#!/usr/bin/env python3
from contextlib import contextmanager
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from urllib.request import urlopen
import json, os

ROOT=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

@contextmanager
def server():
    old=os.getcwd();os.chdir(ROOT)
    httpd=ThreadingHTTPServer(('127.0.0.1',0),Quiet)
    thread=Thread(target=httpd.serve_forever,daemon=True);thread.start()
    try: yield f'http://127.0.0.1:{httpd.server_port}'
    finally: httpd.shutdown();thread.join();os.chdir(old)

with server() as base:
    required=['/','/index.html','/app.js','/styles.css','/sw.js','/manifest.webmanifest','/data/bundle.js','/data/pyq-index.js','/data/pyq-index.json','/data/question-schema.json']
    for path in required:
        with urlopen(base+path,timeout=10) as r:
            body=r.read()
            assert r.status==200 and body, f'failed: {path}'
    with urlopen(base+'/data/pyq-index.json',timeout=10) as r:index=json.load(r)
    for meta in index['years'].values():
        with urlopen(base+'/'+meta['file'],timeout=20) as r:
            body=r.read()
            assert r.status==200 and len(body)>1000, meta['file']
print(json.dumps({'status':'HTTP smoke passed','years':len(index['years']),'mapped':index['mappedTotal'],'scoreable':index['scoreableTotal']}))

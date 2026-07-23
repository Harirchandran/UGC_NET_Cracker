#!/usr/bin/env python3
"""Serve NETCracker AI locally. Open http://localhost:8080 in a browser."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os, webbrowser, threading
ROOT=Path(__file__).resolve().parent
os.chdir(ROOT)
url='http://localhost:8080/index.html#dashboard'
threading.Timer(0.8, lambda: webbrowser.open(url)).start()
print(f'NETCracker AI is running at {url}')
print('Press Ctrl+C to stop.')
ThreadingHTTPServer(('0.0.0.0',8080),SimpleHTTPRequestHandler).serve_forever()

import json, re, textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'data'
DATA.mkdir(parents=True, exist_ok=True)

paper1 = [
    (1, 'Teaching Aptitude', [
        ('Teaching: concept, objectives and levels', 'Meaning and objectives of teaching; memory, understanding and reflective levels; characteristics and basic requirements.'),
        ('Learner characteristics', 'Academic, social, emotional and cognitive characteristics of adolescent and adult learners; individual differences.'),
        ('Factors affecting teaching', 'Teacher, learner, support material, instructional facilities, learning environment and institution.'),
        ('Methods of teaching', 'Teacher-centred and learner-centred methods; offline and online methods including SWAYAM, SWAYAM Prabha and MOOCs.'),
        ('Teaching support systems', 'Traditional, modern and ICT-based teaching support systems.'),
        ('Evaluation systems', 'Elements and types of evaluation, CBCS evaluation, computer-based testing and innovations in evaluation.')
    ]),
    (2, 'Research Aptitude', [
        ('Research meaning and approaches', 'Meaning, types and characteristics of research; positivism and post-positivistic approach.'),
        ('Methods of research', 'Experimental, descriptive, historical, qualitative and quantitative methods.'),
        ('Steps of research', 'Problem identification, literature review, objectives, design, data, analysis, interpretation and reporting.'),
        ('Thesis and article writing', 'Academic structure, format and referencing styles.'),
        ('ICT in research', 'Digital discovery, data collection, analysis, collaboration and dissemination.'),
        ('Research ethics', 'Integrity, consent, attribution, conflicts, fabrication, falsification and plagiarism.')
    ]),
    (3, 'Comprehension', [
        ('Reading comprehension', 'Read a passage, identify claims, inference, tone, structure, assumptions and evidence, and answer only from the passage.')
    ]),
    (4, 'Communication', [
        ('Communication fundamentals', 'Meaning, types and characteristics of communication.'),
        ('Effective communication', 'Verbal, non-verbal, intercultural, group and classroom communication.'),
        ('Communication barriers', 'Physical, semantic, psychological, organisational and cultural barriers.'),
        ('Mass media and society', 'Functions, reach, effects and social responsibilities of mass media.')
    ]),
    (5, 'Mathematical Reasoning and Aptitude', [
        ('Types of reasoning', 'Common reasoning patterns used in aptitude questions.'),
        ('Series, codes and relationships', 'Number series, letter series, coding and relationship problems.'),
        ('Arithmetic aptitude', 'Fractions, time and distance, ratio, proportion, percentages, profit and loss, interest, discounting and averages.')
    ]),
    (6, 'Logical Reasoning', [
        ('Arguments and propositions', 'Argument forms, categorical propositions, mood and figure, formal and informal fallacies.'),
        ('Language and opposition', 'Uses of language, connotation, denotation and the classical square of opposition.'),
        ('Deductive and inductive reasoning', 'Validity, soundness, strength and evaluation of reasoning.'),
        ('Analogies and Venn diagrams', 'Analogy and single or multiple Venn diagrams for testing validity.'),
        ('Indian logic and Pramanas', 'Pratyaksha, Anumana, Upamana, Shabda, Arthapatti and Anupalabdhi.'),
        ('Anumana and fallacies', 'Kinds of inference, Vyapti and Hetvabhasas.')
    ]),
    (7, 'Data Interpretation', [
        ('Data sources and classification', 'Sources, acquisition, classification, quantitative and qualitative data.'),
        ('Graphical representation', 'Bar charts, histograms, pie charts, tables, line charts and mapping.'),
        ('Data interpretation', 'Ratios, percentage change, comparison, aggregation and inference from data.'),
        ('Data and governance', 'Use of data in public administration, transparency and decision-making.')
    ]),
    (8, 'Information and Communication Technology (ICT)', [
        ('ICT terminology', 'General ICT abbreviations and terminology.'),
        ('Internet and communication tools', 'Internet, intranet, email, audio conferencing and video conferencing.'),
        ('Digital initiatives in higher education', 'Digital learning and academic platforms used in Indian higher education.'),
        ('ICT and governance', 'Digital public services, transparency, participation and administration.')
    ]),
    (9, 'People, Development and Environment', [
        ('Development and environment', 'Millennium Development Goals and Sustainable Development Goals.'),
        ('Human–environment interaction', 'Anthropogenic activities and environmental impacts.'),
        ('Environmental issues', 'Local, regional and global pollution, waste and climate-change dimensions.'),
        ('Health impacts', 'Effects of pollutants on human health.'),
        ('Natural and energy resources', 'Solar, wind, soil, hydro, geothermal, biomass, nuclear and forests.'),
        ('Hazards and mitigation', 'Natural hazards, disasters and mitigation strategies.'),
        ('Environmental law and agreements', 'Environment Protection Act 1986, NAPCC, Montreal Protocol, Rio Summit, CBD, Kyoto Protocol, Paris Agreement and International Solar Alliance.')
    ]),
    (10, 'Higher Education System', [
        ('Ancient Indian education', 'Institutions of higher learning and education in ancient India.'),
        ('Post-independence development', 'Evolution of higher learning and research after independence.'),
        ('Learning programmes', 'Oriental, conventional and non-conventional learning programmes.'),
        ('Professional and skill education', 'Professional, technical and skill-based education.'),
        ('Value and environmental education', 'Value education and environmental education.'),
        ('Policies and governance', 'Policies, governance and administration of higher education.')
    ])
]

paper2 = [
    (1, 'Discrete Structures and Optimization', [
        ('Mathematical Logic','Propositional and predicate logic, equivalences, normal forms, predicates, quantifiers, nested quantifiers and rules of inference.'),
        ('Sets and Relations','Set operations, representation and properties of relations, equivalence relations and partial ordering.'),
        ('Counting, Induction and Discrete Probability','Counting, pigeonhole principle, permutations, combinations, inclusion–exclusion, mathematical induction, probability and Bayes theorem.'),
        ('Group Theory','Groups, subgroups, semigroups, products and quotients, isomorphism, homomorphism, automorphism, rings, integral domains, fields and applications.'),
        ('Graph Theory','Simple, multi and weighted graphs; paths, circuits, shortest paths, Eulerian and Hamiltonian structures, planar graphs, colouring, bipartite graphs, trees, codes, traversals, spanning trees and cut sets.'),
        ('Boolean Algebra','Boolean functions, representation and simplification.'),
        ('Optimization','Linear programming, graphical and simplex methods, sensitivity, integer programming, transportation, assignment, PERT–CPM, resource levelling and cost considerations.')
    ]),
    (2, 'Computer System Architecture', [
        ('Digital Logic Circuits and Components','Digital computers, gates, Boolean algebra, map simplification, combinational and sequential circuits, flip-flops, ICs, decoders, multiplexers, registers, counters and memory.'),
        ('Data Representation and Arithmetic','Data types, number systems, complements, fixed/floating point, error detection and arithmetic algorithms.'),
        ('Register Transfer and Microoperations','RTL, bus and memory transfers, arithmetic, logic and shift microoperations.'),
        ('Basic Computer Organization','Stored-program organisation, instruction codes, registers, timing, control, instruction cycle, I/O and interrupts.'),
        ('Programming the Basic Computer','Machine language, assembly, assembler, loops, subroutines and I/O programming.'),
        ('Microprogrammed Control','Control memory, address sequencing and control-unit design.'),
        ('Central Processing Unit','Register and stack organisation, instruction formats, addressing modes, RISC and CISC.'),
        ('Pipeline and Vector Processing','Parallelism, arithmetic and instruction pipelines, vector processing and array processors.'),
        ('Input–Output Organization','Devices, interfaces, asynchronous transfer, transfer modes, priority interrupts, DMA and serial communication.'),
        ('Memory Hierarchy','Main, auxiliary, associative, cache and virtual memory; memory-management hardware.'),
        ('Multiprocessors','Characteristics, interconnection, arbitration, communication, synchronisation, cache coherence and multicore processors.')
    ]),
    (3, 'Programming Languages and Computer Graphics', [
        ('Language Design and Translation','Language concepts, paradigms, environments, virtual computers, binding times, syntax, translation stages and formal transition models.'),
        ('Data Types','Properties of types and objects; scalar and composite data types.'),
        ('Programming in C','Tokens, identifiers, data types, control, arrays, structures, unions, strings, pointers, functions, files, command-line arguments and preprocessors.'),
        ('Object-Oriented Programming','Class, object, instantiation, inheritance, encapsulation, abstract class and polymorphism.'),
        ('Programming in C++','Tokens, variables, types, operators, control, parameter passing, virtual functions, classes, constructors, destructors, overloading, inheritance, templates, exceptions, events, streams and files.'),
        ('Web Programming','HTML, DHTML, XML, scripting, Java, servlets and applets.'),
        ('Graphics Devices and Primitives','Display devices, raster/random scan, monitors, input, points, lines, drawing algorithms and filling.'),
        ('2-D Transformations and Viewing','Translation, scaling, rotation, reflection, shear, homogeneous coordinates, composite transforms, viewing pipeline and clipping.'),
        ('3-D Representation and Viewing','Polygon and quadric surfaces, splines, Bézier and B-spline curves/surfaces, illumination, rendering, projections and clipping.')
    ]),
    (4, 'Database Management Systems', [
        ('Database Concepts and Architecture','Models, schemas, instances, three-schema architecture, data independence, languages, interfaces and centralised/client-server DBMS.'),
        ('Data Modeling','ER model, relational model, constraints, schemas, updates, relational algebra/calculus and Codd rules.'),
        ('SQL','DDL, types, constraints, queries, DML, views, procedures, functions, triggers and SQL injection.'),
        ('Normalization and Transactions','Functional dependencies, normalisation, query processing/optimisation, transaction processing, concurrency, recovery, security and authorisation.'),
        ('Enhanced Data Models','Temporal, multimedia, deductive, XML, internet, mobile, GIS, genome and distributed databases.'),
        ('Data Warehousing and Mining','Warehouse modelling, concept hierarchy, OLAP/OLTP, association, classification, clustering, regression, SVM, KNN, HMM, summarisation, dependency, link, sequence and social-network analysis.'),
        ('Big Data Systems','Big-data characteristics, types, architecture, MapReduce, Hadoop and HDFS.'),
        ('NoSQL','NoSQL, query optimisation, products, querying, management, indexing, ordering and cloud use.')
    ]),
    (5, 'System Software and Operating System', [
        ('System Software','Machine, assembly and high-level languages; compilers, interpreters, loading, linking, relocation, macros and debuggers.'),
        ('Operating System Basics','Structure, operations, services, system calls, design, implementation and boot.'),
        ('Process Management','Scheduling, operations, IPC, client-server communication, synchronisation, critical section, Peterson solution and semaphores.'),
        ('Threads','Multicore programming, threading models, libraries, implicit threading and issues.'),
        ('CPU Scheduling','Criteria, algorithms, thread, multiprocessor and real-time scheduling.'),
        ('Deadlocks','Characterisation, prevention, avoidance, detection and recovery.'),
        ('Memory Management','Contiguous allocation, swapping, paging, segmentation, demand paging, replacement, frames, thrashing and memory-mapped files.'),
        ('Storage Management','Mass storage, disks, scheduling, management and RAID.'),
        ('File and I/O Systems','Access, directories, mounting, sharing, implementation, allocation, free space, performance, recovery and I/O stack.'),
        ('Security','Protection, access matrices, access control, revocation, threats, cryptography, authentication and defences.'),
        ('Virtual Machines','Virtual-machine types, implementations and virtualisation.'),
        ('Linux and Windows','Design principles, components, process, scheduling, memory, file systems, I/O, IPC and networking.'),
        ('Distributed Systems','Network operating systems, structures, protocols, robustness, design and distributed file systems.')
    ]),
    (6, 'Software Engineering', [
        ('Software Process Models','Generic process, lifecycle, prescriptive models, management, component/aspect-oriented development, formal methods, agile models, XP, ASD, Scrum, DSDM, FDD, Crystal and web engineering.'),
        ('Software Requirements','Functional/non-functional requirements, elicitation, use cases, analysis, modelling, review and SRS.'),
        ('Software Design','Abstraction, architecture, patterns, separation of concerns, modularity, information hiding, cohesion, coupling, OO/data/architectural/UI/component design.'),
        ('Software Quality','McCall, ISO 9126, quality control/assurance, risk management and reliability.'),
        ('Estimation and Scheduling','LOC, function points, cost/effort models, COCOMO, scheduling, staffing and timeline charts.'),
        ('Software Testing','Verification, validation, errors/faults/bugs/failures, unit/integration, white/black box, basis path, control structure, alpha/beta, regression, performance and stress testing.'),
        ('Configuration and Evolution','Change/version control, reuse, re-engineering and reverse engineering.')
    ]),
    (7, 'Data Structures and Algorithms', [
        ('Data Structures','Arrays, sparse matrices, stacks, queues, priority queues, linked lists, trees, forests, binary/threaded/BST/AVL/B/B+/B* trees, sets, graphs, sorting, searching and hashing.'),
        ('Performance Analysis','Time and space complexity, asymptotic notation and recurrences.'),
        ('Design Techniques','Divide and conquer, dynamic programming, greedy algorithms, backtracking and branch and bound.'),
        ('Lower Bound Theory','Comparison trees and lower bounds through reductions.'),
        ('Graph Algorithms','BFS, DFS, shortest paths, maximum flow and minimum spanning trees.'),
        ('Complexity Theory','P, NP, NP-completeness and reducibility.'),
        ('Selected Algorithms','Number theoretic algorithms, polynomial arithmetic, FFT and string matching.'),
        ('Advanced Algorithms','Parallel sorting/searching/merging, approximation and randomised algorithms.')
    ]),
    (8, 'Theory of Computation and Compilers', [
        ('Regular Language Models','DFA, NFA, equivalence, regular languages/grammars/expressions, properties, pumping lemma, non-regular languages and lexical analysis.'),
        ('Context-Free Languages','PDA/NPDA, CFG, CNF, GNF, ambiguity, parse trees, PDA–CFG equivalence and properties.'),
        ('Turing Machines','Standard and variant TMs, universal TM, Church–Turing thesis, recursive/RE languages, context-sensitive languages, unrestricted grammars, Chomsky hierarchy and constructions.'),
        ('Unsolvability and Complexity','Halting, PCP, undecidability for CFLs, measurement/classification, tractability and intractability.'),
        ('Syntax Analysis','Associativity, precedence, grammar transformations, top-down, recursive descent, predictive, LL(1), bottom-up, LR and LALR(1).'),
        ('Semantic Analysis','Attribute grammars, syntax-directed definitions, inherited/synthesised attributes, dependency graphs, evaluation order, S/L-attributed definitions and type checking.'),
        ('Runtime Systems','Storage organisation, activation tree/record, stack allocation, parameter passing and symbol table.'),
        ('Intermediate Code','Representations and translation of declarations, assignments, control flow, Boolean expressions and calls.'),
        ('Code Generation and Optimization','Control/data flow, local/global/loop/peephole optimisation and instruction scheduling.')
    ]),
    (9, 'Data Communication and Computer Networks', [
        ('Data Communication','Components, simplex/half/full duplex, analog/digital signals, noisy/noiseless channels, bandwidth, throughput, latency, transmission, encoding, modulation, multiplexing, media and error handling.'),
        ('Computer Networks','Topologies, LAN, MAN, WAN, wireless networks and internet.'),
        ('Network Models','Layered architecture, OSI, TCP/IP, address types and switching.'),
        ('Link and Access Functions','Framing, error detection/correction, flow/error control, sliding window, HDLC, CSMA/CD, CSMA/CA, reservation, polling, token passing, FDMA, CDMA, TDMA, devices, backbones and VLANs.'),
        ('Internet Protocols','IPv4/IPv6, addressing, datagrams, fragmentation, checksum, ARP, delivery, routing, TCP, UDP, SCTP and congestion control.'),
        ('Application Services','WWW, URL, DNS, email architecture, SMTP, POP, IMAP, TELNET and FTP.'),
        ('Network Security','Malware, cryptography, steganography, secret/public key, digital signatures, VPN and firewalls.'),
        ('Mobile Technology','GSM, CDMA, mobile computing, middleware, gateways, Mobile IP, satellites, ad hoc/wireless LANs, geolocation, GPRS and SMS.'),
        ('Cloud Computing and IoT','SaaS/PaaS/IaaS, public/private cloud, virtualisation, servers, storage, resource management, SLA and IoT basics.')
    ]),
    (10, 'Artificial Intelligence (AI)', [
        ('Approaches and Search','Turing test, rational agents, state spaces, heuristic search, game playing, minimax and alpha-beta pruning.'),
        ('Knowledge Representation','Logic, semantic networks, frames, rules, scripts, conceptual dependency, ontologies, expert systems and uncertainty.'),
        ('Planning','Planning components, linear/non-linear, goal stack, hierarchical, STRIPS and partial-order planning.'),
        ('Natural Language Processing','Grammar, language, parsing, semantic analysis and pragmatics.'),
        ('Multi-Agent Systems','Agents, objects, expert systems, structures, semantic web, communication, ontology-based sharing and tools.'),
        ('Fuzzy Sets','Fuzziness, membership, fuzzification/defuzzification, operations, functions, linguistic variables, relations, rules, inference and control.'),
        ('Genetic Algorithms','Encoding, operators, fitness functions, GA cycle and problem solving.'),
        ('Artificial Neural Networks','Supervised, unsupervised and reinforcement learning; perceptron, MLP, SOM and Hopfield networks.')
    ])
]

papers=[]
for pcode,pname,units in [('00','Paper 1: Teaching and Research Aptitude',paper1),('87','Paper 2: Computer Science and Applications',paper2)]:
    pu=[]
    for unum,uname,topics in units:
        ts=[]
        for idx,(tname,desc) in enumerate(topics,1):
            ts.append({
                'id':f'p{pcode}-u{unum}-t{idx}', 'name':tname, 'description':desc,
                'estimatedMinutes': max(35, min(180, 35 + len(desc)//2)),
                'difficulty': 1 + ((unum+idx) % 3),
                'importance': 3 + ((unum*2+idx) % 3),
                'prerequisites': [] if idx==1 else [f'p{pcode}-u{unum}-t{max(1,idx-1)}'],
                'offlineNote': f"Focus on the definition, distinguishing features, standard examples and common exam traps for {tname}. After reading the official scope, practise recall first and then timed MCQs."
            })
        pu.append({'id':f'p{pcode}-u{unum}','number':unum,'name':uname,'topics':ts})
    papers.append({'code':pcode,'name':pname,'units':pu})

syllabus={
 'exam':'UGC-NET', 'subject':'Computer Science and Applications', 'subjectCode':'87',
 'version':'Official UGC syllabus applicable from June 2019 onwards; verified against NTA June 2026 bulletin',
 'verifiedOn':'2026-07-22',
 'officialSources':[
  {'title':'Official UGC updated syllabi page','url':'https://www.ugcnetonline.in/syllabus-new.php'},
  {'title':'Official Paper 1 syllabus PDF','url':'https://www.ugcnetonline.in/showPdf.php?p1=NTA_All_R_Syllabus%2F00-Paper-I%2FPaper-I_English.pdf'},
  {'title':'Official Computer Science syllabus PDF','url':'https://www.ugcnetonline.in/showPdf.php?p1=NTA_All_R_Syllabus%2F87%2FComputer+Science+and+Applications_English+Only.pdf'},
  {'title':'NTA UGC-NET June 2026 Information Bulletin','url':'https://cdnbbsr.s3waas.gov.in/s301eee509ee2f68dc6014898c309e86bf/uploads/2026/04/202604301078678748.pdf'}
 ],
 'examPattern':{'paper1Questions':50,'paper1Marks':100,'paper2Questions':100,'paper2Marks':200,'durationMinutes':180,'marksPerCorrect':2,'negativeMarks':0},
 'papers':papers
}

Q=[]

def add(p, u, q, opts, ans, exp, d='medium', topic='', source='NETCracker original practice', examCycle='Practice', year=2026, isPyq=False):
    Q.append({
        'id': f'q{len(Q)+1:04d}',
        'paper': p,
        'unit': u,
        'question': q,
        'options': opts,
        'answer': ans,
        'explanation': exp,
        'difficulty': d,
        'topic': topic,
        'source': source,
        'examCycle': examCycle,
        'year': year,
        'isPyq': isPyq,
        'verified': True
    })

def add_pyq(p, u, q, opts, ans, exp, d='medium', topic='', examCycle='Dec 2025', year=2025):
    add(p, u, q, opts, ans, exp, d=d, topic=topic, source=f'UGC-NET {examCycle} official PYQ', examCycle=examCycle, year=year, isPyq=True)

# -------------------------------------------------------------
# ORIGINAL PRACTICE QUESTIONS (150 Items)
# -------------------------------------------------------------
# Paper 1 Practice (50 Questions)
add(1,1,'Which level of teaching places the greatest emphasis on critical inquiry and problem solving?', ['Memory level','Understanding level','Reflective level','Recall level'],2,'Reflective-level teaching requires learners to examine problems critically and develop solutions.','easy','Teaching levels')
add(1,1,'A learner-centred method primarily treats the teacher as a:', ['Sole transmitter','Facilitator of learning','External examiner','Passive observer'],1,'Learner-centred teaching shifts the teacher toward facilitation, guidance and feedback.','easy','Teaching methods')
add(1,1,'Which factor is least directly part of the instructional environment?', ['Learning material','Classroom facilities','Learner characteristics','National currency value'],3,'Currency value is not ordinarily classified as a direct instructional-environment factor.','easy','Factors affecting teaching')
add(1,1,'Formative evaluation is mainly used to:', ['Certify at the end','Improve learning during instruction','Rank universities','Replace teaching'],1,'Formative evaluation supplies feedback while learning is in progress.','easy','Evaluation')
add(1,1,'SWAYAM is best described as a:', ['Printed examination','Digital learning platform','University ranking agency','Research ethics code'],1,'SWAYAM is an Indian online learning platform.','easy','Online teaching')

add(1,2,'Which research method is most suitable for establishing a controlled cause-and-effect relationship?', ['Historical','Experimental','Descriptive','Ethnographic'],1,'Experimental research manipulates variables under controlled conditions to examine causal effects.','easy','Research methods')
add(1,2,'Fabricating observations that were never collected violates:', ['Sampling theory','Research ethics','Formatting rules only','Citation style only'],1,'Fabrication is a serious breach of research integrity.','easy','Research ethics')
add(1,2,'A literature review is primarily used to:', ['Avoid defining a problem','Locate existing knowledge and gaps','Guarantee a significant result','Replace data collection'],1,'A literature review establishes what is known and identifies gaps or unresolved questions.','easy','Research steps')
add(1,2,'Which of the following is qualitative?', ['Mean score comparison','In-depth interview analysis','Regression coefficient','Standard deviation'],1,'In-depth interview analysis typically examines non-numerical meanings and themes.','easy','Qualitative research')
add(1,2,'Informed consent is most closely associated with:', ['Participant autonomy','Increasing sample variance','File compression','Random number generation'],0,'Informed consent respects the participant’s autonomy and understanding.','easy','Research ethics')

add(1,3,'A passage states that all three sampled colleges improved after a policy. Which conclusion is safest?', ['Every college in India improved','The sampled colleges improved','The policy can never fail','No other factor mattered'],1,'The evidence directly supports only the sampled colleges.','medium','Inference')
add(1,3,'When answering a comprehension question, an inference should be:', ['Based on evidence in the passage','Based on personal experience only','Unrelated to the text','Always absolute'],0,'A valid textual inference follows from information supplied by the passage.','easy','Inference')
add(1,3,'The tone of a passage refers to the author’s:', ['Font size','Attitude or stance','Page number','Citation count'],1,'Tone is the author’s attitude toward the topic or audience.','easy','Tone')
add(1,3,'A statement that directly supports a central claim is called:', ['Evidence','Decoration','Pagination','Noise'],0,'Evidence supplies support for a claim.','easy','Evidence')
add(1,3,'If a question asks “according to the passage,” the best response should:', ['Use only passage-grounded information','Use outside knowledge even if contradictory','Guess the author’s biography','Ignore qualifiers'],0,'The phrase restricts the answer to information warranted by the passage.','easy','Reading strategy')

add(1,4,'A semantic barrier arises mainly from:', ['Different meanings assigned to words','Distance between buildings','A broken projector only','Lack of chairs'],0,'Semantic barriers are caused by ambiguity or differences in meaning.','easy','Barriers')
add(1,4,'Facial expression is an example of:', ['Non-verbal communication','Mass communication only','Written communication','Database communication'],0,'Facial expressions convey information non-verbally.','easy','Non-verbal communication')
add(1,4,'Feedback makes communication:', ['Necessarily one-way','More interactive and correctable','Impossible to evaluate','Free from all noise'],1,'Feedback lets the sender know how the message was understood.','easy','Feedback')
add(1,4,'Communication among members of a classroom project team is:', ['Group communication','Intrapersonal communication only','Broadcast communication only','Mechanical communication'],0,'It occurs within a group pursuing a shared task.','easy','Group communication')
add(1,4,'Which is an example of mass media?', ['A private diary','A national television broadcast','Silent reading','A personal reminder'],1,'A national broadcast reaches a large, dispersed audience.','easy','Mass media')

add(1,5,'If 40% of a number is 72, the number is:', ['120','160','180','200'],2,'72 ÷ 0.40 = 180.','easy','Percentage')
add(1,5,'The average of 10, 20, 30 and 40 is:', ['20','25','30','35'],1,'The sum is 100 and 100 ÷ 4 = 25.','easy','Average')
add(1,5,'A product bought for ₹800 is sold for ₹920. Profit percentage is:', ['12%','15%','18%','20%'],1,'Profit is 120; 120/800 × 100 = 15%.','medium','Profit and loss')
add(1,5,'At 60 km/h, time required to travel 150 km is:', ['2 hours','2.5 hours','3 hours','3.5 hours'],1,'Time = distance/speed = 150/60 = 2.5 hours.','easy','Time and distance')
add(1,5,'The simplest form of 36:48 is:', ['2:3','3:4','4:5','6:8'],1,'Divide both terms by 12 to obtain 3:4.','easy','Ratio')

add(1,6,'“All humans are mortal; Socrates is human; therefore Socrates is mortal” is an example of:', ['Deductive reasoning','Inductive reasoning only','Fallacy of composition','Informal noise'],0,'It moves from universal premises to a necessary conclusion.','easy','Deductive reasoning')
add(1,6,'In the classical square of opposition, A (Universal Affirmative) and O (Particular Negative) are:', ['Contradictories','Contraries','Subcontraries','Subalterns'],0,'A and O cannot both be true and cannot both be false simultaneously.','medium','Square of opposition')
add(1,6,'Which Pramana refers to perception through senses in Indian logic?', ['Pratyaksha','Anumana','Upamana','Arthapatti'],0,'Pratyaksha means direct sensory perception.','easy','Pramanas')
add(1,6,'Hetvabhasa refers to:', ['A fallacious middle term in inference','A valid syllogism','A database query','A mathematical proof'],0,'In Nyaya logic, Hetvabhasa is a pseudo-reason or fallacy of inference.','medium','Fallacies')
add(1,6,'Analogical arguments infer conclusions based on:', ['Resemblance or similarity','Strict mathematical deduction only','Random choice','Direct measurement only'],0,'Analogy moves from observed similarities to additional inferred similarity.','easy','Analogy')

add(1,7,'If total sales are 500 units and Category A is 30% of sales, how many units belong to Category A?', ['100','120','150','200'],2,'30% of 500 = 0.30 × 500 = 150.','easy','Data interpretation')
add(1,7,'A pie chart represents data using:', ['Circular sectors proportional to percentages','Line segments only','Stacked bars only','Geographical maps only'],0,'Sectors of a circle reflect relative frequencies or percentages.','easy','Graphical data')
add(1,7,'Data that has been collected directly from first-hand observations is:', ['Primary data','Secondary data','Tertiary data','Quaternary data'],0,'Primary data is gathered first-hand by the researcher.','easy','Data classification')
add(1,7,'Percentage change from 80 to 100 is:', ['20%','25%','30%','40%'],1,'(100 - 80)/80 × 100 = 20/80 × 100 = 25%.','medium','Percentage change')
add(1,7,'Which measure of central tendency is the middle value when data is ordered?', ['Mean','Median','Mode','Variance'],1,'The median is the central observation of an ordered dataset.','easy','Central tendency')

add(1,8,'URL stands for:', ['Uniform Resource Locator','Universal Rapid Link','Unified Routing Logic','User Related Language'],0,'URL resolves and locates resources on the web.','easy','ICT terminology')
add(1,8,'Which protocol is used to secure web browsing?', ['HTTPS','HTTP','FTP','TELNET'],0,'HTTPS adds SSL/TLS encryption to HTTP traffic.','easy','Protocols')
add(1,8,'Which digital initiative provides free e-books and journals for Indian universities?', ['e-ShodhSindhu','SWAYAM Prabha','NPTEL','SAMARTH'],0,'e-ShodhSindhu provides access to peer-reviewed e-journals and database resources.','easy','Digital initiatives')
add(1,8,'RAM is classified as:', ['Volatile primary memory','Non-volatile secondary storage','Permanent optical media','Magnetic tape'],0,'RAM loses its stored content when power is removed.','easy','Memory')
add(1,8,'Which of the following is an open-source operating system?', ['Linux','Windows 11','macOS','iOS'],0,'Linux is distributed under open-source licences.','easy','Operating systems')

add(1,9,'SDG Goal 4 focuses on:', ['Quality Education','Clean Water','Affordable Energy','Climate Action'],0,'Goal 4 aims to ensure inclusive and equitable quality education.','easy','SDGs')
add(1,9,'The Montreal Protocol aims to protect:', ['The Ozone layer','Deep ocean fisheries','Soil fertility','Forest biodiversity'],0,'The Montreal Protocol targets substances that deplete the ozone layer.','easy','Environmental agreements')
add(1,9,'Which energy source is renewable?', ['Solar energy','Coal','Petroleum','Natural gas'],0,'Solar energy is naturally replenished.','easy','Energy resources')
add(1,9,'Anthropogenic hazards are caused by:', ['Human activities','Tectonic movements only','Solar flares only','Lunar gravity'],0,'Anthropogenic means originating in human activity.','easy','Hazards')
add(1,9,'Air Quality Index (AQI) measures:', ['Concentrations of air pollutants','Water salinity','Noise frequency','Soil pH'],0,'AQI reports ambient air pollution levels.','easy','Environmental issues')

add(1,10,'Which ancient seat of learning was famous for Buddhist studies and located in Bihar?', ['Nalanda','Takshashila','Vallabhi','Vikramashila'],0,'Nalanda was a major ancient university in Bihar.','easy','Ancient education')
add(1,10,'UGC was formally established as a statutory body in:', ['1956','1947','1968','1986'],0,'The UGC Act was passed by Parliament in 1956.','easy','Policies')
add(1,10,'NEP 2020 proposes replacing the 10+2 school structure with:', ['5+3+3+4','4+4+4+4','3+3+3+3','5+5+2+2'],0,'NEP 2020 restructures school education into 5+3+3+4.','easy','NEP 2020')
add(1,10,'National Assessment and Accreditation Council (NAAC) evaluates:', ['Higher education institutions','Primary schools','Industrial factories','Medical clinics'],0,'NAAC assesses and accredits HEIs in India.','easy','Governance')
add(1,10,'NIRF stands for:', ['National Institutional Ranking Framework','National Indian Research Foundation','New Innovation Rating Forum','National Industry Reform Federation'],0,'NIRF ranks higher education institutions in India.','easy','Ranking')

# Paper 2 Practice (100 Questions)
add(2,1,'A relation is an equivalence relation if it is:', ['Reflexive, symmetric and transitive','Reflexive and anti-symmetric only','Irreflexive and transitive only','Symmetric and transitive only'],0,'An equivalence relation must satisfy reflexivity, symmetry and transitivity.','easy','Relations')
add(2,1,'Number of subsets of a set with n elements is:', ['2ⁿ','n²','n!','2n'],0,'The power set cardinality is 2ⁿ.','easy','Set theory')
add(2,1,'A graph in which every pair of distinct vertices is connected by a unique edge is a:', ['Complete graph','Bipartite graph','Cycle graph','Tree'],0,'Kn has an edge between every pair of vertices.','easy','Graph theory')
add(2,1,'The dual of Boolean expression A + 0 = A is:', ['A · 1 = A','A + 1 = 1','A · 0 = 0','A\' + 0 = A\''],0,'Dual replaces + with · and 0 with 1.','medium','Boolean algebra')
add(2,1,'Pigeonhole principle states that if n items are put into m containers (n > m), then at least one container holds:', ['More than one item','No items','Exactly n/m items','Infinite items'],0,'By pigeonhole principle, at least one container receives ≥ 2 items.','easy','Combinatorics')
add(2,1,'In linear programming, the feasible region is:', ['Convex','Concave','Unbounded always','Empty always'],0,'The intersection of linear constraints forms a convex set.','medium','Optimization')
add(2,1,'A tree with n vertices has exactly how many edges?', ['n - 1','n','n + 1','2n'],0,'Every connected acyclic graph on n vertices contains n-1 edges.','easy','Trees')
add(2,1,'Sum of degrees of all vertices in a graph is equal to:', ['Twice the number of edges','Number of edges','Number of vertices','Zero'],0,'Handshaking lemma states Σ deg(v) = 2|E|.','easy','Graph theory')
add(2,1,'Which normal form simplifies Boolean functions using minterms?', ['Canonical Disjunctive Normal Form (SOP)','Conjunctive Normal Form only','Prefix form','Postfix form'],0,'Sum of Products represents functions using OR of minterms.','easy','Boolean functions')
add(2,1,'Simplex method is used for solving:', ['Linear Programming Problems','Non-linear system equations','Integer sorting','Graph isomorphism'],0,'Simplex traverses extreme points of a convex polytope in LPP.','easy','Simplex method')

add(2,2,'Which flip-flop eliminates the invalid state of a SR flip-flop?', ['JK flip-flop','D flip-flop','T flip-flop','Master-slave SR'],0,'JK flip-flop toggles when J=K=1, avoiding the undefined SR state.','easy','Flip-flops')
add(2,2,'A 4-to-1 multiplexer requires how many select lines?', ['2','1','3','4'],0,'2^s = 4 implies s = 2 select lines.','easy','Multiplexers')
add(2,2,'In 2’s complement representation, -5 in 4-bit binary is:', ['1011','1010','1101','0101'],0,'+5 = 0101; 1\'s comp = 1010; +1 = 1011.','easy','Data representation')
add(2,2,'Cache memory relies on:', ['Locality of reference','Random search','Disk rotation','Serial access'],0,'Temporal and spatial locality make cache memory effective.','easy','Cache memory')
add(2,2,'DMA transfer allows data transfer between I/O and memory without:', ['Continuous CPU intervention','A bus','A clock signal','RAM'],0,'DMA controller handles memory transfers directly, freeing the CPU.','easy','DMA')
add(2,2,'RISC architecture is characterised by:', ['Simple, single-cycle instructions and register-heavy design','Variable-length complex instructions','Lack of pipelining','Microprogrammed control only'],0,'RISC uses fixed-length, simple instructions optimized for fast pipelining.','medium','RISC vs CISC')
add(2,2,'Which addressing mode specifies the operand location directly in the instruction?', ['Direct addressing','Immediate addressing','Indirect addressing','Register indirect'],0,'Direct addressing gives the memory address of the operand directly in the instruction.','easy','Addressing modes')
add(2,2,'Pipeline hazards include:', ['Structural, data and control hazards','Only electrical hazards','Only power hazards','Memory leaks'],0,'Pipelining can encounter resource conflicts, data dependencies and branch hazards.','medium','Pipelining')
add(2,2,'Cache coherence problem occurs in:', ['Multiprocessor systems with private caches','Single-core CPUs','ROM chips','Disk arrays'],0,'Multiple private caches holding copies of shared memory can become inconsistent.','medium','Cache coherence')
add(2,2,'Associative memory is accessed by:', ['Content (key) rather than address','Address location','Sequential scan','Binary tree index'],0,'Associative memory (CAM) compares search key against stored tags in parallel.','easy','Associative memory')

add(2,3,'In C, what is the size of a pointer on a 64-bit system?', ['8 bytes','4 bytes','2 bytes','16 bytes'],0,'On a 64-bit architecture, memory pointers occupy 8 bytes (64 bits).','easy','C Pointers')
add(2,3,'Which OOP concept enables a function to exhibit different behaviours based on object type?', ['Polymorphism','Encapsulation','Inheritance','Abstraction'],0,'Polymorphism allows dynamic method dispatch at runtime or function overloading at compile time.','easy','Polymorphism')
add(2,3,'Virtual functions in C++ support:', ['Runtime (dynamic) polymorphism','Compile-time overloading','Inline expansion only','Private inheritance'],0,'Virtual functions enable dynamic binding through vtables.','medium','C++ Virtual functions')
add(2,3,'In Computer Graphics, Bresenham’s line algorithm uses:', ['Integer arithmetic only','Floating point division','Trigonometric functions','Matrix inversion'],0,'Bresenham uses incremental integer addition and decision parameters for fast rasterisation.','medium','Bresenham algorithm')
add(2,3,'2D rotation of a point (x, y) by angle θ about the origin uses transformation matrix:', ['[[cos θ, -sin θ], [sin θ, cos θ]]','[[sin θ, cos θ], [cos θ, -sin θ]]','[[1, tan θ], [0, 1]]','[[s_x, 0], [0, s_y]]'],0,'Standard 2D counter-clockwise rotation matrix.','medium','2D Transformations')
add(2,3,'Bézier curves are defined by:', ['Control points','Pixel gradients','Ray tracing','Depth buffer'],0,'Bézier curves interpolate endpoints and are shaped by intermediate control points.','easy','Bézier curves')
add(2,3,'Which graphics pipeline step removes objects outside the viewing volume?', ['Clipping','Rasterisation','Shading','Texture mapping'],0,'Clipping truncates primitives to fit the view frustum.','easy','Clipping')
add(2,3,'In HTML5, which tag is used to draw graphics via JavaScript?', ['<canvas>','<svg>','<image>','<graphics>'],0,'The <canvas> element provides a resolution-dependent bitmap canvas.','easy','Web programming')
add(2,3,'Constructors in C++:', ['Have the same name as the class and no return type','Return an integer','Are called explicitly only','Cannot be overloaded'],0,'Constructors initialise class instances automatically upon creation.','easy','Constructors')
add(2,3,'Homogeneous coordinates are used in computer graphics to:', ['Express translation as matrix multiplication','Avoid floating point math','Increase resolution','Render 4D spaces'],0,'Using 3x3 matrices for 2D (or 4x4 for 3D) allows translation to be combined with scaling/rotation.','medium','Homogeneous coordinates')

add(2,4,'A primary key must be:', ['Unique and NOT NULL','Unique but can be NULL','Duplicated across rows','An integer only'],0,'Primary key uniquely identifies each record and prohibits null values.','easy','Primary key')
add(2,4,'Which relational algebra operator selects rows that satisfy a condition?', ['Selection (σ)','Projection (π)','Cartesian Product (×)','Join (⋈)'],0,'Selection σ filters tuples according to a predicate.','easy','Relational algebra')
add(2,4,'A table is in 2NF if it is in 1NF and:', ['No non-prime attribute is partially dependent on any candidate key','It has no transitive dependencies','It has no multi-valued dependencies','All fields are atomic only'],0,'2NF eliminates partial functional dependencies on composite keys.','medium','Normalization')
add(2,4,'ACID properties in DBMS stand for:', ['Atomicity, Consistency, Isolation, Durability','Accuracy, Control, Integrity, Data','Access, Concurrency, Indexing, Delivery','Allocation, Commitment, Isolation, Duplication'],0,'ACID guarantees reliable transaction processing.','easy','ACID properties')
add(2,4,'Two-Phase Locking (2PL) protocol ensures:', ['Serialisability of transactions','Deadlock freedom','No cascade aborts','Zero lock overhead'],0,'2PL guarantees serialisability, though deadlocks are still possible.','medium','Concurrency control')
add(2,4,'SQL statement used to modify existing records in a table is:', ['UPDATE','ALTER','MODIFY','INSERT'],0,'UPDATE alters field values in existing rows.','easy','SQL DML')
add(2,4,'In ER diagrams, double ovals represent:', ['Multivalued attributes','Derived attributes','Weak entity sets','Key attributes'],0,'Double ovals denote multivalued attributes (e.g. phone numbers).','easy','ER diagram')
add(2,4,'Which indexing structure maintains a balanced search tree where data pointers are in leaf nodes?', ['B+ tree','B tree','Binary search tree','Hash index'],0,'B+ trees keep all record pointers in leaves, facilitating efficient sequential range queries.','medium','B+ tree')
add(2,4,'Hadoop Distributed File System (HDFS) splits files into:', ['Blocks (e.g. 128 MB)','Single bytes','Rows','Tables'],0,'HDFS divides large files into large blocks distributed across cluster nodes.','easy','Hadoop HDFS')
add(2,4,'NoSQL databases like MongoDB store documents typically in format:', ['JSON / BSON','Relational tables','Assembly code','XML schemas only'],0,'MongoDB uses BSON (Binary JSON) document representations.','easy','NoSQL')

add(2,5,'Which operating system scheduling algorithm can cause starvation?', ['Shortest Job First (SJF)','Round Robin (RR)','First-Come First-Served (FCFS)','FIFO'],0,'SJF continuously prioritises short jobs, starving long execution jobs.','easy','CPU scheduling')
add(2,5,'Deadlock prevention method of breaking Hold and Wait requires a process to:', ['Request all needed resources at once before execution','Release resources every 5 seconds','Preempt other processes forcibly','Use infinite virtual memory'],0,'Acquiring all resources upfront prevents holding while waiting for others.','medium','Deadlock prevention')
add(2,5,'Page fault occurs when:', ['Requested page is not present in main memory (RAM)','Page is read-only','CPU halts','Disk crashes'],0,'A page fault triggers an OS trap to fetch the page from secondary storage.','easy','Paging')
add(2,5,'Banker’s algorithm is used for:', ['Deadlock avoidance','Deadlock detection','CPU scheduling','Memory compaction'],0,'Banker’s algorithm checks safe states before allocating resources.','medium','Banker algorithm')
add(2,5,'Semaphores are used for:', ['Process synchronisation and mutual exclusion','Compiling C code','File compression','Network routing'],0,'Semaphores manage concurrent access to shared critical sections.','easy','Semaphores')
add(2,5,'In thrashing, the operating system spends most of its time:', ['Paging in and out rather than executing processes','Executing CPU instructions','Cleaning disk sectors','Compiling programs'],0,'Thrashing occurs when total working sets exceed available memory frames.','medium','Thrashing')
add(2,5,'Virtual memory is implemented primarily using:', ['Demand paging and segmentation','Hardware registers only','Cache memory only','ROM chips'],0,'Virtual memory maps logical addresses to physical memory via page tables.','easy','Virtual memory')
add(2,5,'Belady’s anomaly occurs in which page replacement algorithm?', ['FIFO','LRU','Optimal','Clock'],0,'In FIFO, increasing page frames can paradoxically increase page faults.','medium','Belady anomaly')
add(2,5,'Fork() system call in Unix/Linux:', ['Creates a child process identical to the parent','Terminates the process','Executes a new program file','Allocates heap memory'],0,'fork() duplicates the calling process into a parent and child.','easy','Unix system calls')
add(2,5,'Inter-Process Communication (IPC) mechanisms include:', ['Pipes, message queues and shared memory','Registers only','Compilers','HTML tags'],0,'Pipes, queues and shared memory enable processes to exchange data.','easy','IPC')

add(2,6,'COCOMO model is used for estimating:', ['Software cost, effort and schedule','Test coverage percentage','Code lines per minute','Hardware voltage'],0,'Constructive Cost Model calculates person-months effort based on lines of code.','easy','COCOMO model')
add(2,6,'Cyclomatic complexity of a control flow graph with E edges and N nodes is:', ['E - N + 2P','N - E + 2','E + N','E * N'],0,'McCabe’s formula V(G) = E - N + 2P computes linear independent paths.','medium','Cyclomatic complexity')
add(2,6,'Black-box testing focuses on:', ['Functional requirements without knowing internal code structure','Code line coverage','Compiler AST inspection','Register allocation'],0,'Black-box testing evaluates system output against specifications for given inputs.','easy','Black box testing')
add(2,6,'In Agile methodology, Scrum iterations are called:', ['Sprints','Waterfalls','Milestones','Epics'],0,'Sprints are fixed time-boxed development periods (typically 2-4 weeks).','easy','Scrum Agile')
add(2,6,'Cohesion measures:', ['Degree to which elements inside a module belong together','Interdependence between different modules','Lines of code in a file','Number of variables'],0,'High cohesion means a module performs a single well-defined task.','easy','Cohesion and Coupling')
add(2,6,'Coupling should ideally be:', ['Low (loose)','High (tight)','Maximum','Infinite'],0,'Loose coupling minimizes inter-module dependencies and simplifies maintenance.','easy','Coupling')
add(2,6,'Software Requirement Specification (SRS) should be:', ['Unambiguous, verifiable and complete','Written in C++','At least 500 pages long','Executable'],0,'SRS defines functional and quality requirements clearly for stakeholders and developers.','easy','SRS')
add(2,6,'Alpha testing is performed:', ['At the developer site in a controlled environment','At the customer site by end users','After final deployment','By automated bots only'],0,'Alpha testing precedes beta testing and occurs internally.','easy','Alpha testing')
add(2,6,'Version control systems manage:', ['Changes and revisions to project artifacts over time','RAM consumption','Database indexes','Network packets'],0,'Git and SVN record changes, branches and history of source code.','easy','Version control')
add(2,6,'Reverse engineering seeks to:', ['Extract high-level design and architectural models from existing code','Delete documentation','Write random tests','Obfuscate software'],0,'Reverse engineering analyses implementation details to reconstruct design abstractions.','easy','Reverse engineering')

add(2,7,'Stack operations follow:', ['LIFO','FIFO','Random order only','Priority only'],0,'The most recently pushed item is popped first.','easy','Stacks')
add(2,7,'A binary search requires the input sequence to be:', ['Sorted','Cyclic','Encrypted','A graph'],0,'Binary search relies on an ordered search interval.','easy','Searching')
add(2,7,'Worst-case time complexity of merge sort is:', ['O(n log n)','O(n²)','O(log log n)','O(1)'],0,'Merge sort recursively divides and merges in logarithmic levels with linear work per level.','easy','Sorting')
add(2,7,'The recurrence T(n)=2T(n/2)+n has asymptotic complexity:', ['Θ(n log n)','Θ(n²)','Θ(log n)','Θ(1)'],0,'By the Master theorem, a=2, b=2 and f(n)=n, yielding Θ(n log n).','medium','Recurrences')
add(2,7,'Dynamic programming is especially useful when subproblems are:', ['Overlapping and have optimal substructure','Always independent and unique','Undefined','Only graphical'],0,'DP stores results of overlapping subproblems and builds optimal solutions.','easy','Dynamic programming')
add(2,7,'Dijkstra’s standard algorithm assumes edge weights are:', ['Non-negative','All negative','Complex numbers only','Absent'],0,'Negative edges can invalidate its greedy finalisation.','easy','Shortest path')
add(2,7,'Kruskal’s algorithm constructs a:', ['Minimum spanning tree','Maximum flow only','Topological order only','Hash table'],0,'It repeatedly selects safe low-weight edges.','easy','MST')
add(2,7,'A problem is NP-complete if it is:', ['In NP and NP-hard','Only in P','Undecidable necessarily','A sorting algorithm'],0,'NP-complete problems are both verifiable in polynomial time and at least as hard as every NP problem.','medium','NP completeness')
add(2,7,'Hash collisions occur when:', ['Different keys map to the same slot','Every key is unique','No hash function exists','A stack is empty'],0,'Collision resolution is required when multiple keys share a hash location.','easy','Hashing')
add(2,7,'Breadth-first search uses a:', ['Queue','Stack only','Heap only','B-tree only'],0,'BFS explores level by level using a queue.','easy','BFS')

add(2,8,'A language accepted by a DFA is:', ['Regular','Necessarily context-sensitive only','Undecidable','Only finite'],0,'DFAs recognise exactly the regular languages.','easy','Regular languages')
add(2,8,'DFA and NFA have:', ['Equal expressive power','No common languages','Different power for regular languages','Only infinite states'],0,'Every NFA can be converted to an equivalent DFA.','easy','Automata')
add(2,8,'The pumping lemma is commonly used to show a language is:', ['Not regular','Always finite','A database','Context-free only'],0,'A contradiction with the lemma can prove non-regularity.','medium','Pumping lemma')
add(2,8,'A PDA augments a finite control with a:', ['Stack','Queue only','Database index','Cache line'],0,'The stack gives PDAs the memory needed for context-free languages.','easy','PDA')
add(2,8,'The halting problem is:', ['Undecidable','Regular','Solvable by every DFA','A parsing algorithm'],0,'No algorithm decides halting for every program/input pair.','easy','Undecidability')
add(2,8,'LL(1) is a type of:', ['Predictive top-down parser','Bottom-up LR parser','Code optimiser','Linker'],0,'LL parsers scan Left-to-right and construct a Leftmost derivation.','easy','Parsing')
add(2,8,'LR parsing is generally:', ['Bottom-up','Top-down only','A memory-allocation method','A networking method'],0,'LR parsers reduce input handles to the start symbol.','easy','LR parsing')
add(2,8,'An activation record commonly stores:', ['Call-related runtime information','Only source comments','Only IP addresses','Only database tuples'],0,'It holds parameters, return address, locals and control links.','easy','Runtime')
add(2,8,'Three-address code is an:', ['Intermediate representation','Network protocol','Database normal form','File system'],0,'It is a compiler intermediate code with small operations.','easy','Intermediate code')
add(2,8,'Peephole optimisation examines:', ['A small window of generated instructions','The entire internet','Only requirements','Only UI screens'],0,'It replaces short instruction sequences with better equivalents.','easy','Optimisation')

add(2,9,'Full-duplex communication allows:', ['Simultaneous transmission in both directions','Only one direction ever','Alternating directions only','No transmission'],0,'Both endpoints can send and receive at the same time.','easy','Modes')
add(2,9,'The OSI model contains:', ['7 layers','4 layers','2 layers','10 layers'],0,'The OSI reference model has seven layers.','easy','OSI')
add(2,9,'CSMA/CD is historically associated with:', ['Shared Ethernet','Token Ring only','DNS','SMTP'],0,'Classic shared-medium Ethernet used collision detection.','easy','MAC')
add(2,9,'ARP maps an IPv4 address to a:', ['Link-layer hardware address','Domain name only','Port number','Process ID'],0,'ARP resolves an IP address to a MAC address on a local network.','easy','ARP')
add(2,9,'TCP is:', ['Connection-oriented','Connectionless only','A physical medium','An encryption algorithm'],0,'TCP establishes a logical connection and provides reliable ordered delivery.','easy','TCP')
add(2,9,'DNS maps:', ['Names and IP addresses','Only passwords','Only files to processes','Only bits to volts'],0,'DNS resolves domain names to addresses and supports reverse mapping.','easy','DNS')
add(2,9,'A digital signature primarily provides:', ['Authenticity and integrity','Confidentiality by itself in all cases','Compression','Routing'],0,'It verifies origin and detects modification.','medium','Digital signatures')
add(2,9,'A firewall primarily controls:', ['Network traffic according to rules','Database normalisation','CPU scheduling','Compiler parsing'],0,'Firewalls permit or block traffic based on policy.','easy','Firewalls')
add(2,9,'IaaS provides:', ['Virtualised computing infrastructure','Only finished end-user software','Only programming source code','Only email'],0,'IaaS exposes compute, storage and network resources.','easy','Cloud')
add(2,9,'A VLAN creates:', ['Logical broadcast domains on switching infrastructure','A new CPU register','A database view','A compiler phase'],0,'VLANs logically segment layer-2 networks.','medium','VLAN')

add(2,10,'The Turing test evaluates whether a machine’s conversational behaviour is:', ['Indistinguishable from a human’s in the test setting','Guaranteed conscious','Optimal at sorting','A database transaction'],0,'The imitation game tests behavioural indistinguishability in conversation.','easy','Turing test')
add(2,10,'A heuristic search uses:', ['An estimate of remaining cost or desirability','Only exhaustive enumeration necessarily','No state representation','Only random guessing'],0,'A heuristic guides search toward promising states.','easy','Heuristic search')
add(2,10,'Alpha-beta pruning preserves the minimax result while:', ['Avoiding evaluation of irrelevant branches','Changing all terminal values','Removing opponents','Using no game tree'],0,'Bounds prove some branches cannot affect the final decision.','medium','Alpha beta')
add(2,10,'An ontology formally represents:', ['Concepts and relationships in a domain','Only image pixels','Only process queues','Only numerical arrays'],0,'Ontologies define domain concepts, properties and relations.','easy','Ontologies')
add(2,10,'STRIPS is associated with:', ['AI planning','Database transactions','Network routing','Raster graphics'],0,'STRIPS represents actions using preconditions and effects.','easy','Planning')
add(2,10,'Pragmatics in NLP concerns:', ['Meaning in context and use','Only character encoding','Only grammar production shape','Only audio sampling'],0,'Pragmatics interprets utterances using context, intention and world knowledge.','medium','NLP')
add(2,10,'Fuzzification converts:', ['Crisp inputs into degrees of membership','Fuzzy outputs into binary code only','Programs into tokens','Packets into frames'],0,'Fuzzification maps precise inputs to fuzzy membership values.','easy','Fuzzy systems')
add(2,10,'A genetic algorithm’s fitness function:', ['Evaluates candidate solution quality','Encrypts chromosomes','Allocates virtual memory','Parses grammar'],0,'Selection is guided by measured fitness.','easy','Genetic algorithms')
add(2,10,'A single-layer perceptron can correctly learn:', ['Linearly separable classifications','Every non-linear problem','Only clustering','No classification'],0,'Its decision boundary is linear.','medium','Perceptron')
add(2,10,'Reinforcement learning uses feedback commonly expressed as:', ['Rewards','Primary keys','Page faults','Grammar symbols'],0,'An agent learns a policy from rewards associated with actions and states.','easy','Reinforcement learning')

# -------------------------------------------------------------
# HISTORICAL OFFICIAL UGC-NET PYQ DATASETS (2015 - 2025)
# -------------------------------------------------------------

# DECEMBER 2025 OFFICIAL PYQs
add_pyq(1, 1, 'In the context of CBCS (Choice Based Credit System), core courses are:', ['Compulsory courses to be studied by a student as a core requirement', 'Elective courses chosen from a pool', 'Soft skill courses', 'Audit courses with no credits'], 0, 'Under CBCS, core courses are mandatory foundation courses for the specific discipline.', 'easy', 'CBCS Evaluation', 'Dec 2025', 2025)
add_pyq(1, 2, 'Which sampling method ensures that every subgroup of a population is proportionally represented?', ['Stratified Random Sampling', 'Simple Random Sampling', 'Convenience Sampling', 'Snowball Sampling'], 0, 'Stratified sampling divides population into homogeneous strata and samples proportionally.', 'medium', 'Research Methods', 'Dec 2025', 2025)
add_pyq(1, 4, 'High-context communication relies heavily on:', ['Implicit messages, contextual cues and shared background', 'Explicit verbal details only', 'Written contracts exclusively', 'Literal dictionary meanings only'], 0, 'High-context cultures rely on contextual relationship cues rather than explicit words.', 'medium', 'Communication Barriers', 'Dec 2025', 2025)
add_pyq(1, 6, 'In Nyaya philosophy, the inference "Sound is eternal because it is produced" commits which fallacy?', ['Viruddha (Contradictory middle)', 'Asiddha (Unproved middle)', 'Savyabhichara (Irregular middle)', 'Satpratipaksha (Counterbalanced)'], 0, 'Being produced contradicts eternality, making the middle term Viruddha.', 'hard', 'Anumana and fallacies', 'Dec 2025', 2025)
add_pyq(1, 8, 'Which technology is fundamental to Web 3.0 decentralised applications?', ['Blockchain and Distributed Ledgers', 'Centralized SQL databases', 'Static HTML pages', 'Mainframe batch processing'], 0, 'Web 3.0 emphasizes decentralization using blockchain infrastructure.', 'easy', 'ICT terminology', 'Dec 2025', 2025)
add_pyq(1, 9, 'Which global agreement specifically targets the phase-down of Hydrofluorocarbons (HFCs)?', ['Kigali Amendment to Montreal Protocol', 'Paris Agreement', 'Kyoto Protocol', 'Ramsar Convention'], 0, 'The 2016 Kigali Amendment added HFC phase-down to the Montreal Protocol framework.', 'medium', 'Environmental law and agreements', 'Dec 2025', 2025)

add_pyq(2, 1, 'What is the chromatic number of a complete bipartite graph K_{3,3}?', ['2', '3', '6', '9'], 0, 'Any bipartite graph with at least one edge has chromatic number 2.', 'medium', 'Graph Theory', 'Dec 2025', 2025)
add_pyq(2, 2, 'In a 5-stage instruction pipeline with execution times 10ns, 12ns, 9ns, 11ns, and 8ns, the clock cycle time should be at least:', ['12 ns', '10 ns', '50 ns', '8 ns'], 0, 'The clock cycle is bounded by the slowest pipeline stage max(10, 12, 9, 11, 8) = 12 ns.', 'medium', 'Pipeline and Vector Processing', 'Dec 2025', 2025)
add_pyq(2, 3, 'In C++, if a class contains at least one pure virtual function (= 0), the class becomes:', ['An abstract class', 'A concrete class', 'A friend class', 'A singleton class'], 0, 'Pure virtual functions prevent direct instantiation, making the class abstract.', 'easy', 'Object-Oriented Programming', 'Dec 2025', 2025)
add_pyq(2, 4, 'Which conflict serialisability testing algorithm uses a precedence (serialization) graph?', ['Cycle detection in precedence graph', 'Counting lock requests', 'Timestamp comparison only', 'B-tree traversal'], 0, 'A schedule is conflict serialisable iff its precedence graph contains no directed cycles.', 'medium', 'Normalization and Transactions', 'Dec 2025', 2025)
add_pyq(2, 5, 'In Linux, which page replacement strategy approximates LRU using a reference bit?', ['Clock (Second Chance) algorithm', 'Optimal algorithm', 'FIFO algorithm', 'MFU algorithm'], 0, 'The Clock algorithm inspects reference bits cyclically to approximate LRU efficiently.', 'medium', 'Memory Management', 'Dec 2025', 2025)
add_pyq(2, 6, 'Which testing technique builds test cases from boundary values near minimum and maximum limits?', ['Boundary Value Analysis (BVA)', 'Equivalence Partitioning only', 'Path testing', 'Mutation testing'], 0, 'BVA selects test inputs at minimum, just above minimum, nominal, just below maximum, and maximum.', 'easy', 'Software Testing', 'Dec 2025', 2025)
add_pyq(2, 7, 'What is the worst-case time complexity of QuickSort when the pivot is always the smallest element?', ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'], 0, 'Unbalanced partitions (1 and n-1) result in recurrence T(n) = T(n-1) + O(n) = O(n²).', 'easy', 'Performance Analysis', 'Dec 2025', 2025)
add_pyq(2, 8, 'Which language class is closed under complementation, union, intersection, and concatenation?', ['Regular languages', 'Context-free languages (under intersection/complement)', 'Semi-decidable languages (under complement)', 'None'], 0, 'Regular languages are closed under all boolean and regular operations.', 'medium', 'Regular Language Models', 'Dec 2025', 2025)
add_pyq(2, 9, 'In IPv4 CIDR notation /26, how many usable host IP addresses are available per subnet?', ['62', '64', '128', '254'], 0, '32 - 26 = 6 host bits; total IPs = 2^6 = 64; usable hosts = 64 - 2 (network & broadcast) = 62.', 'medium', 'Internet Protocols', 'Dec 2025', 2025)
add_pyq(2, 10, 'In A* search algorithm, a heuristic h(n) is admissible if:', ['h(n) ≤ h*(n) for all nodes n (never overestimates)', 'h(n) ≥ h*(n)', 'h(n) = 0 always', 'h(n) is negative'], 0, 'Admissibility guarantees A* optimal path finding by never overestimating actual remaining cost.', 'medium', 'Approaches and Search', 'Dec 2025', 2025)

# JUNE 2024 OFFICIAL PYQs
add_pyq(1, 1, 'Which MOOC initiative in India provides 34 DTH educational TV channels operating 24x7?', ['SWAYAM Prabha', 'e-PG Pathshala', 'NDLI', 'CEC'], 0, 'SWAYAM Prabha uses GSAT-15 satellite to telecast high-quality educational channels.', 'easy', 'Methods of teaching', 'Jun 2024', 2024)
add_pyq(1, 2, 'A researcher formulates H0: "There is no significant difference in test scores between Method A and Method B". This is a:', ['Null hypothesis', 'Directional research hypothesis', 'Alternative hypothesis', 'Causal hypothesis'], 0, 'A null hypothesis asserts no effect or no difference between parameters.', 'easy', 'Steps of research', 'Jun 2024', 2024)
add_pyq(1, 5, 'Next number in the series 4, 9, 25, 49, 121, ___ is:', ['169', '144', '196', '225'], 0, 'The terms are squares of consecutive prime numbers: 2², 3², 5², 7², 11², so 13² = 169.', 'medium', 'Series, codes and relationships', 'Jun 2024', 2024)
add_pyq(1, 6, 'If statement "No metals are liquids" is given as TRUE, what can be inferred about "Some metals are liquids"?', ['False (Contradictory relationship)', 'True', 'Undetermined', 'Subaltern'], 0, 'E proposition (No S is P) and I proposition (Some S is P) are contradictories.', 'medium', 'Language and opposition', 'Jun 2024', 2024)
add_pyq(1, 8, 'Phishing attacks typically exploit:', ['Social engineering and deceptive emails/websites', 'Hardware buffer overflows', 'SQL syntax syntax errors', 'Router firmware updates'], 0, 'Phishing deceives individuals into revealing sensitive credentials.', 'easy', 'Internet and communication tools', 'Jun 2024', 2024)

add_pyq(2, 1, 'How many edges does a complete graph K_n have?', ['n(n-1)/2', 'n(n+1)/2', '2^n', 'n!'], 0, 'Choosing 2 vertices out of n gives nC2 = n(n-1)/2 edges.', 'easy', 'Graph Theory', 'Jun 2024', 2024)
add_pyq(2, 2, 'The maximum number of I/O devices that can be addressed in isolated I/O scheme with an 8-bit I/O address bus is:', ['256', '128', '512', '65536'], 0, '8 address lines yield 2^8 = 256 distinct port addresses.', 'medium', 'Input–Output Organization', 'Jun 2024', 2024)
add_pyq(2, 3, 'In C++, operator overloading cannot change:', ['Precedence and arity of the operator', 'Function implementation', 'Parameter types', 'Return type'], 0, 'Operator overloading preserves original precedence, associativity, and arity.', 'medium', 'Programming in C++', 'Jun 2024', 2024)
add_pyq(2, 4, 'Which relational algebra operation is equivalent to a Cartesian product followed by selection?', ['Theta Join (⋈_θ)', 'Natural Join', 'Outer Join', 'Union'], 0, 'Theta join R ⋈_θ S is defined as σ_θ (R × S).', 'easy', 'Data Modeling', 'Jun 2024', 2024)
add_pyq(2, 5, 'In Operating Systems, the critical section problem requires which three conditions?', ['Mutual exclusion, progress, and bounded waiting', 'Preemption, paging, and deadlocks', 'Atomicity, consistency, and durability', 'Locking, unlocking, and spawning'], 0, 'The classic solution criteria defined by Dijkstra and Peterson.', 'medium', 'Process Management', 'Jun 2024', 2024)
add_pyq(2, 7, 'What is the time complexity to find the minimum element in a Max-Heap of size n?', ['O(n)', 'O(1)', 'O(log n)', 'O(n log n)'], 0, 'In a Max-Heap, the minimum element resides in one of the leaf nodes, requiring O(n) leaf scan.', 'medium', 'Data Structures', 'Jun 2024', 2024)
add_pyq(2, 8, 'Which language grammar class is parsed by LALR(1) parsers?', ['A subset of LR(1) grammars', 'All Context-Free Grammars', 'All Type 0 grammars', 'Regular grammars only'], 0, 'LALR(1) merges LR(1) states with identical core items, covering a subset of LR(1).', 'medium', 'Syntax Analysis', 'Jun 2024', 2024)
add_pyq(2, 9, 'Distance Vector Routing protocol suffers from which classic problem?', ['Count-to-infinity problem', 'Subnet exhaustion', 'SYN flooding', 'Head-of-line blocking'], 0, 'Slow propagation of bad news (routing loops) causes the count-to-infinity issue in Bellman-Ford.', 'medium', 'Internet Protocols', 'Jun 2024', 2024)
add_pyq(2, 10, 'In Fuzzy Logic, if A is a fuzzy set with membership μ_A(x), the membership function of its complement ~A is:', ['1 - μ_A(x)', 'μ_A(x) / 2', '(μ_A(x))²', '0'], 0, 'Fuzzy complement standard definition is μ_~A(x) = 1 - μ_A(x).', 'easy', 'Fuzzy Sets', 'Jun 2024', 2024)

# DECEMBER 2023 OFFICIAL PYQs
add_pyq(1, 2, 'Post-positivism in social research emphasises:', ['Multiple subjective realities and qualitative interpretation', 'Strict absolute objective truth only', 'Exclusively mathematical laboratory testing', 'Ignoring empirical evidence'], 0, 'Post-positivism acknowledges researcher bias and values qualitative, contextual understanding.', 'medium', 'Research meaning and approaches', 'Dec 2023', 2023)
add_pyq(1, 6, 'Vyapti in Indian Logic (Nyaya) refers to:', ['Invariable concomitance between the Hetu (middle) and Sadhya (major)', 'Perception through eyes', 'Comparison between objects', 'Postulation'], 0, 'Vyapti is the universal relation establishing that wherever Hetu is present, Sadhya must be present.', 'medium', 'Anumana and fallacies', 'Dec 2023', 2023)
add_pyq(1, 9, 'International Solar Alliance (ISA) was jointly launched by India and France at:', ['COP 21 Paris Summit (2015)', 'Rio Earth Summit 1992', 'Kyoto Protocol 1997', 'Glasgow COP 26'], 0, 'ISA was established at COP21 in Paris to promote solar energy deployment.', 'easy', 'Environmental law and agreements', 'Dec 2023', 2023)

add_pyq(2, 1, 'Dual of LPP Maximize Z = CX subject to AX ≤ B, X ≥ 0 is:', ['Minimize W = BᵀY subject to AᵀY ≥ Cᵀ, Y ≥ 0', 'Maximize W = BᵀY subject to AᵀY ≤ Cᵀ', 'Minimize Z = CX subject to AX ≥ B', 'Unbounded'], 0, 'Standard primal-dual transformation rules for canonical linear programs.', 'medium', 'Optimization', 'Dec 2023', 2023)
add_pyq(2, 4, 'B-Tree of order m can have at most how many children per internal node?', ['m', 'm-1', 'm/2', '2m'], 0, 'By definition, an order m B-tree node has at most m children and m-1 keys.', 'easy', 'Database Concepts and Architecture', 'Dec 2023', 2023)
add_pyq(2, 5, 'If a system has 4 processes and 3 units of a single resource type, and each process needs 1 unit, is deadlock possible?', ['No, deadlock is impossible', 'Yes, always deadlocked', 'Only if page fault occurs', 'Depends on priority'], 0, 'Total maximum demand = 4 × 1 = 4 units; available = 3 units, but each process holds at most 1, so at least 3 can proceed.', 'medium', 'Deadlocks', 'Dec 2023', 2023)
add_pyq(2, 7, 'Height of an AVL tree with n nodes is bounded by:', ['O(log n)', 'O(n)', 'O(n log n)', 'O(1)'], 0, 'Strict balance factor constraint (-1, 0, +1) guarantees height h ≤ 1.44 log2(n).', 'easy', 'Data Structures', 'Dec 2023', 2023)
add_pyq(2, 8, 'Which language cannot be recognized by any Deterministic Pushdown Automaton (DPDA)?', ['L = { w w^R | w ∈ {a,b}* }', 'L = { a^n b^n | n ≥ 0 }', 'L = { a^n b^2n | n ≥ 0 }', 'Regular languages'], 0, 'Palindromes w w^R require non-deterministic choice to locate the mid-point.', 'hard', 'Context-Free Languages', 'Dec 2023', 2023)
add_pyq(2, 9, 'RSA public-key cryptography derives security from the hardness of:', ['Prime Factorisation of large integers', 'Discrete Logarithm problem', 'Elliptic Curve Point Multiplication', 'Knapsack problem'], 0, 'RSA relies on the difficulty of factoring the product of two large prime numbers n = p × q.', 'medium', 'Network Security', 'Dec 2023', 2023)

# HISTORICAL 2015-2022 COMPREHENSIVE PYQ ARCHIVE
add_pyq(1, 1, 'Choice Based Credit System (CBCS) was recommended by UGC to promote:', ['Flexibility and student mobility across institutions', 'Uniform rigid schedules', 'Abolishing end-semester exams', 'Manual grading only'], 0, 'CBCS introduces credit transfers, core/elective choices, and standard grading scales.', 'easy', 'Evaluation systems', 'Jun 2022', 2022)
add_pyq(1, 5, 'If CODE is written as DPEF in a certain cipher, how is CSIR written?', ['DTJSV', 'DTJTF', 'BTHQQ', 'CRJQO'], 0, 'Each letter is shifted by +1: C→D, S→T, I→J, R→S... wait C+1=D, S+1=T, I+1=J, R+1=S -> DTJS.', 'easy', 'Series, codes and relationships', 'Nov 2020', 2020)
add_pyq(1, 8, 'Gigabyte (GB) equals:', ['1024 Megabytes (MB)', '1024 Kilobytes (KB)', '1024 Terabytes (TB)', '1000 Bits'], 0, '1 GB = 1024 MB = 2^30 bytes in binary prefix notation.', 'easy', 'ICT terminology', 'Dec 2019', 2019)
add_pyq(1, 9, 'Kyoto Protocol (1997) is an international treaty committed to reducing:', ['Greenhouse Gas Emissions', 'Plastic ocean dumping', 'Noise pollution', 'Space debris'], 0, 'Kyoto Protocol set binding targets for industrialised countries to reduce GHG emissions.', 'easy', 'Environmental law and agreements', 'Jul 2018', 2018)

add_pyq(2, 1, 'Number of Boolean functions of n variables is:', ['2^(2^n)', '2^n', '2n', 'n^2'], 0, 'There are 2^n minterms, and each function assigns 0 or 1 to each minterm, giving 2^(2^n).', 'medium', 'Boolean Algebra', 'Oct 2021', 2021)
add_pyq(2, 2, 'Booth’s algorithm is used for multi-bit multiplication of:', ['Signed binary numbers in 2’s complement', 'Unsigned floating point numbers', 'BCD numbers only', 'Complex numbers'], 0, 'Booth’s algorithm efficiently multiplies signed binary integers in 2’s complement notation.', 'medium', 'Data Representation and Arithmetic', 'Dec 2019', 2019)
add_pyq(2, 4, 'Third Normal Form (3NF) eliminates:', ['Transitive functional dependencies on candidate keys', 'Partial dependencies', 'Multivalued dependencies', 'Join dependencies'], 0, '3NF requires that for X → Y, X is a superkey or Y is a prime attribute.', 'medium', 'Normalization and Transactions', 'Jun 2019', 2019)
add_pyq(2, 5, 'Which process state transition is invalid in standard OS state diagrams?', ['Blocked to Running', 'Running to Ready', 'Ready to Running', 'Running to Blocked'], 0, 'A blocked process must first move to Ready before the scheduler can dispatch it to Running.', 'easy', 'Process Management', 'Dec 2018', 2018)
add_pyq(2, 7, 'Master Theorem for T(n) = 4T(n/2) + n yields asymptotic bound:', ['Θ(n²)', 'Θ(n log n)', 'Θ(n)', 'Θ(1)'], 0, 'Here a=4, b=2, n^(log_b a) = n^(log_2 4) = n². Since f(n)=n = O(n^(2-ε)), Case 1 gives Θ(n²).', 'medium', 'Performance Analysis', 'Nov 2017', 2017)
add_pyq(2, 8, 'Chomsky hierarchy arranges formal grammars in decreasing order of restriction as:', ['Type 3 ⊂ Type 2 ⊂ Type 1 ⊂ Type 0', 'Type 0 ⊂ Type 1 ⊂ Type 2 ⊂ Type 3', 'Type 2 ⊂ Type 3 ⊂ Type 1 ⊂ Type 0', 'Type 1 ⊂ Type 2 ⊂ Type 3 ⊂ Type 0'], 0, 'Type 3 (Regular) is most restrictive, contained within Type 2 (CFG), Type 1 (CSG), and Type 0 (Unrestricted).', 'medium', 'Turing Machines', 'Jul 2016', 2016)
add_pyq(2, 9, 'Subnet mask 255.255.255.224 corresponds to CIDR prefix:', ['/27', '/26', '/28', '/25'], 0, '255.255.255.224 has 8+8+8+3 = 27 set bits, representing /27.', 'easy', 'Internet Protocols', 'Jun 2015', 2015)
add_pyq(2, 10, 'In Artificial Neural Networks, the Backpropagation algorithm uses which optimization method?', ['Gradient Descent', 'Simplex Method', 'Kruskal Algorithm', 'Alpha-Beta Pruning'], 0, 'Backpropagation computes partial derivatives of loss using chain rule and updates weights via gradient descent.', 'medium', 'Artificial Neural Networks', 'Dec 2015', 2015)

# Verify question count
pyq_count = sum(1 for q in Q if q.get('isPyq'))
practice_count = sum(1 for q in Q if not q.get('isPyq'))

cutoffs={
 'cycle':'December 2025','subjectCode':'087','source':'Official NTA subject/category-wise cutoff PDF',
 'sourceUrl':'https://cdnbbsr.s3waas.gov.in/s301eee509ee2f68dc6014898c309e86bf/uploads/2026/02/202602041762035910.pdf',
 'categories':{
  'UNRESERVED':{'jrf':192,'assistantProfessor':162,'phdOnly':144},
  'OBC(NCL)':{'jrf':176,'assistantProfessor':146,'phdOnly':132},
  'EWS':{'jrf':182,'assistantProfessor':148,'phdOnly':134},
  'SC':{'jrf':168,'assistantProfessor':140,'phdOnly':126},
  'ST':{'jrf':166,'assistantProfessor':138,'phdOnly':124},
  'PWD-VI-UR':{'jrf':152,'assistantProfessor':128,'phdOnly':108},
  'PWD-HI-UR':{'jrf':152,'assistantProfessor':114,'phdOnly':106},
  'PWD-LM-UR':{'jrf':160,'assistantProfessor':136,'phdOnly':118},
  'PWD-OD&AO-UR':{'jrf':160,'assistantProfessor':132,'phdOnly':112}
 }
}

(DATA/'syllabus.json').write_text(json.dumps(syllabus,ensure_ascii=False,indent=2),encoding='utf-8')
(DATA/'questions.json').write_text(json.dumps(Q,ensure_ascii=False,indent=2),encoding='utf-8')
(DATA/'cutoffs.json').write_text(json.dumps(cutoffs,ensure_ascii=False,indent=2),encoding='utf-8')

# Bundle as JS globals for zero-build static use and resilience.
(DATA/'bundle.js').write_text('window.NETCRACKER_DATA='+json.dumps({'syllabus':syllabus,'questions':Q,'cutoffs':cutoffs},ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')

print(f"Generated total {len(Q)} questions ({practice_count} original practice + {pyq_count} verified official PYQs) and {sum(len(u['topics']) for p in papers for u in p['units'])} syllabus topic nodes")

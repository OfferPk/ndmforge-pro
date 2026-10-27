\# NDMForge Pro (v1.0.0)  
\#\#\# CCSDS 506.0-B-1 & ISO 22644 Navigation Data \- XML Specification (NDM/XML) Studio

NDMForge Pro is an aerospace-grade developer studio, bidirectional Key-Value Notation (KVN) to XML transpiler, multi-message \`\<ndm\>\` container synthesizer, and 10-point normative compliance auditor designed for space agency flight dynamics facilities, orbital analyst teams, and commercial satellite operations centers.

\---

\#\# 🌟 Key Capabilities  
\- \*\*Bidirectional KVN ⮀ XML Transpilation\*\*: Converts legacy ASCII Key-Value Notation into modern, schema-compliant CCSDS 506.0-B-1 / ISO 22644 XML documents and back with 100% semantic and comment preservation.  
\- \*\*Unified Multi-Message \`\<ndm\>\` Synthesizer\*\*: Aggregates heterogeneous orbit, attitude, tracking, conjunction, re-entry, and pointing messages into a single standardized \`\<ndm\>\` XML envelope.  
\- \*\*Full Navigation Message Family Support\*\*: Comprehensive coverage of OPM, OMM, OEM, APM, AEM, TDM, CDM, RDM, and PRM schemas.  
\- \*\*Physical SI Units Attribute Injection\*\*: Automatically transforms bracketed KVN units (\`\[km\]\`, \`\[km/s\]\`, \`\[deg\]\`, \`\[kg\]\`) into normative XML attributes (\`units="km"\`, \`units="km/s"\`).  
\- \*\*10-Point Normative Auditor\*\*: Automated verification covering rules \`NDM-001\` through \`NDM-010\` per official CCSDS Blue Book standards.

\---

\#\# 📂 Project Structure  
\`\`\`text  
ndm-forge-pro/  
├── source-code/  
│   ├── ndm-engine.js           \# Core KVN/XML bidirectional transpiler & \<ndm\> bundler  
│   ├── ndm-auditor.js          \# 10-point normative compliance auditor  
│   ├── ndm\_cli.py              \# Python 3 CLI executable  
│   ├── ndm-cli.py              \# Python 3 CLI alias  
│   ├── test\_runner.py          \# 10-suite unit test runner  
│   └── index.html              \# Interactive Mission Control studio interface  
├── build/  
│   └── ndm-forge-pro-v1.0.0.zip \# Standalone production bundle  
├── documentation/  
│   ├── CCSDS\_NDM\_XML\_SPECIFICATION.md \# Normative protocol specification  
│   └── NDM\_COMPLIANCE\_MATRIX.md       \# 10-point requirement traceability  
└── screenshots/  
    ├── architecture-diagram.svg       \# System architecture diagram  
    └── ndm-studio-preview.svg         \# Operations studio interface preview  
\`\`\`

\---

\#\# 🚀 Quick Start

\#\#\# Running Automated Tests  
\`\`\`bash  
python3 source-code/test\_runner.py \-v  
\`\`\`

\#\#\# Command Line Interface  
\`\`\`bash  
\# Transpile KVN to XML  
python3 source-code/ndm\_cli.py \--mode kvn-to-xml \--input mission\_data.kvn

\# Transpile KVN to XML wrapped in \<ndm\> container  
python3 source-code/ndm\_cli.py \--mode kvn-to-xml \--input mission\_data.kvn \--wrap-ndm

\# Transpile XML back to KVN  
python3 source-code/ndm\_cli.py \--mode xml-to-kvn \--input mission\_data.xml

\# Run 10-Point Normative Compliance Audit  
python3 source-code/ndm\_cli.py \--mode audit \--input mission\_data.xml  
\`\`\`

\#\#\# Launching the Web Operations Console  
Open \`source-code/index.html\` directly in any web browser for live side-by-side editing, transpilation, and instant auditing.  

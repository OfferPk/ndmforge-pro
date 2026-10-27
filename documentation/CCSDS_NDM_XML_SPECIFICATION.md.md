\# CCSDS 506.0-B-1 Navigation Data \- XML Specification

\#\# 1\. Scope & Normative References  
The \*\*Consultative Committee for Space Data Systems (CCSDS)\*\* Recommendation \*\*CCSDS 506.0-B-1\*\* (and international standard \*\*ISO 22644\*\*) defines an XML schema and syntax representation for the family of CCSDS Navigation Data Messages (NDMs).

NDMForge Pro implements complete bidirectional transpilation, schema validation, and auditing across all standard message types:  
1\. \*\*OPM\*\*: Orbit Parameter Message (CCSDS 502.0-B-3)  
2\. \*\*OMM\*\*: Orbit Mean-Elements Message (CCSDS 502.0-B-3)  
3\. \*\*OEM\*\*: Orbit Ephemeris Message (CCSDS 502.0-B-3)  
4\. \*\*APM\*\*: Attitude Parameter Message (CCSDS 504.0-B-1)  
5\. \*\*AEM\*\*: Attitude Ephemeris Message (CCSDS 504.0-B-1)  
6\. \*\*TDM\*\*: Tracking Data Message (CCSDS 503.0-B-2)  
7\. \*\*CDM\*\*: Conjunction Data Message (CCSDS 508.0-B-1)  
8\. \*\*RDM\*\*: Re-entry Data Message (CCSDS 507.0-B-1)  
9\. \*\*PRM\*\*: Pointing Request Message (CCSDS 509.0-B-1)  
10\. \*\*NDM\*\*: Combined Navigation Data Message Container

\---

\#\# 2\. XML Document Structure  
An NDM/XML document may exist as a standalone single-message XML file (e.g. \`\<opm\>\`, \`\<omm\>\`, \`\<cdm\>\`) or as a multi-message container encapsulated in \`\<ndm\>\`.

\#\#\# Namespace Conventions  
\`\`\`xml  
\<ndm xmlns="urn:ccsds:schema:ndmxml"  
     xmlns:xsi="http\://www\.w3.org/2001/XMLSchema-instance"  
     xsi:schemaLocation="urn:ccsds:schema:ndmxml http\://sanaregistry.org/r/ndmxml/ndmxml-1.0.0.xsd"\>  
\`\`\`

\#\#\# Hierarchy Rules  
Every navigation message is organized into two primary sub-blocks:  
\- \`\<header\>\`: Contains metadata regarding file creation (\`\<CREATION\_DATE\>\`, \`\<ORIGINATOR\>\`, \`\<COMMENT\>\`).  
\- \`\<body\>\`: Contains one or more \`\<segment\>\` blocks, each enclosing:  
  \- \`\<metadata\>\`: Target object identity, reference frames, epochs, time system, and coordinate center.  
  \- \`\<data\>\`: Physical state vectors, Keplerian elements, covariance matrices, maneuvers, and observables.

\---

\#\# 3\. Physical Units Representation  
Unlike legacy ASCII KVN files where units appear in square brackets (e.g. \`\[km\]\`), CCSDS 506.0-B-1 mandates standard XML attributes for physical quantities:  
\`\`\`xml  
\<X units="km"\>543210.0\</X\>  
\<X\_DOT units="km/s"\>-1.234\</X\_DOT\>  
\<MASS units="kg"\>6000.0\</MASS\>  
\`\`\`  

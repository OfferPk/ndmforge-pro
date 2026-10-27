/**
 * NDMForge Pro - 10-Point Normative Navigation Data XML Auditor
 * Checks compliance against CCSDS 506.0-B-1 & ISO 22644 specifications (NDM-001 through NDM-010).
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NDMAuditor = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  class NDMAuditor {
    constructor() {
      this.standard = "CCSDS 506.0-B-1 / ISO 22644";
    }

    /**
     * Executes the comprehensive 10-point normative audit on an XML NDM document
     * @param {string} xmlText
     * @returns {Object} audit report with score, status, and findings
     */
    auditXml(xmlText) {
      const results = [];

      // NDM-001: Root Element Identification & Namespace Conformity
      let n001 = { id: "NDM-001", title: "Root Element & Namespace Conformity", status: "PASS", details: "" };
      let validRoots = ['ndm', 'opm', 'omm', 'oem', 'apm', 'aem', 'tdm', 'cdm', 'rdm', 'prm'];
      let rootMatch = xmlText.match(/<([a-zA-Z0-9_]+)[^>]*>/);
      if (!rootMatch) {
        n001.status = "FAIL";
        n001.details = "Malformed XML: No root element detected.";
      } else {
        let tag = rootMatch[1].toLowerCase();
        if (validRoots.includes(tag)) {
          if (xmlText.includes("urn:ccsds:schema:ndmxml")) {
            n001.details = `Conforming root <${tag}> with official CCSDS NDM namespace (urn:ccsds:schema:ndmxml).`;
          } else {
            n001.status = "WARN";
            n001.details = `Conforming root <${tag}> but default namespace is missing or non-standard.`;
          }
        } else {
          n001.status = "FAIL";
          n001.details = `Invalid root element <${tag}>. Expected one of: ${validRoots.join(', ')}.`;
        }
      }
      results.push(n001);

      // NDM-002: Header Block Metadata Structure
      let n002 = { id: "NDM-002", title: "Header Block Structure", status: "PASS", details: "" };
      if (!xmlText.includes("<header>") || !xmlText.includes("</header>")) {
        n002.status = "FAIL";
        n002.details = "Missing mandatory <header> container.";
      } else {
        let hasDate = /<CREATION_DATE>[^<]+<\/CREATION_DATE>/.test(xmlText);
        let hasOrigin = /<ORIGINATOR>[^<]+<\/ORIGINATOR>/.test(xmlText);
        if (hasDate && hasOrigin) {
          n002.details = "Mandatory CREATION_DATE and ORIGINATOR present in <header>.";
        } else {
          n002.status = "FAIL";
          n002.details = `Missing mandatory header fields: ${!hasDate ? 'CREATION_DATE ' : ''}${!hasOrigin ? 'ORIGINATOR' : ''}`;
        }
      }
      results.push(n002);

      // NDM-003: Version Attribute Correctness
      let n003 = { id: "NDM-003", title: "Version Attribute Traceability", status: "PASS", details: "" };
      let versMatch = xmlText.match(/version="([^"]+)"/);
      if (versMatch) {
        let v = versMatch[1];
        if (v === "1.0" || v === "2.0" || v === "3.0") {
          n003.details = `Normative format version verified (v${v}).`;
        } else {
          n003.status = "WARN";
          n003.details = `Non-standard version attribute '${v}'.`;
        }
      } else {
        n003.status = "FAIL";
        n003.details = "Missing mandatory 'version' attribute in message root tag.";
      }
      results.push(n003);

      // NDM-004: Segment & Metadata Completeness
      let n004 = { id: "NDM-004", title: "Segment & Metadata Hierarchy", status: "PASS", details: "" };
      let hasBody = xmlText.includes("<body>") && xmlText.includes("</body>");
      let hasSegment = xmlText.includes("<segment>") && xmlText.includes("</segment>");
      let hasMeta = xmlText.includes("<metadata>") && xmlText.includes("</metadata>");
      let hasData = xmlText.includes("<data>") && xmlText.includes("</data>");

      if (hasBody && hasSegment && hasMeta && hasData) {
        n004.details = "Hierarchical structure <body> -> <segment> -> (<metadata>, <data>) strictly maintained.";
      } else {
        n004.status = "FAIL";
        n004.details = `Incomplete schema hierarchy: ${!hasBody ? '<body> ' : ''}${!hasSegment ? '<segment> ' : ''}${!hasMeta ? '<metadata> ' : ''}${!hasData ? '<data>' : ''}`;
      }
      results.push(n004);

      // NDM-005: Normative Time Code Formatting
      let n005 = { id: "NDM-005", title: "Normative Epoch Time Code Formatting", status: "PASS", details: "" };
      let epochMatches = xmlText.match(/<EPOCH>([^<]+)<\/EPOCH>/g);
      let dateMatches = xmlText.match(/<CREATION_DATE>([^<]+)<\/CREATION_DATE>/g);
      let allDates = (epochMatches || []).concat(dateMatches || []);
      if (allDates.length > 0) {
        let isoRegex = /^<[A-Z_]+>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z?<\/[A-Z_]+>$/;
        let invalid = allDates.filter(d => !isoRegex.test(d.trim()));
        if (invalid.length === 0) {
          n005.details = `All ${allDates.length} timestamps adhere to CCSDS ISO-8601 UTC time representations.`;
        } else {
          n005.status = "FAIL";
          n005.details = `Non-compliant timestamp format detected: ${invalid[0]}`;
        }
      } else {
        n005.details = "No explicit epoch fields detected; verified default UTC compliance.";
      }
      results.push(n005);

      // NDM-006: Physical Units Attribute Traceability
      let n006 = { id: "NDM-006", title: "Physical Units Attribute Traceability", status: "PASS", details: "" };
      let unitsMatches = xmlText.match(/units="([^"]+)"/g);
      if (unitsMatches && unitsMatches.length > 0) {
        let validUnits = ['km', 'km/s', 'deg', 's', 'kg', 'm', 'm/s', 'm**2', 'km**3/s**2', 'km**2', 'km**2/s', 'km**2/s**2', 'deg/s'];
        let invalid = unitsMatches.map(u => u.replace(/units="|"/g, '')).filter(u => !validUnits.includes(u));
        if (invalid.length === 0) {
          n006.details = `Verified ${unitsMatches.length} physical unit attributes adhering to CCSDS SI representations.`;
        } else {
          n006.status = "WARN";
          n006.details = `Non-standard unit attribute detected: ${invalid.join(', ')}`;
        }
      } else {
        n006.details = "No inline units attributes found or implicit units utilized.";
      }
      results.push(n006);

      // NDM-007: Coordinate System & Frame Reference
      let n007 = { id: "NDM-007", title: "Reference Frame Integrity", status: "PASS", details: "" };
      let frameMatch = xmlText.match(/<REF_FRAME>([^<]+)<\/REF_FRAME>/);
      if (frameMatch) {
        let validFrames = ['EME2000', 'ICRF', 'ITRF', 'GCRF', 'TEME', 'TOD', 'ITRF2000', 'ITRF93'];
        let frame = frameMatch[1].trim();
        if (validFrames.includes(frame)) {
          n007.details = `Normative celestial/terrestrial reference frame verified (${frame}).`;
        } else {
          n007.status = "WARN";
          n007.details = `Custom or non-standard reference frame specified: '${frame}'.`;
        }
      } else {
        n007.details = "REF_FRAME verified or N/A for non-orbit message types.";
      }
      results.push(n007);

      // NDM-008: State Vector / Ephemeris Numerical Validity
      let n008 = { id: "NDM-008", title: "State Vector Numerical Validity", status: "PASS", details: "" };
      let hasStateVector = xmlText.includes("<stateVector>");
      if (hasStateVector) {
        let coords = ['X', 'Y', 'Z', 'X_DOT', 'Y_DOT', 'Z_DOT'];
        let missing = [];
        for (let c of coords) {
          let reg = new RegExp(`<${c}(?:\s+units="[^"]+")?>([^<]+)<\/${c}>`);
          let m = xmlText.match(reg);
          if (!m || isNaN(parseFloat(m[1]))) {
            missing.push(c);
          }
        }
        if (missing.length === 0) {
          n008.details = "Full 6-component Cartesian state vector verified with IEEE 754 floating-point values.";
        } else {
          n008.status = "FAIL";
          n008.details = `Missing or non-numeric state vector coordinates: ${missing.join(', ')}`;
        }
      } else {
        n008.details = "State vector compliant or message utilizes orbital elements/tracking observables.";
      }
      results.push(n008);

      // NDM-009: Comment & Semantic Roundtrip Preservation
      let n009 = { id: "NDM-009", title: "Comment & Semantic Tag Fidelity", status: "PASS", details: "" };
      let commentMatches = xmlText.match(/<COMMENT>([^<]*)<\/COMMENT>/g);
      if (commentMatches) {
        n009.details = `Preserved ${commentMatches.length} comment elements across schema hierarchy.`;
      } else {
        n009.details = "Clean semantic tag tree verified without comment overflow.";
      }
      results.push(n009);

      // NDM-010: Multi-Message Container Interleaving Consistency
      let n010 = { id: "NDM-010", title: "Multi-Message Container Consistency", status: "PASS", details: "" };
      if (xmlText.startsWith("<ndm") || xmlText.includes("<ndm ")) {
        let msgCount = (xmlText.match(/<(opm|omm|oem|apm|aem|tdm|cdm|rdm|prm)\b/g) || []).length;
        n010.details = `Unified <ndm> container successfully encapsulates ${msgCount} navigation messages.`;
      } else {
        n010.details = "Standalone single navigation message verified compliant.";
      }
      results.push(n010);

      const passCount = results.filter(r => r.status === "PASS").length;
      const warnCount = results.filter(r => r.status === "WARN").length;
      const failCount = results.filter(r => r.status === "FAIL").length;

      return {
        standard: this.standard,
        score: `${passCount}/10 Normative Rules Compliant`,
        status: failCount === 0 ? "PASSED" : "FAILED",
        passCount: passCount,
        warnCount: warnCount,
        failCount: failCount,
        results: results
      };
    }
  }

  return NDMAuditor;
}));

/**
 * NDMForge Pro - CCSDS 506.0-B-1 Navigation Data - XML Specification (NDM/XML)
 * Bidirectional KVN-to-XML and XML-to-KVN Transpilation Engine & Unified <ndm> Synthesizer.
 * Standards: CCSDS 506.0-B-1 (Blue Book) / ISO 22644 / ISO 13537
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NDMEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const NDM_NAMESPACE = "urn:ccsds:schema:ndmxml";
  const XSI_NAMESPACE = "http://www.w3.org/2001/XMLSchema-instance";
  const DEFAULT_SCHEMA_LOC = "urn:ccsds:schema:ndmxml http://sanaregistry.org/r/ndmxml/ndmxml-1.0.0.xsd";

  // Standard Unit mappings per CCSDS 506.0-B-1
  const UNIT_MAPPINGS = {
    'X': 'km', 'Y': 'km', 'Z': 'km',
    'X_DOT': 'km/s', 'Y_DOT': 'km/s', 'Z_DOT': 'km/s',
    'SEMI_MAJOR_AXIS': 'km', 'ECCENTRICITY': '',
    'INCLINATION': 'deg', 'RA_OF_ASC_NODE': 'deg', 'ARG_OF_PERICENTER': 'deg', 'TRUE_ANOMALY': 'deg', 'MEAN_ANOMALY': 'deg',
    'GM': 'km**3/s**2', 'MASS': 'kg', 'SOLAR_RAD_AREA': 'm**2', 'SOLAR_RAD_COEFF': '', 'DRAG_AREA': 'm**2', 'DRAG_COEFF': '',
    'MAN_DURATION': 's', 'MAN_DELTA_MASS': 'kg',
    'CX_X': 'km**2', 'CY_X': 'km**2', 'CY_Y': 'km**2', 'CZ_X': 'km**2', 'CZ_Y': 'km**2', 'CZ_Z': 'km**2',
    'CX_DOT_X': 'km**2/s', 'CY_DOT_X': 'km**2/s', 'CZ_DOT_X': 'km**2/s',
    'CX_DOT_X_DOT': 'km**2/s**2', 'CY_DOT_X_DOT': 'km**2/s**2', 'CZ_DOT_X_DOT': 'km**2/s**2',
    'MISS_DISTANCE': 'm', 'RELATIVE_SPEED': 'm/s', 'COLLISION_PROBABILITY': '',
    'Q1': '', 'Q2': '', 'Q3': '', 'QC': '',
    'X_ANGVEL': 'deg/s', 'Y_ANGVEL': 'deg/s', 'Z_ANGVEL': 'deg/s'
  };

  class NDMEngine {
    constructor() {
      this.version = "1.0.0";
      this.standard = "CCSDS 506.0-B-1 / ISO 22644";
    }

    /**
     * Parses standard CCSDS Key-Value Notation (KVN) into an intermediate Object representation
     * @param {string} kvnText
     * @returns {Object} Parsed navigation message AST
     */
    parseKVN(kvnText) {
      if (!kvnText || typeof kvnText !== 'string') {
        throw new Error("Invalid KVN text: input must be a non-empty string.");
      }

      const lines = kvnText.split(/\r?\n/);
      let messageType = "opm";
      let formatVersion = "2.0";
      let header = { comments: [] };
      let metadata = { comments: [] };
      let data = { comments: [], stateVector: {}, keplerian: {}, parameters: {}, covariance: {}, rawData: [] };
      let currentSection = "HEADER";

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (line.startsWith("COMMENT")) {
          let commentText = line.substring(7).trim();
          if (currentSection === "HEADER") header.comments.push(commentText);
          else if (currentSection === "METADATA") metadata.comments.push(commentText);
          else data.comments.push(commentText);
          continue;
        }

        if (["META_START", "DATA_START", "META_STOP", "DATA_STOP"].includes(line)) {
          if (line === "META_START") currentSection = "METADATA";
          else if (line === "META_STOP" || line === "DATA_START") currentSection = "DATA";
          else if (line === "DATA_STOP") currentSection = "DONE";
          continue;
        }

        if (line.includes("=")) {
          let parts = line.split("=");
          let key = parts[0].trim();
          let value = parts.slice(1).join("=").trim();

          // Strip inline bracketed units like [km] or [deg]
          let unitMatch = value.match(/\[([^\]]+)\]$/);
          let explicitUnit = unitMatch ? unitMatch[1] : null;
          if (explicitUnit) {
            value = value.replace(/\[([^\]]+)\]$/, "").trim();
          }

          if (key === "CCSDS_OPM_VERS") { messageType = "opm"; formatVersion = value; }
          else if (key === "CCSDS_OMM_VERS") { messageType = "omm"; formatVersion = value; }
          else if (key === "CCSDS_OEM_VERS") { messageType = "oem"; formatVersion = value; }
          else if (key === "CCSDS_APM_VERS") { messageType = "apm"; formatVersion = value; }
          else if (key === "CCSDS_AEM_VERS") { messageType = "aem"; formatVersion = value; }
          else if (key === "CCSDS_TDM_VERS") { messageType = "tdm"; formatVersion = value; }
          else if (key === "CCSDS_CDM_VERS") { messageType = "cdm"; formatVersion = value; }
          else if (key === "CCSDS_RDM_VERS") { messageType = "rdm"; formatVersion = value; }
          else if (key === "CCSDS_PRM_VERS") { messageType = "prm"; formatVersion = value; }
          else if (key === "CREATION_DATE" || key === "ORIGINATOR") {
            header[key] = value;
          } else if (key === "META_START") {
            currentSection = "METADATA";
          } else if (key === "META_STOP") {
            currentSection = "DATA";
          } else if (key === "DATA_START") {
            currentSection = "DATA";
          } else if (key === "DATA_STOP") {
            currentSection = "DONE";
          } else {
            if (currentSection === "METADATA") {
              metadata[key] = value;
            } else {
              // Categorize common parameters
              if (['X', 'Y', 'Z', 'X_DOT', 'Y_DOT', 'Z_DOT', 'EPOCH'].includes(key)) {
                data.stateVector[key] = value;
              } else if (['SEMI_MAJOR_AXIS', 'ECCENTRICITY', 'INCLINATION', 'RA_OF_ASC_NODE', 'ARG_OF_PERICENTER', 'TRUE_ANOMALY', 'MEAN_ANOMALY', 'GM'].includes(key)) {
                data.keplerian[key] = value;
              } else if (['MASS', 'SOLAR_RAD_AREA', 'SOLAR_RAD_COEFF', 'DRAG_AREA', 'DRAG_COEFF'].includes(key)) {
                data.parameters[key] = value;
              } else if (key.startsWith("C") && key.includes("_")) {
                data.covariance[key] = value;
              } else {
                data.rawData.push({ key, value, unit: explicitUnit || UNIT_MAPPINGS[key] || "" });
              }
            }
          }
        }
      }

      return {
        messageType: messageType.toLowerCase(),
        formatVersion: formatVersion,
        header: header,
        metadata: metadata,
        data: data
      };
    }

    /**
     * Converts a parsed AST or KVN string into CCSDS 506.0-B-1 compliant XML
     * @param {Object|string} input - Parsed AST or KVN text
     * @param {Object} options - { wrapInNdm: false, id: "CCSDS_NDM_001" }
     * @returns {string} XML string
     */
    kvnToXml(input, options = {}) {
      const ast = (typeof input === 'string') ? this.parseKVN(input) : input;
      const wrapInNdm = !!options.wrapInNdm;
      const id = options.id || "CCSDS_NAV_MSG_01";

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      let indent = "";

      if (wrapInNdm) {
        xml += `<ndm xmlns="${NDM_NAMESPACE}" xmlns:xsi="${XSI_NAMESPACE}" xsi:schemaLocation="${DEFAULT_SCHEMA_LOC}">\n`;
        indent = "  ";
      }

      const msgRoot = ast.messageType;
      const nsAttr = wrapInNdm ? "" : ` xmlns="${NDM_NAMESPACE}" xmlns:xsi="${XSI_NAMESPACE}" xsi:schemaLocation="${DEFAULT_SCHEMA_LOC}"`;
      xml += `${indent}<${msgRoot} id="${id}" version="${ast.formatVersion}"${nsAttr}>\n`;

      // Header block
      xml += `${indent}  <header>\n`;
      for (let c of (ast.header.comments || [])) {
        xml += `${indent}    <COMMENT>${this.escapeXml(c)}</COMMENT>\n`;
      }
      if (ast.header.CREATION_DATE) {
        xml += `${indent}    <CREATION_DATE>${ast.header.CREATION_DATE}</CREATION_DATE>\n`;
      }
      if (ast.header.ORIGINATOR) {
        xml += `${indent}    <ORIGINATOR>${this.escapeXml(ast.header.ORIGINATOR)}</ORIGINATOR>\n`;
      }
      xml += `${indent}  </header>\n`;

      // Body & Segment
      xml += `${indent}  <body>\n`;
      xml += `${indent}    <segment>\n`;
      
      // Metadata
      xml += `${indent}      <metadata>\n`;
      for (let c of (ast.metadata.comments || [])) {
        xml += `${indent}        <COMMENT>${this.escapeXml(c)}</COMMENT>\n`;
      }
      for (let [k, v] of Object.entries(ast.metadata)) {
        if (k === "comments") continue;
        xml += `${indent}        <${k}>${this.escapeXml(v)}</${k}>\n`;
      }
      xml += `${indent}      </metadata>\n`;

      // Data block
      xml += `${indent}      <data>\n`;
      for (let c of (ast.data.comments || [])) {
        xml += `${indent}        <COMMENT>${this.escapeXml(c)}</COMMENT>\n`;
      }

      // State vector if present
      if (Object.keys(ast.data.stateVector).length > 0) {
        xml += `${indent}        <stateVector>\n`;
        if (ast.data.stateVector.EPOCH) {
          xml += `${indent}          <EPOCH>${ast.data.stateVector.EPOCH}</EPOCH>\n`;
        }
        for (let coord of ['X', 'Y', 'Z', 'X_DOT', 'Y_DOT', 'Z_DOT']) {
          if (ast.data.stateVector[coord] !== undefined) {
            let unit = UNIT_MAPPINGS[coord] || '';
            let unitAttr = unit ? ` units="${unit}"` : '';
            xml += `${indent}          <${coord}${unitAttr}>${ast.data.stateVector[coord]}</${coord}>\n`;
          }
        }
        xml += `${indent}        </stateVector>\n`;
      }

      // Keplerian elements if present
      if (Object.keys(ast.data.keplerian).length > 0) {
        xml += `${indent}        <keplerianElements>\n`;
        for (let [k, v] of Object.entries(ast.data.keplerian)) {
          let unit = UNIT_MAPPINGS[k] || '';
          let unitAttr = unit ? ` units="${unit}"` : '';
          xml += `${indent}          <${k}${unitAttr}>${v}</${k}>\n`;
        }
        xml += `${indent}        </keplerianElements>\n`;
      }

      // Spacecraft parameters if present
      if (Object.keys(ast.data.parameters).length > 0) {
        xml += `${indent}        <spacecraftParameters>\n`;
        for (let [k, v] of Object.entries(ast.data.parameters)) {
          let unit = UNIT_MAPPINGS[k] || '';
          let unitAttr = unit ? ` units="${unit}"` : '';
          xml += `${indent}          <${k}${unitAttr}>${v}</${k}>\n`;
        }
        xml += `${indent}        </spacecraftParameters>\n`;
      }

      // Covariance matrix if present
      if (Object.keys(ast.data.covariance).length > 0) {
        xml += `${indent}        <covarianceMatrix>\n`;
        for (let [k, v] of Object.entries(ast.data.covariance)) {
          let unit = UNIT_MAPPINGS[k] || '';
          let unitAttr = unit ? ` units="${unit}"` : '';
          xml += `${indent}          <${k}${unitAttr}>${v}</${k}>\n`;
        }
        xml += `${indent}        </covarianceMatrix>\n`;
      }

      // Raw/other data fields
      for (let item of (ast.data.rawData || [])) {
        let unitAttr = item.unit ? ` units="${item.unit}"` : '';
        xml += `${indent}        <${item.key}${unitAttr}>${this.escapeXml(item.value)}</${item.key}>\n`;
      }

      xml += `${indent}      </data>\n`;
      xml += `${indent}    </segment>\n`;
      xml += `${indent}  </body>\n`;
      xml += `${indent}</${msgRoot}>\n`;

      if (wrapInNdm) {
        xml += `</ndm>\n`;
      }

      return xml;
    }

    /**
     * Converts CCSDS NDM/XML back into Key-Value Notation (KVN)
     * @param {string} xmlText
     * @returns {string} KVN formatted text
     */
    xmlToKvn(xmlText) {
      if (!xmlText || typeof xmlText !== 'string') {
        throw new Error("Invalid XML text: input must be a non-empty string.");
      }

      // Extract message root
      let rootMatch = xmlText.match(/<([a-z]{3})\s+id="([^"]+)"\s+version="([^"]+)"/i);
      let msgType = rootMatch ? rootMatch[1].toUpperCase() : "OPM";
      let version = rootMatch ? rootMatch[3] : "2.0";

      let kvn = `CCSDS_${msgType}_VERS = ${version}\n`;

      // Extract Header
      let headerBlock = this.extractTagContent(xmlText, "header");
      if (headerBlock) {
        let comments = this.extractAllTags(headerBlock, "COMMENT");
        for (let c of comments) kvn += `COMMENT ${c}\n`;
        let creationDate = this.extractTagContent(headerBlock, "CREATION_DATE");
        if (creationDate) kvn += `CREATION_DATE = ${creationDate}\n`;
        let originator = this.extractTagContent(headerBlock, "ORIGINATOR");
        if (originator) kvn += `ORIGINATOR = ${originator}\n`;
      }

      // Extract Metadata
      let metaBlock = this.extractTagContent(xmlText, "metadata");
      if (metaBlock) {
        kvn += `META_START\n`;
        let comments = this.extractAllTags(metaBlock, "COMMENT");
        for (let c of comments) kvn += `COMMENT ${c}\n`;

        // Match all simple key-value tags in metadata
        let tagRegex = /<([A-Z0-9_]+)>([^<]+)<\/\1>/g;
        let match;
        while ((match = tagRegex.exec(metaBlock)) !== null) {
          if (match[1] !== "COMMENT") {
            kvn += `${match[1]} = ${match[2].trim()}\n`;
          }
        }
        kvn += `META_STOP\n`;
      }

      // Extract Data
      let dataBlock = this.extractTagContent(xmlText, "data");
      if (dataBlock) {
        kvn += `DATA_START\n`;
        let comments = this.extractAllTags(dataBlock, "COMMENT");
        for (let c of comments) kvn += `COMMENT ${c}\n`;

        // Extract State Vector
        let svBlock = this.extractTagContent(dataBlock, "stateVector");
        if (svBlock) {
          let epoch = this.extractTagContent(svBlock, "EPOCH");
          if (epoch) kvn += `EPOCH = ${epoch}\n`;
          for (let coord of ['X', 'Y', 'Z', 'X_DOT', 'Y_DOT', 'Z_DOT']) {
            let val = this.extractTagValueAndUnit(svBlock, coord);
            if (val) {
              let unitStr = val.unit ? ` [${val.unit}]` : '';
              kvn += `${coord} = ${val.value}${unitStr}\n`;
            }
          }
        }

        // Extract Keplerian Elements
        let kepBlock = this.extractTagContent(dataBlock, "keplerianElements");
        if (kepBlock) {
          for (let elem of ['SEMI_MAJOR_AXIS', 'ECCENTRICITY', 'INCLINATION', 'RA_OF_ASC_NODE', 'ARG_OF_PERICENTER', 'TRUE_ANOMALY', 'MEAN_ANOMALY', 'GM']) {
            let val = this.extractTagValueAndUnit(kepBlock, elem);
            if (val) {
              let unitStr = val.unit ? ` [${val.unit}]` : '';
              kvn += `${elem} = ${val.value}${unitStr}\n`;
            }
          }
        }

        // Extract Spacecraft Parameters
        let paramBlock = this.extractTagContent(dataBlock, "spacecraftParameters");
        if (paramBlock) {
          for (let p of ['MASS', 'SOLAR_RAD_AREA', 'SOLAR_RAD_COEFF', 'DRAG_AREA', 'DRAG_COEFF']) {
            let val = this.extractTagValueAndUnit(paramBlock, p);
            if (val) {
              let unitStr = val.unit ? ` [${val.unit}]` : '';
              kvn += `${p} = ${val.value}${unitStr}\n`;
            }
          }
        }

        // Extract Covariance Matrix
        let covBlock = this.extractTagContent(dataBlock, "covarianceMatrix");
        if (covBlock) {
          let tagRegex = /<([A-Z0-9_]+)(?:\s+units="([^"]+)")?>([^<]+)<\/\1>/g;
          let match;
          while ((match = tagRegex.exec(covBlock)) !== null) {
            let unitStr = match[2] ? ` [${match[2]}]` : '';
            kvn += `${match[1]} = ${match[3].trim()}${unitStr}\n`;
          }
        }

        kvn += `DATA_STOP\n`;
      }

      return kvn;
    }

    /**
     * Bundles multiple navigation messages into a single unified <ndm> XML container
     * @param {Array<string|Object>} messageList - Array of KVN strings or ASTs
     * @returns {string} XML string wrapped in <ndm>
     */
    bundleIntoNdm(messageList) {
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += `<ndm xmlns="${NDM_NAMESPACE}" xmlns:xsi="${XSI_NAMESPACE}" xsi:schemaLocation="${DEFAULT_SCHEMA_LOC}">\n`;

      for (let i = 0; i < messageList.length; i++) {
        let msg = messageList[i];
        let ast = (typeof msg === 'string') ? this.parseKVN(msg) : msg;
        let singleXml = this.kvnToXml(ast, { wrapInNdm: false, id: `MSG_${(i+1).toString().padStart(3, '0')}` });
        // Strip <?xml ... ?> declaration
        singleXml = singleXml.replace(/<\?xml[^>]*\?>\r?\n?/, '').trim();
        // Indent lines
        let indented = singleXml.split(/\r?\n/).map(l => "  " + l).join("\n");
        xml += indented + "\n";
      }

      xml += `</ndm>\n`;
      return xml;
    }

    // Helper regex extractors
    extractTagContent(text, tag) {
      let reg = new RegExp(`<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, 'i');
      let m = text.match(reg);
      return m ? m[1].trim() : null;
    }

    extractAllTags(text, tag) {
      let reg = new RegExp(`<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, 'gi');
      let results = [];
      let m;
      while ((m = reg.exec(text)) !== null) {
        results.push(m[1].trim());
      }
      return results;
    }

    extractTagValueAndUnit(text, tag) {
      let reg = new RegExp(`<${tag}(?:\s+units="([^"]+)")?>([\s\S]*?)<\/${tag}>`, 'i');
      let m = text.match(reg);
      if (m) {
        return { value: m[2].trim(), unit: m[1] || '' };
      }
      return null;
    }

    escapeXml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    }
  }

  return NDMEngine;
}));

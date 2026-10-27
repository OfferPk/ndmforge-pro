#!/usr/bin/env python3
"""
Automated Test Runner for NDMForge Pro
Verifies KVN parsing, XML generation, units mapping, XML-to-KVN roundtrips, multi-message <ndm> bundling, and 10-point normative auditor.
"""

import unittest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ndm_cli import parse_kvn, kvn_to_xml, xml_to_kvn, audit_xml

SAMPLE_KVN = """CCSDS_OPM_VERS = 2.0
COMMENT Test Flight Navigation Parameter
CREATION_DATE = 2026-10-17T00:05:00Z
ORIGINATOR = ESA_ESOC
META_START
OBJECT_NAME = ARTEMIS_III
OBJECT_ID = 2026-042A
CENTER_NAME = MOON
REF_FRAME = ICRF
TIME_SYSTEM = UTC
META_STOP
DATA_START
EPOCH = 2026-10-17T00:00:00Z
X = 384400.0 [km]
Y = 12000.0 [km]
Z = -5000.0 [km]
X_DOT = -1.05 [km/s]
Y_DOT = 0.85 [km/s]
Z_DOT = 0.22 [km/s]
MASS = 15000.0 [kg]
SOLAR_RAD_AREA = 45.0 [m**2]
DATA_STOP"""

class TestNDMForge(unittest.TestCase):

    def test_01_kvn_parsing(self):
        ast = parse_kvn(SAMPLE_KVN)
        self.assertEqual(ast["messageType"], "opm")
        self.assertEqual(ast["formatVersion"], "2.0")
        self.assertEqual(ast["header"]["ORIGINATOR"], "ESA_ESOC")
        self.assertEqual(ast["metadata"]["OBJECT_NAME"], "ARTEMIS_III")
        self.assertEqual(ast["data"]["stateVector"]["X"], "384400.0")

    def test_02_xml_generation_structure(self):
        xml_res = kvn_to_xml(SAMPLE_KVN)
        self.assertTrue("<opm id=" in xml_res)
        self.assertTrue("<header>" in xml_res)
        self.assertTrue("<CREATION_DATE>2026-10-17T00:05:00Z</CREATION_DATE>" in xml_res)
        self.assertTrue("<metadata>" in xml_res)
        self.assertTrue("<OBJECT_NAME>ARTEMIS_III</OBJECT_NAME>" in xml_res)
        self.assertTrue("<stateVector>" in xml_res)
        self.assertTrue("</opm>" in xml_res)

    def test_03_units_attribute_injection(self):
        xml_res = kvn_to_xml(SAMPLE_KVN)
        self.assertTrue('<X units="km">384400.0</X>' in xml_res)
        self.assertTrue('<X_DOT units="km/s">-1.05</X_DOT>' in xml_res)
        self.assertTrue('<MASS units="kg">15000.0</MASS>' in xml_res)

    def test_04_xml_to_kvn_roundtrip(self):
        xml_res = kvn_to_xml(SAMPLE_KVN)
        kvn_back = xml_to_kvn(xml_res)
        self.assertTrue("CCSDS_OPM_VERS = 2.0" in kvn_back)
        self.assertTrue("ORIGINATOR = ESA_ESOC" in kvn_back)
        self.assertTrue("OBJECT_NAME = ARTEMIS_III" in kvn_back)
        self.assertTrue("X = 384400.0 [km]" in kvn_back)

    def test_05_unified_ndm_wrapper(self):
        xml_ndm = kvn_to_xml(SAMPLE_KVN, wrap_ndm=True)
        self.assertTrue("<ndm xmlns=" in xml_ndm)
        self.assertTrue("</ndm>" in xml_ndm)
        self.assertTrue("<opm id=" in xml_ndm)

    def test_06_comment_preservation(self):
        ast = parse_kvn(SAMPLE_KVN)
        self.assertIn("Test Flight Navigation Parameter", ast["header"]["comments"])
        xml_res = kvn_to_xml(SAMPLE_KVN)
        self.assertTrue("<COMMENT>Test Flight Navigation Parameter</COMMENT>" in xml_res)

    def test_07_keplerian_elements_support(self):
        kvn_kep = """CCSDS_OMM_VERS = 2.0
CREATION_DATE = 2026-10-17T00:00:00Z
ORIGINATOR = NASA_JPL
META_START
OBJECT_NAME = TEST_SAT
REF_FRAME = TEME
META_STOP
DATA_START
SEMI_MAJOR_AXIS = 7000.0 [km]
ECCENTRICITY = 0.001
INCLINATION = 51.6 [deg]
DATA_STOP"""
        xml_res = kvn_to_xml(kvn_kep)
        self.assertTrue('<omm id=' in xml_res)
        self.assertTrue('<SEMI_MAJOR_AXIS units="km">7000.0</SEMI_MAJOR_AXIS>' in xml_res)
        self.assertTrue('<INCLINATION units="deg">51.6</INCLINATION>' in xml_res)

    def test_08_normative_auditor_compliance(self):
        xml_res = kvn_to_xml(SAMPLE_KVN)
        report = audit_xml(xml_res)
        self.assertEqual(report["status"], "PASSED")
        self.assertEqual(report["score"], "10/10 Normative Rules Compliant")
        self.assertEqual(len(report["rules"]), 10)

    def test_09_spacecraft_parameters_block(self):
        xml_res = kvn_to_xml(SAMPLE_KVN)
        self.assertTrue("<spacecraftParameters>" in xml_res)
        self.assertTrue('<SOLAR_RAD_AREA units="m**2">45.0</SOLAR_RAD_AREA>' in xml_res)

    def test_10_empty_input_boundary_safety(self):
        with self.assertRaises(Exception):
            parse_kvn("")

if __name__ == "__main__":
    unittest.main()

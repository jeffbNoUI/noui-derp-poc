#!/usr/bin/env python3
"""
COPERA Legacy Database Seed Data Generator
============================================
Generates 3 demo case members + 500 bulk members for the COPERA sales demo.
Populates IBM i tables (MDPMBMR0, DPPMBMR0, DCPSTMR0, CMPTIER0, etc.)
matching COPERA's actual system structure from the Data Assessment.

Demo case salary/benefit values match hand calculations TO THE PENNY.
See demo-cases/copera/ for the authoritative hand calculations.

Usage:  python3 generate_copera_data.py [--output-dir ./output]
"""

import argparse, hashlib, json, os, random, sys
from datetime import date, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP

# ── Constants ──────────────────────────────────────────────────────────────
# Division-specific contribution rates
STATE_EE_RATE = Decimal("0.1050")
STATE_ER_RATE = Decimal("0.2140")
DPS_EE_RATE   = Decimal("0.1200")
DPS_ER_RATE   = Decimal("0.1950")
MULTIPLIER    = Decimal("0.025")  # 2.5% universal
ANTI_SPIKE    = Decimal("1.08")   # 108% cascading cap

CURRENT_DATE = date(2026, 3, 15)
random.seed(42)

# HAS table assignment by membership date + division
# PERA: P1 (pre-2007), P6 (2007-2010, vested before 2020), P7 (2011+)
# DPS: D1 (pre-2005), D2 (2005-2010), D3 (2011+)

# ── Reference Data ─────────────────────────────────────────────────────────
EMPLOYERS = [
    # (code, name, division, type)
    ("ST-001", "Colorado Dept of Transportation", "State", "Agency"),
    ("ST-002", "Colorado Dept of Revenue",        "State", "Agency"),
    ("ST-003", "Colorado Dept of Public Health",   "State", "Agency"),
    ("ST-004", "Colorado Dept of Human Services",  "State", "Agency"),
    ("ST-005", "Colorado Dept of Corrections",     "State", "Agency"),
    ("SC-001", "Denver Public Schools",            "School", "District"),
    ("SC-002", "Jefferson County Schools",         "School", "District"),
    ("SC-003", "Adams County School District 14",  "School", "District"),
    ("SC-004", "Cherry Creek School District",     "School", "District"),
    ("DPS-001","Colorado State Patrol",            "DPS", "Department"),
    ("DPS-002","CBI - Colorado Bureau of Investigation","DPS","Department"),
    ("DPS-003","Parks & Wildlife Law Enforcement",  "DPS", "Department"),
    ("LG-001", "City of Aurora",                   "LocalGov","Municipality"),
    ("LG-002", "City of Pueblo",                   "LocalGov","Municipality"),
    ("JD-001", "Colorado Judicial Department",     "Judicial","Agency"),
]

JOB_TITLES = [
    "Administrative Assistant", "Analyst I", "Analyst II", "Senior Analyst",
    "Engineer I", "Engineer II", "Senior Engineer", "Accountant",
    "Program Manager", "Project Coordinator", "IT Specialist",
    "Budget Analyst", "HR Specialist", "Communications Director",
    "Maintenance Worker", "Technician", "Social Worker", "Librarian",
    "Instructor", "Teacher", "Principal", "Superintendent",
    "Trooper", "Sergeant", "Lieutenant", "Captain", "Major",
    "Investigator", "Ranger", "Dispatcher", "Records Clerk",
    "Court Reporter", "Probation Officer", "Judge's Clerk",
    "Parks Manager", "Inspector", "Supervisor", "Director",
]

FIRST_M = ["Robert","David","James","Michael","William","John","Richard","Thomas",
           "Daniel","Mark","Steven","Paul","Andrew","Kevin","Brian","Anthony",
           "Jose","Carlos","Luis","Miguel","Christopher","Timothy","Patrick",
           "Dennis","Jerry","Raymond","Gregory","Larry","Frank","Scott"]
FIRST_F = ["Jennifer","Maria","Patricia","Linda","Susan","Sarah","Jessica",
           "Michelle","Lisa","Angela","Amy","Stephanie","Rebecca","Laura",
           "Karen","Anna","Guadalupe","Rosa","Carmen","Elena","Sofia",
           "Nicole","Amanda","Melissa","Christine","Janet","Deborah","Catherine"]
LASTS = ["Martinez","Kim","Washington","Smith","Johnson","Williams","Brown",
         "Jones","Garcia","Miller","Davis","Rodriguez","Wilson","Anderson",
         "Taylor","Thomas","Jackson","White","Harris","Thompson","Moore",
         "Martin","Lee","Hernandez","Lopez","Gonzalez","Nguyen","Patel",
         "Chen","Park","Singh","Ramirez","Torres","Rivera","Campbell",
         "Parker","Evans","Edwards","Collins","Stewart","Sanchez","Morris"]

# Salary ranges by job-level bucket
SALARY_RANGES = {
    "entry":  (35000, 48000),
    "mid":    (48000, 72000),
    "senior": (68000, 95000),
    "mgmt":   (85000, 130000),
    "exec":   (110000, 160000),
    "dps_entry": (50000, 65000),
    "dps_mid":   (65000, 90000),
    "dps_senior":(85000, 120000),
}

PERACARE_PLANS = [
    ("UHC_ADVG",   "UnitedHealthcare Medicare Advantage", 450.00, 230.00),
    ("KAISER_HMO", "Kaiser Permanente HMO",               480.00, 230.00),
    ("DELTA_DENT", "Delta Dental",                         65.00,  35.00),
    ("VSP_VISION", "VSP Vision Care",                      25.00,  12.00),
]

# ── Helpers ────────────────────────────────────────────────────────────────
def d(val):
    """Quantize to 2 decimal places."""
    return Decimal(str(val)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def has_table_for(membership_dt, division):
    """Determine HAS table code from membership date and division."""
    if division == "DPS":
        if membership_dt < date(2005, 7, 1):
            return "D1"
        elif membership_dt < date(2011, 1, 1):
            return "D2"
        else:
            return "D3"
    else:  # State, School, LocalGov, Judicial
        if membership_dt < date(2007, 1, 1):
            return "P1"
        elif membership_dt < date(2011, 1, 1):
            return "P6"
        else:
            return "P7"

def ee_rate_for(division):
    return DPS_EE_RATE if division == "DPS" else STATE_EE_RATE

def er_rate_for(division):
    return DPS_ER_RATE if division == "DPS" else STATE_ER_RATE

def sql_v(val):
    """Format a value for SQL INSERT."""
    if val is None: return "NULL"
    if isinstance(val, str): return "'" + val.replace("'", "''") + "'"
    if isinstance(val, (date, datetime)): return "'" + val.isoformat() + "'"
    if isinstance(val, Decimal): return str(val)
    if isinstance(val, bool): return "'Y'" if val else "'N'"
    return str(val)

def ins(table, cols, vals):
    """Build an INSERT statement."""
    return f"INSERT INTO {table} ({','.join(cols)}) VALUES ({','.join(sql_v(v) for v in vals)});\n"

def rdate(s, e):
    """Random date between s and e."""
    delta = (e - s).days
    return s + timedelta(days=random.randint(0, max(0, delta))) if delta > 0 else s

def safe_date(y, m, day):
    day = min(day, 28)
    return date(y, m, day)

def monthly_dates(start, end):
    """Generate 1st-of-month dates for salary records."""
    out = []
    y, m = start.year, start.month
    while date(y, m, 1) <= end:
        out.append(date(y, m, 1))
        m += 1
        if m > 12:
            m = 1
            y += 1
    return out

def fake_ssn(mid):
    h = hashlib.md5(mid.encode()).hexdigest()
    n = int(h[:9], 16) % 899999999 + 100000000
    s = str(n)
    return f"{s[:3]}-{s[3:5]}-{s[5:]}" if random.random() < 0.85 else s

def fake_entity_id(mid):
    """Generate an entity ID from member ID (some members won't get one — DQ-C01)."""
    return f"E{mid[2:]}"  # M-100001 -> E100001


# ── Main Generator ─────────────────────────────────────────────────────────
class Generator:
    def __init__(self, outfile):
        self.f = outfile
        self.mbr_count = 0
        self.annuity_count = 0
        # Track IDs for quality issue injection
        self.pera_ids = []    # Members in MDPMBMR0
        self.dps_ids = []     # Members in DPPMBMR0
        self.all_ids = []
        self.active_ids = []
        self.retired_ids = []
        self.retired_annuity_map = {}  # mid -> annuity_nbr

    def write(self, s):
        self.f.write(s)

    def next_id(self):
        self.mbr_count += 1
        return f"M-{self.mbr_count:06d}"

    def next_annuity(self):
        self.annuity_count += 1
        return f"AN-{self.annuity_count:06d}"

    # ── Reference data ────────────────────────────────────────────────────
    def write_ref_data(self):
        self.write("-- ═══ EMPLOYER REFERENCE DATA ═══\n\n")
        for emp_cd, emp_nm, div, emp_type in EMPLOYERS:
            self.write(ins("EMPLOYER_REF",
                ["EMPLOYER_CD","EMPLOYER_NAME","DIVISION_CD","EMPLOYER_TYPE","ACTIVE_FLG","EFF_DT"],
                [emp_cd, emp_nm, div, emp_type, "Y", date(1990, 1, 1)]))

        # Agency/department directory (ACPDPMA0)
        self.write("\n-- ACPDPMA0 — Agency/Department Directory\n")
        for emp_cd, emp_nm, div, emp_type in EMPLOYERS:
            dept_cd = emp_cd.replace("-", "")
            self.write(ins("ACPDPMA0",
                ["AGENCY_CD","DEPT_CD","AGENCY_NM","DEPT_NM","DIVISION_CD","ACTIVE_FLG","EFF_DT"],
                [emp_cd, dept_cd, emp_nm, f"{emp_nm} - Main", div, "Y", date(1990, 1, 1)]))
        self.write("\n")

    # ── Shared member writing helpers ────────────────────────────────────
    def _write_entity(self, mid, ssn, first, last, middle, suffix, dob, gender, skip_entity=False):
        """Write ENTITY record (unless skip for DQ-C01)."""
        if skip_entity:
            return
        eid = fake_entity_id(mid)
        self.write(ins("ENTITY",
            ["ENTITY_ID","SSN","FIRST_NM","LAST_NM","MIDDLE_NM","SUFFIX","DOB","GENDER_CD",
             "ENTITY_TYPE","CREATE_DT","LAST_UPD_DT"],
            [eid, ssn, first, last, middle, suffix, dob, gender, "M",
             datetime.now(), datetime.now()]))

    def _write_dcpstmr0(self, mid, ssn, emp_cd, hire_dt, term_dt, status, job_class, salary, fte=1.0):
        """Write DCPSTMR0 (Employee Master) record."""
        eid = fake_entity_id(mid)
        self.write(ins("DCPSTMR0",
            ["ENTITY_ID","SSN","EMPLOYER_CD","HIRE_DT","TERM_DT","STATUS_CD",
             "JOB_CLASS","SALARY_AMT","FTE_PCT","LAST_UPD_DT"],
            [eid, ssn, emp_cd, hire_dt, term_dt, status,
             job_class, d(salary), Decimal(str(fte)), datetime.now()]))

    def _write_cmptier0(self, mid, tier_cd, membership_dt, vested, vested_dt, annuity_nbr=None):
        """Write CMPTIER0 (tier/HAS table) record."""
        self.write(ins("CMPTIER0",
            ["MBR_ID","TIER_CD","MEMBERSHIP_DT","VESTED_FLG","VESTED_DT","ANNUITY_NBR",
             "EFF_DT","LAST_UPD_DT"],
            [mid, tier_cd, membership_dt, "Y" if vested else "N",
             vested_dt, annuity_nbr, membership_dt, datetime.now()]))

    def _write_dept_record(self, mid, emp_cd, division, job_title, start_dt, end_dt, status, rank=None):
        """Write MDPMBDT0 or DPPMBDT0 depending on division."""
        if division == "DPS":
            self.write(ins("DPPMBDT0",
                ["MBR_ID","EMPLOYER_CD","DEPT_SEQ","JOB_CLASS","JOB_TITLE","RANK_CD",
                 "FTE_PCT","START_DT","END_DT","STATUS_CD","LAST_UPD_DT"],
                [mid, emp_cd, 1, job_title[:20], job_title, rank,
                 Decimal("1.000"), start_dt, end_dt, status, datetime.now()]))
        else:
            self.write(ins("MDPMBDT0",
                ["MBR_ID","EMPLOYER_CD","DEPT_SEQ","JOB_CLASS","JOB_TITLE",
                 "FTE_PCT","START_DT","END_DT","STATUS_CD","LAST_UPD_DT"],
                [mid, emp_cd, 1, job_title[:20], job_title,
                 Decimal("1.000"), start_dt, end_dt, status, datetime.now()]))

    def _write_salary_history(self, mid, emp_cd, division, schedule, hire_dt, end_dt):
        """Write MDPHASC0, SALARY_ANNUAL, and CONTRIBUTION_HIST records.

        schedule: dict mapping year -> annual salary
        """
        ee_rate = ee_rate_for(division)
        er_rate = er_rate_for(division)

        # SALARY_ANNUAL rows
        for yr, sal in sorted(schedule.items()):
            self.write(ins("SALARY_ANNUAL",
                ["MBR_ID","YEAR_NBR","ANNUAL_SALARY","EMPLOYER_CD","LAST_UPD_DT"],
                [mid, yr, d(sal), emp_cd, datetime.now()]))

        # MDPHASC0 monthly salary records + CONTRIBUTION_HIST + deposit table
        deposit_table = "DPTMBDP0" if division == "DPS" else "MDTMBDP0"
        for md in monthly_dates(hire_dt, end_dt):
            annual = schedule.get(md.year)
            if annual is None:
                # Find closest prior year
                prior_years = [y for y in schedule.keys() if y <= md.year]
                annual = schedule[max(prior_years)] if prior_years else list(schedule.values())[0]

            monthly_pay = d(annual / 12)
            svc_credit = Decimal("0.0833")  # ~1/12

            self.write(ins("MDPHASC0",
                ["MBR_ID","YEAR_NBR","MONTH_NBR","GROSS_PAY","PENSION_PAY",
                 "SVC_CREDIT","EMPLOYER_CD","LAST_UPD_DT"],
                [mid, md.year, md.month, monthly_pay, monthly_pay,
                 svc_credit, emp_cd, datetime.now()]))

            ee_contrib = d(monthly_pay * ee_rate)
            er_contrib = d(monthly_pay * er_rate)
            self.write(ins("CONTRIBUTION_HIST",
                ["MBR_ID","YEAR_NBR","MONTH_NBR","EE_CONTRIB","ER_CONTRIB",
                 "EE_RATE","ER_RATE","EMPLOYER_CD","LAST_UPD_DT"],
                [mid, md.year, md.month, ee_contrib, er_contrib,
                 ee_rate, er_rate, emp_cd, datetime.now()]))

            # Deposit table (MDTMBDP0 or DPTMBDP0)
            self.write(ins(deposit_table,
                ["MBR_ID","DEPOSIT_DT","PAY_PRD_END","EE_AMT","ER_AMT","SALARY_AMT",
                 "EE_RATE","ER_RATE","EMPLOYER_CD","LAST_UPD_DT"],
                [mid, md, md, ee_contrib, er_contrib, monthly_pay,
                 ee_rate, er_rate, emp_cd, datetime.now()]))

    def _write_beneficiary(self, mid, division, name, rel, dob, pct=Decimal("100.00")):
        """Write MDPBNMR0 or DPPBNMR0 depending on division."""
        table = "DPPBNMR0" if division == "DPS" else "MDPBNMR0"
        self.write(ins(table,
            ["MBR_ID","BENEF_SEQ","BENEF_NM","BENEF_DOB","BENEF_REL","BENEF_PCT",
             "PRIMARY_FLG","EFF_DT","LAST_UPD_DT"],
            [mid, 1, name, dob, rel, pct, "Y", date(2020, 1, 1), datetime.now()]))

    # ── Demo Case 1: Maria Garcia ────────────────────────────────────────
    def write_demo_case_1(self):
        """Maria Garcia — State Division, HAS Table P1, Normal Retirement.
        Expected benefit: $5,356.94/month.
        """
        mid = "COPERA-001"
        ssn = "555-12-3456"
        self.all_ids.append(mid)
        self.active_ids.append(mid)
        self.pera_ids.append(mid)

        self.write("\n-- ── Demo Case 1: Maria Garcia (COPERA-001) ──\n")

        # ENTITY
        self._write_entity(mid, ssn, "Maria", "Garcia", "L.", None,
                          date(1963, 7, 20), "F")

        # MDPMBMR0 (PERA master — State division)
        self.write(ins("MDPMBMR0",
            ["MBR_ID","SSN","FIRST_NM","LAST_NM","MIDDLE_NM","DOB","GENDER_CD",
             "ADDR_LINE1","CITY","STATE_CD","ZIP_CD","HOME_PHONE","EMAIL_ADDR","CELL_PHONE",
             "MEMBERSHIP_DT","DIVISION_CD","STATUS_CD","MARITAL_STS",
             "SVC_CREDIT_YRS","PURCHASED_SVC","MILITARY_SVC","ANNUAL_SALARY",
             "HIRE_DT","LAST_UPD_DT"],
            [mid, ssn, "Maria", "Garcia", "L.", date(1963, 7, 20), "F",
             "1425 Vine St", "Denver", "CO", "80206",
             "303-555-0101", "mgarcia@state.co.us", "720-555-0301",
             date(1998, 1, 1), "State", "A", "M",
             Decimal("28.0000"), Decimal("0.0000"), Decimal("0.0000"), d(95000),
             date(1998, 1, 1), datetime.now()]))

        # DCPSTMR0
        self._write_dcpstmr0(mid, ssn, "ST-001", date(1998, 1, 1), None, "A",
                            "Senior Analyst", 95000)

        # CMPTIER0 — P1 (pre-2007 membership)
        self._write_cmptier0(mid, "P1", date(1998, 1, 1), True, date(2003, 1, 1))

        # MDPMBDT0 — department assignment
        self._write_dept_record(mid, "ST-001", "State", "Senior Analyst",
                               date(1998, 1, 1), None, "A")

        # Salary schedule producing HAS: 2023=$88,500, 2024=$92,000, 2025=$95,000
        # Need enough years to build 28 years of service
        schedule = {}
        base = 42000
        for yr in range(1998, 2026):
            if yr <= 2005:
                base = round(base * 1.03 / 100) * 100
            elif yr <= 2010:
                base = round(base * 1.035 / 100) * 100
            elif yr <= 2015:
                base = round(base * 1.025 / 100) * 100
            elif yr <= 2020:
                base = round(base * 1.03 / 100) * 100
            else:
                base = round(base * 1.03 / 100) * 100
            schedule[yr] = base

        # Override the HAS window years to match hand calculation exactly
        schedule[2022] = 85000   # Base year for anti-spiking
        schedule[2023] = 88500   # HAS window year 1
        schedule[2024] = 92000   # HAS window year 2
        schedule[2025] = 95000   # HAS window year 3

        self._write_salary_history(mid, "ST-001", "State", schedule,
                                  date(1998, 1, 1), date(2025, 12, 1))

        # Beneficiary: Carlos Garcia (Spouse)
        self._write_beneficiary(mid, "State", "Carlos Garcia", "Spouse",
                               date(1965, 2, 14))

    # ── Demo Case 2: James Chen ──────────────────────────────────────────
    def write_demo_case_2(self):
        """James Chen — School Division, HAS Table P6, Early Retirement.
        Anti-spiking triggered on 2024 salary. Expected benefit: $1,847.56/month.
        """
        mid = "COPERA-002"
        ssn = "555-23-4567"
        self.all_ids.append(mid)
        self.active_ids.append(mid)
        self.pera_ids.append(mid)

        self.write("\n-- ── Demo Case 2: James Chen (COPERA-002) ──\n")

        # ENTITY
        self._write_entity(mid, ssn, "James", "Chen", None, None,
                          date(1968, 11, 15), "M")

        # MDPMBMR0 (PERA master — School division)
        self.write(ins("MDPMBMR0",
            ["MBR_ID","SSN","FIRST_NM","LAST_NM","DOB","GENDER_CD",
             "ADDR_LINE1","CITY","STATE_CD","ZIP_CD","HOME_PHONE","EMAIL_ADDR",
             "MEMBERSHIP_DT","DIVISION_CD","STATUS_CD","MARITAL_STS",
             "SVC_CREDIT_YRS","PURCHASED_SVC","MILITARY_SVC","ANNUAL_SALARY",
             "HIRE_DT","LAST_UPD_DT"],
            [mid, ssn, "James", "Chen", date(1968, 11, 15), "M",
             "2301 Glenarm Pl Apt 4B", "Denver", "CO", "80205",
             "303-555-0102", "jchen@dpsk12.org",
             date(2008, 1, 1), "School", "A", "S",
             Decimal("18.0000"), Decimal("0.0000"), Decimal("0.0000"), d(78000),
             date(2008, 1, 1), datetime.now()]))

        # DCPSTMR0
        self._write_dcpstmr0(mid, ssn, "SC-001", date(2008, 1, 1), None, "A",
                            "Budget Analyst", 78000)

        # CMPTIER0 — P6 (2008 membership, vested before 2020)
        self._write_cmptier0(mid, "P6", date(2008, 1, 1), True, date(2013, 1, 1))

        # MDPMBDT0
        self._write_dept_record(mid, "SC-001", "School", "Budget Analyst",
                               date(2008, 1, 1), None, "A")

        # Salary schedule — 2024 triggers anti-spiking (actual $74K > 108% of $67K = $72,360)
        # SALARY_ANNUAL stores ACTUAL values; anti-spiking is a calculation concern
        schedule = {}
        base = 50000
        for yr in range(2008, 2022):
            base = round(base * 1.03 / 100) * 100
            schedule[yr] = base

        # Override HAS window years to match hand calculation
        schedule[2022] = 64000   # Base year for anti-spiking
        schedule[2023] = 67000   # HAS year 1 — within 108% of $64K
        schedule[2024] = 74000   # HAS year 2 — ACTUAL (exceeds 108% of $67K=$72,360, CAPPED in calc)
        schedule[2025] = 78000   # HAS year 3 — within 108% of capped $72,360

        self._write_salary_history(mid, "SC-001", "School", schedule,
                                  date(2008, 1, 1), date(2025, 12, 1))

        # Beneficiary: Linda Chen (Mother)
        self._write_beneficiary(mid, "School", "Linda Chen", "Parent",
                               date(1940, 4, 22))

    # ── Demo Case 3: Sarah Williams ──────────────────────────────────────
    def write_demo_case_3(self):
        """Sarah Williams — DPS Division, HAS Table D1, Rule of 80.
        Expected benefit: $5,904.17/month.
        CRITICAL: Uses DPS-specific tables (DPPMBMR0, DPPMBDT0, DPPBNMR0).
        """
        mid = "COPERA-003"
        ssn = "555-34-5678"
        self.all_ids.append(mid)
        self.active_ids.append(mid)
        self.dps_ids.append(mid)

        self.write("\n-- ── Demo Case 3: Sarah Williams (COPERA-003) ──\n")

        # ENTITY
        self._write_entity(mid, ssn, "Sarah", "Williams", None, None,
                          date(1966, 2, 28), "F")

        # DPPMBMR0 (DPS master — NOT MDPMBMR0)
        self.write(ins("DPPMBMR0",
            ["MBR_ID","SSN","FIRST_NM","LAST_NM","DOB","GENDER_CD",
             "ADDR_LINE1","CITY","STATE_CD","ZIP_CD","HOME_PHONE","EMAIL_ADDR","CELL_PHONE",
             "MEMBERSHIP_DT","DIVISION_CD","STATUS_CD","MARITAL_STS",
             "SVC_CREDIT_YRS","PURCHASED_SVC","MILITARY_SVC","ANNUAL_SALARY",
             "HIRE_DT","LAST_UPD_DT"],
            [mid, ssn, "Sarah", "Williams", date(1966, 2, 28), "F",
             "7890 E Colfax Ave", "Denver", "CO", "80220",
             "303-555-0103", "swilliams@csp.state.co.us", "720-555-0303",
             date(2000, 1, 1), "DPS", "A", "M",
             Decimal("26.0000"), Decimal("0.0000"), Decimal("0.0000"), d(113000),
             date(2000, 1, 1), datetime.now()]))

        # DCPSTMR0
        self._write_dcpstmr0(mid, ssn, "DPS-001", date(2000, 1, 1), None, "A",
                            "Captain", 113000)

        # CMPTIER0 — D1 (pre-2005 DPS membership)
        self._write_cmptier0(mid, "D1", date(2000, 1, 1), True, date(2005, 1, 1))

        # DPPMBDT0 (DPS department record with rank)
        self._write_dept_record(mid, "DPS-001", "DPS", "Captain",
                               date(2000, 1, 1), None, "A", rank="CPT")

        # DPPMGMR0 — DPS merger master (2010 merger)
        self.write(ins("DPPMGMR0",
            ["MBR_ID","MERGER_DT","PRE_MERGER_SVC","POST_MERGER_SVC",
             "ADJUSTMENT_CD","NOTES","LAST_UPD_DT"],
            [mid, date(2010, 1, 1), Decimal("10.0000"), Decimal("16.0000"),
             "NONE", "Pre-2010 DPS member, no adjustment needed", datetime.now()]))

        # Salary schedule: 2023=$105,000, 2024=$109,000, 2025=$113,000
        schedule = {}
        base = 55000
        for yr in range(2000, 2022):
            base = round(base * 1.035 / 100) * 100
            schedule[yr] = base

        # Override HAS window to match hand calculation
        schedule[2022] = 101000
        schedule[2023] = 105000
        schedule[2024] = 109000
        schedule[2025] = 113000

        self._write_salary_history(mid, "DPS-001", "DPS", schedule,
                                  date(2000, 1, 1), date(2025, 12, 1))

        # Beneficiary: David Williams (Spouse) — in DPPBNMR0
        self._write_beneficiary(mid, "DPS", "David Williams", "Spouse",
                               date(1964, 9, 10))

    # ── Bulk member generation ───────────────────────────────────────────
    def write_bulk_member(self, division, status):
        """Generate one bulk member for the given division and status."""
        mid = self.next_id()
        self.all_ids.append(mid)
        is_dps = (division == "DPS")

        if is_dps:
            self.dps_ids.append(mid)
        else:
            self.pera_ids.append(mid)

        gender = random.choice(["M", "F"])
        first = random.choice(FIRST_M if gender == "M" else FIRST_F)
        last = random.choice(LASTS)

        # Hire date distribution
        if division == "DPS":
            hire = rdate(date(1990, 1, 1), date(2022, 12, 31))
        elif division == "Judicial":
            hire = rdate(date(1995, 1, 1), date(2022, 12, 31))
        else:
            hire = rdate(date(1988, 1, 1), date(2023, 12, 31))

        age_at_hire = random.randint(22, 50)
        dob = safe_date(hire.year - age_at_hire, random.randint(1, 12), random.randint(1, 28))
        tier_cd = has_table_for(hire, division)

        # Employer selection
        div_employers = [e for e in EMPLOYERS if e[2] == division]
        emp = random.choice(div_employers)
        emp_cd = emp[0]

        # Job title and salary
        if is_dps:
            job = random.choice(["Trooper", "Sergeant", "Lieutenant", "Investigator",
                                "Ranger", "Dispatcher", "Captain"])
            rng = "dps_entry" if random.random() < 0.4 else ("dps_mid" if random.random() < 0.7 else "dps_senior")
        else:
            job = random.choice(JOB_TITLES[:20])  # Non-DPS titles
            rng = random.choice(["entry", "mid", "senior", "mgmt"])

        sal_lo, sal_hi = SALARY_RANGES[rng]
        era_f = 1.0 + max(0, hire.year - 1990) * 0.01
        starting = round(random.uniform(sal_lo, sal_hi) * min(era_f, 1.3) / 100) * 100

        ssn = fake_ssn(mid)
        marital = random.choices(["M", "S", "D", "W"], weights=[55, 25, 15, 5])[0]

        # Term date for non-active
        term = None
        if status == "R":
            yrs = random.uniform(15, 35)
            term = safe_date(min(hire.year + int(yrs), 2025), random.randint(1, 12), 1)
            if term > CURRENT_DATE: term = rdate(date(2020, 1, 1), CURRENT_DATE)
        elif status == "T":
            yrs = random.uniform(1, 15)
            term = safe_date(min(hire.year + int(yrs), 2025), random.randint(1, 12), random.randint(1, 28))
            if term > CURRENT_DATE: term = rdate(date(2018, 1, 1), CURRENT_DATE)
        elif status == "D":
            yrs = random.uniform(5, 20)
            term = safe_date(min(hire.year + int(yrs), 2025), random.randint(1, 12), random.randint(1, 28))
            if term > CURRENT_DATE: term = rdate(date(2018, 1, 1), CURRENT_DATE)

        end = term if term else CURRENT_DATE
        if end < hire: end = hire + timedelta(days=365)

        svc_yrs = d((end - hire).days / 365.25)
        vested = float(svc_yrs) >= 5.0
        vested_dt = safe_date(hire.year + 5, hire.month, min(hire.day, 28)) if vested else None
        if vested_dt and vested_dt > end: vested_dt = None; vested = False

        cur_salary = starting
        # Build salary schedule
        schedule = {hire.year: starting}
        for yr in range(hire.year + 1, end.year + 1):
            growth = random.uniform(0.02, 0.04)
            cur_salary = round(cur_salary * (1 + growth) / 100) * 100
            schedule[yr] = cur_salary

        if status == "A":
            self.active_ids.append(mid)

        # ENTITY
        self._write_entity(mid, ssn, first, last, None, None, dob, gender)

        # Member master (DPS or PERA)
        master_table = "DPPMBMR0" if is_dps else "MDPMBMR0"
        self.write(ins(master_table,
            ["MBR_ID","SSN","FIRST_NM","LAST_NM","DOB","GENDER_CD",
             "ADDR_LINE1","CITY","STATE_CD","ZIP_CD","HOME_PHONE",
             "MEMBERSHIP_DT","DIVISION_CD","STATUS_CD","MARITAL_STS",
             "SVC_CREDIT_YRS","PURCHASED_SVC","MILITARY_SVC","ANNUAL_SALARY",
             "HIRE_DT","TERM_DT","LAST_UPD_DT"],
            [mid, ssn, first, last, dob, gender,
             f"{random.randint(100, 9999)} {random.choice(['Main', 'Oak', 'Pine', 'Elm'])} St",
             random.choice(["Denver", "Aurora", "Pueblo", "Colorado Springs", "Fort Collins"]),
             "CO", f"80{random.randint(100, 299)}",
             f"303-{random.randint(200, 999)}-{random.randint(1000, 9999)}",
             hire, division, status, marital,
             svc_yrs, Decimal("0.0000"), Decimal("0.0000"), d(cur_salary),
             hire, term, datetime.now()]))

        # DCPSTMR0
        self._write_dcpstmr0(mid, ssn, emp_cd, hire, term, status, job, cur_salary)

        # CMPTIER0
        self._write_cmptier0(mid, tier_cd, hire, vested, vested_dt)

        # Department record
        rank = random.choice(["PVT", "CPL", "SGT", "LT", "CPT"]) if is_dps else None
        self._write_dept_record(mid, emp_cd, division, job, hire, term, status, rank=rank)

        # DPS merger record for DPS members hired before 2010
        if is_dps and hire < date(2010, 1, 1):
            pre_svc = d(min((date(2010, 1, 1) - hire).days / 365.25, float(svc_yrs)))
            post_svc = d(float(svc_yrs) - float(pre_svc))
            self.write(ins("DPPMGMR0",
                ["MBR_ID","MERGER_DT","PRE_MERGER_SVC","POST_MERGER_SVC",
                 "ADJUSTMENT_CD","LAST_UPD_DT"],
                [mid, date(2010, 1, 1), pre_svc, post_svc, "NONE", datetime.now()]))

        # Salary history (abbreviated for bulk — only last 5 years + first year)
        # Use full schedule for realistic data
        self._write_salary_history(mid, emp_cd, division, schedule, hire, end)

        # Beneficiary
        if marital == "M":
            sp_g = "F" if gender == "M" else "M"
            sp_first = random.choice(FIRST_F if sp_g == "F" else FIRST_M)
            sp_dob = safe_date(dob.year + random.randint(-5, 5), random.randint(1, 12), random.randint(1, 28))
            self._write_beneficiary(mid, division, f"{sp_first} {last}", "Spouse", sp_dob)
        else:
            self._write_beneficiary(mid, division, "Estate", "Estate", None, Decimal("100.00"))

        # Retired members: create annuitant record + payment history
        if status == "R" and term:
            self._write_retired_records(mid, division, tier_cd, svc_yrs, cur_salary,
                                       schedule, dob, term, hire)

        return mid

    def _write_retired_records(self, mid, division, tier_cd, svc_yrs, cur_salary,
                               schedule, dob, ret_dt, hire_dt):
        """Create ANPMBMR0, MDPBBMR0, and ANPPYTR0 records for retired members."""
        annuity = self.next_annuity()
        self.retired_ids.append(mid)
        self.retired_annuity_map[mid] = annuity

        svc_f = float(svc_yrs)
        # Approximate HAS from last 3 years of schedule
        sorted_yrs = sorted(schedule.keys())
        last_3 = sorted_yrs[-3:] if len(sorted_yrs) >= 3 else sorted_yrs
        has_amt = d(sum(schedule[y] for y in last_3) / len(last_3))

        unreduced = d(float(has_amt) * 0.025 * svc_f / 12)

        age_ret = (ret_dt - dob).days / 365.25
        reduction = Decimal("0.0000")
        reduced = unreduced

        if age_ret < 65 and tier_cd in ("P1", "D1"):
            # Rule of 80 check
            rule_sum = age_ret + svc_f
            if rule_sum < 80:
                yrs_under = int(65 - age_ret)
                red_rate = 0.03  # 3% for P1/D1
                reduction = d(min(yrs_under * red_rate, 0.30))
                reduced = d(float(unreduced) * (1 - float(reduction)))
        elif age_ret < 65 and tier_cd in ("P6", "D2"):
            rule_sum = age_ret + svc_f
            if rule_sum < 85:
                yrs_under = int(65 - age_ret)
                red_rate = 0.04  # 4% for P6/D2
                reduction = d(min(yrs_under * red_rate, 0.40))
                reduced = d(float(unreduced) * (1 - float(reduction)))
        elif age_ret < 65 and tier_cd in ("P7", "D3"):
            rule_sum = age_ret + svc_f
            if rule_sum < 90:
                yrs_under = int(65 - age_ret)
                red_rate = 0.05  # 5% for P7/D3
                reduction = d(min(yrs_under * red_rate, 0.50))
                reduced = d(float(unreduced) * (1 - float(reduction)))

        # Payment option (random)
        if division == "DPS":
            opt = random.choice(["A", "B", "P2", "P3"])
            opt_factor = {"A": 1.0, "B": 0.945, "P2": 0.915, "P3": 0.885}[opt]
        else:
            opt = random.choice(["1", "2", "3"])
            opt_factor = {"1": 1.0, "2": 0.945, "3": 0.885}[opt]

        monthly_benefit = d(float(reduced) * opt_factor)
        ai_rate = Decimal("0.0150") if tier_cd in ("P1", "D1") else Decimal("0.0100")

        # ANPMBMR0
        self.write(ins("ANPMBMR0",
            ["ANNUITY_NBR","MBR_ID","SSN","RET_TYPE_CD","RET_EFF_DT",
             "BENEFIT_AMT","BASE_BENEFIT","OPTION_CD","DIVISION_CD",
             "HAS_TABLE_CD","HAS_AMT","SVC_CREDIT_YRS","MULTIPLIER",
             "REDUCTION_PCT","AI_RATE","STATUS_CD","LAST_UPD_DT"],
            [annuity, mid, fake_ssn(mid),
             "NR" if float(reduction) == 0 else "ER",
             ret_dt, monthly_benefit, reduced, opt, division,
             tier_cd, has_amt, svc_yrs, Decimal("0.0250"),
             reduction, ai_rate, "A", datetime.now()]))

        # MDPBBMR0 (benefit calculation record)
        self.write(ins("MDPBBMR0",
            ["MBR_ID","CALC_DT","HAS_TABLE_CD","HAS_AMT","SVC_CREDIT_YRS",
             "MULTIPLIER","UNREDUCED_AMT","REDUCTION_PCT","REDUCED_AMT",
             "ANTI_SPIKE_FLG","DIVISION_CD","STATUS_CD","LAST_UPD_DT"],
            [mid, ret_dt, tier_cd, has_amt, svc_yrs,
             Decimal("0.0250"), unreduced, reduction, reduced,
             "N", division, "A", datetime.now()]))

        # ANPPYTR0 — 6 months of payment history
        for m_offset in range(6):
            pay_month = ret_dt.month + m_offset
            pay_year = ret_dt.year
            while pay_month > 12:
                pay_month -= 12
                pay_year += 1
            pay_dt = date(pay_year, pay_month, 1)
            if pay_dt > CURRENT_DATE:
                break

            fed_tax = d(float(monthly_benefit) * 0.15)
            state_tax = d(float(monthly_benefit) * 0.045)
            net = d(float(monthly_benefit) - float(fed_tax) - float(state_tax))

            self.write(ins("ANPPYTR0",
                ["ANNUITY_NBR","PAY_DT","GROSS_AMT","FED_TAX","STATE_TAX",
                 "HEALTH_DED","OTHER_DED","NET_AMT","PAY_METHOD","LAST_UPD_DT"],
                [annuity, pay_dt, monthly_benefit, fed_tax, state_tax,
                 d(0), d(0), net, "ACH", datetime.now()]))

    # ── PERACare records for select retirees ─────────────────────────────
    def write_peracare(self, count=20):
        """Add PERACare enrollment for select retired members."""
        eligible = [mid for mid in self.retired_ids if mid in self.retired_annuity_map]
        if len(eligible) < count:
            count = len(eligible)

        self.write("\n-- ═══ PERACARE ENROLLMENT ═══\n\n")

        for mid in random.sample(eligible, count):
            annuity = self.retired_annuity_map[mid]
            # Enroll in 1-2 plans
            plans = random.sample(PERACARE_PLANS, random.choice([1, 2]))
            coverage = random.choice(["S", "F", "C"])

            for plan_cd, plan_nm, premium, subsidy in plans:
                member_amt = d(premium - subsidy)
                self.write(ins("PCPMSTR0",
                    ["ANNUITY_NBR","PLAN_CD","COVERAGE_CD","EFF_DT",
                     "PREMIUM_AMT","SUBSIDY_AMT","MEMBER_AMT","STATUS_CD","LAST_UPD_DT"],
                    [annuity, plan_cd, coverage, date(2025, 1, 1),
                     d(premium), d(subsidy), member_amt, "A", datetime.now()]))

                # 6 months of payment history
                for m in range(1, 7):
                    self.write(ins("PCPPHST0",
                        ["ANNUITY_NBR","PAY_DT","PLAN_CD","PREMIUM_AMT",
                         "SUBSIDY_AMT","MEMBER_AMT","LAST_UPD_DT"],
                        [annuity, date(2025, m, 1), plan_cd,
                         d(premium), d(subsidy), member_amt, datetime.now()]))

    # ── Data Quality Issues ──────────────────────────────────────────────
    def write_quality_issues(self):
        """Inject deliberate data quality problems for demo discovery."""
        self.write("\n-- ═══ DELIBERATE DATA QUALITY ISSUES ═══\n\n")

        pera_bulk = [m for m in self.pera_ids if m.startswith("M-")]
        dps_bulk = [m for m in self.dps_ids if m.startswith("M-")]
        all_bulk = [m for m in self.all_ids if m.startswith("M-")]

        # DQ-C01: No ENTITY_ID, SSN-only lookup (10 members)
        self.write("-- DQ-C01: Members missing ENTITY record (SSN-only lookup)\n")
        for mid in random.sample(all_bulk, min(10, len(all_bulk))):
            eid = fake_entity_id(mid)
            self.write(f"DELETE FROM ENTITY WHERE ENTITY_ID = '{eid}';\n")

        # DQ-C02: Active member missing from DCPSTMR0 (8 members)
        self.write("\n-- DQ-C02: Active members missing from DCPSTMR0\n")
        active_bulk = [m for m in self.active_ids if m.startswith("M-")]
        for mid in random.sample(active_bulk, min(8, len(active_bulk))):
            eid = fake_entity_id(mid)
            self.write(f"DELETE FROM DCPSTMR0 WHERE ENTITY_ID = '{eid}';\n")

        # DQ-C03: PERA member in wrong master (DPS table) — 3 members
        self.write("\n-- DQ-C03: PERA members incorrectly in DPS master table\n")
        pera_for_swap = random.sample(pera_bulk, min(3, len(pera_bulk)))
        for mid in pera_for_swap:
            # Copy to DPPMBMR0 (wrong table)
            self.write(f"INSERT INTO DPPMBMR0 (MBR_ID,SSN,FIRST_NM,LAST_NM,DOB,GENDER_CD,"
                      f"MEMBERSHIP_DT,DIVISION_CD,STATUS_CD,HIRE_DT,LAST_UPD_DT) "
                      f"SELECT MBR_ID,SSN,FIRST_NM,LAST_NM,DOB,GENDER_CD,"
                      f"MEMBERSHIP_DT,'State',STATUS_CD,HIRE_DT,LAST_UPD_DT "
                      f"FROM MDPMBMR0 WHERE MBR_ID = '{mid}';\n")

        # DQ-C04: Salary gaps in MDPHASC0 (8 members)
        self.write("\n-- DQ-C04: Salary gaps in MDPHASC0\n")
        for mid in random.sample(all_bulk, min(8, len(all_bulk))):
            gap_year = random.randint(2018, 2023)
            gap_months = random.randint(2, 4)
            gap_start = random.randint(1, 12 - gap_months)
            months_clause = ",".join(str(m) for m in range(gap_start, gap_start + gap_months))
            self.write(f"DELETE FROM MDPHASC0 WHERE MBR_ID = '{mid}' "
                      f"AND YEAR_NBR = {gap_year} AND MONTH_NBR IN ({months_clause});\n")

        # DQ-C05: CMPTIER0 missing for active members (15 members)
        self.write("\n-- DQ-C05: Active members missing CMPTIER0 record\n")
        for mid in random.sample(active_bulk, min(15, len(active_bulk))):
            self.write(f"DELETE FROM CMPTIER0 WHERE MBR_ID = '{mid}';\n")

        # DQ-C06: Orphaned contributions (no parent member) — 5 records
        self.write("\n-- DQ-C06: Orphaned contribution records\n")
        for i in range(5):
            orphan_id = f"ORPHAN-{i+1:03d}"
            self.write(ins("CONTRIBUTION_HIST",
                ["MBR_ID","YEAR_NBR","MONTH_NBR","EE_CONTRIB","ER_CONTRIB",
                 "EE_RATE","ER_RATE","EMPLOYER_CD","LAST_UPD_DT"],
                [orphan_id, 2024, random.randint(1, 12), d(random.uniform(300, 800)),
                 d(random.uniform(600, 1500)),
                 STATE_EE_RATE, STATE_ER_RATE, "ST-001", datetime.now()]))

        # DQ-C07: Salary exceeds 108% cap (RPG routine gap) — 3 records
        self.write("\n-- DQ-C07: Salary anomalies exceeding 108% cap\n")
        for mid in random.sample(all_bulk, min(3, len(all_bulk))):
            # Insert an anomalous salary jump
            self.write(ins("SALARY_ANNUAL",
                ["MBR_ID","YEAR_NBR","ANNUAL_SALARY","EMPLOYER_CD","LAST_UPD_DT"],
                [mid, 2020, d(random.uniform(120000, 180000)),
                 random.choice(["ST-001", "SC-001"]), datetime.now()]))

        # DQ-C08: Beneficiary allocations != 100% (5 members)
        self.write("\n-- DQ-C08: Beneficiary allocation errors (sum != 100%)\n")
        for mid in random.sample(pera_bulk, min(5, len(pera_bulk))):
            # Add a second beneficiary creating >100% total
            self.write(ins("MDPBNMR0",
                ["MBR_ID","BENEF_SEQ","BENEF_NM","BENEF_REL","BENEF_PCT",
                 "PRIMARY_FLG","EFF_DT","LAST_UPD_DT"],
                [mid, 2, f"{random.choice(FIRST_M + FIRST_F)} {random.choice(LASTS)}",
                 "Child", d(30), "P", date(2023, 1, 1), datetime.now()]))


# ── Main ─────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="COPERA Legacy Database Seed Data Generator")
    parser.add_argument("--output-dir", default="./output")
    args = parser.parse_args()
    os.makedirs(args.output_dir, exist_ok=True)
    outpath = os.path.join(args.output_dir, "010_copera_seed_data.sql")

    print("=" * 60)
    print("COPERA Legacy Database Seed Data Generator")
    print("=" * 60)

    with open(outpath, "w") as f:
        gen = Generator(f)
        f.write(f"-- COPERA Seed Data — Generated {datetime.now().isoformat()}\n")
        f.write("-- Target: 3 demo cases + 500 bulk members\n")
        f.write("-- Tables: MDPMBMR0, DPPMBMR0, DCPSTMR0, CMPTIER0, MDPHASC0,\n")
        f.write("--         SALARY_ANNUAL, CONTRIBUTION_HIST, MDTMBDP0, DPTMBDP0,\n")
        f.write("--         MDPBNMR0, DPPBNMR0, ENTITY, MDPMBDT0, DPPMBDT0,\n")
        f.write("--         DPPMGMR0, ANPMBMR0, MDPBBMR0, ANPPYTR0,\n")
        f.write("--         PCPMSTR0, PCPPHST0, ACPDPMA0\n\n")
        f.write("BEGIN;\n\n")

        # Reference data
        print("Writing employer reference data...")
        gen.write_ref_data()

        # Demo cases
        print("Writing demo case members...")
        f.write("\n-- ═══ DEMO CASE MEMBERS ═══\n")
        gen.write_demo_case_1()
        print("  Case 1: Maria Garcia (COPERA-001) — State, P1, $5,356.94/mo")
        gen.write_demo_case_2()
        print("  Case 2: James Chen (COPERA-002) — School, P6, $1,847.56/mo")
        gen.write_demo_case_3()
        print("  Case 3: Sarah Williams (COPERA-003) — DPS, D1, $5,904.17/mo")

        # Bulk members by division
        print("\nGenerating 500 bulk members...")
        f.write("\n-- ═══ BULK MEMBERS ═══\n\n")

        # Division distribution: State 200, School 150, DPS 75, LocalGov 50, Judicial 25
        division_counts = [
            ("State",    200),
            ("School",   150),
            ("DPS",       75),
            ("LocalGov",  50),
            ("Judicial",  25),
        ]
        # Status distribution: 60% Active, 20% Retired, 12% Terminated, 8% Deferred
        status_weights = [("A", 0.60), ("R", 0.20), ("T", 0.12), ("D", 0.08)]

        total = 0
        for division, count in division_counts:
            f.write(f"\n-- {division} Division ({count} members)\n")
            for i in range(count):
                # Pick status based on weights
                r = random.random()
                cumulative = 0
                status = "A"
                for s, w in status_weights:
                    cumulative += w
                    if r < cumulative:
                        status = s
                        break
                gen.write_bulk_member(division, status)
                total += 1
                if total % 100 == 0:
                    print(f"  {total} members generated...")

        print(f"  Total bulk members: {total}")

        # PERACare enrollment for select retirees
        print("Adding PERACare enrollment for ~20 retirees...")
        gen.write_peracare(20)

        # Data quality issues
        print("Injecting data quality issues (~50 records across 8 types)...")
        gen.write_quality_issues()

        f.write("\nCOMMIT;\n")

    size_mb = os.path.getsize(outpath) / (1024 * 1024)
    print(f"\nOutput: {outpath} ({size_mb:.1f} MB)")
    print(f"Total members: {len(gen.all_ids)}")
    print(f"  PERA (MDPMBMR0): {len(gen.pera_ids)}")
    print(f"  DPS (DPPMBMR0):  {len(gen.dps_ids)}")
    print(f"  Retired (w/ ANPMBMR0): {len(gen.retired_ids)}")
    print(f"  Active: {len(gen.active_ids)}")
    print("=" * 60)
    print("Done!")


if __name__ == "__main__":
    main()

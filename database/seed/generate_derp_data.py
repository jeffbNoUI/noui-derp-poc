#!/usr/bin/env python3
"""
DERP Legacy Database Seed Data Generator
=========================================
Generates 10,000 synthetic members for the Denver Employees Retirement Plan POC.

Design:
- Demo case members (M-100001 to M-100003): Full biweekly salary records
- Bulk members: Monthly salary summaries (realistic but manageable data volume)
- SQL streamed directly to file (low memory footprint)
- Deliberate data quality issues embedded per BUILD_PLAN Step 1.4

Usage:  python generate_derp_data.py [--output-dir ./output]
"""

import argparse, hashlib, json, os, random, sys
from datetime import date, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP

# ── Constants ──────────────────────────────────────────────────────────────
EMPLOYEE_CONTRIB_RATE = Decimal("0.0845")
EMPLOYER_CONTRIB_RATE = Decimal("0.1795")  # Current rate per DERP Handbook Jan 2024 (was 0.11 pre-2012)
# TODO: For era-appropriate rates, use ~0.11 for hire dates before 2012, scale to 0.1795 for current
TIER_1_END = date(2004, 9, 1)
TIER_2_END = date(2011, 7, 1)
CURRENT_DATE = date(2026, 3, 15)
random.seed(42)

# ── Reference Data ─────────────────────────────────────────────────────────
DEPARTMENTS = [
    ("DPW","Public Works","PubWorks"),("DFN","Finance","Finance"),
    ("DPR","Parks and Recreation","Parks&Rec"),("DPD","Police Department","Police"),
    ("DFD","Fire Department","Fire"),("DHS","Human Services","HumanSvc"),
    ("DPH","Public Health","PubHealth"),("DCA","City Attorney","CityAtty"),
    ("DAS","Aviation (DIA)","Aviation"),("DTD","Technology Services","TechSvc"),
    ("DCF","Community Planning","ComPlan"),("DWW","Water","Water"),
    ("DLB","Library","Library"),("DPK","Parking","Parking"),
    ("DSS","Safety","Safety"),("DGS","General Services","GenSvc"),
    ("DRM","Risk Management","RiskMgmt"),("DHR","Human Resources","HR"),
    ("DEN","Environmental Health","EnvHlth"),("DCR","County Court","CntyCrt"),
    ("DDS","District Court","DistCrt"),("DPB","Probation","Probation"),
    ("DEX","Excise and License","Excise"),("DTR","Treasury","Treasury"),
    ("DAU","Auditor","Auditor"),("DCK","Clerk and Recorder","ClerkRec"),
    ("DZN","Zoning","Zoning"),("DBM","Budget Management","BudMgmt"),
    ("DPA","Public Art","PubArt"),("DSR","Streets","Streets"),
]

POSITIONS = [
    ("ENG1","Engineer I","G10","N"),("ENG2","Engineer II","G12","N"),
    ("ENG3","Senior Engineer","G14","Y"),("ANLY1","Analyst I","G08","N"),
    ("ANLY2","Analyst II","G10","N"),("ANLY3","Senior Analyst","G12","Y"),
    ("BADG1","Budget Analyst I","G09","N"),("BADG2","Budget Analyst II","G11","N"),
    ("BADG3","Budget Analyst III","G13","Y"),("TECH1","Technician I","G06","N"),
    ("TECH2","Technician II","G08","N"),("TECH3","Senior Technician","G10","N"),
    ("CLK1","Clerk I","G04","N"),("CLK2","Clerk II","G06","N"),
    ("CLK3","Senior Clerk","G08","N"),("MGR1","Manager I","G13","Y"),
    ("MGR2","Manager II","G15","Y"),("PMGR","Program Manager","G14","Y"),
    ("DIR1","Director I","G16","Y"),("DIR2","Director II","G18","Y"),
    ("SPEC1","Specialist I","G09","N"),("SPEC2","Specialist II","G11","N"),
    ("SPEC3","Senior Specialist","G13","Y"),("ACCT1","Accountant I","G09","N"),
    ("ACCT2","Accountant II","G11","N"),("ACCT3","Senior Accountant","G13","Y"),
    ("INSPC","Inspector","G10","N"),("SUPV1","Supervisor I","G11","Y"),
    ("SUPV2","Supervisor II","G13","Y"),("MAINT","Maintenance Worker","G05","N"),
    ("OFFR1","Officer I","G08","N"),("OFFR2","Officer II","G10","N"),
    ("COORD","Coordinator","G09","N"),("ADMIN","Administrative Assistant","G06","N"),
    ("EXEC","Executive Assistant","G10","Y"),("PLNR1","Planner I","G10","N"),
    ("PLNR2","Planner II","G12","N"),("LEGAL","Legal Assistant","G08","N"),
    ("ATTY1","Attorney I","G14","Y"),("ATTY2","Attorney II","G16","Y"),
    ("IT1","IT Specialist I","G10","N"),("IT2","IT Specialist II","G12","N"),
    ("IT3","Senior IT Specialist","G14","Y"),("PMED","Paramedic","G10","N"),
    ("FFTR","Firefighter","G09","N"),("DPCH","Dispatcher","G07","N"),
    ("SOCWK","Social Worker","G11","N"),("LIBR1","Librarian I","G09","N"),
    ("LIBR2","Librarian II","G11","N"),("CSTDN","Custodian","G04","N"),
]

GRADE_RANGES = {
    "G04":(30000,42000),"G05":(32000,45000),"G06":(34000,48000),
    "G07":(36000,52000),"G08":(38000,56000),"G09":(40000,60000),
    "G10":(44000,66000),"G11":(48000,72000),"G12":(52000,78000),
    "G13":(56000,84000),"G14":(62000,92000),"G15":(68000,100000),
    "G16":(75000,110000),"G18":(85000,130000),
}

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

# ── Helpers ────────────────────────────────────────────────────────────────
def d(val):
    return Decimal(str(val)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def tier_for(hire_date):
    if hire_date < TIER_1_END: return 1
    if hire_date < TIER_2_END: return 2
    return 3

def sql_v(val):
    if val is None: return "NULL"
    if isinstance(val, str): return "'" + val.replace("'","''") + "'"
    if isinstance(val, (date, datetime)): return "'" + val.isoformat() + "'"
    if isinstance(val, Decimal): return str(val)
    return str(val)

def ins(table, cols, vals):
    return f"INSERT INTO {table} ({','.join(cols)}) VALUES ({','.join(sql_v(v) for v in vals)});\n"

def rdate(s, e):
    delta = (e - s).days
    return s + timedelta(days=random.randint(0, max(0, delta))) if delta > 0 else s

def safe_date(y, m, day):
    day = min(day, 28)
    return date(y, m, day)

def biweekly_dates(start, end):
    c = start
    while c.weekday() != 4: c += timedelta(days=1)
    c += timedelta(days=7)
    out = []
    while c <= end:
        out.append(c)
        c += timedelta(days=14)
    return out

def monthly_dates(start, end):
    """Generate month-end dates for salary records."""
    out = []
    y, m = start.year, start.month
    while date(y, m, 28) <= end:
        out.append(date(y, m, 28))  # Use 28th as month-end proxy
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

# ── Main Generator ─────────────────────────────────────────────────────────
class Generator:
    def __init__(self, outfile):
        self.f = outfile
        self.mbr_count = 0
        self.bene_id = 0
        self.dro_id = 0
        self.case_id = 0
        # Track IDs for quality issue injection
        self.active_ids = []
        self.retired_ids = []
        self.all_ids = []

    def write(self, s):
        self.f.write(s)

    def next_id(self):
        self.mbr_count += 1
        return f"M-{self.mbr_count:06d}"

    # ── Reference data ────────────────────────────────────────────────────
    def write_ref_data(self):
        self.write("-- DEPARTMENT_REF\n")
        for d_cd, d_nm, d_short in DEPARTMENTS:
            self.write(ins("DEPARTMENT_REF",
                ["DEPT_CD","DEPT_NAME","DEPT_SHORT_NM","ACTIVE_FLG","CREATE_DT"],
                [d_cd, d_nm, d_short, "Y", date(1995,1,1)]))

        self.write("\n-- POSITION_REF\n")
        for p_cd, p_title, p_grade, exempt in POSITIONS:
            smin, smax = GRADE_RANGES.get(p_grade, (35000,75000))
            self.write(ins("POSITION_REF",
                ["POS_CD","POS_TITLE","PAY_GRADE","EXEMPT_FLG","MIN_SALARY","MAX_SALARY","EFF_DT"],
                [p_cd, p_title, p_grade, exempt, d(smin), d(smax), date(1995,1,1)]))
        self.write("\n")

    # ── Demo Case 1: Robert Martinez ──────────────────────────────────────
    def write_demo_case_1(self):
        mid = "M-100001"
        self.all_ids.append(mid)
        self.active_ids.append(mid)

        # MEMBER_MASTER
        self.write(ins("MEMBER_MASTER",
            ["MBR_ID","SSN","FIRST_NM","LAST_NM","MIDDLE_NM","SUFFIX","DOB","GENDER_CD",
             "ADDR_LINE1","ADDR_LINE2","CITY","STATE_CD","ZIP_CD",
             "HOME_PHONE","WORK_PHONE","EMAIL_ADDR","CELL_PHONE",
             "HIRE_DT","TERM_DT","REHIRE_DT","ORIG_HIRE_DT",
             "TIER_CD","STATUS_CD","DEPT_CD","POS_CD","ANNUAL_SALARY",
             "EMPL_CONTRIB_RT","EMPR_CONTRIB_RT","MARITAL_STATUS","RET_ELIG_DT","VEST_DT",
             "CREATE_DT","CREATE_USER"],
            [mid,"555-12-3456","Robert","Martinez","A.",None,date(1963,3,8),"M",
             "1847 Vine St",None,"Denver","CO","80205",
             "303-555-0101","303-555-0201","rmartinez@denvergov.org","720-555-0301",
             date(1997,6,15),None,None,None,
             1,"A","DPW","ENG3",d(116434),
             EMPLOYEE_CONTRIB_RATE,EMPLOYER_CONTRIB_RATE,"M",None,date(2002,6,15),
             datetime.now(),"SYSTEM"]))

        # EMPLOYMENT_HIST
        for ev in [
            (mid,"HIRE",date(1997,6,15),None,"DPW",None,"ENG1",None,d(48000),None,"Initial hire"),
            (mid,"PROMO",date(2003,1,1),"DPW","DPW","ENG1","ENG2",d(62629),d(68000),None,"Promotion to Engineer II"),
            (mid,"PROMO",date(2010,1,1),"DPW","DPW","ENG2","ENG3",d(72604),d(85000),None,"Promotion to Senior Engineer"),
        ]:
            self.write(ins("EMPLOYMENT_HIST",
                ["MBR_ID","EVENT_TYPE","EVENT_DT","FROM_DEPT","TO_DEPT","FROM_POS","TO_POS",
                 "FROM_SALARY","TO_SALARY","SEP_REASON","NOTES"], ev))

        # SALARY_HIST — full biweekly records
        schedule = {
            1997:48000,1998:49440,1999:50923,2000:52451,2001:54024,
            2002:55645,2003:57314,2004:59034,2005:60805,2006:62629,
            2007:64508,2008:66443,2009:68436,2010:70489,2011:72604,
            2012:74782,2013:77026,2014:79337,2015:81717,2016:84168,
            2017:86693,2018:89294,2019:91973,2020:94732,
            2021:98500,2022:101455,2023:105513,2024:109734,
            2025:113043,2026:116434,
        }
        cumul_e, cumul_r = Decimal("0"), Decimal("0")
        for pd in biweekly_dates(date(1997,6,15), date(2026,3,31)):
            annual = schedule.get(pd.year, schedule.get(pd.year-1, 48000))
            bw = d(annual/26)
            ppn = min((pd - date(pd.year,1,1)).days // 14 + 1, 26)

            lv_amt, lv_type = None, None
            if pd >= date(2026,3,20) and pd <= date(2026,3,31):
                lv_amt, lv_type = d(52000), "SICK_VAC"

            self.write(ins("SALARY_HIST",
                ["MBR_ID","PAY_PRD_END_DT","PAY_PRD_NBR","BASE_PAY","OT_PAY","PENS_PAY",
                 "SUPPL_PAY","LV_PAYOUT_AMT","LV_PAYOUT_TYPE","ANNL_SALARY","PROC_DT"],
                [mid, pd, ppn, bw, d(0), bw, d(0), lv_amt, lv_type, d(annual), pd]))

            ec = d(bw * EMPLOYEE_CONTRIB_RATE)
            rc = d(bw * EMPLOYER_CONTRIB_RATE)
            cumul_e += ec; cumul_r += rc
            fy = pd.year if pd.month >= 7 else pd.year - 1
            self.write(ins("CONTRIBUTION_HIST",
                ["MBR_ID","CONTRIB_DT","EMPL_CONTRIB","EMPR_CONTRIB","PENS_SALARY",
                 "EMPL_BAL","EMPR_BAL","INTEREST_BAL","FISCAL_YR","QTR","PROC_DT"],
                [mid, pd, ec, rc, bw, d(cumul_e), d(cumul_r), d(0), fy,
                 (pd.month-1)//3+1, pd]))

        # SVC_CREDIT
        self.write(ins("SVC_CREDIT",
            ["MBR_ID","SVC_TYPE","SVC_START_DT","SVC_END_DT","YEARS_CREDIT","MONTHS_CREDIT",
             "INCL_BENEFIT","INCL_ELIG","INCL_IPR","CREATE_DT","VERIFY_USER"],
            [mid,"EMPL",date(1997,6,15),None,d(28.75),345,"Y","Y","Y",datetime.now(),"SYSTEM"]))

        # BENEFICIARY — Elena
        self.bene_id += 1
        self.write(ins("BENEFICIARY",
            ["BENE_ID","MBR_ID","BENE_FIRST_NM","BENE_LAST_NM","BENE_DOB","BENE_RELATION",
             "ALLOC_PCT","BENE_TYPE","EFF_DT","STATUS_CD","SPOUSE_CONSENT","CONSENT_DT",
             "CREATE_DT","CREATE_USER"],
            [self.bene_id, mid, "Elena","Martinez",date(1966,9,15),"SPOUSE",
             d(100),"P",date(1999,8,15),"A","Y",date(1999,8,15),datetime.now(),"SYSTEM"]))

        # DRO for Case 4
        self.dro_id += 1
        self.write(ins("DRO_MASTER",
            ["DRO_ID","MBR_ID","COURT_ORDER_DT","COURT_NAME","CASE_NBR",
             "ALT_PAYEE_NM","ALT_PAYEE_DOB","ALT_PAYEE_RELATION",
             "MARRIAGE_DT","DIVORCE_DT","DIV_METHOD","DIV_PCT","DIV_DESC",
             "STATUS_CD","APPROVED_DT","APPROVED_BY","CALC_MARITAL_SVC","CALC_MARITAL_FRAC",
             "RECV_DT","CREATE_DT","NOTES"],
            [self.dro_id, mid, date(2017,11,3),"Denver District Court","2017-DR-4521",
             "Patricia Martinez",date(1964,4,22),"FORMER_SPOUSE",
             date(1999,8,15),date(2017,11,3),"PERCENTAGE",Decimal("0.4000"),
             "40% of marital share of benefit",
             "ACTIVE",date(2018,2,15),"ADMIN01",d(18.25),Decimal("0.6348"),
             date(2017,12,1),datetime.now(),
             "DRO approved per court order 2017-DR-4521"]))

    # ── Demo Case 2: Jennifer Kim ─────────────────────────────────────────
    def write_demo_case_2(self):
        mid = "M-100002"
        self.all_ids.append(mid)
        self.active_ids.append(mid)

        self.write(ins("MEMBER_MASTER",
            ["MBR_ID","SSN","FIRST_NM","LAST_NM","DOB","GENDER_CD",
             "ADDR_LINE1","ADDR_LINE2","CITY","STATE_CD","ZIP_CD",
             "HOME_PHONE","EMAIL_ADDR","CELL_PHONE",
             "HIRE_DT","TIER_CD","STATUS_CD","DEPT_CD","POS_CD","ANNUAL_SALARY",
             "EMPL_CONTRIB_RT","EMPR_CONTRIB_RT","MARITAL_STATUS","VEST_DT",
             "CREATE_DT","CREATE_USER"],
            [mid,"555-23-4567","Jennifer","Kim",date(1970,6,22),"F",
             "2301 Glenarm Pl","Apt 4B","Denver","CO","80205",
             "303-555-0102","jkim@denvergov.org","720-555-0302",
             date(2008,3,1),2,"A","DFN","BADG3",d(92778),
             EMPLOYEE_CONTRIB_RATE,EMPLOYER_CONTRIB_RATE,"S",date(2013,3,1),
             datetime.now(),"SYSTEM"]))

        for ev in [
            (mid,"HIRE",date(2008,3,1),None,"DFN",None,"BADG1",None,d(52000),None,"Initial hire"),
            (mid,"PROMO",date(2013,7,1),"DFN","DFN","BADG1","BADG2",d(60260),d(68000),None,"Promotion"),
            (mid,"PROMO",date(2018,1,1),"DFN","DFN","BADG2","BADG3",d(69858),d(78500),None,"Promotion"),
        ]:
            self.write(ins("EMPLOYMENT_HIST",
                ["MBR_ID","EVENT_TYPE","EVENT_DT","FROM_DEPT","TO_DEPT","FROM_POS","TO_POS",
                 "FROM_SALARY","TO_SALARY","SEP_REASON","NOTES"], ev))

        # Salary schedule must produce fixture AMS of $7,347.62
        # Annual values verified against case2-jennifer-kim-calculation.md
        schedule = {
            2008:52000,2009:53560,2010:55147,2011:56801,2012:58505,
            2013:60260,2014:62068,2015:63930,2016:65848,2017:67823,
            2018:69858,2019:71953,2020:74112,
            2021:78500,2022:80855,2023:84089,2024:87453,2025:90076,2026:92778,
        }
        cumul_e, cumul_r = Decimal("0"), Decimal("0")
        for pd in biweekly_dates(date(2008,3,1), date(2026,4,30)):
            annual = schedule.get(pd.year, schedule.get(pd.year-1, 52000))
            bw = d(annual/26)
            ppn = min((pd - date(pd.year,1,1)).days // 14 + 1, 26)
            self.write(ins("SALARY_HIST",
                ["MBR_ID","PAY_PRD_END_DT","PAY_PRD_NBR","BASE_PAY","OT_PAY","PENS_PAY",
                 "SUPPL_PAY","ANNL_SALARY","PROC_DT"],
                [mid, pd, ppn, bw, d(0), bw, d(0), d(annual), pd]))
            ec = d(bw * EMPLOYEE_CONTRIB_RATE); rc = d(bw * EMPLOYER_CONTRIB_RATE)
            cumul_e += ec; cumul_r += rc
            fy = pd.year if pd.month >= 7 else pd.year - 1
            self.write(ins("CONTRIBUTION_HIST",
                ["MBR_ID","CONTRIB_DT","EMPL_CONTRIB","EMPR_CONTRIB","PENS_SALARY",
                 "EMPL_BAL","EMPR_BAL","INTEREST_BAL","FISCAL_YR","QTR","PROC_DT"],
                [mid, pd, ec, rc, bw, d(cumul_e), d(cumul_r), d(0), fy, (pd.month-1)//3+1, pd]))

        # Employment service credit
        self.write(ins("SVC_CREDIT",
            ["MBR_ID","SVC_TYPE","SVC_START_DT","SVC_END_DT","YEARS_CREDIT","MONTHS_CREDIT",
             "INCL_BENEFIT","INCL_ELIG","INCL_IPR","CREATE_DT","VERIFY_USER"],
            [mid,"EMPL",date(2008,3,1),None,d(18.17),218,"Y","Y","Y",datetime.now(),"SYSTEM"]))
        # Purchased service — CRITICAL: benefit only, NOT elig, NOT IPR
        self.write(ins("SVC_CREDIT",
            ["MBR_ID","SVC_TYPE","SVC_START_DT","SVC_END_DT","YEARS_CREDIT","MONTHS_CREDIT",
             "PURCH_COST","PURCH_DT","PURCH_STATUS","PURCH_TYPE",
             "INCL_BENEFIT","INCL_ELIG","INCL_IPR","CREATE_DT","VERIFY_USER","NOTES"],
            [mid,"PURCH",date(2004,1,1),date(2007,1,1),d(3.00),36,
             d(45000),date(2015,6,1),"PAID","PRIOR_GOVT",
             "Y","N","N",datetime.now(),"ADMIN02",
             "Purchase of 3 years prior government service"]))

        self.bene_id += 1
        self.write(ins("BENEFICIARY",
            ["BENE_ID","MBR_ID","BENE_FIRST_NM","BENE_RELATION","ALLOC_PCT","BENE_TYPE",
             "EFF_DT","STATUS_CD","CREATE_DT","CREATE_USER"],
            [self.bene_id, mid, "Estate","ESTATE",d(100),"P",
             date(2008,3,1),"A",datetime.now(),"SYSTEM"]))

    # ── Demo Case 3: David Washington ─────────────────────────────────────
    def write_demo_case_3(self):
        mid = "M-100003"
        self.all_ids.append(mid)
        self.active_ids.append(mid)

        self.write(ins("MEMBER_MASTER",
            ["MBR_ID","SSN","FIRST_NM","LAST_NM","MIDDLE_NM","DOB","GENDER_CD",
             "ADDR_LINE1","CITY","STATE_CD","ZIP_CD",
             "HOME_PHONE","EMAIL_ADDR","CELL_PHONE",
             "HIRE_DT","TIER_CD","STATUS_CD","DEPT_CD","POS_CD","ANNUAL_SALARY",
             "EMPL_CONTRIB_RT","EMPR_CONTRIB_RT","MARITAL_STATUS","VEST_DT",
             "CREATE_DT","CREATE_USER"],
            [mid,"555-34-5678","David","Washington","L.",date(1963,2,14),"M",
             "4520 E Colfax Ave","Denver","CO","80220",
             "303-555-0103","dwashington@denvergov.org","720-555-0303",
             date(2012,9,1),3,"A","DPR","PMGR",d(86766),
             EMPLOYEE_CONTRIB_RATE,EMPLOYER_CONTRIB_RATE,"M",date(2017,9,1),
             datetime.now(),"SYSTEM"]))

        self.write(ins("EMPLOYMENT_HIST",
            ["MBR_ID","EVENT_TYPE","EVENT_DT","FROM_DEPT","TO_DEPT","FROM_POS","TO_POS",
             "FROM_SALARY","TO_SALARY","SEP_REASON","NOTES"],
            [mid,"HIRE",date(2012,9,1),None,"DPR",None,"PMGR",None,d(62000),None,
             "Initial hire - David Washington"]))

        # Salary schedule must produce fixture AMS of $6,684.52
        # 2021 lower than 2020 due to COVID-era city budget adjustment
        schedule = {
            2012:62000,2013:63860,2014:65776,2015:67749,2016:69781,
            2017:71874,2018:74030,2019:76251,2020:78538,
            2021:75101,2022:77275,2023:79588,2024:81872,2025:84319,2026:86766,
        }
        cumul_e, cumul_r = Decimal("0"), Decimal("0")
        for pd in biweekly_dates(date(2012,9,1), date(2026,3,31)):
            annual = schedule.get(pd.year, schedule.get(pd.year-1, 62000))
            bw = d(annual/26)
            ppn = min((pd - date(pd.year,1,1)).days // 14 + 1, 26)
            self.write(ins("SALARY_HIST",
                ["MBR_ID","PAY_PRD_END_DT","PAY_PRD_NBR","BASE_PAY","OT_PAY","PENS_PAY",
                 "SUPPL_PAY","ANNL_SALARY","PROC_DT"],
                [mid, pd, ppn, bw, d(0), bw, d(0), d(annual), pd]))
            ec = d(bw * EMPLOYEE_CONTRIB_RATE); rc = d(bw * EMPLOYER_CONTRIB_RATE)
            cumul_e += ec; cumul_r += rc
            fy = pd.year if pd.month >= 7 else pd.year - 1
            self.write(ins("CONTRIBUTION_HIST",
                ["MBR_ID","CONTRIB_DT","EMPL_CONTRIB","EMPR_CONTRIB","PENS_SALARY",
                 "EMPL_BAL","EMPR_BAL","INTEREST_BAL","FISCAL_YR","QTR","PROC_DT"],
                [mid, pd, ec, rc, bw, d(cumul_e), d(cumul_r), d(0), fy, (pd.month-1)//3+1, pd]))

        self.write(ins("SVC_CREDIT",
            ["MBR_ID","SVC_TYPE","SVC_START_DT","SVC_END_DT","YEARS_CREDIT","MONTHS_CREDIT",
             "INCL_BENEFIT","INCL_ELIG","INCL_IPR","CREATE_DT","VERIFY_USER"],
            [mid,"EMPL",date(2012,9,1),None,d(13.58),163,"Y","Y","Y",datetime.now(),"SYSTEM"]))

        self.bene_id += 1
        self.write(ins("BENEFICIARY",
            ["BENE_ID","MBR_ID","BENE_FIRST_NM","BENE_LAST_NM","BENE_DOB","BENE_RELATION",
             "ALLOC_PCT","BENE_TYPE","EFF_DT","STATUS_CD","SPOUSE_CONSENT","CONSENT_DT",
             "CREATE_DT","CREATE_USER"],
            [self.bene_id, mid, "Michelle","Washington",date(1965,8,3),"SPOUSE",
             d(100),"P",date(2012,9,1),"A","Y",date(2012,9,1),datetime.now(),"SYSTEM"]))

    # ── Bulk member generation ────────────────────────────────────────────
    def write_bulk_member(self, status, tier_hint=None):
        mid = self.next_id()
        self.all_ids.append(mid)

        gender = random.choice(["M","F"])
        first = random.choice(FIRST_M if gender == "M" else FIRST_F)
        last = random.choice(LASTS)

        # Hire date by tier
        if tier_hint == 1: hire = rdate(date(1985,1,1), date(2004,8,31))
        elif tier_hint == 2: hire = rdate(date(2004,9,1), date(2011,6,30))
        elif tier_hint == 3: hire = rdate(date(2011,7,1), date(2023,12,31))
        else: hire = rdate(date(1985,1,1), date(2023,12,31))

        tier = tier_for(hire)
        age_at_hire = random.randint(22, 55)
        dob = safe_date(hire.year - age_at_hire, random.randint(1,12), random.randint(1,28))

        dept = random.choice(DEPARTMENTS)
        pos = random.choice(POSITIONS)
        sal_min, sal_max = GRADE_RANGES.get(pos[2], (35000,75000))
        era_f = 1.0 + max(0, hire.year - 1990) * 0.015
        starting = round(random.uniform(sal_min, sal_max) * min(era_f, 1.5) / 100) * 100

        # Term date
        term = None
        if status == "R":
            yrs = random.uniform(10, 35)
            term = safe_date(min(hire.year + int(yrs), 2025), random.randint(1,12), 1)
            if term > CURRENT_DATE: term = rdate(date(2018,1,1), CURRENT_DATE)
        elif status == "T":
            yrs = random.uniform(0.5, 15)
            term = safe_date(min(hire.year + int(yrs), 2025), random.randint(1,12), random.randint(1,28))
            if term > CURRENT_DATE: term = rdate(date(2015,1,1), CURRENT_DATE)
        elif status == "D":
            yrs = random.uniform(5, 20)
            term = safe_date(min(hire.year + int(yrs), 2025), random.randint(1,12), random.randint(1,28))
            if term > CURRENT_DATE: term = rdate(date(2015,1,1), CURRENT_DATE)

        end = term if term else CURRENT_DATE
        if end < hire: end = hire + timedelta(days=365)  # Safety

        marital = random.choices(["M","S","D","W"], weights=[55,25,15,5])[0]

        vdt = None
        if (end - hire).days > 5 * 365:
            vdt = safe_date(hire.year + 5, hire.month, min(hire.day, 28))

        if status == "A": self.active_ids.append(mid)
        if status == "R": self.retired_ids.append(mid)

        annual = starting
        self.write(ins("MEMBER_MASTER",
            ["MBR_ID","SSN","FIRST_NM","LAST_NM","DOB","GENDER_CD",
             "ADDR_LINE1","CITY","STATE_CD","ZIP_CD","HOME_PHONE",
             "HIRE_DT","TERM_DT","TIER_CD","STATUS_CD","DEPT_CD","POS_CD","ANNUAL_SALARY",
             "EMPL_CONTRIB_RT","EMPR_CONTRIB_RT","MARITAL_STATUS","VEST_DT",
             "CREATE_DT","CREATE_USER"],
            [mid, fake_ssn(mid), first, last, dob, gender,
             f"{random.randint(100,9999)} {random.choice(['Main','Oak','Pine','Elm'])} St",
             "Denver","CO",f"802{random.randint(10,99)}",
             f"303-{random.randint(200,999)}-{random.randint(1000,9999)}",
             hire, term, tier, status, dept[0], pos[0], d(annual),
             EMPLOYEE_CONTRIB_RATE, EMPLOYER_CONTRIB_RATE, marital, vdt,
             datetime.now(), "SYSTEM"]))

        # Employment events
        self.write(ins("EMPLOYMENT_HIST",
            ["MBR_ID","EVENT_TYPE","EVENT_DT","TO_DEPT","TO_POS","TO_SALARY","NOTES"],
            [mid,"HIRE",hire,dept[0],pos[0],d(starting),"Initial hire"]))

        if term:
            sep = {"R":"RETIRE","T":random.choice(["RESIGN","TERM"]),"D":"RESIGN"}.get(status,"RESIGN")
            self.write(ins("EMPLOYMENT_HIST",
                ["MBR_ID","EVENT_TYPE","EVENT_DT","SEP_REASON","NOTES"],
                [mid,"SEP",term,sep,f"Separation - {sep}"]))

        # Monthly salary records (not biweekly — saves 50% of data volume)
        cumul_e, cumul_r = Decimal("0"), Decimal("0")
        cur_year = hire.year
        for md in monthly_dates(hire, end):
            if md.year > cur_year:
                annual *= (1 + random.uniform(0.02, 0.04))
                annual = round(annual / 100) * 100
                cur_year = md.year
            monthly = d(annual / 12)
            self.write(ins("SALARY_HIST",
                ["MBR_ID","PAY_PRD_END_DT","BASE_PAY","PENS_PAY","ANNL_SALARY","PROC_DT"],
                [mid, md, monthly, monthly, d(annual), md]))

            ec = d(monthly * EMPLOYEE_CONTRIB_RATE)
            rc = d(monthly * EMPLOYER_CONTRIB_RATE)
            cumul_e += ec; cumul_r += rc
            fy = md.year if md.month >= 7 else md.year - 1
            self.write(ins("CONTRIBUTION_HIST",
                ["MBR_ID","CONTRIB_DT","EMPL_CONTRIB","EMPR_CONTRIB","PENS_SALARY",
                 "EMPL_BAL","EMPR_BAL","INTEREST_BAL","FISCAL_YR","QTR","PROC_DT"],
                [mid, md, ec, rc, monthly, d(cumul_e), d(cumul_r), d(0), fy,
                 (md.month-1)//3+1, md]))

        # Service credit
        svc_yrs = d((end - hire).days / 365.25)
        self.write(ins("SVC_CREDIT",
            ["MBR_ID","SVC_TYPE","SVC_START_DT","SVC_END_DT","YEARS_CREDIT",
             "INCL_BENEFIT","INCL_ELIG","INCL_IPR","CREATE_DT","VERIFY_USER"],
            [mid,"EMPL",hire,term,svc_yrs,"Y","Y","Y",datetime.now(),"SYSTEM"]))

        # Beneficiary
        self.bene_id += 1
        if marital == "M":
            sp_g = "F" if gender == "M" else "M"
            sp_first = random.choice(FIRST_F if sp_g == "F" else FIRST_M)
            sp_dob = safe_date(dob.year + random.randint(-5,5), random.randint(1,12), random.randint(1,28))
            self.write(ins("BENEFICIARY",
                ["BENE_ID","MBR_ID","BENE_FIRST_NM","BENE_LAST_NM","BENE_DOB","BENE_RELATION",
                 "ALLOC_PCT","BENE_TYPE","EFF_DT","STATUS_CD","SPOUSE_CONSENT","CREATE_DT","CREATE_USER"],
                [self.bene_id, mid, sp_first, last, sp_dob, "SPOUSE",
                 d(100),"P",hire,"A","Y",datetime.now(),"SYSTEM"]))
        else:
            self.write(ins("BENEFICIARY",
                ["BENE_ID","MBR_ID","BENE_FIRST_NM","BENE_RELATION","ALLOC_PCT","BENE_TYPE",
                 "EFF_DT","STATUS_CD","CREATE_DT","CREATE_USER"],
                [self.bene_id, mid, "Estate","ESTATE",d(100),"P",hire,"A",datetime.now(),"SYSTEM"]))

        # Benefit payment for retirees
        if status == "R" and term:
            svc_f = float(svc_yrs)
            mult = 0.02 if tier == 1 else 0.015
            gross = d(float(d(annual/12)) * mult * svc_f)
            age_ret = (term - dob).days / 365.25
            if age_ret < 65:
                rule_sum = age_ret + svc_f
                threshold = 75 if tier in (1,2) else 85
                if rule_sum < threshold:
                    # CRITICAL-001: Tiers 1&2 use 3%/yr, Tier 3 uses 6%/yr
                    rate = 0.03 if tier in (1, 2) else 0.06
                    red = min(int(65 - age_ret) * rate, 0.30)
                    gross = d(float(gross) * (1 - red))
            opt = random.choice(["MAX","100JS","75JS","50JS"])
            of = {"MAX":1.0,"100JS":0.885,"75JS":0.915,"50JS":0.945}[opt]
            gb = d(float(gross) * of)
            ft = d(float(gb) * 0.15); st = d(float(gb) * 0.045)
            self.write(ins("BENEFIT_PAYMENT",
                ["MBR_ID","EFF_DT","GROSS_BENEFIT","PAY_OPTION","FED_TAX_AMT","STATE_TAX_AMT",
                 "NET_BENEFIT","DRO_FLG","IPR_AMT","IPR_TYPE","COLA_FLG",
                 "CALC_DT","CALC_USER","CREATE_DT","STATUS_CD"],
                [mid, term, gb, opt, ft, st, d(float(gb)-float(ft)-float(st)),
                 "N",d(float(Decimal("12.50") if age_ret < 65 else Decimal("6.25")) * svc_f),
                 "PRE_MCARE" if age_ret < 65 else "POST_MCARE","N",
                 term,"SYSTEM",datetime.now(),"A"]))

        return mid, tier, hire, term, status, marital

    # ── Quality issues ────────────────────────────────────────────────────
    def write_quality_issues(self):
        """Inject data quality problems via UPDATE statements."""
        self.write("\n-- ═══ DELIBERATE DATA QUALITY ISSUES ═══\n\n")

        # DQ-001: 12 active members with TERM_DT populated
        self.write("-- DQ-001: Active members with termination date\n")
        active_for_dq = [m for m in self.active_ids if m.startswith("M-0")]
        for mid in random.sample(active_for_dq, min(12, len(active_for_dq))):
            fake_term = rdate(date(2020,1,1), date(2025,12,31))
            self.write(f"UPDATE MEMBER_MASTER SET TERM_DT = '{fake_term}' WHERE MBR_ID = '{mid}';\n")

        # DQ-002: 8 members with salary gaps (missing pay periods)
        self.write("\n-- DQ-002: Salary gaps (missing pay periods)\n")
        for mid in random.sample(active_for_dq, min(8, len(active_for_dq))):
            gap_start = rdate(date(2018,1,1), date(2023,6,30))
            gap_end = gap_start + timedelta(days=random.randint(28, 84))  # 1-3 months gap
            self.write(f"DELETE FROM SALARY_HIST WHERE MBR_ID = '{mid}' "
                       f"AND PAY_PRD_END_DT BETWEEN '{gap_start}' AND '{gap_end}';\n")

        # DQ-003: 3 members with contribution balance mismatches
        self.write("\n-- DQ-003: Contribution balance rounding drift\n")
        for mid in random.sample(active_for_dq, min(3, len(active_for_dq))):
            drift = round(random.uniform(0.01, 2.50), 2)
            sign = random.choice(['+', '-'])
            self.write(f"UPDATE CONTRIBUTION_HIST SET EMPL_BAL = EMPL_BAL {sign} {drift} "
                       f"WHERE MBR_ID = '{mid}' AND CONTRIB_DT = ("
                       f"SELECT MAX(CONTRIB_DT) FROM CONTRIBUTION_HIST WHERE MBR_ID = '{mid}');\n")

        # DQ-004: 5 beneficiary allocations that don't total 100%
        self.write("\n-- DQ-004: Beneficiary allocation errors\n")
        for mid in random.sample(active_for_dq, min(5, len(active_for_dq))):
            self.bene_id += 1
            child_first = random.choice(FIRST_M + FIRST_F)
            child_dob = rdate(date(1990,1,1), date(2010,1,1))
            self.write(ins("BENEFICIARY",
                ["BENE_ID","MBR_ID","BENE_FIRST_NM","BENE_LAST_NM","BENE_DOB","BENE_RELATION",
                 "ALLOC_PCT","BENE_TYPE","EFF_DT","STATUS_CD","CREATE_DT","CREATE_USER"],
                [self.bene_id, mid, child_first, random.choice(LASTS), child_dob, "CHILD",
                 d(30),"P",rdate(date(2015,1,1),date(2023,1,1)),"A",datetime.now(),"SYSTEM"]))

        # DQ-005: 2 retired members with wrong payment amounts
        self.write("\n-- DQ-005: Incorrect benefit payment amounts\n")
        if len(self.retired_ids) >= 2:
            for mid in random.sample(self.retired_ids, 2):
                factor = round(random.uniform(1.05, 1.15), 4)
                self.write(f"UPDATE BENEFIT_PAYMENT SET GROSS_BENEFIT = GROSS_BENEFIT * {factor} WHERE MBR_ID = '{mid}';\n")

        # DQ-006: 15 members near tier boundaries with wrong TIER_CD
        self.write("\n-- DQ-006: Tier boundary misclassifications\n")
        for _ in range(15):
            # Create members right at boundaries
            boundary = random.choice([TIER_1_END, TIER_2_END])
            offset = random.randint(-30, 30)
            hire_dt = boundary + timedelta(days=offset)
            correct_tier = tier_for(hire_dt)
            wrong_tier = {1: 2, 2: random.choice([1,3]), 3: 2}[correct_tier]
            mid = self.next_id()
            self.all_ids.append(mid)
            gender = random.choice(["M","F"])
            first = random.choice(FIRST_M if gender == "M" else FIRST_F)
            dob = safe_date(hire_dt.year - random.randint(25,40), random.randint(1,12), random.randint(1,28))
            self.write(ins("MEMBER_MASTER",
                ["MBR_ID","SSN","FIRST_NM","LAST_NM","DOB","GENDER_CD",
                 "ADDR_LINE1","CITY","STATE_CD","ZIP_CD",
                 "HIRE_DT","TIER_CD","STATUS_CD","DEPT_CD","POS_CD",
                 "EMPL_CONTRIB_RT","EMPR_CONTRIB_RT","CREATE_DT","CREATE_USER"],
                [mid, fake_ssn(mid), first, random.choice(LASTS), dob, gender,
                 f"{random.randint(100,9999)} Elm St","Denver","CO","80210",
                 hire_dt, wrong_tier, "A", random.choice(DEPARTMENTS)[0],
                 random.choice(POSITIONS)[0],
                 EMPLOYEE_CONTRIB_RATE, EMPLOYER_CONTRIB_RATE, datetime.now(), "SYSTEM"]))

    # ── Cases and transactions ────────────────────────────────────────────
    def write_cases_and_txns(self):
        workers = [f"WRK{i:03d}" for i in range(1,21)]
        case_types = ["SVC_RET","EARLY_RET","REFUND","DRO","SVC_PURCH",
                      "BEN_CHANGE","ADDR_CHG","DEATH","REEMPLOY"]

        self.write("\n-- CASE_HIST\n")
        for _ in range(25000):
            self.case_id += 1
            mid = random.choice(self.all_ids)
            ct = random.choice(case_types)
            odt = rdate(date(2011,1,1), CURRENT_DATE)
            st = random.choices(["CLOSED","APPROVED","DENIED","OPEN","IN_REVIEW"],
                                weights=[50,25,5,10,10])[0]
            cdt = None
            if st in ("CLOSED","APPROVED","DENIED"):
                cdt = min(odt + timedelta(days=random.randint(1,90)), CURRENT_DATE)
            self.write(ins("CASE_HIST",
                ["CASE_ID","MBR_ID","CASE_TYPE","CASE_STATUS","OPEN_DT","CLOSE_DT",
                 "ASSIGNED_TO","PRIORITY","CREATE_DT","CREATE_USER"],
                [self.case_id, mid, ct, st, odt, cdt,
                 random.choice(workers), random.choice([1,2,3,None]),
                 datetime.now(), random.choice(workers)]))

        self.write("\n-- TRANSACTION_LOG\n")
        txn_types = ["SAL_UPD","BEN_CALC","STAT_CHG","ADDR_UPD","BENE_CHG","CONTRIB"]
        modules = ["PAY","BEN","ADMIN","RPT"]
        for _ in range(50000):
            tdt = rdate(date(2010,1,1), CURRENT_DATE)
            tts = datetime(tdt.year, tdt.month, tdt.day, random.randint(7,18), random.randint(0,59))
            mid = random.choice(self.all_ids) if random.random() < 0.9 else None

            if tdt.year < 2015:
                self.write(ins("TRANSACTION_LOG",
                    ["TXN_DT","TXN_TYPE","TXN_DESC","MBR_ID","USER_ID","MODULE"],
                    [tts, random.choice(txn_types),
                     f"Processed for member {mid}" if mid else "System batch",
                     mid, random.choice(workers), random.choice(modules)]))
            elif tdt.year < 2018:
                self.write(ins("TRANSACTION_LOG",
                    ["TXN_DT","TXN_TYPE","ENTITY_TYPE","ENTITY_ID","ACTION",
                     "OLD_VALUE","NEW_VALUE","MBR_ID","USER_ID","MODULE","RESULT_CD"],
                    [tts, random.choice(txn_types),
                     random.choice(["MEMBER","SALARY","BENEFIT"]),
                     mid or f"SYS-{random.randint(1000,9999)}",
                     random.choice(["CREATE","UPDATE"]),
                     "field1|old_val","field1|new_val",
                     mid, random.choice(workers), random.choice(modules),
                     random.choice(["SUCCESS","WARNING",None])]))
            else:
                self.write(ins("TRANSACTION_LOG",
                    ["TXN_DT","TXN_TYPE","ENTITY_TYPE","ENTITY_ID","ACTION",
                     "OLD_VALUE","NEW_VALUE","MBR_ID","USER_ID",
                     "SESSION_ID","IP_ADDR","MODULE","RESULT_CD"],
                    [tts, random.choice(txn_types),
                     random.choice(["MEMBER","SALARY","BENEFIT","CASE"]),
                     mid or f"SYS-{random.randint(1000,9999)}",
                     random.choice(["CREATE","UPDATE","DELETE","CALCULATE"]),
                     json.dumps({"f":"x","old":"v1"}),
                     json.dumps({"f":"x","new":"v2"}),
                     mid, random.choice(workers),
                     f"sess-{random.randint(100000,999999)}",
                     f"10.0.{random.randint(1,254)}.{random.randint(1,254)}",
                     random.choice(modules),
                     random.choice(["SUCCESS","FAILURE","WARNING"])]))

    # ── Purchased service and DROs for bulk members ───────────────────────
    def write_bulk_purchased_service(self, count=200):
        eligible = [m for m in self.all_ids if m.startswith("M-0")]
        for mid in random.sample(eligible, min(count, len(eligible))):
            pyrs = d(random.choice([1,1.5,2,2.5,3,4,5]))
            cost = d(float(pyrs) * random.uniform(10000,20000))
            self.write(ins("SVC_CREDIT",
                ["MBR_ID","SVC_TYPE","SVC_START_DT","SVC_END_DT","YEARS_CREDIT",
                 "PURCH_COST","PURCH_DT","PURCH_STATUS","PURCH_TYPE",
                 "INCL_BENEFIT","INCL_ELIG","INCL_IPR","CREATE_DT","VERIFY_USER","NOTES"],
                [mid,"PURCH",
                 rdate(date(1995,1,1),date(2010,12,31)),
                 rdate(date(1998,1,1),date(2015,12,31)),
                 pyrs, cost,
                 rdate(date(2010,1,1),date(2023,12,31)),
                 random.choice(["PAID","PAID","PAID","PARTIAL"]),
                 random.choice(["PRIOR_GOVT","MILITARY","LOA_BUYBACK"]),
                 "Y","N","N",datetime.now(),
                 f"ADMIN{random.randint(1,5):02d}",
                 f"Purchase of {pyrs} years service"]))

    def write_bulk_dros(self, count=300):
        eligible = [m for m in self.all_ids if m.startswith("M-0")]
        for mid in random.sample(eligible, min(count, len(eligible))):
            self.dro_id += 1
            mdt = rdate(date(1985,1,1), date(2015,1,1))
            ddt = mdt + timedelta(days=random.randint(365*3, 365*20))
            if ddt > CURRENT_DATE: ddt = rdate(date(2015,1,1), CURRENT_DATE)
            self.write(ins("DRO_MASTER",
                ["DRO_ID","MBR_ID","COURT_ORDER_DT","COURT_NAME","CASE_NBR",
                 "ALT_PAYEE_NM","ALT_PAYEE_DOB","ALT_PAYEE_RELATION",
                 "MARRIAGE_DT","DIVORCE_DT","DIV_METHOD","DIV_PCT","DIV_DESC",
                 "STATUS_CD","APPROVED_DT","RECV_DT","CREATE_DT"],
                [self.dro_id, mid,
                 ddt + timedelta(days=random.randint(30,180)),
                 random.choice(["Denver District Court","Arapahoe County Court"]),
                 f"{ddt.year}-DR-{random.randint(1000,9999)}",
                 f"{random.choice(FIRST_F)} {random.choice(LASTS)}",
                 rdate(date(1955,1,1),date(1990,1,1)),
                 "FORMER_SPOUSE",
                 mdt, ddt, "PERCENTAGE",
                 Decimal(str(round(random.uniform(0.25,0.50),4))),
                 f"{round(random.uniform(25,50))}% of marital share",
                 random.choice(["ACTIVE","ACTIVE","PENDING"]),
                 ddt + timedelta(days=random.randint(60,365)),
                 ddt + timedelta(days=random.randint(30,90)),
                 datetime.now()]))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", default="./output")
    args = parser.parse_args()
    os.makedirs(args.output_dir, exist_ok=True)
    outpath = os.path.join(args.output_dir, "002_seed_data.sql")

    print("=" * 60)
    print("DERP Legacy Database Seed Data Generator")
    print("=" * 60)

    with open(outpath, "w") as f:
        gen = Generator(f)
        f.write(f"-- DERP Seed Data — Generated {datetime.now().isoformat()}\n")
        f.write("-- Target: 10,000 members with full history\n\n")
        f.write("BEGIN;\n\n")

        # Reference data
        print("Writing reference data...")
        gen.write_ref_data()

        # Demo cases
        print("Writing demo case members...")
        f.write("\n-- ═══ DEMO CASE MEMBERS ═══\n\n")
        gen.write_demo_case_1()
        print("  Case 1: Robert Martinez (M-100001)")
        gen.write_demo_case_2()
        print("  Case 2: Jennifer Kim (M-100002)")
        gen.write_demo_case_3()
        print("  Case 3: David Washington (M-100003)")
        print("  Case 4: Uses M-100001 + DRO (already created)")

        # Bulk members
        print("\nGenerating bulk members (this takes a minute)...")
        f.write("\n-- ═══ BULK MEMBERS ═══\n\n")

        status_counts = {"A": 4997, "R": 3800, "D": 800, "T": 400}
        tier_weights = {1: 0.24, 2: 0.30, 3: 0.46}  # Roughly 1200/1500/2300 of 5000

        total = 0
        for status, count in status_counts.items():
            for i in range(count):
                r = random.random()
                if r < tier_weights[1]: th = 1
                elif r < tier_weights[1] + tier_weights[2]: th = 2
                else: th = 3

                # Retired members skew toward earlier tiers
                if status == "R":
                    th = random.choices([1,2,3], weights=[50,30,20])[0]

                gen.write_bulk_member(status, tier_hint=th)
                total += 1
                if total % 1000 == 0:
                    print(f"  {total} members generated...")

        print(f"  Total bulk members: {total}")

        # Purchased service and DROs
        print("Adding purchased service records (~200)...")
        gen.write_bulk_purchased_service(200)

        print("Adding DRO records (~300)...")
        gen.write_bulk_dros(300)

        # Quality issues
        print("Injecting data quality issues...")
        gen.write_quality_issues()

        # Cases and transactions
        print("Generating case history (25,000) and transactions (50,000)...")
        gen.write_cases_and_txns()

        f.write("\nCOMMIT;\n")

    size_mb = os.path.getsize(outpath) / (1024*1024)
    print(f"\nOutput: {outpath} ({size_mb:.1f} MB)")
    print(f"Total members: {len(gen.all_ids)}")
    print("=" * 60)
    print("Done!")


if __name__ == "__main__":
    main()

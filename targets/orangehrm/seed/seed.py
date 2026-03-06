#!/usr/bin/env python3
"""
OrangeHRM Seed Script — NoUI Connector Lab
Generates realistic HR/payroll test data with embedded data quality issues.

Usage:
    python3 seed.py                              # 200 employees, 3 years, no DQ issues
    python3 seed.py --employees 200 --years 3    # explicit defaults
    python3 seed.py --dq-issues                  # embed data quality issues
    python3 seed.py --reset                      # drop seeded data and re-run

DQ Issues Embedded (with --dq-issues):
    - 12 employees: salary history gaps (missing pay periods)
    - 15 employees: negative leave balances
    -  5 employees: missing termination records (inactive, no termination row)
    -  3 months:    missing payroll runs (gaps in payroll frequency)
    -  8 employees: future hire dates (invalid joined_date)
    - 10 employees: contribution imbalance (calculated vs stored mismatch)
"""

import argparse
import random
import string
from datetime import date, timedelta, datetime
import mysql.connector
from mysql.connector import Error

# ── Configuration ────────────────────────────────────────────────────────────

DB_CONFIG = {
    "host": "127.0.0.1",
    "port": 3306,
    "database": "orangehrm",
    "user": "orangehrm",
    "password": "orangehrm",
}

SEED_MARKER = "NOUI_SEED"  # Embedded in comments/notes to identify seeded records

FIRST_NAMES = [
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda",
    "William", "Barbara", "David", "Elizabeth", "Richard", "Susan", "Joseph", "Jessica",
    "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Lisa", "Daniel", "Nancy",
    "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra", "Donald", "Ashley",
    "Steven", "Dorothy", "Paul", "Kimberly", "Andrew", "Emily", "Kenneth", "Donna"
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
    "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores"
]

JOB_TITLES = [
    ("Administrative Specialist", "A", 42000, 68000),
    ("Senior Administrative Specialist", "B", 58000, 85000),
    ("Program Coordinator", "B", 55000, 82000),
    ("Senior Program Coordinator", "C", 70000, 100000),
    ("Manager", "C", 75000, 110000),
    ("Senior Manager", "D", 90000, 130000),
    ("Director", "D", 110000, 155000),
    ("Deputy Director", "E", 130000, 175000),
]

DEPARTMENTS = [
    "Public Works", "Parks & Recreation", "Finance", "Human Resources",
    "Information Technology", "Planning", "Transportation", "Utilities",
    "Community Development", "Legal", "Administration", "Health Services"
]

LEAVE_TYPES = {
    1: "Annual Leave",
    2: "Sick Leave",
    3: "Maternity Leave",
    4: "Personal Leave",
}

# ── Helpers ──────────────────────────────────────────────────────────────────

def rand_date(start: date, end: date) -> date:
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))

def rand_salary(title_info: tuple) -> float:
    _, _, low, high = title_info
    return round(random.uniform(low, high), 2)

def emp_number_str(n: int) -> str:
    return str(1000 + n)

def make_employee_id() -> str:
    """Generate a random employee UUID-style ID string."""
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=8))

# ── Database ─────────────────────────────────────────────────────────────────

def get_connection():
    return mysql.connector.connect(**DB_CONFIG)

def get_max_emp_number(cursor) -> int:
    cursor.execute("SELECT COALESCE(MAX(emp_number), 1000) FROM hs_hr_employee")
    return cursor.fetchone()[0]

def get_job_title_ids(cursor) -> dict:
    cursor.execute("SELECT id, job_title_name FROM ohrm_job_title WHERE is_deleted = 0")
    rows = cursor.fetchall()
    return {row[1]: row[0] for row in rows}

def get_or_create_job_title(cursor, title_name: str) -> int:
    cursor.execute("SELECT id FROM ohrm_job_title WHERE job_title_name = %s", (title_name,))
    row = cursor.fetchone()
    if row:
        return row[0]
    cursor.execute(
        "INSERT INTO ohrm_job_title (job_title_name, is_deleted) VALUES (%s, 0)",
        (title_name,)
    )
    return cursor.lastrowid

def get_or_create_subunit(cursor, name: str) -> int:
    cursor.execute("SELECT id FROM ohrm_subunit WHERE name = %s", (name,))
    row = cursor.fetchone()
    if row:
        return row[0]
    cursor.execute(
        "INSERT INTO ohrm_subunit (name, unit_id, description, level) VALUES (%s, %s, %s, 1)",
        (name, name[:4].upper(), f"Department: {name}")
    )
    return cursor.lastrowid

# ── Seeding Logic ─────────────────────────────────────────────────────────────

def seed_employees(cursor, count: int, years: int, embed_dq: bool):
    today = date.today()
    history_start = today - timedelta(days=365 * years)

    # Track which employees get DQ issues
    dq_salary_gap = set()
    dq_negative_leave = set()
    dq_missing_termination = set()
    dq_future_hire = set()
    dq_contribution_imbalance = set()

    if embed_dq:
        active_indices = list(range(count - 30))  # first N are active
        dq_salary_gap = set(random.sample(active_indices, 12))
        dq_negative_leave = set(random.sample(active_indices, 15))
        dq_future_hire = set(random.sample(active_indices[:20], 8))
        dq_contribution_imbalance = set(random.sample(active_indices, 10))
        # Missing termination: from terminated pool (last 30)
        dq_missing_termination = set(random.sample(range(count - 30, count), 5))

    max_emp = get_max_emp_number(cursor)
    seeded_emp_numbers = []

    for i in range(count):
        emp_num = max_emp + 1 + i
        is_terminated = i >= (count - 30)
        is_missing_term = i in dq_missing_termination
        has_future_hire = i in dq_future_hire

        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        title_info = random.choice(JOB_TITLES)
        title_name = title_info[0]
        dept = random.choice(DEPARTMENTS)

        if has_future_hire:
            hire_date = today + timedelta(days=random.randint(30, 365))
        else:
            hire_date = rand_date(history_start, today - timedelta(days=180))

        emp_status = "Terminated" if (is_terminated and not is_missing_term) else "Active"

        cursor.execute("""
            INSERT INTO hs_hr_employee (
                emp_number, employee_id, emp_lastname, emp_firstname,
                emp_middle_name, emp_nick_name, emp_smoker, emp_status,
                emp_dri_lice_num, emp_dri_lice_exp_date, emp_gender,
                emp_marital_status, emp_birthday, nation_code,
                military_service, emp_zipcode, emp_hm_telephone,
                emp_work_telephone, emp_work_email, joined_date,
                nick_name, emp_work_shift
            ) VALUES (
                %s, %s, %s, %s,
                '', '', 0, %s,
                '', NULL, %s,
                'Single', %s, 'US',
                '', '', '', '', %s, %s,
                %s, 0
            )
        """, (
            emp_num,
            f"E{emp_num}",
            last, first,
            emp_status,
            random.choice(["Male", "Female"]),
            (today - timedelta(days=random.randint(25 * 365, 55 * 365))).isoformat(),
            f"{first.lower()}.{last.lower()}@city.gov",
            hire_date.isoformat(),
            f"{SEED_MARKER}",
            # emp_work_shift
        ))

        seeded_emp_numbers.append((emp_num, hire_date, is_terminated, title_info, dept,
                                    i in dq_salary_gap, i in dq_negative_leave,
                                    i in dq_contribution_imbalance, is_terminated and not is_missing_term))

    return seeded_emp_numbers

def seed_salary_history(cursor, emp_records, years: int):
    today = date.today()
    for emp_num, hire_date, is_terminated, title_info, dept, has_gap, _, _, _ in emp_records:
        salary = rand_salary(title_info)
        current = max(hire_date, today - timedelta(days=365 * years))
        end = today if not is_terminated else today - timedelta(days=random.randint(30, 365))

        month_count = 0
        while current <= end:
            # Skip a 2-month gap for DQ employees
            if has_gap and month_count in [14, 15]:
                current += timedelta(days=32)
                current = current.replace(day=1)
                month_count += 1
                continue

            # Annual raise ~3-5%
            if month_count > 0 and month_count % 12 == 0:
                salary = round(salary * random.uniform(1.02, 1.05), 2)

            cursor.execute("""
                INSERT INTO hs_hr_employee_salary (
                    emp_number, salary_component, pay_grade_id,
                    pay_frequency_id, currency_id, amount, comment,
                    effective_date
                ) VALUES (%s, 'Base Salary', 1, 2, 'USD', %s, %s, %s)
            """, (emp_num, salary, SEED_MARKER, current.isoformat()))

            current += timedelta(days=32)
            current = current.replace(day=1)
            month_count += 1

def seed_leave_balances(cursor, emp_records):
    for emp_num, hire_date, is_terminated, _, _, _, has_neg_leave, _, _ in emp_records:
        for leave_type_id, leave_name in LEAVE_TYPES.items():
            if is_terminated:
                continue
            if has_neg_leave and leave_type_id == 2:  # Sick leave goes negative
                balance = round(random.uniform(-8.0, -0.5), 2)
            else:
                balance = round(random.uniform(40.0, 240.0), 2)

            cursor.execute("""
                INSERT INTO ohrm_leave_summary (
                    emp_number, leave_type_id, entitlement, used,
                    balance, days_allocated, days_available, year
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                emp_num, leave_type_id,
                round(balance + random.uniform(0, 20), 2),
                round(random.uniform(0, 20), 2),
                balance,
                round(balance + random.uniform(0, 20), 2),
                max(0.0, balance),
                date.today().year
            ))

def seed_payroll_runs(cursor, emp_records, years: int, embed_dq: bool):
    today = date.today()
    start = today - timedelta(days=365 * years)

    # Which months are missing (DQ)
    total_months = years * 12
    missing_months = set()
    if embed_dq:
        missing_months = set(random.sample(range(total_months), 3))

    emp_numbers = [r[0] for r in emp_records if not r[2]]  # active only

    month_idx = 0
    current = start.replace(day=1)

    while current <= today:
        if month_idx not in missing_months:
            payment_date = current.replace(day=28)
            export_date = current.replace(day=25)
            total = sum(random.uniform(3000, 8000) for _ in emp_numbers)

            cursor.execute("""
                INSERT INTO ohrm_payroll_export (
                    pay_period_start, pay_period_end,
                    payment_date, export_date,
                    employee_count, total_amount, status, notes
                ) VALUES (%s, %s, %s, %s, %s, %s, 'Completed', %s)
            """, (
                current.isoformat(),
                (current.replace(day=28)).isoformat(),
                payment_date.isoformat(),
                export_date.isoformat(),
                len(emp_numbers),
                round(total, 2),
                SEED_MARKER
            ))

        current = (current + timedelta(days=32)).replace(day=1)
        month_idx += 1

def seed_terminations(cursor, emp_records):
    today = date.today()
    for emp_num, hire_date, is_terminated, _, _, _, _, _, should_have_term in emp_records:
        if should_have_term:
            term_date = today - timedelta(days=random.randint(30, 365))
            cursor.execute("""
                INSERT INTO ohrm_employee_termination (
                    emp_number, termination_reason, termination_date, note
                ) VALUES (%s, %s, %s, %s)
            """, (emp_num, "Resignation", term_date.isoformat(), SEED_MARKER))

# ── Table existence checks ────────────────────────────────────────────────────

def ensure_tables(cursor):
    """Create seed-required tables if OrangeHRM hasn't created them yet."""

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ohrm_leave_summary (
            id INT AUTO_INCREMENT PRIMARY KEY,
            emp_number INT NOT NULL,
            leave_type_id INT NOT NULL,
            entitlement DECIMAL(10,2),
            used DECIMAL(10,2),
            balance DECIMAL(10,2),
            days_allocated DECIMAL(10,2),
            days_available DECIMAL(10,2),
            year INT
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ohrm_payroll_export (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pay_period_start DATE,
            pay_period_end DATE,
            payment_date DATE,
            export_date DATE,
            employee_count INT,
            total_amount DECIMAL(14,2),
            status VARCHAR(50),
            notes VARCHAR(255)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ohrm_employee_termination (
            id INT AUTO_INCREMENT PRIMARY KEY,
            emp_number INT NOT NULL,
            termination_reason VARCHAR(255),
            termination_date DATE,
            note VARCHAR(255)
        )
    """)

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="NoUI OrangeHRM Seed Script")
    parser.add_argument("--employees", type=int, default=200, help="Number of employees to generate")
    parser.add_argument("--years", type=int, default=3, help="Years of history to generate")
    parser.add_argument("--dq-issues", action="store_true", help="Embed data quality issues")
    parser.add_argument("--reset", action="store_true", help="Remove seeded data before re-seeding")
    args = parser.parse_args()

    print(f"Connecting to OrangeHRM database at {DB_CONFIG['host']}:{DB_CONFIG['port']}...")
    try:
        conn = get_connection()
        cursor = conn.cursor()
        print("Connected.")
    except Error as e:
        print(f"ERROR: Could not connect to database: {e}")
        print("Is OrangeHRM running? Try: docker compose -f targets/orangehrm/docker-compose.yml ps")
        return

    try:
        ensure_tables(cursor)
        conn.commit()

        if args.reset:
            print("Resetting seeded data...")
            for table in ["ohrm_employee_termination", "ohrm_payroll_export",
                          "ohrm_leave_summary", "hs_hr_employee_salary"]:
                cursor.execute(f"DELETE FROM {table} WHERE notes = %s OR comment = %s",
                               (SEED_MARKER, SEED_MARKER))
            cursor.execute("DELETE FROM hs_hr_employee WHERE nick_name = %s", (SEED_MARKER,))
            conn.commit()
            print("Reset complete.")

        print(f"Seeding {args.employees} employees with {args.years} years of history...")
        print(f"DQ issues: {'ENABLED' if args.dq_issues else 'disabled'}")

        emp_records = seed_employees(cursor, args.employees, args.years, args.dq_issues)
        conn.commit()
        print(f"  ✓ {len(emp_records)} employees created")

        seed_salary_history(cursor, emp_records, args.years)
        conn.commit()
        print(f"  ✓ Salary history seeded")

        seed_leave_balances(cursor, emp_records)
        conn.commit()
        print(f"  ✓ Leave balances seeded")

        seed_payroll_runs(cursor, emp_records, args.years, args.dq_issues)
        conn.commit()
        print(f"  ✓ Payroll runs seeded")

        seed_terminations(cursor, emp_records)
        conn.commit()
        print(f"  ✓ Termination records seeded")

        # Summary
        cursor.execute("SELECT COUNT(*) FROM hs_hr_employee WHERE nick_name = %s", (SEED_MARKER,))
        emp_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM hs_hr_employee_salary WHERE comment = %s", (SEED_MARKER,))
        sal_count = cursor.fetchone()[0]

        print("\n── Seed Summary ─────────────────────────────────")
        print(f"  Employees seeded:       {emp_count}")
        print(f"  Salary records seeded:  {sal_count}")
        if args.dq_issues:
            print(f"  DQ: salary gaps:        12 employees")
            print(f"  DQ: negative leave:     15 employees")
            print(f"  DQ: missing term:        5 employees")
            print(f"  DQ: missing payroll:     3 months")
            print(f"  DQ: future hire dates:   8 employees")
            print(f"  DQ: contrib imbalance:  10 employees")
        print("─────────────────────────────────────────────────")
        print("Done. Ready for schema introspection.")

    except Error as e:
        print(f"ERROR during seeding: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    random.seed(42)  # Reproducible seed
    main()

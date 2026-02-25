# Phase 2 Data Generator Additions

## Purpose

Extends generate_derp_data.py with two new demo case methods and bulk data generation for Phase 2 tables. These additions follow the exact patterns established by `write_demo_case_1()` through `write_demo_case_3()`.

## Integration Point

Add these methods to the `Generator` class and call them from `main()` after the existing demo cases:

```python
# In main(), after existing demo cases:
gen.write_demo_case_5()
print("  Case 5: Maria Santos (M-100005)")
gen.write_demo_case_6()
print("  Case 6: Margaret Thompson (M-100006)")
```

---

## Demo Case 5: Maria Santos — Non-Vested Termination, Contribution Refund

```python
    def write_demo_case_5(self):
        """Case 5: Maria Santos — Tier 3, non-vested, contribution refund.
        Validates: termination processing, vesting check, contribution
        accumulation with interest, 90-day waiting period, tax withholding.
        """
        mid = "M-100005"
        self.all_ids.append(mid)
        # Note: NOT added to active_ids — she's terminated

        # MEMBER_MASTER — status 'T' for terminated
        self.write(ins("MEMBER_MASTER",
            ["MBR_ID","SSN","FIRST_NM","LAST_NM","DOB","GENDER_CD",
             "ADDR_LINE1","CITY","STATE_CD","ZIP_CD",
             "HOME_PHONE","EMAIL_ADDR","CELL_PHONE",
             "HIRE_DT","TERM_DT",
             "TIER_CD","STATUS_CD","DEPT_CD","POS_CD","ANNUAL_SALARY",
             "EMPL_CONTRIB_RT","EMPR_CONTRIB_RT","MARITAL_STATUS","VEST_DT",
             "CREATE_DT","CREATE_USER"],
            [mid,"555-45-6789","Maria","Santos",date(1990,8,10),"F",
             "2245 Champa St","Denver","CO","80205",
             "303-555-0501","msantos@denvergov.org","720-555-0501",
             date(2022,4,1),date(2026,1,31),
             3,"T","PKR","COORD2",d(60832.65),
             EMPLOYEE_CONTRIB_RATE,EMPLOYER_CONTRIB_RATE,"S",None,
             datetime.now(),"SYSTEM"]))

        # EMPLOYMENT_HIST — hire and separation
        for ev in [
            (mid,"HIRE",date(2022,4,1),None,"PKR",None,"COORD1",None,d(52000),None,"Initial hire"),
            (mid,"PROMO",date(2023,1,1),"PKR","PKR","COORD1","COORD2",d(52000),d(54080),None,"Annual increase"),
            (mid,"SEP",date(2026,1,31),"PKR",None,"COORD2",None,d(60832.65),None,"RESIGN","Voluntary resignation"),
        ]:
            self.write(ins("EMPLOYMENT_HIST",
                ["MBR_ID","EVENT_TYPE","EVENT_DT","FROM_DEPT","TO_DEPT","FROM_POS","TO_POS",
                 "FROM_SALARY","TO_SALARY","SEP_REASON","NOTES"], ev))

        # SALARY_HIST — monthly records (not biweekly for simplicity)
        # Salary schedule: 4% annual increases
        salary_schedule = {
            2022: 52000.00,
            2023: 54080.00,
            2024: 56243.20,
            2025: 58492.93,
            2026: 60832.65,
        }

        cumul_e, cumul_r = Decimal("0"), Decimal("0")
        # Employment: Apr 2022 through Jan 2026
        start = date(2022, 4, 1)
        end = date(2026, 1, 31)
        current = start
        while current <= end:
            annual = salary_schedule.get(current.year, 52000)
            monthly = d(annual / 12)
            # Last day of month as pay period end
            if current.month == 12:
                ppend = date(current.year, 12, 31)
            else:
                ppend = date(current.year, current.month + 1, 1) - timedelta(days=1)
            if ppend > end:
                ppend = end

            self.write(ins("SALARY_HIST",
                ["MBR_ID","PAY_PRD_END_DT","PAY_PRD_NBR","BASE_PAY","OT_PAY","PENS_PAY",
                 "SUPPL_PAY","LV_PAYOUT_AMT","LV_PAYOUT_TYPE","ANNL_SALARY","PROC_DT"],
                [mid, ppend, None, monthly, d(0), monthly, d(0), None, None, d(annual), ppend]))

            ec = d(monthly * EMPLOYEE_CONTRIB_RATE)
            rc = d(monthly * EMPLOYER_CONTRIB_RATE)
            cumul_e += ec; cumul_r += rc
            fy = current.year if current.month >= 7 else current.year - 1
            self.write(ins("CONTRIBUTION_HIST",
                ["MBR_ID","CONTRIB_DT","EMPL_CONTRIB","EMPR_CONTRIB","PENS_SALARY",
                 "EMPL_BAL","EMPR_BAL","INTEREST_BAL","FISCAL_YR","QTR","PROC_DT"],
                [mid, ppend, ec, rc, monthly, d(cumul_e), d(cumul_r), d(0), fy,
                 (current.month - 1) // 3 + 1, ppend]))

            # Advance to next month
            if current.month == 12:
                current = date(current.year + 1, 1, 1)
            else:
                current = date(current.year, current.month + 1, 1)

        # SVC_CREDIT — 3 years 10 months (46 months)
        self.write(ins("SVC_CREDIT",
            ["MBR_ID","SVC_TYPE","SVC_START_DT","SVC_END_DT","YEARS_CREDIT","MONTHS_CREDIT",
             "INCL_BENEFIT","INCL_ELIG","INCL_IPR","CREATE_DT","VERIFY_USER"],
            [mid,"EMPL",date(2022,4,1),date(2026,1,31),Decimal("3.83"),46,
             "Y","Y","Y",datetime.now(),"SYSTEM"]))

        # INTEREST_CREDIT — 4 compounding events at 2%
        interest_events = [
            (date(2022,6,30), Decimal("1098.51"), Decimal("0.0200"), Decimal("21.97"), Decimal("1120.48"), 2022),
            (date(2023,6,30), Decimal("5602.36"), Decimal("0.0200"), Decimal("112.05"), Decimal("5714.41"), 2023),
            (date(2024,6,30), Decimal("10375.57"), Decimal("0.0200"), Decimal("207.51"), Decimal("10583.08"), 2024),
            (date(2025,6,30), Decimal("15430.72"), Decimal("0.0200"), Decimal("308.61"), Decimal("15739.33"), 2025),
        ]
        for evt in interest_events:
            self.write(ins("INTEREST_CREDIT",
                ["MBR_ID","CREDIT_DT","BAL_BEFORE","RATE_USED","INTEREST_AMT","BAL_AFTER",
                 "FISCAL_YR","CREATE_DT"],
                [mid, evt[0], evt[1], evt[2], evt[3], evt[4], evt[5], datetime.now()]))

        # REFUND_REQUEST — application received May 5, 2026
        self.refund_id = getattr(self, 'refund_id', 0) + 1
        self.write(ins("REFUND_REQUEST",
            ["REFUND_ID","MBR_ID","REQUEST_DT","SEP_DT","WAIT_END_DT","WAIT_SATISFIED",
             "VESTED_FLG","VESTED_ACKNOWLEDGE","SPOUSE_NOTIFIED",
             "CONTRIB_TOTAL","INTEREST_TOTAL","REFUND_AMT","INTEREST_RT",
             "ELECTION_CD","ROLLOVER_INST","ROLLOVER_ACCT","ROLLOVER_AMT",
             "TAX_WITHHOLD_AMT","NET_PAYMENT_AMT",
             "STATUS_CD","APPROVED_DT","APPROVED_BY","ISSUE_DT","CHECK_NBR","ISSUE_DEADLINE",
             "DENY_REASON","CANCEL_REASON","CREATE_DT","CREATE_USER","NOTES"],
            [self.refund_id, mid, date(2026,5,5), date(2026,1,31), date(2026,5,1), "Y",
             "N", None, None,
             Decimal("17988.89"), Decimal("650.14"), Decimal("18639.03"), Decimal("0.0200"),
             "DIRECT", None, None, None,
             Decimal("3727.81"), Decimal("14911.22"),
             "ISSUED", date(2026,5,8), "ANALYST01", date(2026,6,2), "CHK-2026-0451", date(2026,8,3),
             None, None, datetime.now(), "SYSTEM",
             "Non-vested refund processed. 90-day wait satisfied."]))

        # NO beneficiary needed — single, no J&S
        # NO benefit payment — never retired


    def write_demo_case_6(self):
        """Case 6: Margaret Thompson — Retiree death, J&S 75% survivor continuation.
        Validates: death notification, benefit suspension, survivor benefit calc,
        death benefit installment continuation, overpayment detection.
        """
        mid = "M-100006"
        self.all_ids.append(mid)
        # Added to retired list conceptually — STATUS_CD = 'X' (deceased)

        # MEMBER_MASTER — deceased retiree
        self.write(ins("MEMBER_MASTER",
            ["MBR_ID","SSN","FIRST_NM","LAST_NM","DOB","GENDER_CD",
             "ADDR_LINE1","CITY","STATE_CD","ZIP_CD",
             "HOME_PHONE","EMAIL_ADDR",
             "HIRE_DT","TERM_DT",
             "TIER_CD","STATUS_CD","DEPT_CD","POS_CD","ANNUAL_SALARY",
             "EMPL_CONTRIB_RT","EMPR_CONTRIB_RT","MARITAL_STATUS","VEST_DT",
             "CREATE_DT","CREATE_USER"],
            [mid,"555-67-8901","Margaret","Thompson",date(1957,11,22),"F",
             "890 Pennsylvania St","Denver","CO","80203",
             "303-555-0601","mthompson@retired.denvergov.org",
             date(1993,8,15),date(2023,12,31),  # Term date = last day before retirement
             1,"X","LAW","PARA3",d(95000),  # Last salary before retirement
             EMPLOYEE_CONTRIB_RATE,EMPLOYER_CONTRIB_RATE,"M",date(1998,8,15),
             datetime.now(),"SYSTEM"]))

        # EMPLOYMENT_HIST
        for ev in [
            (mid,"HIRE",date(1993,8,15),None,"LAW",None,"PARA1",None,d(32000),None,"Initial hire"),
            (mid,"PROMO",date(2000,1,1),"LAW","LAW","PARA1","PARA2",d(42000),d(48000),None,"Promotion"),
            (mid,"PROMO",date(2008,1,1),"LAW","LAW","PARA2","PARA3",d(62000),d(72000),None,"Senior Paralegal"),
            (mid,"SEP",date(2023,12,31),"LAW",None,"PARA3",None,d(95000),None,"RETIRE","Service retirement"),
        ]:
            self.write(ins("EMPLOYMENT_HIST",
                ["MBR_ID","EVENT_TYPE","EVENT_DT","FROM_DEPT","TO_DEPT","FROM_POS","TO_POS",
                 "FROM_SALARY","TO_SALARY","SEP_REASON","NOTES"], ev))

        # SALARY_HIST — abbreviated: just the final 36-month window for AMS
        # (Full history would be 30+ years; we include enough for verification)
        final_salaries = {
            2021: 87000, 2022: 90000, 2023: 95000
        }
        for year, annual in final_salaries.items():
            for month in range(1, 13):
                if year == 2023 and month > 12:
                    break
                ppend = date(year, month, 28)  # Monthly records
                monthly = d(annual / 12)
                self.write(ins("SALARY_HIST",
                    ["MBR_ID","PAY_PRD_END_DT","PAY_PRD_NBR","BASE_PAY","OT_PAY","PENS_PAY",
                     "SUPPL_PAY","ANNL_SALARY","PROC_DT"],
                    [mid, ppend, None, monthly, d(0), monthly, d(0), d(annual), ppend]))

        # SVC_CREDIT — 30.375 years
        self.write(ins("SVC_CREDIT",
            ["MBR_ID","SVC_TYPE","SVC_START_DT","SVC_END_DT","YEARS_CREDIT","MONTHS_CREDIT",
             "INCL_BENEFIT","INCL_ELIG","INCL_IPR","CREATE_DT","VERIFY_USER"],
            [mid,"EMPL",date(1993,8,15),date(2023,12,31),Decimal("30.38"),364,
             "Y","Y","Y",datetime.now(),"SYSTEM"]))

        # BENEFICIARY — William Thompson (spouse, J&S beneficiary)
        self.bene_id += 1
        william_bene_id = self.bene_id
        self.write(ins("BENEFICIARY",
            ["BENE_ID","MBR_ID","BENE_FIRST_NM","BENE_LAST_NM","BENE_DOB","BENE_RELATION",
             "ALLOC_PCT","BENE_TYPE","EFF_DT","STATUS_CD","SPOUSE_CONSENT","CONSENT_DT",
             "CREATE_DT","CREATE_USER"],
            [self.bene_id, mid, "William","Thompson",date(1955,6,3),"SPOUSE",
             d(100),"P",date(1993,8,15),"A","Y",date(2023,11,15),datetime.now(),"SYSTEM"]))

        # BENEFIT_PAYMENT — retired with 75% J&S, $3,248/month
        self.write(ins("BENEFIT_PAYMENT",
            ["MBR_ID","EFF_DT","GROSS_BENEFIT","PAY_OPTION","FED_TAX_AMT","STATE_TAX_AMT",
             "NET_BENEFIT","DRO_FLG","IPR_AMT","IPR_TYPE","COLA_FLG","CALC_DT","CALC_USER",
             "CREATE_DT","STATUS_CD"],
            [mid, date(2024,1,1), d(3248.00), "75JS", d(450.00), d(100.00),
             d(2698.00), "N", d(189.84), "POST_MCARE", "N",
             date(2023,12,15), "ANALYST02", datetime.now(), "T"]))
        # Note: STATUS_CD='T' — terminated because member is deceased

        # DEATH_RECORD
        self.death_id = getattr(self, 'death_id', 0) + 1
        death_id = self.death_id
        self.write(ins("DEATH_RECORD",
            ["DEATH_ID","MBR_ID","DEATH_DT","NOTIFY_DT","NOTIFY_SOURCE",
             "CERT_RECEIVED","CERT_RECEIVED_DT","CAUSE_CD",
             "MBR_STATUS_AT_DEATH","LAST_BENEFIT_DT","LAST_BENEFIT_AMT",
             "OVERPAY_FLG","OVERPAY_AMT","OVERPAY_RECOVERED","OVERPAY_METHOD",
             "SUSPENSION_DT","STATUS_CD","CREATE_DT","CREATE_USER","NOTES"],
            [death_id, mid, date(2026,3,15), date(2026,3,20), "FAMILY",
             "Y", date(2026,3,28), "NATURAL",
             "R", date(2026,3,1), d(3248.00),
             "N", d(0), None, None,
             date(2026,3,20), "PROCESSED", datetime.now(), "SYSTEM",
             "Spouse William Thompson notified by phone. Death cert received in person."]))

        # SURVIVOR_BENEFIT — William gets 75% of $3,248 = $2,436
        self.surv_id = getattr(self, 'surv_id', 0) + 1
        self.write(ins("SURVIVOR_BENEFIT",
            ["SURV_ID","DEATH_ID","MBR_ID","SURV_MBR_ID",
             "SURV_FIRST_NM","SURV_LAST_NM","SURV_DOB","SURV_RELATION","SURV_SSN",
             "JS_OPTION","JS_PCT","MBR_BENEFIT_AT_DEATH","SURV_BENE_AMT",
             "EFF_DT","END_DT","STATUS_CD",
             "POPUP_APPLIED","POPUP_DT","POPUP_PREV_AMT","POPUP_NEW_AMT",
             "COLA_ELIGIBLE","COLA_BASE_DT",
             "CREATE_DT","CREATE_USER","NOTES"],
            [self.surv_id, death_id, mid, None,
             "William","Thompson",date(1955,6,3),"SPOUSE","555-78-9012",
             "75JS",Decimal("0.7500"),d(3248.00),d(2436.00),
             date(2026,5,1),None,"A",
             "N",None,None,None,
             "Y",date(2024,1,1),
             datetime.now(),"SYSTEM",
             "75% J&S survivor benefit. COLA eligibility based on member ret date 2024-01-01."]))

        # DEATH_BENEFIT_INSTALLMENT — 100 installments, 27 paid, 73 remaining
        self.dbi_id = getattr(self, 'dbi_id', 0) + 1
        self.write(ins("DEATH_BENEFIT_INSTALLMENT",
            ["DBI_ID","MBR_ID","DEATH_ID",
             "BENEFIT_AMT","ELECTION_TYPE","MONTHLY_AMT","TOTAL_INSTALLMENTS",
             "START_DT","INSTALLMENTS_PAID","AMT_PAID","REMAINING_AMT",
             "CURRENT_PAYEE_NM","CURRENT_PAYEE_TYPE","TRANSFER_DT",
             "STATUS_CD","CREATE_DT","CREATE_USER"],
            [self.dbi_id, mid, death_id,
             d(5000.00),"100_INST",d(50.00),100,
             date(2024,1,1),27,d(1350.00),d(3650.00),
             "William Thompson","BENEFICIARY",date(2026,3,20),
             "ACTIVE",datetime.now(),"SYSTEM"]))
```

## Bulk Data Generation for Phase 2 Tables

Add to the existing bulk generation in `main()`:

```python
# After existing bulk generation:
print("Generating Phase 2 data (refunds, deaths, survivors)...")

# Refunds for terminated members (~300 of 400 terminated)
f.write("\n-- ═══ REFUND DATA ═══\n\n")
gen.write_bulk_refunds(300)

# Death records for deceased members (~700 of 800)
f.write("\n-- ═══ DEATH/SURVIVOR DATA ═══\n\n")
gen.write_bulk_deaths(700)

# Interest credits for all members
f.write("\n-- ═══ INTEREST CREDITS ═══\n\n")
gen.write_bulk_interest_credits()

# Phase 2 data quality issues
gen.write_phase2_quality_issues()
```

### Bulk Generation Methods

```python
    def write_bulk_refunds(self, count):
        """Generate refund records for terminated members."""
        terminated = [m for m in self.all_ids
                      if m.startswith("M-") and m not in
                      ["M-100001","M-100002","M-100003","M-100005","M-100006"]]
        # Pick `count` terminated members (those with STATUS_CD='T')
        # For each, generate:
        #   - INTEREST_CREDIT records (1 per year of employment)
        #   - REFUND_REQUEST with realistic amounts
        # ~80% DIRECT, ~15% ROLLOVER, ~5% LEAVE_IN_TRUST
        # ~90% ISSUED, ~5% PENDING, ~5% CANCELLED
        refund_count = 0
        for mid in random.sample(terminated, min(count, len(terminated))):
            self.refund_id += 1
            # Generate realistic contribution/interest amounts based on
            # member's hire/term dates and salary
            # ... (implementation follows same patterns as bulk member generation)
            refund_count += 1

    def write_bulk_deaths(self, count):
        """Generate death records for deceased members."""
        # Pick members with STATUS_CD='X' (or 'R'/'T' with injected DQ issues)
        # For each:
        #   - DEATH_RECORD
        #   - SURVIVOR_BENEFIT if J&S election (60% of retiree deaths)
        #   - DEATH_BENEFIT_INSTALLMENT tracking
        # ~70% PROCESSED, ~20% CLOSED, ~10% PENDING
        # Overpayment: ~15% have overpayment (delayed notification)
        pass

    def write_bulk_interest_credits(self):
        """Generate INTEREST_CREDIT records for all active/terminated members."""
        # One record per June 30 during employment
        # Rate varies by year: 2020-2022: 1%, 2023-2024: 2%, 2025: 2%
        pass

    def write_phase2_quality_issues(self):
        """Inject deliberate data quality problems in Phase 2 tables."""
        # DQ-REFUND-01: wait_satisfied='Y' but dates don't match (~5)
        # DQ-DEATH-01: notify_dt < death_dt (~3)
        # DQ-DEATH-02: member status still 'R' not 'X' (~8)
        # DQ-SURV-01: survivor amount != member_benefit * js_pct (~4)
        # DQ-DBI-01: remaining_amt drift (~6)
        # DQ-REEMPL-01: service restored without repayment (~2)
        pass
```

## Notes for Claude Code

1. **Demo case amounts must match hand calculations exactly.** The interest credits, contribution totals, and refund amounts for Cases 5 and 6 come from case5-maria-santos-calculation.md and case6-margaret-thompson-calculation.md. Verify to the penny.

2. **Bulk generation methods are sketched, not complete.** Claude Code should implement them following the same patterns as `write_bulk_member()` — realistic distributions, appropriate randomization, consistent with plan provisions.

3. **New counter attributes** (`refund_id`, `death_id`, `surv_id`, `dbi_id`) follow the same pattern as `self.bene_id` and `self.dro_id` in the existing code.

4. **Case 6 salary history is abbreviated.** Only 3 years shown (the AMS window). Full 30-year history would follow the same pattern as Case 1 but is unnecessary for the demo — the retirement calculation is pre-computed.

5. **STATUS_CD for Margaret is 'X'** (deceased), which is a status added late to the legacy system. Per the existing schema notes, some deceased members still show 'R' or 'T' — this is one of the data quality issues the system should detect.

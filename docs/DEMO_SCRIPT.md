# NoUI DERP POC — Demo Script

**Target Duration:** 25 minutes + Q&A
**Presenter:** Jeff
**Audience:** DERP Leadership, IT Staff, Board Members
**Date:** February 2026

---

## Pre-Demo Checklist

- [ ] Browser open to `http://localhost:5175/` (Portal Switcher)
- [ ] Second tab open to `http://localhost:5175/demo` (Demo Landing — backup entry point)
- [ ] Browser zoom at 100%, window maximized
- [ ] Chrome or Firefox (tested in both; Safari also works)
- [ ] All demo data is client-side — no database, no backend services, no network required
- [ ] Verify Case 1 loads: navigate to `/staff/case/10001/guided` and confirm member banner renders

---

## Opening (2 minutes)

**[Show Portal Switcher page — `/`]**

> "Good morning. What you are looking at is a proof of concept we built specifically for DERP. It is called NoUI — and the name reflects the core idea: the system composes the right workspace for each situation, rather than making staff navigate through fixed screens."

> "Before I show you anything, I want to set one expectation clearly. **Every calculation you see today comes from a deterministic rules engine executing certified plan provisions from the Revised Municipal Code.** AI composes the workspace — it decides what to show and when. The rules engine calculates the numbers. AI never touches the money."

> "We are going to walk through four portals — staff, member, employer, and vendor — across three process types: retirement applications, contribution refunds, and death and survivor benefits. We configured 52 business rules, all traced to RMC sections 18-391 through 18-430.7. Every rule, every formula, every number on screen is transparent and verifiable."

**Transition:** Click the "Staff Portal" card.

---

## Act 1: Staff Retirement Workspace (8 minutes)

### Case 1: Robert Martinez — Tier 1, Rule of 75 (4 min)

**[Staff Welcome Screen — `/staff`]**

> "This is the staff workspace. The system presents three process types: retirement applications, contribution refunds, and death and survivor benefits. Staff see exactly the cases in their queue."

**Click the Guided mode toggle, then click Case 1 (Robert Martinez).**

**[Guided Workspace — `/staff/case/10001/guided`]**

> "Robert Martinez. Tier 1 member, hired June 1997. The system immediately shows his tier, department, and service years in the banner. It composed this workspace specifically for his situation."

**Point to the member banner.**

> "Notice the tier badge — Tier 1, blue. That classification comes from his hire date: before September 1, 2004. The rules engine made that determination, not AI."

**Walk through the stages using the stage navigation.**

> "The guided workspace walks the analyst through stages. At each stage, the system shows what needs to be verified and provides the governing document citation."

**Navigate to the benefit calculation stage.**

> "Here is where trust is built. Look at this calculation panel."

**Point to the AMS calculation.**

> "Average Monthly Salary: the system found his highest 36 consecutive months — that is the Tier 1 AMS window. It shows which months it selected, the salary for each period, and the final average. An analyst can verify every input against the payroll records."

**Point to the benefit formula.**

> "The formula: AMS times the multiplier — 2.0% for Tier 1 — times years of service. Robert has 28 years and 9 months. He qualifies under the Rule of 75 because his age plus service exceeds 75. No reduction. The system shows the Rule of 75 calculation: age 62.98 plus 28.75 years equals 91.73."

> "And his leave payout — $52,000 in sick and vacation leave added to his final month of salary because he was hired before January 1, 2010. The system knows that leave payout eligibility depends on hire date, and it shows exactly how that payout affects the AMS."

**Navigate to payment options.**

> "Four payment options with reduction factors. Single life, 100% joint-and-survivor, 75%, and 50%. Each option shows the actuarial reduction factor and the resulting monthly benefit. Robert's spouse Elena is listed as the joint-and-survivor beneficiary."

> "Every number traces back to a specific RMC section. This is not a black box."

### Case 2: Jennifer Kim — Tier 2, Early Retirement (2 min)

**Click back to Staff Welcome, select Case 2.**

**[Guided Workspace — `/staff/case/10002/guided`]**

> "Jennifer Kim. Tier 2, hired March 2008. She is taking early retirement at age 55 — ten years before the normal retirement age of 65."

**Point to the reduction factor.**

> "Here is a critical distinction. The early retirement reduction for Tiers 1 and 2 is 3% per year under age 65. Jennifer is 55, so she gets a 30% reduction — ten years times 3%. Not 6%. That 3% versus 6% distinction is directly from the Active Member Handbook page 17 and RMC section 18-409(b)."

**Point to the service credit panel.**

> "Jennifer purchased 3 years of service credit. Watch carefully: purchased service counts toward her benefit calculation — it increases the multiplied years of service. But it does NOT count toward the Rule of 75. Her earned service is 18 years and 2 months. With the purchase, her total for the benefit formula is 21 years and 2 months. But her Rule of 75 check uses only earned service: age 55.86 plus 18.17 equals 74.03. She is 11 months short of the Rule of 75."

> "That distinction — purchased service included in the benefit but excluded from eligibility rules — is one of the most commonly misunderstood provisions. The system enforces it correctly and shows the analyst exactly how."

### Case 3: David Washington — Tier 3 (2 min)

**Click back to Staff Welcome, select Case 3.**

**[Guided Workspace — `/staff/case/10003/guided`]**

> "David Washington. Tier 3 — hired after July 1, 2011. Three key differences jump out immediately."

**Point to AMS window.**

> "First: the AMS window is 60 consecutive months, not 36. The system automatically applied the correct window for his tier."

**Point to reduction factor.**

> "Second: the early retirement reduction is 6% per year for Tier 3, not 3%. David is 63, so he gets a 12% reduction — two years times 6%."

**Point to the Rule of 85 check.**

> "Third: Tier 3 uses Rule of 85 with a minimum age of 60, not Rule of 75 with minimum 55. Different threshold, same transparency."

> "The system adapts the workspace to the member's tier. Staff do not need to remember which rules apply to which tier — the workspace shows exactly what applies, with the citations."

**Transition:** "Those are three of our four retirement cases. The fourth — Case 4 — adds a Domestic Relations Order, which splits the benefit between the member and an alternate payee. We can come back to that in Q&A if you are interested."

---

## Act 2: Multi-Process Demonstration (4 minutes)

### Contribution Refund (2 min)

**Navigate back to Staff Welcome or use the `/demo` landing page. Click refund case (Maria Santos — Case 7).**

**[Refund Workspace — `/staff/refund/10007`]**

> "Not every member retires. When a non-vested member separates, they are entitled to a refund of their contributions. This is a different process type, but the same platform and the same transparency principles."

> "Maria Santos — Tier 2, 3.83 years of service, not vested. The system composed a refund workspace with six stages: notification, separation verification, contribution calculation, interest computation, tax withholding options, and disbursement."

**Point to the contribution calculation.**

> "The contribution total, the interest calculation, the gross refund amount — all shown with full formula transparency. The interest compounds monthly. The system shows the compounding schedule."

**Point to the tax withholding section.**

> "Rollover options: direct rollover to an IRA or 401(k) with no withholding, or cash distribution with mandatory 20% federal withholding. The system presents both options with the tax implications."

### Death and Survivor Benefits (2 min)

**Navigate back, click a death case (Margaret Thompson — Case 9).**

**[Death Workspace — `/staff/death/10009`]**

> "Margaret Thompson was a retired Tier 1 member who elected the 75% joint-and-survivor option. When we process a death notification, the system composes a completely different workspace — death notification, survivor identification, benefit calculation, overpayment review, and continuation processing."

**Point to the survivor benefit calculation.**

> "The survivor benefit: 75% of Margaret's monthly benefit continues to her designated survivor. The system shows the original benefit, the J&S reduction factor that was applied at retirement, and the resulting survivor amount — $2,436 per month."

> "Same platform. Same transparency. Different process type. The workspace adapts to the situation."

---

## Act 3: Member Portal (3 minutes)

**Navigate to Portal Switcher (`/`), click "Member Portal." Or go directly to `/portal`.**

**[Member Dashboard — `/portal`]**

> "Now let us shift perspectives. This is MyDERP — the member-facing portal. What you saw from the staff side, the member sees from their side."

> "The member dashboard shows their tier, their estimated benefit, their service years — the same data the staff workspace uses, presented for the member's context."

**Click to start an application or navigate to the application wizard.**

> "The retirement application wizard walks the member through seven steps: personal information verification, beneficiary designation, retirement date selection, benefit estimate review, document upload, election of payment option, and submission."

**Point to the benefit estimate within the wizard.**

> "The member sees the same calculation the staff workspace shows. Same formula, same inputs, same result. There is no separate member calculation — the rules engine produces one answer."

> "The member portal never calculates benefits. It reads from the same rules engine output. This is a governing principle: the portal presents, but the rules engine determines."

**Point to document requirements.**

> "Document requirements are generated based on the member's situation. A member with a DRO sees the DRO documentation requirement. A member without one does not. The workspace adapts."

---

## Act 4: Employer Portal (2 minutes)

**Navigate to `/employer`.**

**[Employer Dashboard — `/employer`]**

> "The employer portal serves department HR coordinators. Their view of the system is their workforce and their contribution obligations."

**Point to the stats cards.**

> "Active employees, pending retirements, contribution reporting status. This is the department's view of their relationship with DERP."

**Navigate to Employee Roster (`/employer/roster`).**

> "The employee roster shows tier distribution, years of service, and eligibility proximity. An HR coordinator can see who in their department is approaching retirement eligibility."

**Navigate to Contribution Reporting (`/employer/contributions`).**

> "Contribution reports with discrepancy highlighting. If a department's reported salary does not match the contribution amount at the 8.45% employee rate or 17.95% employer rate, the system flags it. The discrepancy is presented for review — not auto-corrected."

**Navigate to Retirement Coordination (`/employer/retirements`).**

> "Pending retirements with document completeness tracking. The department sees which separating employees have outstanding paperwork."

---

## Act 5: Vendor Portal (2 minutes)

**Navigate to `/vendor`.**

**[Vendor Dashboard — `/vendor`]**

> "The vendor portal serves insurance carriers — Kaiser, Delta Dental, and other benefit providers. When a member retires, their insurance enrollment needs to transition."

**Point to the enrollment queue.**

> "The enrollment queue shows new retirees and coverage changes. Each entry has the member's Insurance Premium Reimbursement — IPR — amount."

**Click into a member detail (e.g., Case 2 — Jennifer Kim).**

**[Vendor Member Detail — `/vendor/member/10002`]**

> "Here is where a critical rule applies. Jennifer Kim purchased 3 years of service credit. For benefit calculation, those 3 years count. But for the IPR calculation, purchased service is excluded. The system uses only her 18.17 earned years."

> "The vendor sees the IPR amount, the formula, and the explicit note that purchased service was excluded per RMC section 18-412. The vendor does not need to know the rule — the system enforces it and explains why."

---

## Act 6: Platform Intelligence (3 minutes)

### Data Quality Dashboard (1 min)

**Navigate to `/demos/data-quality`.**

> "When we connected to the DERP database, the system ran six types of data quality detectors across the member population. It found 45 findings — tier classification mismatches, salary gaps, contribution balance discrepancies, beneficiary allocation errors."

**Point to a finding.**

> "Each finding shows the severity, the affected member, what was detected, and a proposed correction. The key word is 'proposed.' In Phase 1, every correction awaits human review. The system identifies; humans decide."

### Population Analysis (1 min)

**Navigate to `/demos/operational`.**

> "The operational dashboard shows processing analytics — how many retirements are projected in the next 12 months, caseload distribution, processing time patterns. This is AI learning from transaction patterns to inform operational planning. It is not making decisions — it is providing visibility."

### Knowledge Assistant (1 min)

**Navigate to `/demos/knowledge-assistant`.**

> "The Knowledge Assistant is a plan provision search tool. Staff type a question — 'What is the early retirement reduction for Tier 2?' — and the system returns the answer with the exact RMC citation. It searches the configured rule definitions, not the internet. Every answer is traceable to a governing document section."

> "This is AI in its proper role: accelerating access to information, not replacing human judgment."

---

## Closing (1 minute)

**Navigate back to Portal Switcher (`/`).**

> "Let me summarize what you have seen."

> "Four portals — staff, member, employer, vendor — each showing the same underlying data from the perspective that matters to that user."

> "Three process types — retirement applications, contribution refunds, death and survivor benefits — each with a workspace composed specifically for that process."

> "52 business rules, all traceable to the Revised Municipal Code. Every calculation shows its formula, its inputs, its intermediate steps, and its result."

> "The system earns trust by showing its work, not by automating approvals. AI composes the workspace. The rules engine determines the numbers. Humans verify and certify."

> "Questions?"

---

## Anticipated Questions

### "Does the AI calculate benefits?"

> **No.** The deterministic rules engine calculates all benefits. The rules engine is conventional code implementing certified plan provisions from the Revised Municipal Code. AI composes the workspace — it decides which panels to show based on the member's tier, retirement type, and situation. AI never executes business rules, never determines dollar amounts, and never makes eligibility decisions.

### "How do you handle rule changes?"

> Rule changes follow a full software development lifecycle. When the board passes an amendment or a statute changes, AI reads the governing document and drafts proposed rule configuration changes. Human subject matter experts review the draft against the actual document language. The system generates regression tests from the reviewed definitions. The full test suite executes — any failures are defects, never auto-resolved. A human certifies the complete package: rules, tests, and results. Approved changes deploy on their effective date, and prior rules are preserved for historical accuracy.

### "What about edge cases?"

> We have 52 business rules with RMC citations, each tested at the boundary: at the threshold, one below, and one above. The four demo cases were hand-calculated and verified to the penny against the rules engine output. Edge cases like purchased service exclusion from eligibility rules, leave payout eligibility based on hire date, and tier-specific reduction rates are all explicitly tested.

### "How long to implement?"

> The POC demonstrates the architecture and proves the calculation accuracy. A production implementation would scale this pattern: connect to the actual DERP database, certify all 52 rules with DERP staff, build the remaining process types (retiree payroll, annual adjustments), and deploy with proper security and audit controls. The architecture is designed to be incrementally adoptable — you do not replace the legacy system overnight.

### "What about data quality?"

> The system includes six types of data quality detectors that ran across the connected database. It found 45 findings: tier classification mismatches where the hire date does not match the assigned tier, salary gaps with missing pay periods, contribution balance discrepancies from rounding errors, and beneficiary allocation errors where percentages do not total 100%. Each finding is presented as a proposed correction awaiting human review. The system detects; staff decide.

### "Is this cloud or on-prem?"

> The architecture is Kubernetes-based and deployable either way — cloud, on-premises, or hybrid. Services communicate via standard HTTP APIs. The frontend is a static React application that can be served from any web server. The database connection is a standard PostgreSQL driver. There are no cloud-vendor-specific dependencies.

### "What about security and access control?"

> The POC demonstrates role-based portal separation: staff see staff workspaces, members see member workspaces, employers see department-scoped data, vendors see enrollment-scoped data. In production, this maps to your existing identity provider with role-based access control, audit logging of every data access, and encryption in transit and at rest. The architecture supports it; the POC demonstrates the functional separation.

### "How does this compare to what we have today?"

> Today, staff navigate multiple screens, manually look up which rules apply to each tier, and perform calculations in spreadsheets or on paper. This system composes the right workspace for each case — the analyst sees exactly what they need, with the governing document citations inline. The calculations are automated but transparent: every formula shows its work. Staff spend less time navigating and more time verifying.

### "Can the member portal handle all application types?"

> The POC demonstrates the retirement application wizard. The architecture supports any process type: refund applications, survivor benefit claims, service purchase requests. Each process type gets its own wizard flow, its own document requirements, and its own status tracking — all composed from the same underlying data and rules engine.

### "What if the system gets a calculation wrong?"

> Every calculation shows its formula, inputs, and result. Staff verify against their own records and governing documents. If a calculation does not match, the discrepancy is visible — the system's transparency makes errors detectable. In the POC, all four demo cases match hand-calculated expected results to the penny. In production, regression tests run against every rule change to prevent calculation drift.

---

## Demo Flow Quick Reference

| Time | Act | Route | Key Message |
|------|-----|-------|-------------|
| 0:00 | Opening | `/` | AI composes; rules engine calculates |
| 2:00 | Case 1 — Martinez | `/staff/case/10001/guided` | Rule of 75, leave payout, full formula transparency |
| 6:00 | Case 2 — Kim | `/staff/case/10002/guided` | Purchased service excluded from Rule of 75 |
| 8:00 | Case 3 — Washington | `/staff/case/10003/guided` | Tier 3 differences: 60-mo AMS, 6% reduction, Rule of 85 |
| 10:00 | Refund — Santos | `/staff/refund/10007` | Same platform, different process |
| 12:00 | Death — Thompson | `/staff/death/10009` | Workspace adapts to process type |
| 14:00 | Member Portal | `/portal` | Same data, member perspective |
| 17:00 | Employer Portal | `/employer` | Department workforce view |
| 19:00 | Vendor Portal | `/vendor/member/10002` | IPR excludes purchased service |
| 21:00 | Data Quality | `/demos/data-quality` | Detection, not auto-correction |
| 22:00 | Population Analysis | `/demos/operational` | AI learns patterns, informs operations |
| 23:00 | Knowledge Assistant | `/demos/knowledge-assistant` | AI accelerates information access |
| 24:00 | Closing | `/` | Trust through transparency |

---

## Key Phrases to Use

- "The rules engine is configured with certified plan provisions."
- "AI composes the workspace to show the right information for each situation."
- "Every calculation shows its formula, inputs, and result."
- "The system earns trust by showing its work, not by automating approvals."
- "Proposed correction — awaiting human review."
- "52 business rules, all traced to the Revised Municipal Code."
- "The system detects and presents. Humans verify and certify."

## Phrases to Avoid

- ~~"Self-healing"~~ — Say "AI-accelerated change management"
- ~~"Auto-resolved"~~ — Say "Proposed correction awaiting review"
- ~~"AI calculated the benefit"~~ — Say "The rules engine calculated the benefit"
- ~~"The system automatically corrects..."~~ — Say "The system identifies and presents for review"
- ~~"The AI knows your rules"~~ — Say "The rules engine is configured with your plan provisions"

"""DERP-specific system prompt for the AI composition engine."""

from __future__ import annotations

from ..schemas import ALL_PANELS, ALL_ALERTS, ALL_DATA_FETCHES


def build_system_prompt(few_shot_examples: list[dict] | None = None) -> str:
    """Build the full system prompt with optional few-shot examples.

    Returns the complete prompt string. Few-shot examples are appended
    after the rules section for in-context learning.
    """
    parts = [ROLE_SECTION, PANEL_CATALOG, ALERT_CATALOG, DATA_FETCH_CATALOG, DERIVATION_LOGIC, VIEW_MODE_RULES]

    if few_shot_examples:
        parts.append(_format_few_shots(few_shot_examples))

    parts.append(CLOSING_INSTRUCTIONS)
    return "\n\n".join(parts)


# ---------------------------------------------------------------------------
# Prompt sections
# ---------------------------------------------------------------------------

ROLE_SECTION = """\
You are the composition engine for a pension administration workspace.

Given a member profile, CRM context, and eligibility snapshot, you decide:
1. Which view mode to use (workspace or crm)
2. Which panels to show and which to hide
3. Which alerts to trigger
4. Which data fetches are needed

You must call the compose_workspace tool with your decisions. Every panel \
must appear in either panels_shown or panels_hidden — never omit a panel.\
"""

PANEL_CATALOG = """\
## Panel Catalog (12 panels)

Each panel has specific show/hide conditions:

1. **member_banner** — Always shown when member data is available (has_member = true).

2. **service_credit_summary** — Shown when has_member AND earned_service_years > 0.

3. **benefit_calculation** — Shown when has_calculation = true.
   has_calculation requires ALL of: has_member, vested, AND status in (active, retired, deferred).

4. **payment_options** — Shown when has_calculation = true.

5. **dro_impact** — Shown when has_dro AND has_calculation.
   Both conditions must be met.

6. **scenario_modeler** — Shown when best_eligible_type == "EARLY" AND has_calculation.
   Any member with has_calculation=true AND best_eligible_type="EARLY" gets this panel,
   regardless of contact_type, view_mode, or other factors. Check both conditions explicitly.

7. **death_benefit** — Shown when has_calculation = true.

8. **ipr_calculator** — Shown when has_calculation = true.

9. **employment_timeline** — Shown when has_employment_history == true AND employment_event_count > 0.
   CRITICAL: This panel depends ONLY on the employment data fields in the member profile. It does
   NOT depend on has_member, has_calculation, contact_type, or view_mode. Even when has_member is
   false (e.g., external contact without legacy_member_id), if the profile says
   has_employment_history=true and employment_event_count > 0, show this panel.

10. **case_journal** — Shown when view_mode == "crm" OR open_conversations > 0.
    CRITICAL: When view_mode is "crm" (i.e., contact_type is beneficiary, alternate_payee, or external),
    case_journal is ALWAYS shown — even if open_conversations is 0. The OR means either condition alone
    is sufficient. HOWEVER, when view_mode is "workspace" AND open_conversations is 0, case_journal
    is HIDDEN. Both conditions must be false to hide it.

11. **ai_summary** — Shown when case_journal is visible AND employment_timeline is visible.
    Requires BOTH: journal visible (case_journal shown) AND timeline data (has_employment_history AND employment_event_count > 0).

12. **crm_note_form** — Shown when case_journal is visible.
    Always accompanies the case journal.\
"""

ALERT_CATALOG = """\
## Alert Catalog (14 alerts)

CRITICAL INSTRUCTION: For every alert, you MUST read the actual field value from the scenario data \
and verify the condition is met BEFORE including it. Most scenarios will only trigger 1-3 alerts. \
If a field value does not match the trigger condition, do NOT include that alert. \
Err on the side of NOT firing an alert rather than including one you're unsure about.

### Member-related alerts (ONLY fire when has_member = true — skip ALL of these if has_member is false):
IMPORTANT: First derive has_member. has_member is ONLY true when contact_type == "member" OR
has_legacy_member_id == true. If contact_type is "external", "beneficiary", or "alternate_payee"
AND has_legacy_member_id is false, then has_member is FALSE — do NOT fire ANY of these 9 alerts.
NOTE: When has_member IS true, these alerts fire regardless of status. A terminated member still
has has_member=true, so alerts like spousal_consent, medicare_ipr, etc. still apply.

1. **spousal_consent_required** — ONLY if marital_status is exactly "M" (married). The letter "M"
   means married. Do NOT fire for "S" (single), "D" (divorced), or "W" (widowed).
   "D" = divorced = NOT married = do NOT fire. "S" = single = NOT married = do NOT fire.
2. **early_retirement_reduction** — reduction_applies == true. If reduction_applies is false, do NOT fire.
3. **leave_payout_ams_boost** — BOTH leave_payout_eligible == true AND leave_payout_ams_impact > 0 must be true.
4. **purchased_service_warning** — has_purchased_service == true. If false, do NOT fire.
5. **dro_deduction_active** — has_dro == true. If false, do NOT fire.
6. **not_vested** — ONLY if vested == false. If vested is true, do NOT fire. \
   Most members ARE vested, so this alert is rare.
7. **medicare_ipr_highlight** — medicare_flag == "Y". If medicare_flag is "N", do NOT fire. \
   Fires for ANY member with medicare_flag "Y", regardless of status.
8. **waiting_increases_benefit** — Requires BOTH conditions: best_eligible_type == "EARLY" AND \
   rule_of_n_met == false. If rule_of_n_met is true, do NOT fire even if type is EARLY. \
   If best_eligible_type is NORMAL or NOT_ELIGIBLE, do NOT fire.
9. **rule_of_n_near_threshold** — rule_of_n_near == true. If false, do NOT fire.

### CRM alerts (apply regardless of has_member — but you MUST check each field's actual value):
CRITICAL: These alerts have HIGH false-positive rates. For each one, locate the exact field value \
in the input data and verify the condition. Do NOT fire based on assumptions.

10. **security_flag_warning** — ONLY if security_flag is not null (has an actual value like "fraud_alert"). \
    If security_flag is null or "None", do NOT fire.
11. **overdue_commitments** — ONLY if overdue_commitments > 0. If overdue_commitments is 0, do NOT fire.
12. **sla_breach** — ONLY if sla_breached == true. If sla_breached is false or False, do NOT fire.
13. **identity_not_verified** — ONLY if identity_verified == false. If identity_verified is true or True, \
    do NOT fire. Most contacts ARE verified, so this alert is uncommon.
14. **urgent_note_flag** — ONLY if has_urgent_notes == true. If false, do NOT fire.\
"""

DATA_FETCH_CATALOG = """\
## Data Fetch Catalog (11 fetch types)

Fetch data based on what panels are shown:

- **member_data** — Fetch when has_member (member_banner or any member panel shown).
- **service_credit** — Fetch when service_credit_summary is shown.
- **benefit_calculation** — Fetch when benefit_calculation panel is shown.
- **employment_history** — Fetch when employment_timeline is shown.
- **payment_options** — Fetch when payment_options panel is shown.
- **scenario_projection** — Fetch when scenario_modeler is shown.
- **crm_contact** — Fetch when case_journal is shown.
- **crm_conversations** — Fetch when case_journal is shown.
- **crm_commitments** — Fetch when case_journal is shown.
- **crm_interactions** — Fetch when case_journal is shown.
- **crm_outreach** — Fetch when case_journal is shown OR view_mode == "crm".\
"""

DERIVATION_LOGIC = """\
## Key Derivation Logic

These intermediate values drive panel and alert decisions:

**has_member** = (contact_type == "member") OR (has_legacy_member_id == true)
  → If either condition is met, member data is available.

**has_calculation** = has_member AND vested AND status in ("active", "retired", "deferred")
  → Terminated members NEVER have calculations, even if vested.
  → Non-vested members NEVER have calculations.

**journal_visible** = (view_mode == "crm") OR (open_conversations > 0)
  → The case journal shows for CRM views OR when there are open conversations.

**has_timeline** = has_employment_history AND employment_event_count > 0
  → Employment data exists with at least one event.\
"""

VIEW_MODE_RULES = """\
## View Mode Rules

- contact_type == "beneficiary" → view_mode = "crm"
- contact_type == "alternate_payee" → view_mode = "crm"
- contact_type == "external" → view_mode = "crm"
- contact_type == "member" → view_mode = "workspace"

Only the contact_type field determines view mode.\
"""

CLOSING_INSTRUCTIONS = """\
## Instructions

Follow this exact process:

1. **Derive intermediate values** from the input data:
   - has_member = (contact_type == "member") OR (has_legacy_member_id == true)
   - has_calculation = has_member AND vested AND status in (active, retired, deferred)
   - journal_visible = (view_mode == "crm") OR (open_conversations > 0)
   - has_timeline = has_employment_history AND employment_event_count > 0

2. **Determine panels**: Apply each panel's show/hide condition using the derived values.
   Every panel must appear in either panels_shown or panels_hidden.

3. **Determine alerts**: For EACH alert, find the specific field value in the input and verify \
   the trigger condition is met. Do NOT include any alert unless you have confirmed the field \
   value matches. When in doubt, do NOT fire the alert.

4. **Determine data fetches**: Match fetches to shown panels.

Call the compose_workspace tool with your complete composition decision. \
Include a brief rationale for each panel decision.\
"""


def _format_few_shots(examples: list[dict]) -> str:
    """Format few-shot examples for the prompt."""
    lines = ["## Examples\n"]
    for i, ex in enumerate(examples, 1):
        lines.append(f"### Example {i}")
        if "description" in ex:
            lines.append(f"**Scenario**: {ex['description']}")

        # Input
        lines.append(f"**Input**: {_summarize_input(ex.get('input', {}))}")

        # Expected output
        out = ex.get("output", {})
        lines.append(f"**view_mode**: {out.get('view_mode', '?')}")
        lines.append(f"**panels_shown**: {out.get('panels_shown', [])}")
        lines.append(f"**panels_hidden**: {out.get('panels_hidden', [])}")
        lines.append(f"**alerts**: {out.get('alerts', [])}")
        lines.append(f"**data_fetches**: {out.get('data_fetches', [])}")

        if "note" in ex:
            lines.append(f"**Key insight**: {ex['note']}")
        lines.append("")

    return "\n".join(lines)


def _summarize_input(inp: dict) -> str:
    """Create a concise summary of scenario input for few-shot display."""
    parts = []
    if "member_profile" in inp:
        p = inp["member_profile"]
        parts.append(
            f"Tier {p.get('tier')}, {p.get('status')}, "
            f"age {p.get('age_at_retirement')}, "
            f"earned {p.get('earned_service_years')}yr, "
            f"vested={p.get('vested')}"
        )
    if "crm_context" in inp:
        c = inp["crm_context"]
        parts.append(
            f"contact={c.get('contact_type')}, "
            f"legacy_id={c.get('has_legacy_member_id')}, "
            f"convos={c.get('open_conversations')}"
        )
    if "eligibility_snapshot" in inp:
        e = inp["eligibility_snapshot"]
        parts.append(f"elig={e.get('best_eligible_type')}, rule_of_n_met={e.get('rule_of_n_met')}")
    return " | ".join(parts) if parts else str(inp)


def format_scenario_for_prompt(scenario_dict: dict) -> str:
    """Format a scenario's input data as the user message for the API call."""
    profile = scenario_dict["member_profile"]
    crm = scenario_dict["crm_context"]
    elig = scenario_dict["eligibility_snapshot"]

    return f"""\
Compose the workspace for this scenario:

## Member Profile
- Tier: {profile['tier']}
- Status: {profile['status']}
- Gender: {profile['gender']}
- Marital status: {profile['marital_status']}
- Age at retirement: {profile['age_at_retirement']}
- Earned service years: {profile['earned_service_years']}
- Has purchased service: {profile['has_purchased_service']} (purchased_years: {profile['purchased_years']})
- Has military service: {profile['has_military_service']} (military_years: {profile['military_years']})
- Has DRO: {profile['has_dro']} (dro_division_pct: {profile['dro_division_pct']})
- Leave payout eligible: {profile['leave_payout_eligible']} (amount: {profile['leave_payout_amount']})
- Medicare flag: {profile['medicare_flag']}
- Has employment history: {profile['has_employment_history']} (event_count: {profile['employment_event_count']})
- Vested: {profile['vested']}
- Total service years: {profile['total_service_years']}
- Eligibility years: {profile['eligibility_years']}

## CRM Context
- Contact type: {crm['contact_type']}
- Identity verified: {crm['identity_verified']}
- Security flag: {crm['security_flag']}
- Has legacy member ID: {crm['has_legacy_member_id']}
- Open conversations: {crm['open_conversations']}
- Pending commitments: {crm['pending_commitments']}
- Overdue commitments: {crm['overdue_commitments']}
- SLA breached: {crm['sla_breached']}
- Has urgent notes: {crm['has_urgent_notes']}

## Eligibility Snapshot
- Best eligible type: {elig['best_eligible_type']}
- Rule of N sum: {elig['rule_of_n_sum']}
- Rule of N target: {elig['rule_of_n_target']}
- Rule of N met: {elig['rule_of_n_met']}
- Reduction applies: {elig['reduction_applies']}
- Reduction pct: {elig['reduction_pct']}
- Vested: {elig['vested']}
- Leave payout AMS impact: {elig['leave_payout_ams_impact']}
- Rule of N near: {elig['rule_of_n_near']}"""

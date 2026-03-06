"""Curated and auto-selected few-shot examples for the compose prompt."""

from __future__ import annotations

import json
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..schemas import Scenario, ScenarioResult


# ---------------------------------------------------------------------------
# Curated seed examples covering key decision boundaries
# ---------------------------------------------------------------------------
CURATED_EXAMPLES: list[dict] = [
    {
        "description": "Active vested member, workspace view, no CRM activity",
        "input": {
            "member_profile": {
                "tier": 1, "status": "active", "vested": True,
                "earned_service_years": 25.0, "has_dro": False,
                "has_employment_history": True, "employment_event_count": 3,
                "marital_status": "M", "has_purchased_service": False,
                "leave_payout_eligible": True, "leave_payout_amount": 40000,
                "medicare_flag": "Y",
            },
            "crm_context": {
                "contact_type": "member", "has_legacy_member_id": True,
                "open_conversations": 0, "identity_verified": True,
                "security_flag": None, "overdue_commitments": 0,
                "sla_breached": False, "has_urgent_notes": False,
            },
            "eligibility_snapshot": {
                "best_eligible_type": "EARLY", "rule_of_n_met": True,
                "reduction_applies": False, "vested": True,
                "leave_payout_ams_impact": 1111.11, "rule_of_n_near": False,
            },
        },
        "output": {
            "view_mode": "workspace",
            "panels_shown": [
                "member_banner", "service_credit_summary", "benefit_calculation",
                "payment_options", "scenario_modeler", "death_benefit",
                "ipr_calculator", "employment_timeline",
            ],
            "panels_hidden": [
                "dro_impact", "case_journal", "ai_summary", "crm_note_form",
            ],
            "alerts": [
                "spousal_consent_required", "leave_payout_ams_boost",
                "medicare_ipr_highlight",
            ],
            "data_fetches": [
                "member_data", "service_credit", "benefit_calculation",
                "payment_options", "scenario_projection", "employment_history",
            ],
        },
        "note": "Workspace view because contact_type=member. "
                "case_journal hidden because open_conversations=0 and view_mode=workspace. "
                "scenario_modeler shown because best_eligible_type=EARLY.",
    },
    {
        "description": "Beneficiary contact with legacy member ID — CRM view with member panels",
        "input": {
            "member_profile": {
                "tier": 2, "status": "retired", "vested": True,
                "earned_service_years": 20.0, "has_dro": True,
                "has_employment_history": True, "employment_event_count": 2,
                "marital_status": "S", "has_purchased_service": False,
                "leave_payout_eligible": False, "leave_payout_amount": 0,
                "medicare_flag": "N",
            },
            "crm_context": {
                "contact_type": "beneficiary", "has_legacy_member_id": True,
                "open_conversations": 1, "identity_verified": True,
                "security_flag": None, "overdue_commitments": 0,
                "sla_breached": False, "has_urgent_notes": False,
            },
            "eligibility_snapshot": {
                "best_eligible_type": "NORMAL", "rule_of_n_met": False,
                "reduction_applies": False, "vested": True,
                "leave_payout_ams_impact": 0, "rule_of_n_near": False,
            },
        },
        "output": {
            "view_mode": "crm",
            "panels_shown": [
                "member_banner", "service_credit_summary", "benefit_calculation",
                "payment_options", "dro_impact", "death_benefit",
                "ipr_calculator", "employment_timeline",
                "case_journal", "ai_summary", "crm_note_form",
            ],
            "panels_hidden": ["scenario_modeler"],
            "alerts": ["dro_deduction_active"],
            "data_fetches": [
                "member_data", "service_credit", "benefit_calculation",
                "payment_options", "employment_history",
                "crm_contact", "crm_conversations", "crm_commitments",
                "crm_interactions", "crm_outreach",
            ],
        },
        "note": "CRM view because contact_type=beneficiary. "
                "has_member=true because has_legacy_member_id=true. "
                "scenario_modeler hidden because best_eligible_type=NORMAL, not EARLY.",
    },
    {
        "description": "Terminated non-vested member — minimal panels",
        "input": {
            "member_profile": {
                "tier": 3, "status": "terminated", "vested": False,
                "earned_service_years": 3.0, "has_dro": False,
                "has_employment_history": True, "employment_event_count": 1,
                "marital_status": "S", "has_purchased_service": False,
                "leave_payout_eligible": False, "leave_payout_amount": 0,
                "medicare_flag": "N",
            },
            "crm_context": {
                "contact_type": "member", "has_legacy_member_id": True,
                "open_conversations": 0, "identity_verified": False,
                "security_flag": None, "overdue_commitments": 0,
                "sla_breached": False, "has_urgent_notes": False,
            },
            "eligibility_snapshot": {
                "best_eligible_type": "NOT_ELIGIBLE", "rule_of_n_met": False,
                "reduction_applies": False, "vested": False,
                "leave_payout_ams_impact": 0, "rule_of_n_near": False,
            },
        },
        "output": {
            "view_mode": "workspace",
            "panels_shown": [
                "member_banner", "service_credit_summary", "employment_timeline",
            ],
            "panels_hidden": [
                "benefit_calculation", "payment_options", "dro_impact",
                "scenario_modeler", "death_benefit", "ipr_calculator",
                "case_journal", "ai_summary", "crm_note_form",
            ],
            "alerts": ["not_vested", "identity_not_verified"],
            "data_fetches": [
                "member_data", "service_credit", "employment_history",
            ],
        },
        "note": "No calculation panels because status=terminated means has_calculation=false. "
                "not_vested alert fires. identity_not_verified because identity_verified=false.",
    },
    {
        "description": "External contact without legacy member ID — CRM only, no member panels",
        "input": {
            "member_profile": {
                "tier": 1, "status": "active", "vested": True,
                "earned_service_years": 20.0, "has_dro": False,
                "has_employment_history": True, "employment_event_count": 2,
                "marital_status": "M", "has_purchased_service": False,
                "leave_payout_eligible": False, "leave_payout_amount": 0,
                "medicare_flag": "Y",
            },
            "crm_context": {
                "contact_type": "external", "has_legacy_member_id": False,
                "open_conversations": 2, "identity_verified": True,
                "security_flag": "fraud_alert", "overdue_commitments": 1,
                "sla_breached": True, "has_urgent_notes": True,
            },
            "eligibility_snapshot": {
                "best_eligible_type": "EARLY", "rule_of_n_met": False,
                "reduction_applies": True, "vested": True,
                "leave_payout_ams_impact": 0, "rule_of_n_near": False,
            },
        },
        "output": {
            "view_mode": "crm",
            "panels_shown": [
                "employment_timeline", "case_journal", "ai_summary", "crm_note_form",
            ],
            "panels_hidden": [
                "member_banner", "service_credit_summary", "benefit_calculation",
                "payment_options", "dro_impact", "scenario_modeler",
                "death_benefit", "ipr_calculator",
            ],
            "alerts": [
                "security_flag_warning", "overdue_commitments",
                "sla_breach", "urgent_note_flag",
            ],
            "data_fetches": [
                "employment_history",
                "crm_contact", "crm_conversations", "crm_commitments",
                "crm_interactions", "crm_outreach",
            ],
        },
        "note": "has_member=false because contact_type=external AND has_legacy_member_id=false. "
                "Member panels (banner, calc, etc.) hidden. But employment_timeline IS shown because "
                "has_employment_history=true and employment_event_count=2 — this panel is independent "
                "of has_member. ai_summary shown because both case_journal and employment_timeline visible. "
                "Only CRM alerts fire (member alerts require has_member).",
    },
    {
        "description": "Beneficiary without legacy ID, zero open conversations — CRM view still shows case_journal",
        "input": {
            "member_profile": {
                "tier": 1, "status": "active", "vested": True,
                "earned_service_years": 15.0, "has_dro": False,
                "has_employment_history": True, "employment_event_count": 4,
                "marital_status": "D", "has_purchased_service": False,
                "leave_payout_eligible": False, "leave_payout_amount": 0,
                "medicare_flag": "N",
            },
            "crm_context": {
                "contact_type": "beneficiary", "has_legacy_member_id": False,
                "open_conversations": 0, "identity_verified": True,
                "security_flag": None, "overdue_commitments": 0,
                "sla_breached": False, "has_urgent_notes": False,
            },
            "eligibility_snapshot": {
                "best_eligible_type": "NORMAL", "rule_of_n_met": False,
                "reduction_applies": False, "vested": True,
                "leave_payout_ams_impact": 0, "rule_of_n_near": False,
            },
        },
        "output": {
            "view_mode": "crm",
            "panels_shown": [
                "employment_timeline", "case_journal", "ai_summary", "crm_note_form",
            ],
            "panels_hidden": [
                "member_banner", "service_credit_summary", "benefit_calculation",
                "payment_options", "dro_impact", "scenario_modeler",
                "death_benefit", "ipr_calculator",
            ],
            "alerts": [],
            "data_fetches": [
                "employment_history",
                "crm_contact", "crm_conversations", "crm_commitments",
                "crm_interactions", "crm_outreach",
            ],
        },
        "note": "CRITICAL: view_mode=crm because contact_type=beneficiary. case_journal is shown "
                "because view_mode is crm — even though open_conversations=0. The OR condition means "
                "CRM view mode alone is sufficient. ai_summary shown because BOTH case_journal and "
                "employment_timeline are visible. has_member=false (no legacy ID), so no member panels "
                "or member alerts.",
    },
    {
        "description": "Terminated vested member — member alerts still fire (spousal, medicare)",
        "input": {
            "member_profile": {
                "tier": 3, "status": "terminated", "vested": True,
                "earned_service_years": 8.0, "has_dro": False,
                "has_employment_history": True, "employment_event_count": 2,
                "marital_status": "M", "has_purchased_service": False,
                "leave_payout_eligible": False, "leave_payout_amount": 0,
                "medicare_flag": "Y",
            },
            "crm_context": {
                "contact_type": "member", "has_legacy_member_id": True,
                "open_conversations": 0, "identity_verified": True,
                "security_flag": None, "overdue_commitments": 0,
                "sla_breached": False, "has_urgent_notes": False,
            },
            "eligibility_snapshot": {
                "best_eligible_type": "NOT_ELIGIBLE", "rule_of_n_met": False,
                "reduction_applies": False, "vested": True,
                "leave_payout_ams_impact": 0, "rule_of_n_near": False,
            },
        },
        "output": {
            "view_mode": "workspace",
            "panels_shown": [
                "member_banner", "service_credit_summary", "employment_timeline",
            ],
            "panels_hidden": [
                "benefit_calculation", "payment_options", "dro_impact",
                "scenario_modeler", "death_benefit", "ipr_calculator",
                "case_journal", "ai_summary", "crm_note_form",
            ],
            "alerts": ["spousal_consent_required", "medicare_ipr_highlight"],
            "data_fetches": [
                "member_data", "service_credit", "employment_history",
            ],
        },
        "note": "Terminated but vested — has_calculation=false (status=terminated), so no calc panels. "
                "But has_member=true so member alerts still fire: spousal_consent (marital_status=M) and "
                "medicare_ipr_highlight (medicare_flag=Y). NOT not_vested because vested=true.",
    },
]


def get_curated_examples() -> list[dict]:
    """Return the curated seed examples."""
    return CURATED_EXAMPLES.copy()


def select_from_failures(
    results: list[ScenarioResult],
    scenarios: list[Scenario],
    max_examples: int = 12,
) -> list[dict]:
    """Select corrective few-shot examples from failed scenarios.

    Picks diverse examples covering different error types and panel configurations.
    """
    # Build scenario lookup
    scenario_map = {s.scenario_id: s for s in scenarios}

    # Group failures by error type
    by_error: dict[str, list[ScenarioResult]] = {}
    for r in results:
        if r.error_types:
            for et in r.error_types:
                by_error.setdefault(et, []).append(r)

    examples = []
    seen_configs: set[tuple[str, ...]] = set()

    # Pick one example per error type
    for error_type, failed in sorted(by_error.items(), key=lambda x: -len(x[1])):
        if len(examples) >= max_examples:
            break

        for r in failed:
            scenario = scenario_map.get(r.scenario_id)
            if not scenario:
                continue

            config_key = tuple(sorted(r.expected.panels_shown))
            if config_key in seen_configs:
                continue

            seen_configs.add(config_key)
            examples.append(_scenario_to_example(scenario, error_type))
            break

    return examples


def _scenario_to_example(scenario: Scenario, note_prefix: str = "") -> dict:
    """Convert a Scenario to a few-shot example dict."""
    exp = scenario.expected_composition
    return {
        "description": f"{scenario.stratum} — {scenario.scenario_id}",
        "input": {
            "member_profile": scenario.member_profile.model_dump(),
            "crm_context": scenario.crm_context.model_dump(),
            "eligibility_snapshot": scenario.eligibility_snapshot.model_dump(),
        },
        "output": {
            "view_mode": exp.view_mode.value,
            "panels_shown": exp.panels_shown,
            "panels_hidden": exp.panels_hidden,
            "alerts": exp.alerts,
            "data_fetches": exp.data_fetches,
        },
        "note": note_prefix,
    }


def save_few_shot_bank(examples: list[dict], path: Path) -> None:
    """Save few-shot bank to JSON file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as f:
        json.dump(examples, f, indent=2, default=str)


def load_few_shot_bank(path: Path) -> list[dict]:
    """Load few-shot bank from JSON file."""
    if not path.exists():
        return []
    with path.open() as f:
        return json.load(f)

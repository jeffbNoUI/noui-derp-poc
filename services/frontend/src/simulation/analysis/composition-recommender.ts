/**
 * Maps extracted patterns to actionable composition recommendations.
 * Each recommendation targets a specific function/file in the codebase.
 * Consumed by: report-generator.ts, run-analysis.ts
 * Depends on: pattern-extractor.ts, telemetry-types.ts
 */
import type { CompositionRecommendation } from '../telemetry-types.ts'
import type { ExtractedPatterns } from './pattern-extractor.ts'

// ─── Recommendation Generators ──────────────────────────────────

function stageOrderingRecommendations(patterns: ExtractedPatterns): CompositionRecommendation[] {
  const recs: CompositionRecommendation[] = []

  // Check if intermediate/expert users consistently deviate from default order
  for (const pattern of patterns.stage_ordering) {
    if (pattern.percentage < 10) continue // Only care about common patterns

    const intermediateCount = pattern.experience_breakdown['intermediate'] ?? 0
    const expertCount = pattern.experience_breakdown['expert'] ?? 0
    const advancedCount = intermediateCount + expertCount

    if (advancedCount > pattern.count * 0.6) {
      // Most sessions in this pattern are advanced users
      const defaultOrder = [
        'application-intake', 'member-verify', 'service-credit', 'eligibility',
        'benefit-calc', 'payment-options', 'supplemental', 'review-certify',
      ]
      const isNonDefault = JSON.stringify(pattern.order) !== JSON.stringify(defaultOrder)

      if (isNonDefault && pattern.count >= 20) {
        recs.push({
          category: 'stage_ordering',
          current_behavior: `Default stage order: ${defaultOrder.join(' → ')}`,
          recommended_change: `${pattern.percentage}% of intermediate/expert analysts traverse: ${pattern.order.join(' → ')}. Consider adapting default order based on experience level.`,
          evidence: {
            sessions_analyzed: pattern.count,
            pattern_frequency: pattern.percentage / 100,
            confidence: Math.min(0.95, pattern.percentage / 100 + 0.3),
          },
          implementation: {
            file: 'src/pages/staff/guided-composition.ts',
            function_name: 'composeStages',
            change_description: 'Add experience_level parameter to reorder stages when analyst proficiency is intermediate+',
          },
        })
      }
    }
  }

  // Check for confirm-before-visit patterns (out-of-order confirmation)
  const outOfOrder = patterns.stage_ordering.filter(p => {
    const stagePositions = p.order.reduce((acc, s, i) => { acc[s] = i; return acc }, {} as Record<string, number>)
    // Check if member-verify comes before application-intake
    return (stagePositions['member-verify'] ?? 99) < (stagePositions['application-intake'] ?? 0)
  })

  if (outOfOrder.length > 0) {
    const totalOutOfOrder = outOfOrder.reduce((sum, p) => sum + p.count, 0)
    if (totalOutOfOrder > 15) {
      recs.push({
        category: 'stage_ordering',
        current_behavior: 'Application intake is always the first stage',
        recommended_change: `${totalOutOfOrder} sessions confirm member-verify before application-intake when intake signal is green. Consider swapping default order when auto-checks are 100% on intake.`,
        evidence: {
          sessions_analyzed: totalOutOfOrder,
          pattern_frequency: totalOutOfOrder / (patterns.stage_ordering.reduce((s, p) => s + p.count, 0) || 1),
          confidence: 0.7,
        },
        implementation: {
          file: 'src/pages/staff/guided-composition.ts',
          function_name: 'composeStages',
          change_description: 'When all intake auto-checks pass, move member-verify before intake in default order',
        },
      })
    }
  }

  return recs
}

function bottleneckRecommendations(patterns: ExtractedPatterns): CompositionRecommendation[] {
  const recs: CompositionRecommendation[] = []

  for (const stage of patterns.bottlenecks) {
    if (!stage.is_bottleneck) continue

    recs.push({
      category: 'component_visibility',
      current_behavior: `${stage.stage_id} has ${stage.bottleneck_ratio}x median dwell time (${Math.round(stage.median_dwell_ms / 1000)}s vs overall median)`,
      recommended_change: `Pre-expand the learning module rules layer on ${stage.stage_id} for novice/intermediate users. Auto-highlight key values.`,
      evidence: {
        sessions_analyzed: 1, // Will be replaced with actual count
        pattern_frequency: stage.bottleneck_ratio,
        confidence: Math.min(0.9, 0.5 + (stage.bottleneck_ratio - 1.5) * 0.2),
      },
      implementation: {
        file: 'src/pages/staff/guided-types.ts',
        function_name: 'createInitialState',
        change_description: `Set layers.rules = true by default when stage is ${stage.stage_id} and analyst experience < expert`,
      },
    })
  }

  return recs
}

function learningModuleRecommendations(patterns: ExtractedPatterns): CompositionRecommendation[] {
  const recs: CompositionRecommendation[] = []

  for (const layer of patterns.learning_module) {
    const noviceUsage = layer.by_experience['novice'] ?? 0
    const expertUsage = layer.by_experience['expert'] ?? 0

    // If experts barely use a layer, recommend hiding it by default for them
    if (noviceUsage > 10 && expertUsage < 3 && layer.toggle_count > 0) {
      recs.push({
        category: 'learning_defaults',
        current_behavior: `${layer.layer} layer starts ${layer.layer === 'onboarding' ? 'ON' : 'OFF'} for all users`,
        recommended_change: `${layer.layer} layer: novice usage ${noviceUsage}x vs expert ${expertUsage}x. Default to OFF for expert-level analysts.`,
        evidence: {
          sessions_analyzed: layer.toggle_count,
          pattern_frequency: noviceUsage / (noviceUsage + expertUsage + 1),
          confidence: 0.75,
        },
        implementation: {
          file: 'src/pages/staff/guided-types.ts',
          function_name: 'createInitialState',
          change_description: `Accept experience_level parameter; set layers.${layer.layer} = false when experience is expert`,
        },
      })
    }
  }

  return recs
}

function nudgeRecommendations(patterns: ExtractedPatterns): CompositionRecommendation[] {
  const recs: CompositionRecommendation[] = []

  for (const nudge of patterns.nudge_effectiveness) {
    if (nudge.fire_count < 5) continue

    if (nudge.effectiveness < 20) {
      recs.push({
        category: 'nudge_rules',
        current_behavior: `Nudge "${nudge.nudge_id}" fires ${nudge.fire_count}x, acted on ${nudge.effectiveness}% of the time`,
        recommended_change: `Low-effectiveness nudge (${nudge.effectiveness}%). Consider increasing trigger delay or restricting to novice users only.`,
        evidence: {
          sessions_analyzed: nudge.fire_count,
          pattern_frequency: nudge.effectiveness / 100,
          confidence: 0.65,
        },
        implementation: {
          file: 'src/nudges/nudge-rules.ts',
          function_name: 'NUDGE_RULES',
          change_description: `Add experience_level guard to ${nudge.nudge_id}: only fire for novice/intermediate`,
        },
      })
    } else if (nudge.effectiveness > 60) {
      recs.push({
        category: 'nudge_rules',
        current_behavior: `Nudge "${nudge.nudge_id}" fires ${nudge.fire_count}x, acted on ${nudge.effectiveness}% of the time`,
        recommended_change: `High-effectiveness nudge (${nudge.effectiveness}%). Consider triggering earlier or converting to a persistent UI hint.`,
        evidence: {
          sessions_analyzed: nudge.fire_count,
          pattern_frequency: nudge.effectiveness / 100,
          confidence: 0.80,
        },
        implementation: {
          file: 'src/nudges/nudge-rules.ts',
          function_name: 'NUDGE_RULES',
          change_description: `Reduce delayMs for ${nudge.nudge_id} or promote to inline callout`,
        },
      })
    }
  }

  return recs
}

function completionFunnelRecommendations(patterns: ExtractedPatterns): CompositionRecommendation[] {
  const recs: CompositionRecommendation[] = []

  for (const step of patterns.completion_funnel) {
    if (step.abandonment_rate > 5) {
      recs.push({
        category: 'component_visibility',
        current_behavior: `Wizard step "${step.step_id}" has ${step.abandonment_rate}% abandonment rate`,
        recommended_change: `High abandonment at ${step.step_id}. Consider adding progress-save prompt, simplifying the step, or adding contextual help.`,
        evidence: {
          sessions_analyzed: step.entered,
          pattern_frequency: step.abandonment_rate / 100,
          confidence: Math.min(0.85, 0.5 + step.abandonment_rate / 100),
        },
        implementation: {
          file: 'src/pages/portal/ApplicationWizard.tsx',
          function_name: 'ApplicationWizard',
          change_description: `Add auto-save prompt before navigating away from ${step.step_id}`,
        },
      })
    }
  }

  return recs
}

function expertModeRecommendations(patterns: ExtractedPatterns): CompositionRecommendation[] {
  const recs: CompositionRecommendation[] = []

  if (patterns.expert_mode.adoption_rate > 15 && patterns.expert_mode.time_savings_pct > 20) {
    recs.push({
      category: 'component_visibility',
      current_behavior: `Expert mode adopted by ${patterns.expert_mode.adoption_rate}% of staff sessions, saving ${patterns.expert_mode.time_savings_pct}% time`,
      recommended_change: `Significant expert mode adoption. Consider defaulting to expert mode for analysts with >50 completed cases.`,
      evidence: {
        sessions_analyzed: Object.values(patterns.expert_mode.by_experience).reduce((a, b) => a + b, 0),
        pattern_frequency: patterns.expert_mode.adoption_rate / 100,
        confidence: 0.80,
      },
      implementation: {
        file: 'src/pages/staff/GuidedWorkspace.tsx',
        function_name: 'GuidedWorkspace',
        change_description: 'Add proficiency-based default: createInitialState(analystCaseCount > 50 ? "expert" : "guided")',
      },
    })
  }

  return recs
}

// ─── Main Recommender ───────────────────────────────────────────

export function generateRecommendations(patterns: ExtractedPatterns): CompositionRecommendation[] {
  return [
    ...stageOrderingRecommendations(patterns),
    ...bottleneckRecommendations(patterns),
    ...learningModuleRecommendations(patterns),
    ...nudgeRecommendations(patterns),
    ...completionFunnelRecommendations(patterns),
    ...expertModeRecommendations(patterns),
  ].sort((a, b) => b.evidence.confidence - a.evidence.confidence)
}

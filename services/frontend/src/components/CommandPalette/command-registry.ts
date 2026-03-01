/**
 * Command registry — builds the full command list for the palette.
 * Registers demo cases, stages (when memberId present), tools, and views.
 * Consumed by: CommandPalette.tsx
 * Depends on: command-types.ts, constants (DEMO_CASES), guided-help (STAGE_HELP)
 */
import type { NavigateFunction } from 'react-router-dom'
import type { CommandItem } from './command-types'
import { DEMO_CASES } from '@/lib/constants'
import { STAGE_HELP } from '@/pages/staff/guided-help'

export function buildCommands(
  navigate: NavigateFunction,
  memberId?: string,
  isGuided?: boolean,
): CommandItem[] {
  const commands: CommandItem[] = []

  // Demo cases
  const suffix = isGuided ? '/guided' : ''
  for (let i = 0; i < DEMO_CASES.length; i++) {
    const c = DEMO_CASES[i]
    const caseNum = String(i + 1)
    commands.push({
      id: `case-${c.id}`,
      label: `${c.name} — Case ${caseNum}`,
      category: 'Case',
      icon: '\uD83D\uDCC1',
      keywords: [c.label, c.division, c.id],
      action: () => navigate(`/staff/case/${c.id}${suffix}`),
    })
  }

  // Stages (only when viewing a member)
  if (memberId) {
    for (const stage of STAGE_HELP) {
      commands.push({
        id: `stage-${stage.id}`,
        label: `${stage.icon} ${stage.title}`,
        category: 'Stage',
        icon: stage.icon,
        keywords: [stage.subtitle, stage.id],
        action: () => {
          // Dispatch custom event that GuidedWorkspace listens for
          window.dispatchEvent(new CustomEvent('noui:goto-stage', { detail: stage.id }))
        },
      })
    }
  }

  // Tools
  const tools = [
    { id: 'tool-knowledge', label: 'Knowledge Assistant', icon: '\uD83D\uDCDA', path: '/demos/knowledge-assistant' },
    { id: 'tool-compose', label: 'Correspondence Composer', icon: '\u270D\uFE0F', path: '/demos/correspondence' },
    { id: 'tool-validate', label: 'Data Entry Validator', icon: '\u2705', path: '/demos/data-validator' },
  ]
  for (const t of tools) {
    commands.push({
      id: t.id,
      label: t.label,
      category: 'Tool',
      icon: t.icon,
      action: () => navigate(t.path),
    })
  }

  // Views
  if (memberId) {
    commands.push({
      id: 'view-expert',
      label: 'Expert Mode',
      category: 'View',
      icon: '\u26A1',
      keywords: ['all panels', 'carousel'],
      action: () => navigate(`/staff/case/${memberId}`),
    })
    commands.push({
      id: 'view-guided',
      label: 'Guided Mode',
      category: 'View',
      icon: '\uD83D\uDCD6',
      keywords: ['step by step', 'learning'],
      action: () => navigate(`/staff/case/${memberId}/guided`),
    })
  }
  commands.push({
    id: 'view-portal',
    label: 'Member Portal',
    category: 'View',
    icon: '\uD83C\uDF10',
    keywords: ['self service', 'member'],
    action: () => navigate('/portal'),
  })
  commands.push({
    id: 'view-compare',
    label: 'Compare Cases',
    category: 'View',
    icon: '\u2194\uFE0F',
    keywords: ['side by side', 'comparison', 'tier'],
    action: () => navigate('/staff/compare'),
  })

  return commands
}

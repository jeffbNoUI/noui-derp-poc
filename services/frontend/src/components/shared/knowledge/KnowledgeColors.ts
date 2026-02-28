/**
 * Theme-neutral color adapter for the Knowledge panel.
 * Maps both legacy flat C object and nested PortalTheme into a common interface.
 * Consumed by: KnowledgeSidebar.tsx, KnowledgeMiniPanel.tsx
 * Depends on: theme/legacy.ts (C type), theme/types.ts (PortalTheme)
 */
import type { PortalTheme } from '@/theme/types'

export interface KnowledgeColors {
  surface: string
  elevated: string
  border: string
  borderSubtle: string
  accent: string
  accentMuted: string
  text: string
  textSecondary: string
  textMuted: string
  textDim: string
}

/** Map legacy flat C theme object to KnowledgeColors */
export function knowledgeColorsFromLegacy(c: {
  surface: string; elevated: string; border: string; borderSubtle: string
  accent: string; accentMuted: string
  text: string; textSecondary: string; textMuted: string; textDim: string
}): KnowledgeColors {
  return {
    surface: c.surface,
    elevated: c.elevated,
    border: c.border,
    borderSubtle: c.borderSubtle,
    accent: c.accent,
    accentMuted: c.accentMuted,
    text: c.text,
    textSecondary: c.textSecondary,
    textMuted: c.textMuted,
    textDim: c.textDim,
  }
}

/** Map nested PortalTheme to KnowledgeColors */
export function knowledgeColorsFromTheme(t: PortalTheme): KnowledgeColors {
  return {
    surface: t.surface.card,
    elevated: t.surface.cardAlt,
    border: t.border.base,
    borderSubtle: t.border.subtle,
    accent: t.accent.primary,
    accentMuted: t.accent.surface,
    text: t.text.primary,
    textSecondary: t.text.secondary,
    textMuted: t.text.muted,
    textDim: t.text.dim,
  }
}

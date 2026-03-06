import { getHelpForStage } from '@/lib/helpContent';
import type { ProficiencyLevel } from '@/hooks/useProficiency';

interface ContextualHelpProps {
  stageId: string;
  proficiency: ProficiencyLevel;
  onClose: () => void;
}

/**
 * Sticky contextual help panel shown in Guided/Assisted modes.
 * - Guided: Full content with "What to check", rules, and "Next Action"
 * - Assisted: Reference-only ("Quick Reference"), no next action
 * - Expert: Not rendered (caller should hide)
 */
export default function ContextualHelp({ stageId, proficiency, onClose }: ContextualHelpProps) {
  const help = getHelpForStage(stageId);

  if (!help) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-400">
        No help available for this stage.
      </div>
    );
  }

  const isGuided = proficiency === 'guided';
  const panelTitle = isGuided ? 'Guided Help' : 'Quick Reference';

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-sm">{isGuided ? '\ud83e\udded' : '\ud83d\udcd6'}</span>
          <span className="text-sm font-bold text-gray-700">{panelTitle}</span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-sm font-medium"
        >
          \u2715
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Stage title & context */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">{help.title}</h3>
          <p className="text-xs text-gray-500 leading-relaxed">{help.context}</p>
        </div>

        {/* What to check */}
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs font-bold text-teal-700">\u2713 What to check</span>
          </div>
          <ul className="space-y-1.5">
            {help.checklist.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-teal-800 leading-snug">
                <span className="text-teal-400 mt-0.5 flex-shrink-0">\u2022</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Rule references */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs font-bold text-blue-700">\ud83d\udcd6 Rule Reference</span>
          </div>
          <div className="space-y-1">
            {help.rules.map((rule, i) => (
              <div key={i} className="text-[11px] text-blue-800">
                <span className="font-semibold">{rule.code}</span>
                <span className="text-blue-600"> \u2014 {rule.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Next Action (Guided only) */}
        {isGuided && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs font-bold text-amber-700">\u26a1 Next Action</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-snug">{help.nextAction}</p>
          </div>
        )}

        {/* Proficiency hint */}
        <div className="text-[10px] text-gray-400 text-center pt-2 border-t border-gray-100">
          {isGuided
            ? 'Guided mode \u2014 all checks and next actions shown'
            : 'Assisted mode \u2014 reference only, next actions hidden'}
        </div>
      </div>
    </div>
  );
}

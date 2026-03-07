import type { ReactNode, CSSProperties } from 'react';

/**
 * Semantic motion types that communicate meaning:
 *
 * - zoom-in:  "Drilling into detail" — card grows from smaller, feels like focusing
 * - zoom-out: "Pulling back to overview" — card shrinks from larger, feels like context
 * - rise:     "Content surfacing" — card rises from below, feels like discovering
 * - settle:   "Content arriving" — card drops into place from above, feels like placement
 * - fade:     Neutral entrance — no directional meaning
 */
type Motion = 'zoom-in' | 'zoom-out' | 'rise' | 'settle' | 'fade';

interface MotionCardProps {
  children: ReactNode;
  /** Semantic motion type — communicates the card's relationship to the user's action */
  motion?: Motion;
  /** Order in the choreography sequence (0-based). Higher = later entrance. */
  order?: number;
  /** Base delay in ms before the choreography starts (default: 80) */
  baseDelay?: number;
  /** Stagger interval in ms between cards (default: 70) */
  stagger?: number;
  /** Duration of the animation in ms (default: 500) */
  duration?: number;
  /** Additional className */
  className?: string;
}

const ANIMATION_MAP: Record<Motion, string> = {
  'zoom-in': 'motionZoomIn',
  'zoom-out': 'motionZoomOut',
  rise: 'motionRise',
  settle: 'motionSettle',
  fade: 'fadeIn',
};

export default function MotionCard({
  children,
  motion = 'rise',
  order = 0,
  baseDelay = 80,
  stagger = 70,
  duration = 500,
  className = '',
}: MotionCardProps) {
  const delay = baseDelay + order * stagger;
  const animationName = ANIMATION_MAP[motion];

  const style: CSSProperties = {
    opacity: 0,
    animation: `${animationName} ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms forwards`,
  };

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

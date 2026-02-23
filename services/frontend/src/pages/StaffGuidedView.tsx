/**
 * Route param bridge for guided mode — reads :memberId from URL and passes to GuidedWorkspace.
 * The top navbar Expert/Guided toggle navigates between this route and StaffCaseView.
 * Consumed by: router.tsx (route /staff/case/:memberId/guided)
 * Depends on: GuidedWorkspace, react-router-dom (useParams)
 */
import { useParams } from 'react-router-dom'
import { GuidedWorkspace } from '@/pages/staff/GuidedWorkspace'

export function StaffGuidedView() {
  const { memberId } = useParams<{ memberId: string }>()
  if (!memberId) return null
  return <GuidedWorkspace memberId={memberId} defaultMode="guided" />
}

/**
 * Route param bridge — reads :memberId from URL and passes to GuidedWorkspace in expert mode.
 * The top navbar Expert/Guided toggle navigates between this route and StaffGuidedView.
 * Consumed by: router.tsx (route /staff/case/:memberId)
 * Depends on: GuidedWorkspace, react-router-dom (useParams)
 */
import { useParams } from 'react-router-dom'
import { GuidedWorkspace } from '@/pages/staff/GuidedWorkspace'

export function StaffCaseView() {
  const { memberId } = useParams<{ memberId: string }>()
  if (!memberId) return null
  return <GuidedWorkspace memberId={memberId} defaultMode="expert" />
}

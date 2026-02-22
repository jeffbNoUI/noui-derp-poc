/**
 * Route param bridge — reads :memberId from URL and passes to BenefitWorkspace.
 * BenefitWorkspace takes memberId as a prop (not from router), so this thin
 * wrapper allows it to work with react-router-dom without refactoring.
 * Consumed by: router.tsx (route /staff/case/:memberId)
 * Depends on: BenefitWorkspace, react-router-dom (useParams)
 */
import { useParams } from 'react-router-dom'
import { BenefitWorkspace } from '@/pages/BenefitWorkspace'

export function StaffCaseView() {
  const { memberId } = useParams<{ memberId: string }>()
  if (!memberId) return null
  return <BenefitWorkspace memberId={memberId} />
}

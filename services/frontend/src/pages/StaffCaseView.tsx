/** Wrapper to bridge react-router params to BenefitWorkspace's memberId prop */
import { useParams } from 'react-router-dom'
import { BenefitWorkspace } from '@/pages/BenefitWorkspace'

export function StaffCaseView() {
  const { memberId } = useParams<{ memberId: string }>()
  if (!memberId) return null
  return <BenefitWorkspace memberId={memberId} />
}

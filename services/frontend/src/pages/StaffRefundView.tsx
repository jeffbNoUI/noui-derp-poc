/**
 * Route param bridge for refund processing workspace — reads :memberId from URL.
 * Consumed by: router.tsx (route /staff/refund/:memberId)
 * Depends on: RefundWorkspace, react-router-dom (useParams)
 */
import { useParams } from 'react-router-dom'
import { RefundWorkspace } from '@/pages/staff/RefundWorkspace'

export function StaffRefundView() {
  const { memberId } = useParams<{ memberId: string }>()
  if (!memberId) return null
  return <RefundWorkspace memberId={memberId} />
}

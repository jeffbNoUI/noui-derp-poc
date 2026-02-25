/**
 * Route param bridge for death processing workspace — reads :memberId from URL.
 * Consumed by: router.tsx (route /staff/death/:memberId)
 * Depends on: DeathWorkspace, react-router-dom (useParams)
 */
import { useParams } from 'react-router-dom'
import { DeathWorkspace } from '@/pages/staff/DeathWorkspace'

export function StaffDeathView() {
  const { memberId } = useParams<{ memberId: string }>()
  if (!memberId) return null
  return <DeathWorkspace memberId={memberId} />
}

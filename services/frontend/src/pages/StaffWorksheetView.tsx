/**
 * Staff worksheet route wrapper — loads member data and renders print-optimized worksheet.
 * Consumed by: router.tsx (/staff/case/:memberId/worksheet route)
 * Depends on: useMember, useCalculations hooks, RetirementWorksheet component
 */
import { useParams, useSearchParams } from 'react-router-dom'
import { useMember, useServiceCredit, useDROs } from '@/hooks/useMember'
import { useEligibility, useBenefitCalculation, usePaymentOptions, useDROCalculation } from '@/hooks/useCalculations'
import { DEFAULT_RETIREMENT_DATES } from '@/lib/constants'
import { RetirementWorksheet } from '@/pages/staff/RetirementWorksheet'
import { C } from '@/theme'

export function StaffWorksheetView() {
  const { memberId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const caseId = searchParams.get('caseId') ? Number(searchParams.get('caseId')) : null
  const retirementDate = DEFAULT_RETIREMENT_DATES[memberId] || ''

  const member = useMember(memberId)
  const serviceCredit = useServiceCredit(memberId)
  const dros = useDROs(memberId)
  const eligibility = useEligibility(memberId, retirementDate)
  const benefit = useBenefitCalculation(memberId, retirementDate)
  const paymentOptions = usePaymentOptions(memberId, retirementDate)
  const hasDRO = !!dros.data && dros.data.length > 0
  const droCalc = useDROCalculation(memberId, retirementDate, retirementDate !== '' && hasDRO)

  const m = member.data
  const elig = eligibility.data
  const ben = benefit.data

  if (!m || !elig || !ben) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
        Loading worksheet data...
      </div>
    )
  }

  const electedOption = hasDRO ? 'j&s_75' : 'maximum'

  return (
    <div>
      {/* Screen-only toolbar */}
      <div className="no-print" style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 16px', background: C.surface,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <button onClick={() => window.print()} style={{
          padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
          background: C.accent, color: '#fff', border: 'none', cursor: 'pointer',
        }}>Print Worksheet</button>
        <button onClick={() => window.history.back()} style={{
          padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
          background: 'transparent', border: `1px solid ${C.border}`, color: C.text,
          cursor: 'pointer',
        }}>Back</button>
      </div>

      <RetirementWorksheet
        member={m}
        eligibility={elig}
        benefit={ben}
        paymentOptions={paymentOptions.data}
        droCalc={hasDRO ? droCalc.data : undefined}
        serviceCredit={serviceCredit.data}
        retirementDate={retirementDate}
        electedOption={electedOption}
        caseId={caseId}
      />
    </div>
  )
}

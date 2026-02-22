import { createBrowserRouter } from 'react-router-dom'
import { StaffLayout } from '@/layouts/StaffLayout'
import { MemberLayout } from '@/layouts/MemberLayout'
import { PortalSwitcher } from '@/pages/PortalSwitcher'
import { StaffWelcomeScreen } from '@/pages/StaffWelcomeScreen'
import { StaffCaseView } from '@/pages/StaffCaseView'
import { MemberDashboard } from '@/pages/portal/MemberDashboard'
import { ApplicationWizard } from '@/pages/portal/ApplicationWizard'
import { ApplicationStatus } from '@/pages/portal/ApplicationStatus'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PortalSwitcher />,
  },
  {
    path: '/staff',
    element: <StaffLayout />,
    children: [
      { index: true, element: <StaffWelcomeScreen /> },
      { path: 'case/:memberId', element: <StaffCaseView /> },
    ],
  },
  {
    path: '/portal',
    element: <MemberLayout />,
    children: [
      { index: true, element: <MemberDashboard /> },
      { path: 'apply/:appId', element: <ApplicationWizard /> },
      { path: 'status/:appId', element: <ApplicationStatus /> },
      { path: 'messages', element: <PlaceholderPage title="Messages" /> },
      { path: 'documents', element: <PlaceholderPage title="Documents" /> },
    ],
  },
])

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div style={{
      maxWidth: 720, margin: '0 auto', padding: '40px 20px', textAlign: 'center' as const,
    }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#4a6363' }}>{title}</div>
      <div style={{ fontSize: 12, color: '#728f8f', marginTop: 8 }}>
        This page will be available in a future phase.
      </div>
    </div>
  )
}

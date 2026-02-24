/**
 * Central route definitions — maps URLs to layouts and page components.
 * Routes: / (platform showcase), /staff/* (staff workspace), /portal/* (member portal), /demos/* (prototype demos).
 * Consumed by: main.tsx (via RouterProvider)
 * Depends on: all layout and page components, react-router-dom
 */
import { createBrowserRouter } from 'react-router-dom'
import { StaffLayout } from '@/layouts/StaffLayout'
import { MemberLayout } from '@/layouts/MemberLayout'
import { DemoLayout } from '@/layouts/DemoLayout'
import { PortalSwitcher } from '@/pages/PortalSwitcher'
import { StaffWelcomeScreen } from '@/pages/StaffWelcomeScreen'
import { ComparisonView } from '@/pages/staff/ComparisonView'
import { StaffCaseView } from '@/pages/StaffCaseView'
import { StaffGuidedView } from '@/pages/StaffGuidedView'
import { MemberDashboard } from '@/pages/portal/MemberDashboard'
import { ApplicationWizard } from '@/pages/portal/ApplicationWizard'
import { ApplicationStatus } from '@/pages/portal/ApplicationStatus'
import { MessagesPage } from '@/pages/portal/MessagesPage'
import { DocumentsPage } from '@/pages/portal/DocumentsPage'
import { KnowledgeAssistant } from '@/pages/demos/KnowledgeAssistant'
import { CorrespondenceComposer } from '@/pages/demos/CorrespondenceComposer'
import { DataEntryValidator } from '@/pages/demos/DataEntryValidator'
import { ALMELearningEngine } from '@/pages/demos/ALMELearningEngine'
import { WorkflowDashboard } from '@/pages/demos/WorkflowDashboard'
import { OperationalDashboardPage } from '@/pages/demos/OperationalDashboardPage'
import { DataQualityDashboardPage } from '@/pages/demos/DataQualityDashboardPage'

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
      { path: 'case/:memberId/guided', element: <StaffGuidedView /> },
      { path: 'compare', element: <ComparisonView /> },
    ],
  },
  {
    path: '/portal',
    element: <MemberLayout />,
    children: [
      { index: true, element: <MemberDashboard /> },
      { path: 'apply/:appId', element: <ApplicationWizard /> },
      { path: 'status/:appId', element: <ApplicationStatus /> },
      { path: 'messages', element: <MessagesPage /> },
      { path: 'documents', element: <DocumentsPage /> },
    ],
  },
  {
    path: '/demos',
    element: <DemoLayout />,
    children: [
      { path: 'knowledge-assistant', element: <KnowledgeAssistant /> },
      { path: 'correspondence', element: <CorrespondenceComposer /> },
      { path: 'data-validator', element: <DataEntryValidator /> },
      { path: 'learning-engine', element: <ALMELearningEngine /> },
      { path: 'workflow', element: <WorkflowDashboard /> },
      { path: 'operational', element: <OperationalDashboardPage /> },
      { path: 'data-quality', element: <DataQualityDashboardPage /> },
    ],
  },
])

/**
 * Central route definitions — maps URLs to layouts and page components.
 * Routes: / (platform showcase), /staff/*, /portal/*, /employer/*, /vendor/*, /demos/*.
 * Consumed by: main.tsx (via RouterProvider)
 * Depends on: all layout and page components, react-router-dom
 */
import { createBrowserRouter } from 'react-router-dom'
import { StaffLayout } from '@/layouts/StaffLayout'
import { MemberLayout } from '@/layouts/MemberLayout'
import { DemoLayout } from '@/layouts/DemoLayout'
import { EmployerLayout } from '@/layouts/EmployerLayout'
import { VendorLayout } from '@/layouts/VendorLayout'
import { PortalSwitcher } from '@/pages/PortalSwitcher'
import { StaffWelcomeScreen } from '@/pages/StaffWelcomeScreen'
import { ComparisonView } from '@/pages/staff/ComparisonView'
import { StaffCaseView } from '@/pages/StaffCaseView'
import { StaffGuidedView } from '@/pages/StaffGuidedView'
import { StaffDeathView } from '@/pages/StaffDeathView'
import { StaffRefundView } from '@/pages/StaffRefundView'
import { MemberDashboard } from '@/pages/portal/MemberDashboard'
import { ApplicationWizard } from '@/pages/portal/ApplicationWizard'
import { ApplicationStatus } from '@/pages/portal/ApplicationStatus'
import { MessagesPage } from '@/pages/portal/MessagesPage'
import { DocumentsPage } from '@/pages/portal/DocumentsPage'
import { EmployerDashboard } from '@/pages/employer/EmployerDashboard'
import { EmployeeRoster } from '@/pages/employer/EmployeeRoster'
import { ContributionReporting } from '@/pages/employer/ContributionReporting'
import { ContributionUpload } from '@/pages/employer/ContributionUpload'
import { RetirementCoordination } from '@/pages/employer/RetirementCoordination'
import { EmployerReports } from '@/pages/employer/EmployerReports'
import { VendorDashboard } from '@/pages/vendor/VendorDashboard'
import { VendorMemberDetail } from '@/pages/vendor/VendorMemberDetail'
import { VendorReports } from '@/pages/vendor/VendorReports'
import { KnowledgeAssistant } from '@/pages/demos/KnowledgeAssistant'
import { CorrespondenceComposer } from '@/pages/demos/CorrespondenceComposer'
import { DataEntryValidator } from '@/pages/demos/DataEntryValidator'
import { ALMELearningEngine } from '@/pages/demos/ALMELearningEngine'
import { WorkflowDashboard } from '@/pages/demos/WorkflowDashboard'
import { OperationalDashboardPage } from '@/pages/demos/OperationalDashboardPage'
import { DataQualityDashboardPage } from '@/pages/demos/DataQualityDashboardPage'
import { DemoLanding } from '@/pages/DemoLanding'
import { PurchaseExplorer } from '@/pages/PurchaseExplorer'
import { ChangeManagementDemo } from '@/pages/demo/ChangeManagementDemo'
import { LifeEventHub } from '@/pages/portal/LifeEventHub'
import { LifeEventFlow } from '@/pages/portal/LifeEventFlow'
import { FormWizardPage } from '@/pages/portal/FormWizardPage'
import { FormSubmissionStatus } from '@/pages/portal/FormSubmissionStatus'
import { WorkQueue } from '@/pages/staff/WorkQueue'
import { SubmissionReview } from '@/pages/staff/SubmissionReview'
import { ContributionQueue } from '@/pages/staff/ContributionQueue'
import { ContributionReview } from '@/pages/staff/ContributionReview'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PortalSwitcher />,
  },
  {
    path: '/demo',
    element: <DemoLanding />,
  },
  {
    path: '/staff',
    element: <StaffLayout />,
    children: [
      { index: true, element: <StaffWelcomeScreen /> },
      { path: 'case/:memberId', element: <StaffCaseView /> },
      { path: 'case/:memberId/guided', element: <StaffGuidedView /> },
      { path: 'death/:memberId', element: <StaffDeathView /> },
      { path: 'refund/:memberId', element: <StaffRefundView /> },
      { path: 'compare', element: <ComparisonView /> },
      { path: 'queue', element: <WorkQueue /> },
      { path: 'queue/:bundleId', element: <SubmissionReview /> },
      { path: 'contributions', element: <ContributionQueue /> },
      { path: 'contributions/:reportId', element: <ContributionReview /> },
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
      { path: 'life-events', element: <LifeEventHub /> },
      { path: 'life-events/:eventId', element: <LifeEventFlow /> },
      { path: 'forms/:formId', element: <FormWizardPage /> },
      { path: 'submissions/:bundleId', element: <FormSubmissionStatus /> },
    ],
  },
  {
    path: '/employer',
    element: <EmployerLayout />,
    children: [
      { index: true, element: <EmployerDashboard /> },
      { path: 'roster', element: <EmployeeRoster /> },
      { path: 'contributions', element: <ContributionReporting /> },
      { path: 'contributions/upload', element: <ContributionUpload /> },
      { path: 'retirements', element: <RetirementCoordination /> },
      { path: 'reports', element: <EmployerReports /> },
    ],
  },
  {
    path: '/vendor',
    element: <VendorLayout />,
    children: [
      { index: true, element: <VendorDashboard /> },
      { path: 'member/:memberId', element: <VendorMemberDetail /> },
      { path: 'reports', element: <VendorReports /> },
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
      { path: 'purchase-explorer', element: <PurchaseExplorer memberId="10011" /> },
      { path: 'change-management', element: <ChangeManagementDemo /> },
    ],
  },
])

import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import PriceList from './pages/PriceList'
import Quotes from './pages/Quotes'
import QuoteBuilder from './pages/QuoteBuilder'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import ProjectTasks from './pages/ProjectTasks'
import Procurement from './pages/Procurement'
import Subcontractors from './pages/Subcontractors'
import WorkLogs from './pages/WorkLogs'
import WorkLogForm from './pages/WorkLogForm'
import ProjectBilling from './pages/ProjectBilling'
import ProjectOverview from './pages/ProjectOverview'
import Tutorial from './pages/Tutorial'
import BOQUpload from './pages/BOQUpload'
import BOQBuilder from './pages/BOQBuilder'
import BOQBilling from './pages/BOQBilling'
import PlanAnalyzer from './pages/PlanAnalyzer'
import ProjectDocuments from './pages/ProjectDocuments'
import ProjectAlerts from './pages/ProjectAlerts'
import ProjectTimeline from './pages/ProjectTimeline'

function App() {
  return (
    <Routes>
      {/* טופס יומן עבודה חיצוני */}
      <Route path="/log/:projectId" element={<WorkLogForm />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tutorial" element={<Tutorial />} />
        <Route path="/price-list" element={<PriceList />} />
        <Route path="/quotes" element={<Quotes />} />
        <Route path="/quote/:id" element={<QuoteBuilder />} />
        <Route path="/boq/new" element={<BOQUpload />} />
        <Route path="/plan-analyzer" element={<PlanAnalyzer />} />
        <Route path="/boq/:id" element={<BOQBuilder />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/project/:id/tasks" element={<ProjectTasks />} />
        <Route path="/project/:id/procurement" element={<Procurement />} />
        <Route path="/project/:id/subcontractors" element={<Subcontractors />} />
        <Route path="/project/:id/logs" element={<WorkLogs />} />
        <Route path="/project/:id/billing" element={<ProjectBilling />} />
        <Route path="/project/:id/boq-billing" element={<BOQBilling />} />
        <Route path="/project/:id/overview" element={<ProjectOverview />} />
        <Route path="/project/:id/documents" element={<ProjectDocuments />} />
        <Route path="/project/:id/alerts" element={<ProjectAlerts />} />
        <Route path="/project/:id/timeline" element={<ProjectTimeline />} />
      </Route>
    </Routes>
  )
}

export default App

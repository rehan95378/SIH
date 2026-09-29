import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './layouts/AppLayout';

// Pages
import Landing from './pages/Landing';

// Engineer pages
import EngineerDashboard from './pages/engineer/Dashboard';
import WellMapPage from './pages/engineer/WellMapPage';
import OffsetIntelligence from './pages/engineer/OffsetIntelligence';
import RiskAlerts from './pages/engineer/RiskAlerts';
import DigitalTwin from './pages/engineer/DigitalTwin';
import Incidents from './pages/engineer/Incidents';
import Analytics from './pages/engineer/Analytics';
import AIAssistant from './pages/engineer/AIAssistant';
import Knowledge from './pages/engineer/Knowledge';
import EngineerReports from './pages/engineer/Reports';
import WellsPage from './pages/engineer/WellsPage';
import ScenarioSimulator from './pages/engineer/ScenarioSimulator';

// Manager pages
import ManagerDashboard from './pages/manager/Dashboard';
import { ManagerWells, ManagerRisk, ManagerIncidents, ManagerAIBriefing, ManagerTeam } from './pages/manager/ManagerPages';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminReports from './pages/admin/Reports';
import ExtractionReview from './pages/admin/ExtractionReview';
import SystemHealth from './pages/admin/SystemHealth';
import AdminKnowledgeGraph from './pages/admin/KnowledgeGraph';
import { AuditLogs, DataQuality, KnowledgeBase, AdminWells } from './pages/admin/AdminPages';

// Shared pages
import Profile from './pages/shared/Profile';

/* ─── Auth Guards ───────────────────────────────────────────────────────── */
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" style={{ borderWidth: '3px' }} />
        <p className="text-sm text-slate-500">Loading eRTMAC-NWIS...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const homeMap = { ADMIN: '/admin/dashboard', MANAGER: '/manager/dashboard', ENGINEER: '/engineer/dashboard' };
    return <Navigate to={homeMap[user.role] || '/'} replace />;
  }
  return <AppLayout>{children}</AppLayout>;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    const homeMap = { ADMIN: '/admin/dashboard', MANAGER: '/manager/dashboard', ENGINEER: '/engineer/dashboard' };
    return <Navigate to={homeMap[user.role] || '/engineer/dashboard'} replace />;
  }
  return children;
};

/* ─── App ───────────────────────────────────────────────────────────────── */
const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        {/* Public home/landing */}
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Landing /></PublicRoute>} />

        {/* ── Engineer ── */}
        <Route path="/engineer/dashboard"          element={<PrivateRoute allowedRoles={['ENGINEER','ADMIN','MANAGER']}><EngineerDashboard /></PrivateRoute>} />
        <Route path="/engineer/wells"              element={<PrivateRoute allowedRoles={['ENGINEER','ADMIN','MANAGER']}><WellsPage /></PrivateRoute>} />
        <Route path="/engineer/map"                element={<PrivateRoute allowedRoles={['ENGINEER','ADMIN','MANAGER']}><WellMapPage /></PrivateRoute>} />
        <Route path="/engineer/offset-intelligence"element={<PrivateRoute allowedRoles={['ENGINEER','ADMIN','MANAGER']}><OffsetIntelligence /></PrivateRoute>} />
        <Route path="/engineer/risk-alerts"        element={<PrivateRoute allowedRoles={['ENGINEER','ADMIN','MANAGER']}><RiskAlerts /></PrivateRoute>} />
        <Route path="/engineer/digital-twin"       element={<PrivateRoute allowedRoles={['ENGINEER','ADMIN','MANAGER']}><DigitalTwin /></PrivateRoute>} />
        <Route path="/engineer/incidents"          element={<PrivateRoute allowedRoles={['ENGINEER','ADMIN','MANAGER']}><Incidents /></PrivateRoute>} />
        <Route path="/engineer/analytics"          element={<PrivateRoute allowedRoles={['ENGINEER','ADMIN','MANAGER']}><Analytics /></PrivateRoute>} />
        <Route path="/engineer/ai-assistant"       element={<PrivateRoute allowedRoles={['ENGINEER','ADMIN','MANAGER']}><AIAssistant /></PrivateRoute>} />
        <Route path="/engineer/knowledge"          element={<PrivateRoute allowedRoles={['ENGINEER','ADMIN','MANAGER']}><Knowledge /></PrivateRoute>} />
        <Route path="/engineer/reports"            element={<PrivateRoute allowedRoles={['ENGINEER','ADMIN','MANAGER']}><EngineerReports /></PrivateRoute>} />
        <Route path="/engineer/simulator"          element={<PrivateRoute allowedRoles={['ENGINEER','ADMIN','MANAGER']}><ScenarioSimulator /></PrivateRoute>} />
        <Route path="/engineer/profile"            element={<PrivateRoute allowedRoles={['ENGINEER','ADMIN','MANAGER']}><Profile /></PrivateRoute>} />

        {/* ── Manager ── */}
        <Route path="/manager/dashboard"   element={<PrivateRoute allowedRoles={['MANAGER','ADMIN']}><ManagerDashboard /></PrivateRoute>} />
        <Route path="/manager/operations"  element={<PrivateRoute allowedRoles={['MANAGER','ADMIN']}><ManagerDashboard /></PrivateRoute>} />
        <Route path="/manager/wells"       element={<PrivateRoute allowedRoles={['MANAGER','ADMIN']}><ManagerWells /></PrivateRoute>} />
        <Route path="/manager/risk"        element={<PrivateRoute allowedRoles={['MANAGER','ADMIN']}><ManagerRisk /></PrivateRoute>} />
        <Route path="/manager/analytics"   element={<PrivateRoute allowedRoles={['MANAGER','ADMIN']}><Analytics /></PrivateRoute>} />
        <Route path="/manager/incidents"   element={<PrivateRoute allowedRoles={['MANAGER','ADMIN']}><ManagerIncidents /></PrivateRoute>} />
        <Route path="/manager/ai-briefing" element={<PrivateRoute allowedRoles={['MANAGER','ADMIN']}><ManagerAIBriefing /></PrivateRoute>} />
        <Route path="/manager/reports"     element={<PrivateRoute allowedRoles={['MANAGER','ADMIN']}><EngineerReports /></PrivateRoute>} />
        <Route path="/manager/team"        element={<PrivateRoute allowedRoles={['MANAGER','ADMIN']}><ManagerTeam /></PrivateRoute>} />
        <Route path="/manager/profile"     element={<PrivateRoute allowedRoles={['MANAGER','ADMIN']}><Profile /></PrivateRoute>} />

        {/* ── Admin ── */}
        <Route path="/admin/dashboard"         element={<PrivateRoute allowedRoles={['ADMIN']}><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/users"             element={<PrivateRoute allowedRoles={['ADMIN']}><AdminUsers /></PrivateRoute>} />
        <Route path="/admin/wells"             element={<PrivateRoute allowedRoles={['ADMIN']}><AdminWells /></PrivateRoute>} />
        <Route path="/admin/reports"           element={<PrivateRoute allowedRoles={['ADMIN']}><AdminReports /></PrivateRoute>} />
        <Route path="/admin/extraction-review" element={<PrivateRoute allowedRoles={['ADMIN']}><ExtractionReview /></PrivateRoute>} />
        <Route path="/admin/data-verification" element={<PrivateRoute allowedRoles={['ADMIN']}><ExtractionReview /></PrivateRoute>} />
        <Route path="/admin/knowledge-base"    element={<PrivateRoute allowedRoles={['ADMIN']}><KnowledgeBase /></PrivateRoute>} />
        <Route path="/admin/data-quality"      element={<PrivateRoute allowedRoles={['ADMIN']}><DataQuality /></PrivateRoute>} />
        <Route path="/admin/audit-logs"        element={<PrivateRoute allowedRoles={['ADMIN']}><AuditLogs /></PrivateRoute>} />
        <Route path="/admin/system-health"     element={<PrivateRoute allowedRoles={['ADMIN']}><SystemHealth /></PrivateRoute>} />
        <Route path="/admin/knowledge-graph"   element={<PrivateRoute allowedRoles={['ADMIN']}><AdminKnowledgeGraph /></PrivateRoute>} />
        <Route path="/admin/profile"           element={<PrivateRoute allowedRoles={['ADMIN']}><Profile /></PrivateRoute>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;

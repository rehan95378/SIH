import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, MapPin, Target, AlertTriangle, Activity,
  Cpu, BookOpen, FileText, User, LogOut, ChevronRight,
  Layers, GitBranch, Settings, Users, Database, Shield,
  BarChart2, Radio, Menu, X, Zap, Eye, MessageCircle, FlaskConical,
} from 'lucide-react';

const engineerNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/engineer/dashboard' },
  { label: 'Active Wells', icon: Radio, path: '/engineer/wells' },
  { label: 'Well Map', icon: MapPin, path: '/engineer/map' },
  { label: 'Offset Intelligence', icon: Target, path: '/engineer/offset-intelligence' },
  { label: 'Risk Radar', icon: AlertTriangle, path: '/engineer/risk-alerts' },
  { label: 'Digital Well Twin', icon: Cpu, path: '/engineer/digital-twin' },
  { label: 'Incidents', icon: Zap, path: '/engineer/incidents' },
  { label: 'Analytics', icon: BarChart2, path: '/engineer/analytics' },
  { label: 'AI Copilot', icon: MessageCircle, path: '/engineer/ai-assistant' },
  { label: 'Knowledge', icon: BookOpen, path: '/engineer/knowledge' },
  { label: 'Simulator', icon: FlaskConical, path: '/engineer/simulator' },
  { label: 'Reports', icon: FileText, path: '/engineer/reports' },
  { label: 'Profile', icon: User, path: '/engineer/profile' },
];

const managerNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/manager/dashboard' },
  { label: 'Operations', icon: Activity, path: '/manager/operations' },
  { label: 'All Wells', icon: Layers, path: '/manager/wells' },
  { label: 'Risk Overview', icon: AlertTriangle, path: '/manager/risk' },
  { label: 'Analytics', icon: BarChart2, path: '/manager/analytics' },
  { label: 'Incidents', icon: Zap, path: '/manager/incidents' },
  { label: 'AI Briefing', icon: MessageCircle, path: '/manager/ai-briefing' },
  { label: 'Reports', icon: FileText, path: '/manager/reports' },
  { label: 'Team Activity', icon: Users, path: '/manager/team' },
  { label: 'Profile', icon: User, path: '/manager/profile' },
];

const adminNav = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Users', icon: Users, path: '/admin/users' },
  { label: 'Wells', icon: Layers, path: '/admin/wells' },
  { label: 'Documents', icon: FileText, path: '/admin/reports' },
  { label: 'AI Extraction', icon: Cpu, path: '/admin/extraction-review' },
  { label: 'Verification', icon: Shield, path: '/admin/data-verification' },
  { label: 'Knowledge Base', icon: Database, path: '/admin/knowledge-base' },
  { label: 'Knowledge Graph', icon: GitBranch, path: '/admin/knowledge-graph' },
  { label: 'Data Quality', icon: Eye, path: '/admin/data-quality' },
  { label: 'Audit Logs', icon: Activity, path: '/admin/audit-logs' },
  { label: 'System Health', icon: Settings, path: '/admin/system-health' },
  { label: 'Profile', icon: User, path: '/admin/profile' },
];

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = user?.role === 'ADMIN' ? adminNav : user?.role === 'MANAGER' ? managerNav : engineerNav;
  const roleColors = {
    ENGINEER: { badge: 'bg-blue-100 text-blue-700', accent: '#2563EB', header: 'from-blue-900 to-slate-900' },
    MANAGER: { badge: 'bg-teal-100 text-teal-700', accent: '#0d9488', header: 'from-teal-900 to-slate-900' },
    ADMIN: { badge: 'bg-purple-100 text-purple-700', accent: '#7c3aed', header: 'from-purple-900 to-slate-900' },
  };
  const rc = roleColors[user?.role] || roleColors.ENGINEER;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-16'} flex-shrink-0 bg-slate-900 flex flex-col transition-all duration-200 ease-in-out`}>
        {/* Logo */}
        <div className="px-4 py-4 border-b border-slate-700 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-sm leading-tight">eRTMAC-NWIS</div>
              <div className="text-xs text-slate-400 mt-0.5 truncate">Nearby Wells Intelligence</div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(p => !p)} className="w-8 h-8 rounded-lg hover:bg-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0">
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Role badge */}
        {sidebarOpen && (
          <div className="px-4 py-3 border-b border-slate-700">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${rc.badge}`}>{user?.role}</span>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3">
          {navItems.map(item => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-all ${
                  active
                    ? 'bg-white/10 text-white font-medium'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
                {sidebarOpen && active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-400" />}
              </Link>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="border-t border-slate-700 p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{user?.name?.[0] || 'U'}</span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate">{user?.name}</div>
                <div className="text-xs text-slate-400 truncate">{user?.email}</div>
              </div>
            )}
            <button onClick={handleLogout} className="w-7 h-7 rounded-lg hover:bg-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0" title="Logout">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-screen-2xl mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;

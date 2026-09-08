import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './Layout.css';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/ingest', label: 'Upload evidence' },
  { to: '/entities', label: 'Entities' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/cases', label: 'Cases' }
];

export default function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">CN</span>
          <div>
            <strong>Crime Network</strong>
            <small>Intelligence workspace</small>
          </div>
        </div>
        <nav className="navigation" aria-label="Main navigation">
          {links.map((link) => (
            <NavLink
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              key={link.to}
              to={link.to}
            >
              {link.label}
            </NavLink>
          ))}
          {(user?.role === 'admin' || user?.role === 'investigator') && (
            <NavLink
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              to="/audit"
            >
              Audit log
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              to="/admin"
            >
              Admin overview
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              to="/admin/users"
            >
              Manage users
            </NavLink>
          )}
        </nav>
        <button className="logout-button" type="button" onClick={signOut}>
          Sign out
        </button>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <span className="topbar-label">Investigation workspace</span>
            <strong>{user?.email || 'Investigator'}</strong>
          </div>
          <span className="role-badge">{user?.role || 'analyst'}</span>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

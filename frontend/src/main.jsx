import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import { AdminRoute, ProtectedRoute, PublicRoute } from './components/RouteGuards.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Ingest from './pages/Ingest.jsx';
import Entities from './pages/Entities.jsx';
import Analytics from './pages/Analytics.jsx';
import Cases from './pages/Cases.jsx';
import Audit from './pages/Audit.jsx';
import AdminOverview from './pages/admin/AdminOverview.jsx';
import UserManagement from './pages/admin/UserManagement.jsx';
import './styles/tokens.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route element={<Login />} path="/login" />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route element={<Dashboard />} path="/dashboard" />
              <Route element={<Ingest />} path="/ingest" />
              <Route element={<Entities />} path="/entities" />
              <Route element={<Analytics />} path="/analytics" />
              <Route element={<Cases />} path="/cases" />
              <Route element={<Audit />} path="/audit" />
              <Route element={<AdminRoute />}>
                <Route element={<AdminOverview />} path="/admin" />
                <Route element={<UserManagement />} path="/admin/users" />
              </Route>
            </Route>
          </Route>
          <Route element={<Navigate replace to="/dashboard" />} path="*" />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
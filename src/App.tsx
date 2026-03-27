import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import Layout from './components/Layout';
import OnboardingModal from './components/OnboardingModal';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PropertiesPage from './pages/app/PropertiesPage';
import ConfigPage from './pages/app/ConfigPage';
import WeeklySchedulePage from './pages/app/WeeklySchedulePage';
import OTBSchedulePage from './pages/app/OTBSchedulePage';
import ActualsPage from './pages/app/ActualsPage';
import DNDTrackerPage from './pages/app/DNDTrackerPage';
import DatabasePage from './pages/app/DatabasePage';
import HowBuiltPage from './pages/HowBuiltPage';

// Require auth
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Demo app wrapper (read-only showcase)
function DemoApp() {
  return (
    <DataProvider mode="demo">
      <Layout isDemo>
        <Routes>
          <Route path="weekly" element={<WeeklySchedulePage />} />
          <Route path="otb" element={<OTBSchedulePage />} />
          <Route path="actuals" element={<ActualsPage />} />
          <Route path="dnd" element={<DNDTrackerPage />} />
          <Route path="database" element={<DatabasePage />} />
          <Route path="config" element={<ConfigPage />} />
          <Route path="*" element={<Navigate to="/demo/weekly" replace />} />
        </Routes>
      </Layout>
    </DataProvider>
  );
}

// Local app wrapper (no account required, saves to localStorage)
function LocalApp() {
  return (
    <DataProvider mode="local">
      <OnboardingModal />
      <Routes>
        <Route path="properties" element={<PropertiesPage />} />
        <Route path=":propertyId/*" element={<LocalPropertyApp />} />
        <Route path="*" element={<Navigate to="/local/properties" replace />} />
      </Routes>
    </DataProvider>
  );
}

function LocalPropertyApp() {
  return (
    <Layout>
      <Routes>
        <Route path="weekly" element={<WeeklySchedulePage />} />
        <Route path="otb" element={<OTBSchedulePage />} />
        <Route path="actuals" element={<ActualsPage />} />
        <Route path="dnd" element={<DNDTrackerPage />} />
        <Route path="database" element={<DatabasePage />} />
        <Route path="config" element={<ConfigPage />} />
        <Route path="*" element={<Navigate to="weekly" replace />} />
      </Routes>
    </Layout>
  );
}

function AuthApp() {
  const { user } = useAuth();
  return (
    <DataProvider mode="auth" userId={user?.id}>
      <Routes>
        <Route path="properties" element={<PropertiesPage />} />
        <Route path=":propertyId/*" element={<PropertyApp />} />
        <Route path="*" element={<Navigate to="/app/properties" replace />} />
      </Routes>
    </DataProvider>
  );
}

function PropertyApp() {
  return (
    <Layout>
      <Routes>
        <Route path="weekly" element={<WeeklySchedulePage />} />
        <Route path="otb" element={<OTBSchedulePage />} />
        <Route path="actuals" element={<ActualsPage />} />
        <Route path="dnd" element={<DNDTrackerPage />} />
        <Route path="database" element={<DatabasePage />} />
        <Route path="config" element={<ConfigPage />} />
        <Route path="*" element={<Navigate to="weekly" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/demo/*" element={<DemoApp />} />
          <Route path="/local/*" element={<LocalApp />} />
          <Route
            path="/app/*"
            element={
              <RequireAuth>
                <AuthApp />
              </RequireAuth>
            }
          />
          <Route path="/about" element={<HowBuiltPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

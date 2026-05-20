import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import Prescriptions from './pages/Prescriptions';
import Reports from './pages/Reports';

const AppLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

const AppContent = () => {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <AppLayout>
            <Dashboard />
          </AppLayout>
        } 
      />
      <Route 
        path="/inventory" 
        element={
          <AppLayout>
            <Inventory />
          </AppLayout>
        } 
      />
      <Route 
        path="/billing" 
        element={
          <AppLayout>
            <Billing />
          </AppLayout>
        } 
      />
      <Route 
        path="/prescriptions" 
        element={
          <AppLayout>
            <Prescriptions />
          </AppLayout>
        } 
      />
      <Route 
        path="/reports" 
        element={
          <AppLayout>
            <Reports />
          </AppLayout>
        } 
      />

      {/* Fallback routing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;

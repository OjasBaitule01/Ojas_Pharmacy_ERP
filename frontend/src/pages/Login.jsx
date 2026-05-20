import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Key, Mail, Lock } from 'lucide-react';

const Login = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleDemoAutofill = (username) => {
    setEmailOrUsername(username);
    setPassword('password123');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailOrUsername || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(emailOrUsername, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <div className="auth-header">
          <div className="auth-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <Activity size={36} style={{ stroke: 'var(--neon-cyan)', filter: 'drop-shadow(var(--shadow-neon))' }} />
            <span>OJAS ERP</span>
          </div>
          <p className="page-subtitle">Pharmacy & Inventory Management Platform</p>
        </div>

        {error && (
          <div className="badge badge-danger" style={{ width: '100%', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username or Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                id="username"
                className="form-input"
                placeholder="Enter username or email"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                style={{ paddingLeft: '44px' }}
                disabled={loading}
              />
              <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                id="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '44px' }}
                disabled={loading}
              />
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px', fontSize: '15px' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
          <span className="form-label" style={{ fontSize: '12px', textAlign: 'center', marginBottom: '12px' }}>
            Demo Accounts (Click to Autofill)
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              className="btn btn-secondary" 
              style={{ justifyContent: 'space-between', padding: '8px 16px', fontSize: '12px', width: '100%' }}
              onClick={() => handleDemoAutofill('admin')}
              type="button"
            >
              <span>🔑 Admin (Full Access)</span>
              <span style={{ color: 'var(--neon-cyan)', fontWeight: 'bold' }}>admin</span>
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ justifyContent: 'space-between', padding: '8px 16px', fontSize: '12px', width: '100%' }}
              onClick={() => handleDemoAutofill('pharmacist')}
              type="button"
            >
              <span>🔑 Pharmacist (Sales + Meds)</span>
              <span style={{ color: 'var(--neon-purple)', fontWeight: 'bold' }}>pharmacist</span>
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ justifyContent: 'space-between', padding: '8px 16px', fontSize: '12px', width: '100%' }}
              onClick={() => handleDemoAutofill('staff')}
              type="button"
            >
              <span>🔑 Staff (Sales & Uploads)</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>staff</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  DollarSign, 
  Package, 
  AlertTriangle, 
  FileText, 
  TrendingUp, 
  PackageMinus,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const Dashboard = () => {
  const { apiRequest } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/reports/dashboard');
      setStats(data);
    } catch (err) {
      setError(err.message || 'Error fetching dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div className="badge badge-info" style={{ padding: '16px 24px', fontSize: '16px' }}>
          Loading dashboard insights...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
        <AlertTriangle size={48} color="var(--neon-pink)" style={{ marginBottom: '16px' }} />
        <h3>Failed to load Dashboard</h3>
        <p style={{ color: 'var(--text-secondary)', margin: '8px 0 20px 0' }}>{error}</p>
        <button className="btn btn-primary" onClick={fetchStats}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <div className="header-action">
        <div>
          <h1 className="page-title">Pharmacy Dashboard</h1>
          <p className="page-subtitle">Welcome back. Here is the operational summary for today.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={fetchStats}>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-label">TODAY'S REVENUE</div>
          <div className="stat-value" style={{ color: 'var(--neon-cyan)' }}>
            ₹{stats.revenueToday.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="stat-desc">Calculated from today's invoices</div>
        </div>

        <div className="card stat-card purple">
          <div className="stat-label">TOTAL SALES TODAY</div>
          <div className="stat-value" style={{ color: 'var(--neon-purple)' }}>
            {stats.totalSalesCount}
          </div>
          <div className="stat-desc">Completed transactions</div>
        </div>

        <div className="card stat-card green">
          <div className="stat-label">MEDICINES REGISTERED</div>
          <div className="stat-value" style={{ color: 'var(--neon-green)' }}>
            {stats.totalMedicines}
          </div>
          <div className="stat-desc">Unique catalogued products</div>
        </div>

        <div className="card stat-card orange">
          <div className="stat-label">LOW STOCK ITEMS</div>
          <div className="stat-value" style={{ color: 'var(--neon-orange)' }}>
            {stats.lowStockCount}
          </div>
          <div className="stat-desc">Under low stock threshold</div>
        </div>

        <div className="card stat-card pink">
          <div className="stat-label">EXPIRED PRODUCTS</div>
          <div className="stat-value" style={{ color: 'var(--neon-pink)' }}>
            {stats.expiredCount}
          </div>
          <div className="stat-desc">Action required immediately</div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="charts-grid">
        {/* Weekly Trend Chart */}
        <div className="card">
          <div className="chart-header">
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="var(--neon-cyan)" />
              Weekly Sales Trend
            </h3>
            <span className="badge badge-info">Live Sync</span>
          </div>
          
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={stats.weeklySales} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--neon-cyan)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--neon-cyan)" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border-light)" strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="var(--text-secondary)" 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="var(--text-secondary)" 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => `₹${v}`}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#130f26', 
                    borderColor: 'var(--neon-cyan)',
                    borderRadius: '8px',
                    color: 'white',
                    fontFamily: 'var(--font-family)'
                  }} 
                  formatter={(val) => [`₹${val}`, 'Revenue']}
                  labelFormatter={(lbl, items) => items[0]?.payload?.date || lbl}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="var(--neon-cyan)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#salesGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="chart-header">
            <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="var(--neon-purple)" />
              Top Fast-Moving
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {stats.topMedicines.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                No sales data recorded yet.
              </div>
            ) : (
              stats.topMedicines.map((med, index) => (
                <div 
                  key={med._id || index}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div 
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: index === 0 ? 'var(--grad-accent)' : 'rgba(255,255,255,0.05)',
                        color: index === 0 ? '#000' : 'white',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px'
                      }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14px' }}>{med.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{med.totalQty} Units Sold</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--neon-cyan)' }}>
                    ₹{med.revenue.toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Operational Warnings / Alerts Section */}
      <div className="card">
        <h3 className="chart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <AlertTriangle size={20} color="var(--neon-orange)" />
          Operational Stock Warnings
        </h3>
        
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {stats.lowStockCount > 0 && (
            <div 
              style={{ 
                flex: 1, 
                minWidth: '280px', 
                padding: '16px', 
                borderRadius: 'var(--radius-md)', 
                background: 'rgba(255, 159, 67, 0.05)', 
                border: '1px solid rgba(255, 159, 67, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <PackageMinus color="var(--neon-orange)" size={24} />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '15px' }}>{stats.lowStockCount} Items Low in Stock</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Inventory replenishment suggested</div>
                </div>
              </div>
            </div>
          )}

          {stats.expiredCount > 0 && (
            <div 
              style={{ 
                flex: 1, 
                minWidth: '280px', 
                padding: '16px', 
                borderRadius: 'var(--radius-md)', 
                background: 'rgba(255, 78, 80, 0.05)', 
                border: '1px solid rgba(255, 78, 80, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle color="var(--neon-pink)" size={24} />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '15px' }}>{stats.expiredCount} Batches Expired</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Immediate stock removal required</div>
                </div>
              </div>
            </div>
          )}

          {stats.pendingPrescriptions > 0 && (
            <div 
              style={{ 
                flex: 1, 
                minWidth: '280px', 
                padding: '16px', 
                borderRadius: 'var(--radius-md)', 
                background: 'rgba(0, 242, 254, 0.05)', 
                border: '1px solid rgba(0, 242, 254, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileText color="var(--neon-cyan)" size={24} />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '15px' }}>{stats.pendingPrescriptions} Pending Prescriptions</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Awaiting pharmacist review and checkout</div>
                </div>
              </div>
            </div>
          )}

          {stats.lowStockCount === 0 && stats.expiredCount === 0 && stats.pendingPrescriptions === 0 && (
            <div style={{ width: '100%', textAlign: 'center', padding: '20px 0', color: 'var(--text-secondary)' }}>
              🟢 All operations running in optimal parameters. No current warnings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

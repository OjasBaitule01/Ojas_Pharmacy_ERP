import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FileSpreadsheet, 
  TrendingUp, 
  Pill, 
  Printer, 
  Search, 
  Download,
  AlertTriangle
} from 'lucide-react';

const Reports = () => {
  const { user, apiRequest } = useAuth();
  const [activeTab, setActiveTab] = useState('sales');
  const [sales, setSales] = useState([]);
  const [inventoryValue, setInventoryValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchReportData();
  }, [activeTab]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError('');
      if (activeTab === 'sales') {
        const data = await apiRequest('/sales');
        setSales(data);
      } else {
        const data = await apiRequest('/reports/inventory-value');
        setInventoryValue(data);
      }
    } catch (err) {
      setError(err.message || 'Error retrieving report data.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter Sales list based on search term
  const filteredSales = sales.filter(s => 
    s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    s.customerName.toLowerCase().includes(search.toLowerCase()) ||
    s.customerPhone.includes(search)
  );

  return (
    <div>
      {/* Header */}
      <div className="header-action no-print">
        <div>
          <h1 className="page-title">Operational Reports</h1>
          <p className="page-subtitle">Inspect sales invoice logs and real-time inventory valuations.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={16} />
            Print Report
          </button>
        </div>
      </div>

      {/* Tabs list (No-print) */}
      <div className="card no-print" style={{ padding: '10px', marginBottom: '24px', display: 'flex', gap: '8px' }}>
        <button 
          className={`btn btn-secondary ${activeTab === 'sales' ? 'btn-primary' : ''}`}
          style={{ flexGrow: 1, padding: '12px', border: 'none' }}
          onClick={() => setActiveTab('sales')}
        >
          <TrendingUp size={16} />
          Sales Invoice Log
        </button>
        {user.role !== 'Staff' && (
          <button 
            className={`btn btn-secondary ${activeTab === 'inventory' ? 'btn-primary' : ''}`}
            style={{ flexGrow: 1, padding: '12px', border: 'none' }}
            onClick={() => setActiveTab('inventory')}
          >
            <Pill size={16} />
            Inventory Asset Valuation
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="card" style={{ padding: '24px', textAlign: 'center', marginBottom: '24px' }}>
          <AlertTriangle size={32} color="var(--neon-pink)" style={{ marginBottom: '12px' }} />
          <h4>Failed to Load Report</h4>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 16px 0' }}>{error}</p>
          <button className="btn btn-primary" onClick={fetchReportData}>Reload Data</button>
        </div>
      )}

      {/* Active Tab Content Area */}
      <div className="card print-area" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="badge badge-info" style={{ padding: '10px 16px' }}>Generating report tables...</div>
          </div>
        ) : activeTab === 'sales' ? (
          
          /* TAB 1: Sales Invoice Log */
          <div>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Invoice Ledger</h3>
              <div style={{ position: 'relative', width: '280px' }}>
                <input
                  type="text"
                  placeholder="Filter by customer, invoice #..."
                  className="form-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="table-container" style={{ margin: 0 }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Invoice No.</th>
                    <th>Billing Date</th>
                    <th>Customer Name</th>
                    <th>Contact Phone</th>
                    <th>Payment</th>
                    <th>Operator</th>
                    <th style={{ textAlign: 'right' }}>Total Bill</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                        No invoice logs match filters.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map(sale => (
                      <tr key={sale._id}>
                        <td style={{ fontWeight: 'bold', color: 'var(--neon-cyan)', fontSize: '13px' }}>{sale.invoiceNumber}</td>
                        <td style={{ fontSize: '13px' }}>{new Date(sale.createdAt).toLocaleString('en-IN')}</td>
                        <td>{sale.customerName}</td>
                        <td>{sale.customerPhone}</td>
                        <td>
                          <span className={`badge ${sale.paymentMethod === 'Cash' ? 'badge-success' : 'badge-info'}`}>
                            {sale.paymentMethod}
                          </span>
                        </td>
                        <td>{sale.servedBy?.username || 'Staff'}</td>
                        <td style={{ fontWeight: '700', textAlign: 'right', color: 'var(--neon-cyan)' }}>
                          ₹{sale.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Overall Aggregate (Footer) */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                Total Sales Revenue: <span style={{ color: 'var(--neon-green)', fontSize: '18px', marginLeft: '10px' }}>
                  ₹{filteredSales.reduce((sum, s) => sum + s.totalAmount, 0).toFixed(2)}
                </span>
              </div>
            </div>

          </div>
        ) : (
          
          /* TAB 2: Inventory Valuations */
          inventoryValue && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Asset Ledger</h3>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>TOTAL ASSET COST</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--neon-orange)' }}>
                      ₹{inventoryValue.totalValue.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border-light)', paddingLeft: '20px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>EST. RETAIL VAL</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--neon-green)' }}>
                      ₹{inventoryValue.totalRetailValue.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="table-container" style={{ margin: 0 }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Product Code</th>
                      <th>Medicine Name</th>
                      <th>Category</th>
                      <th>Stock Qty</th>
                      <th>Unit Cost</th>
                      <th>Retail Price</th>
                      <th style={{ textAlign: 'right' }}>Total Asset Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryValue.medicines.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                          No assets in inventory.
                        </td>
                      </tr>
                    ) : (
                      inventoryValue.medicines.map(med => (
                        <tr key={med._id}>
                          <td style={{ fontWeight: 'bold', color: 'var(--neon-purple)', fontSize: '13px' }}>{med.code}</td>
                          <td style={{ fontWeight: '600' }}>{med.name}</td>
                          <td>{med.category}</td>
                          <td>{med.stock}</td>
                          <td>₹{med.costPrice.toFixed(2)}</td>
                          <td>₹{med.price.toFixed(2)}</td>
                          <td style={{ fontWeight: '600', textAlign: 'right' }}>
                            ₹{(med.stock * med.costPrice).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Reports;

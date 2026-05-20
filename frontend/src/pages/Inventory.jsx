import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  Filter, 
  X,
  Layers
} from 'lucide-react';

const Inventory = () => {
  const { user, apiRequest } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [filter, setFilter] = useState('all');

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  
  // Form States
  const [form, setForm] = useState({
    name: '',
    code: '',
    category: 'Analgesics',
    price: '',
    costPrice: '',
    stock: '',
    lowStockThreshold: '10',
    expiryDate: '',
    supplier: '',
    description: ''
  });

  const categories = ['All', 'Analgesics', 'Antibiotics', 'Antidiabetics', 'Cardiovascular', 'Antihistamines', 'Vitamins', 'Others'];

  useEffect(() => {
    fetchMedicines();
  }, [search, category, filter]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      let queryParams = [];
      if (search) queryParams.push(`search=${encodeURIComponent(search)}`);
      if (category) queryParams.push(`category=${encodeURIComponent(category)}`);
      if (filter && filter !== 'all') queryParams.push(`filter=${filter}`);
      
      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
      const data = await apiRequest(`/medicines${queryString}`);
      setMedicines(data);
    } catch (err) {
      setError(err.message || 'Error fetching medicines');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(''), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleOpenAddModal = () => {
    setEditingMedicine(null);
    setForm({
      name: '',
      code: `MED${Math.floor(100 + Math.random() * 900)}`,
      category: 'Analgesics',
      price: '',
      costPrice: '',
      stock: '',
      lowStockThreshold: '10',
      expiryDate: '',
      supplier: '',
      description: ''
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (med) => {
    setEditingMedicine(med);
    // Format expiry date to YYYY-MM-DD
    const expDate = med.expiryDate ? new Date(med.expiryDate).toISOString().split('T')[0] : '';
    setForm({
      name: med.name,
      code: med.code,
      category: med.category,
      price: med.price,
      costPrice: med.costPrice,
      stock: med.stock,
      lowStockThreshold: med.lowStockThreshold || '10',
      expiryDate: expDate,
      supplier: med.supplier,
      description: med.description || ''
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this medicine from inventory?')) return;
    try {
      await apiRequest(`/medicines/${id}`, { method: 'DELETE' });
      showToast('Medicine deleted successfully.');
      fetchMedicines();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code || !form.price || !form.costPrice || form.stock === '' || !form.expiryDate || !form.supplier) {
      showToast('Please fill all required fields.', true);
      return;
    }

    try {
      if (editingMedicine) {
        // Update
        await apiRequest(`/medicines/${editingMedicine._id}`, {
          method: 'PUT',
          body: form
        });
        showToast('Medicine updated successfully.');
      } else {
        // Create
        await apiRequest('/medicines', {
          method: 'POST',
          body: form
        });
        showToast('Medicine added successfully.');
      }
      setModalOpen(false);
      fetchMedicines();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const isExpired = (dateStr) => {
    return new Date(dateStr) < new Date();
  };

  const isNearExpiry = (dateStr) => {
    const today = new Date();
    const exp = new Date(dateStr);
    if (exp < today) return false;
    const diffTime = Math.abs(exp - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 90; // 3 months
  };

  return (
    <div>
      {/* Header */}
      <div className="header-action">
        <div>
          <h1 className="page-title">Inventory Control</h1>
          <p className="page-subtitle">Add, track, filter, and manage your medicine stock levels.</p>
        </div>
        {(user.role === 'Admin' || user.role === 'Pharmacist') && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} />
            Add New Medicine
          </button>
        )}
      </div>

      {/* Filter and Search Actions */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          
          {/* Search Box */}
          <div style={{ flexGrow: 1, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by code or medicine name..."
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          {/* Category Dropdown */}
          <div style={{ minWidth: '180px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--text-secondary)" />
            <select 
              className="form-select" 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c} Category</option>
              ))}
            </select>
          </div>

          {/* Warning Filters */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`btn btn-secondary ${filter === 'all' ? 'btn-primary' : ''}`}
              style={{ padding: '8px 16px', fontSize: '13px' }}
              onClick={() => setFilter('all')}
            >
              All Items
            </button>
            <button 
              className={`btn btn-secondary ${filter === 'lowStock' ? 'btn-danger' : ''}`}
              style={{ padding: '8px 16px', fontSize: '13px' }}
              onClick={() => setFilter('lowStock')}
            >
              Low Stock
            </button>
            <button 
              className={`btn btn-secondary ${filter === 'nearExpiry' ? 'btn-accent' : ''}`}
              style={{ padding: '8px 16px', fontSize: '13px' }}
              onClick={() => setFilter('nearExpiry')}
            >
              Near Expiry
            </button>
            <button 
              className={`btn btn-secondary ${filter === 'expired' ? 'btn-danger' : ''}`}
              style={{ padding: '8px 16px', fontSize: '13px' }}
              onClick={() => setFilter('expired')}
            >
              Expired
            </button>
          </div>

        </div>
      </div>

      {/* Grid List/Table of Medicines */}
      <div className="card" style={{ padding: '0px' }}>
        {loading && medicines.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div className="badge badge-info" style={{ padding: '10px 16px' }}>Fetching medicines list...</div>
          </div>
        ) : medicines.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-secondary)' }}>
            No medicines match the selected filter query.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Medicine Name</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Stock Quantity</th>
                  <th>Expiry Date</th>
                  <th>Supplier</th>
                  {(user.role === 'Admin' || user.role === 'Pharmacist') && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {medicines.map((med) => {
                  const expired = isExpired(med.expiryDate);
                  const nearExp = isNearExpiry(med.expiryDate);
                  const lowStock = med.stock <= med.lowStockThreshold;

                  return (
                    <tr key={med._id}>
                      <td style={{ fontWeight: 'bold', color: 'var(--neon-cyan)', fontSize: '13px' }}>{med.code}</td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{med.name}</div>
                        {med.description && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{med.description}</div>}
                      </td>
                      <td>{med.category}</td>
                      <td style={{ fontWeight: '600' }}>₹{med.price.toFixed(2)}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {med.stock}
                          {med.stock === 0 ? (
                            <span className="badge badge-danger">Out of Stock</span>
                          ) : lowStock ? (
                            <span className="badge badge-warning">Low Stock</span>
                          ) : (
                            <span className="badge badge-success">In Stock</span>
                          )}
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {new Date(med.expiryDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                          {expired ? (
                            <span className="badge badge-danger" title="Expired">Expired</span>
                          ) : nearExp ? (
                            <span className="badge badge-warning" title="Expires soon">Near Expiry</span>
                          ) : null}
                        </span>
                      </td>
                      <td>{med.supplier}</td>
                      
                      {(user.role === 'Admin' || user.role === 'Pharmacist') && (
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '8px', borderRadius: '6px' }}
                              onClick={() => handleOpenEditModal(med)}
                            >
                              <Edit2 size={14} />
                            </button>
                            {user.role === 'Admin' && (
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '8px', borderRadius: '6px', color: 'var(--neon-pink)' }}
                                onClick={() => handleDelete(med._id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Glassmorphic Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="page-title" style={{ fontSize: '20px' }}>
                {editingMedicine ? 'Edit Inventory Item' : 'Register New Medicine'}
              </h3>
              <button className="modal-close" onClick={() => setModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Medicine Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Paracetamol 500mg"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Product SKU/Code *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select 
                    className="form-select"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Supplier *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Apex Pharma"
                    value={form.supplier}
                    onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Purchase Price (Cost) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="₹8.00"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Retail Selling Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="₹15.00"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Stock Quantity *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="120"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Low Stock Threshold *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.lowStockThreshold}
                    onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Expiry Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-input"
                  style={{ height: '70px', resize: 'none' }}
                  placeholder="e.g. Schedule H drug. Store in cool place."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingMedicine ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Success Toast */}
      {successMsg && (
        <div className="toast">
          <span>{successMsg}</span>
        </div>
      )}

      {/* Floating Error Toast */}
      {error && (
        <div className="toast error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default Inventory;

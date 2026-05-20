import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Upload, 
  User, 
  Phone, 
  Layers, 
  Search, 
  X, 
  Plus, 
  ShoppingCart, 
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';

const Prescriptions = () => {
  const { user, apiRequest } = useAuth();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal Controllers
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  // Upload Form State
  const [form, setForm] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    doctorName: '',
    notes: '',
    medicines: [{ name: '', dosage: '', frequency: '', duration: '' }],
    imageUrl: ''
  });

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/prescriptions');
      setPrescriptions(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch prescriptions');
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

  // Add Row to Medicines list in form
  const addMedicineRow = () => {
    setForm({
      ...form,
      medicines: [...form.medicines, { name: '', dosage: '', frequency: '', duration: '' }]
    });
  };

  // Remove Row
  const removeMedicineRow = (index) => {
    if (form.medicines.length === 1) return;
    setForm({
      ...form,
      medicines: form.medicines.filter((_, i) => i !== index)
    });
  };

  // Change Value in row
  const handleMedRowChange = (index, field, value) => {
    const updated = form.medicines.map((med, i) => 
      i === index ? { ...med, [field]: value } : med
    );
    setForm({ ...form, medicines: updated });
  };

  // Mock File Upload (Convert image file to Base64)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, imageUrl: reader.result });
      showToast('Prescription document attached successfully.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientName || !form.patientPhone || !form.doctorName) {
      showToast('Please fill patient details and doctor name.', true);
      return;
    }

    // Filter out blank medicines
    const filteredMeds = form.medicines.filter(m => m.name.trim() !== '');
    if (filteredMeds.length === 0) {
      showToast('Please enter at least one prescribed medicine name.', true);
      return;
    }

    try {
      await apiRequest('/prescriptions', {
        method: 'POST',
        body: {
          ...form,
          medicines: filteredMeds
        }
      });
      showToast('Prescription uploaded successfully.');
      setUploadModalOpen(false);
      fetchPrescriptions();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const updated = await apiRequest(`/prescriptions/${id}/status`, {
        method: 'PUT',
        body: { status: newStatus }
      });
      setSelectedPrescription(updated);
      showToast(`Status updated to ${newStatus}.`);
      fetchPrescriptions();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  // Transfer Medicines to Billing page
  const handleDispenseShortcut = (prescription) => {
    // Quick checkout - we can mock adding them to the cart!
    // Since we don't have global Redux, we can cache it in localStorage and redirect to Billing page
    const cartItems = prescription.medicines.map(m => ({
      name: m.name,
      quantity: 1, // default quantity
      isFromPrescription: true
    }));

    localStorage.setItem('ojas_prescription_checkout', JSON.stringify({
      customerName: prescription.patientName,
      customerPhone: prescription.patientPhone,
      items: cartItems
    }));

    // Redirect to billing
    showToast('Redirecting to POS Checkout with prescription details...');
    setDetailModalOpen(false);
    setTimeout(() => {
      navigate('/billing');
    }, 1000);
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    const matchSearch = p.patientName.toLowerCase().includes(search.toLowerCase()) || 
                        p.patientPhone.includes(search) || 
                        p.doctorName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' ? true : p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="badge badge-warning">Pending</span>;
      case 'Dispensed': return <span className="badge badge-success">Dispensed</span>;
      case 'Cancelled': return <span className="badge badge-danger">Cancelled</span>;
      default: return null;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="header-action">
        <div>
          <h1 className="page-title">Prescription Desk</h1>
          <p className="page-subtitle">Upload physician prescriptions, view patient history, and issue billing.</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setForm({
            patientName: '',
            patientEmail: '',
            patientPhone: '',
            doctorName: '',
            notes: '',
            medicines: [{ name: '', dosage: '', frequency: '', duration: '' }],
            imageUrl: ''
          });
          setUploadModalOpen(true);
        }}>
          <Upload size={18} />
          Upload Prescription
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          
          <div style={{ flexGrow: 1, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by Patient Name, Phone or Doctor..."
              className="form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {['All', 'Pending', 'Dispensed', 'Cancelled'].map(status => (
              <button 
                key={status}
                className={`btn btn-secondary ${statusFilter === status ? 'btn-primary' : ''}`}
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Grid of Prescriptions */}
      <div className="card" style={{ padding: '0px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div className="badge badge-info" style={{ padding: '10px 16px' }}>Fetching records...</div>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-secondary)' }}>
            No prescription records found matching filters.
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Patient Name</th>
                  <th>Contact Number</th>
                  <th>Doctor Ref</th>
                  <th>Items Prescribed</th>
                  <th>Fulfillment Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrescriptions.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      {new Date(p.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ fontWeight: '600' }}>{p.patientName}</td>
                    <td>{p.patientPhone}</td>
                    <td>{p.doctorName}</td>
                    <td>
                      <span style={{ color: 'var(--neon-cyan)' }}>
                        {p.medicines.map(m => m.name).join(', ')}
                      </span>
                    </td>
                    <td>{getStatusBadge(p.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                        onClick={() => {
                          setSelectedPrescription(p);
                          setDetailModalOpen(true);
                        }}
                      >
                        Inspect details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Prescription Detail Modal */}
      {detailModalOpen && selectedPrescription && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h3 className="page-title" style={{ fontSize: '20px' }}>Prescription Details</h3>
                <p className="page-subtitle">Submitted: {new Date(selectedPrescription.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <button className="modal-close" onClick={() => setDetailModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>PATIENT NAME</div>
                <div style={{ fontWeight: '600' }}>{selectedPrescription.patientName}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{selectedPrescription.patientPhone}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{selectedPrescription.patientEmail || 'No Email'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>PHYSICIAN REFERENCE</div>
                <div style={{ fontWeight: '600' }}>{selectedPrescription.doctorName}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '8px' }}>FULFILLMENT</div>
                <div>{getStatusBadge(selectedPrescription.status)}</div>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: '600', marginBottom: '10px', fontSize: '14px' }}>Prescribed Medication</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedPrescription.medicines.map((med, index) => (
                  <div key={index} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontWeight: '600', color: 'white' }}>{med.name}</span>
                      {med.dosage && <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>({med.dosage})</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {med.frequency} | {med.duration}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedPrescription.notes && (
              <div style={{ marginBottom: '24px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', borderLeft: '3px solid var(--border-purple)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Physician Instructions</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>{selectedPrescription.notes}</div>
              </div>
            )}

            {selectedPrescription.imageUrl && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '8px' }}>Scanned Document Attachment</div>
                <img 
                  src={selectedPrescription.imageUrl} 
                  alt="Scanned Prescription Document" 
                  style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', border: '1px solid var(--border-light)', borderRadius: '8px' }} 
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '20px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedPrescription.status === 'Pending' && (user.role === 'Admin' || user.role === 'Pharmacist') && (
                  <>
                    <button 
                      className="btn btn-secondary" 
                      style={{ color: 'var(--neon-green)', borderColor: 'rgba(0,255,135,0.3)' }}
                      onClick={() => handleUpdateStatus(selectedPrescription._id, 'Dispensed')}
                    >
                      Mark Dispensed
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ color: 'var(--neon-pink)', borderColor: 'rgba(255,78,80,0.3)' }}
                      onClick={() => handleUpdateStatus(selectedPrescription._id, 'Cancelled')}
                    >
                      Cancel Order
                    </button>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={() => setDetailModalOpen(false)}>
                  Close
                </button>
                {selectedPrescription.status === 'Pending' && (
                  <button className="btn btn-primary" style={{ gap: '6px' }} onClick={() => handleDispenseShortcut(selectedPrescription)}>
                    <ShoppingCart size={14} />
                    Fulfill POS
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Upload Form Modal */}
      {uploadModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="page-title" style={{ fontSize: '20px' }}>Upload Doctor Prescription</h3>
              <button className="modal-close" onClick={() => setUploadModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Scan/Document Upload (Optional)</label>
                <div className="upload-dropzone">
                  <input 
                    type="file" 
                    id="docFile" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="docFile" style={{ cursor: 'pointer' }}>
                    <Upload size={32} className="upload-icon" />
                    <p style={{ fontWeight: '500', margin: '4px 0' }}>Click to select prescription image</p>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Supports JPG, PNG, PDF (base64 simulation)</span>
                  </label>
                </div>
                {form.imageUrl && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 255, 135, 0.05)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(0, 255, 135, 0.2)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--neon-green)', fontWeight: '500' }}>✓ Document attached.</span>
                    <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', border: 'none' }} onClick={() => setForm({ ...form, imageUrl: '' })}>Remove</button>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Patient Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ramesh Sharma"
                    value={form.patientName}
                    onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Patient Contact *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 9876543210"
                    value={form.patientPhone}
                    onChange={(e) => setForm({ ...form, patientPhone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Patient Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. ramesh@gmail.com"
                    value={form.patientEmail}
                    onChange={(e) => setForm({ ...form, patientEmail: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Doctor Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Dr. Preeti Gupta"
                    value={form.doctorName}
                    onChange={(e) => setForm({ ...form, doctorName: e.target.value })}
                  />
                </div>
              </div>

              {/* Medicines Grid Row Add */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Prescribed Medicines *</label>
                  <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '11px', gap: '4px' }} onClick={addMedicineRow}>
                    <Plus size={12} />
                    Add Med Row
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                  {form.medicines.map((med, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Medicine Name"
                        className="form-input"
                        style={{ padding: '8px' }}
                        value={med.name}
                        onChange={(e) => handleMedRowChange(index, 'name', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Dosage"
                        className="form-input"
                        style={{ padding: '8px' }}
                        value={med.dosage}
                        onChange={(e) => handleMedRowChange(index, 'dosage', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Freq."
                        className="form-input"
                        style={{ padding: '8px' }}
                        value={med.frequency}
                        onChange={(e) => handleMedRowChange(index, 'frequency', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Dur."
                        className="form-input"
                        style={{ padding: '8px' }}
                        value={med.duration}
                        onChange={(e) => handleMedRowChange(index, 'duration', e.target.value)}
                      />
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ padding: '8px', color: 'var(--neon-pink)', border: 'none', background: 'none' }}
                        disabled={form.medicines.length === 1}
                        onClick={() => removeMedicineRow(index)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Doctor Notes / Instructions</label>
                <textarea
                  className="form-input"
                  style={{ height: '60px', resize: 'none' }}
                  placeholder="Additional patient notes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setUploadModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Upload & Process
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Alert Notifications */}
      {successMsg && (
        <div className="toast">
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="toast error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default Prescriptions;

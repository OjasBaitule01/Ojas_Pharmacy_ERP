import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Trash2, 
  User, 
  Phone, 
  Plus, 
  Minus, 
  Receipt, 
  Printer, 
  X,
  CreditCard,
  Wallet,
  Coins
} from 'lucide-react';

const Billing = () => {
  const { apiRequest } = useAuth();
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState('');
  
  // Checkout States
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // API Call States
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastError, setToastError] = useState(false);

  // Print Invoice Modal
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);

  useEffect(() => {
    fetchMedicines();
  }, [search]);

  useEffect(() => {
    const cached = localStorage.getItem('ojas_prescription_checkout');
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (data.customerName) setCustomerName(data.customerName);
        if (data.customerPhone) setCustomerPhone(data.customerPhone);
        
        if (data.items && data.items.length > 0) {
          // Fetch all medicines to match by name
          apiRequest('/medicines').then(allMeds => {
            const itemsToAdd = [];
            for (const cachedItem of data.items) {
              const match = allMeds.find(m => m.name.toLowerCase().includes(cachedItem.name.toLowerCase()));
              if (match && match.stock > 0) {
                itemsToAdd.push({
                  medicineId: match._id,
                  name: match.name,
                  code: match.code,
                  price: match.price,
                  maxStock: match.stock,
                  quantity: cachedItem.quantity || 1
                });
              }
            }
            if (itemsToAdd.length > 0) {
              setCart(itemsToAdd);
              showToast(`Imported ${itemsToAdd.length} items from prescription!`);
            } else {
              showToast('Matching prescription medicines are out of stock or not found.', true);
            }
          }).catch(err => {
            console.error('Error matching prescription items', err);
          });
        }
      } catch (err) {
        console.error('Error parsing prescription cache', err);
      } finally {
        localStorage.removeItem('ojas_prescription_checkout');
      }
    }
  }, []);

  const fetchMedicines = async () => {
    try {
      const data = await apiRequest(`/medicines?search=${encodeURIComponent(search)}`);
      // Only show medicines with stock > 0 and not expired
      const today = new Date();
      const sellable = data.filter(m => m.stock > 0 && new Date(m.expiryDate) > today);
      setMedicines(sellable);
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (msg, isErr = false) => {
    setToastMsg(msg);
    setToastError(isErr);
    setTimeout(() => {
      setToastMsg('');
    }, 4000);
  };

  const addToCart = (med) => {
    const existing = cart.find(item => item.medicineId === med._id);
    if (existing) {
      if (existing.quantity >= med.stock) {
        showToast(`Cannot add more. Only ${med.stock} units available in stock.`, true);
        return;
      }
      setCart(cart.map(item => 
        item.medicineId === med._id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        medicineId: med._id,
        name: med.name,
        code: med.code,
        price: med.price,
        maxStock: med.stock,
        quantity: 1
      }]);
    }
    showToast(`${med.name} added to cart.`);
  };

  const incrementQty = (medId) => {
    const item = cart.find(item => item.medicineId === medId);
    if (item.quantity >= item.maxStock) {
      showToast(`Only ${item.maxStock} units available in stock.`, true);
      return;
    }
    setCart(cart.map(i => 
      i.medicineId === medId ? { ...i, quantity: i.quantity + 1 } : i
    ));
  };

  const decrementQty = (medId) => {
    const item = cart.find(i => i.medicineId === medId);
    if (item.quantity === 1) {
      removeFromCart(medId);
    } else {
      setCart(cart.map(i => 
        i.medicineId === medId ? { ...i, quantity: i.quantity - 1 } : i
      ));
    }
  };

  const removeFromCart = (medId) => {
    setCart(cart.filter(i => i.medicineId !== medId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const gstRate = 0.12; // 12% standard GST
    const gstAmount = Math.round((subtotal * gstRate) * 100) / 100;
    const discVal = Number(discount) || 0;
    const totalAmount = Math.max(0, Math.round((subtotal + gstAmount - discVal) * 100) / 100);

    return {
      subtotal,
      gstAmount,
      discount: discVal,
      totalAmount
    };
  };

  const { subtotal, gstAmount, totalAmount } = calculateTotals();

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('Cart is empty. Add medicines first.', true);
      return;
    }
    if (!customerName || !customerPhone) {
      showToast('Please enter customer name and phone number.', true);
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        customerName,
        customerPhone,
        items: cart,
        discount: Number(discount) || 0,
        paymentMethod
      };

      const result = await apiRequest('/sales', {
        method: 'POST',
        body: saleData
      });

      setCompletedSale(result);
      setInvoiceModalOpen(true);
      
      // Clear Billing Form
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscount('');
      setPaymentMethod('Cash');
      
      showToast('Sale checkout completed successfully!');
    } catch (err) {
      showToast(err.message || 'Checkout failed', true);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {/* Header */}
      <div className="header-action">
        <div>
          <h1 className="page-title">Billing & Sales (POS)</h1>
          <p className="page-subtitle">Generate bills, calculate taxes, print customer invoices.</p>
        </div>
      </div>

      <div className="billing-grid">
        
        {/* Left Side: Product Selector & List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Medicine Search Box */}
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Select Medicine</h3>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search catalog by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
            
            {/* Quick List for Search Results */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '16px', maxHeight: '300px', overflowY: 'auto' }}>
              {medicines.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', gridColumn: '1/-1', textAlign: 'center', padding: '20px 0' }}>
                  No in-stock medicines found.
                </p>
              ) : (
                medicines.map(med => (
                  <div 
                    key={med._id} 
                    onClick={() => addToCart(med)}
                    style={{ 
                      padding: '12px', 
                      background: 'rgba(255, 255, 255, 0.02)', 
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    className="medicine-pill-hover"
                  >
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{med.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <span>Price: ₹{med.price.toFixed(2)}</span>
                      <span style={{ color: med.stock <= med.lowStockThreshold ? 'var(--neon-orange)' : 'var(--neon-green)' }}>
                        Stock: {med.stock}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cart Table list */}
          <div className="card billing-cart">
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>Checkout Cart</h3>
            
            <div className="cart-items-list">
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                  Your checkout cart is empty.
                </div>
              ) : (
                cart.map(item => (
                  <div className="cart-item" key={item.medicineId}>
                    <div className="cart-item-details">
                      <span className="cart-item-name">{item.name}</span>
                      <span className="cart-item-price">₹{item.price.toFixed(2)} x {item.quantity}</span>
                    </div>
                    <div className="cart-item-actions">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button className="qty-btn" onClick={() => decrementQty(item.medicineId)}>
                          <Minus size={12} />
                        </button>
                        <span className="qty-val">{item.quantity}</span>
                        <button className="qty-btn" onClick={() => incrementQty(item.medicineId)}>
                          <Plus size={12} />
                        </button>
                      </div>
                      <span style={{ fontWeight: '600', fontSize: '14px', width: '70px', textAlign: 'right' }}>
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '6px', borderRadius: '4px', color: 'var(--neon-pink)', border: 'none' }}
                        onClick={() => removeFromCart(item.medicineId)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations Summary */}
            <div style={{ padding: '16px 0 0 0' }}>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>GST (12% Central/State)</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Discount (INR)</span>
                <span style={{ color: 'var(--neon-pink)' }}>-₹{(Number(discount) || 0).toFixed(2)}</span>
              </div>
              <div className="summary-total">
                <span>Total Amount Due</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Customer Details & Checkout */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={18} color="var(--neon-cyan)" />
            Customer Information
          </h3>

          <form onSubmit={handleCheckout}>
            <div className="form-group">
              <label className="form-label">Customer Mobile *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 9876543210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
                <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Customer Name *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramesh Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Applied Discount (₹)</label>
              <input
                type="number"
                className="form-input"
                placeholder="0.00"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '28px' }}>
              <label className="form-label">Payment Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cash')}
                  className={`btn btn-secondary ${paymentMethod === 'Cash' ? 'btn-primary' : ''}`}
                  style={{ fontSize: '12px', padding: '10px 4px', gap: '6px' }}
                >
                  <Coins size={14} />
                  Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`btn btn-secondary ${paymentMethod === 'UPI' ? 'btn-primary' : ''}`}
                  style={{ fontSize: '12px', padding: '10px 4px', gap: '6px' }}
                >
                  <Wallet size={14} />
                  UPI
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Card')}
                  className={`btn btn-secondary ${paymentMethod === 'Card' ? 'btn-primary' : ''}`}
                  style={{ fontSize: '12px', padding: '10px 4px', gap: '6px' }}
                >
                  <CreditCard size={14} />
                  Card
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px', gap: '10px' }}
              disabled={loading || cart.length === 0}
            >
              <Receipt size={18} />
              {loading ? 'Processing...' : 'Checkout & Generate Invoice'}
            </button>
          </form>
        </div>

      </div>

      {/* Printable Invoice Modal */}
      {invoiceModalOpen && completedSale && (
        <div className="modal-overlay">
          <div className="modal-content print-area" style={{ maxWidth: '600px' }}>
            <div className="modal-header" style={{ borderBottom: '1px dashed var(--border-light)', paddingBottom: '16px' }}>
              <div>
                <h3 className="page-title" style={{ fontSize: '20px' }}>Invoice Receipt</h3>
                <span className="badge badge-success" style={{ marginTop: '4px' }}>Paid ({completedSale.paymentMethod})</span>
              </div>
              <button className="modal-close no-print" onClick={() => setInvoiceModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '20px 0', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>OJAS PHARMACY ERP</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Sector 5, Salt Lake, Kolkata, India</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Tel: +91 98765 43210</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--neon-cyan)' }}>Invoice #: {completedSale.invoiceNumber}</div>
                  <div>Date: {new Date(completedSale.createdAt).toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', padding: '12px 0', marginBottom: '20px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Billed To:</div>
                <div>Name: {completedSale.customerName}</div>
                <div>Phone: {completedSale.customerPhone}</div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 0', color: 'var(--text-secondary)' }}>Item Medicine</th>
                    <th style={{ textAlign: 'center', padding: '8px 0', color: 'var(--text-secondary)' }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: '8px 0', color: 'var(--text-secondary)' }}>Unit Price</th>
                    <th style={{ textAlign: 'right', padding: '8px 0', color: 'var(--text-secondary)' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {completedSale.items.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px dashed var(--border-light)' }}>
                      <td style={{ padding: '8px 0', fontWeight: '500' }}>{item.name}</td>
                      <td style={{ padding: '8px 0', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>₹{item.price.toFixed(2)}</td>
                      <td style={{ padding: '8px 0', textAlign: 'right' }}>₹{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ display: 'flex', width: '220px', justifyContent: 'space-between' }}>
                  <span>Subtotal:</span>
                  <span>₹{completedSale.subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', width: '220px', justifyContent: 'space-between' }}>
                  <span>GST (12%):</span>
                  <span>₹{completedSale.gstAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', width: '220px', justifyContent: 'space-between' }}>
                  <span>Discount:</span>
                  <span style={{ color: 'var(--neon-pink)' }}>-₹{completedSale.discount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', width: '220px', justifyContent: 'space-between', borderTop: '2px solid var(--neon-cyan)', paddingTop: '10px', fontWeight: 'bold', color: 'var(--neon-cyan)' }}>
                  <span>Grand Total:</span>
                  <span>₹{completedSale.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px dashed var(--border-light)', paddingTop: '20px' }} className="no-print">
              <button className="btn btn-secondary" onClick={() => setInvoiceModalOpen(false)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={handlePrint}>
                <Printer size={16} />
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Alerts */}
      {toastMsg && (
        <div className={`toast ${toastError ? 'error' : ''}`}>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};

export default Billing;

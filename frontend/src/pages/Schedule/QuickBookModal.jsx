import { useState, useEffect } from 'react';
import { Calendar, User, DollarSign, X } from 'lucide-react';
import { customersAPI, bookingsAPI } from '../../api';
import './Schedule.css';

export default function QuickBookModal({ isOpen, onClose, slot, court, onBookingSuccess }) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ full_name: '', phone: '', email: '' });

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      setSelectedCustomerId('');
      setDepositAmount(court ? court.price_per_hour * 0.5 : ''); // Gợi ý cọc 50%
      setError('');
      setIsNewCustomer(false);
    }
  }, [isOpen, court]);

  const loadCustomers = async () => {
    try {
      const data = await customersAPI.getAll({ limit: 1000 });
      setCustomers(data);
    } catch (err) {
      console.error('Lỗi tải khách hàng:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!slot || !court) return;
    
    setLoading(true);
    setError('');

    try {
      let customerId = selectedCustomerId;

      // Nếu là khách hàng mới, tạo khách hàng trước
      if (isNewCustomer) {
        if (!newCustomerData.full_name || !newCustomerData.phone) {
          throw new Error('Vui lòng nhập tên và số điện thoại khách hàng');
        }
        const newCustomer = await customersAPI.create(newCustomerData);
        customerId = newCustomer.id;
      }

      if (!customerId) {
        throw new Error('Vui lòng chọn hoặc tạo khách hàng');
      }

      const bookingData = {
        customer_id: parseInt(customerId),
        court_id: court.id,
        time_slot_id: slot.id,
        deposit_amount: parseFloat(depositAmount) || 0,
        status: 'confirmed' // Mặc định confirmed khi đặt trực tiếp
      };

      await bookingsAPI.create(bookingData);
      onBookingSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Lỗi khi đặt sân');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !slot || !court) return null;

  const slotTimeStr = `${String(slot.start_time).substring(0, 5)} - ${String(slot.end_time).substring(0, 5)}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Đặt sân nhanh</h2>
          <button className="btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="info-box" style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>{court.name}</span>
                <span className="text-gradient" style={{ fontWeight: 600 }}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(court.price_per_hour)}/h
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Calendar size={16} />
                <span>{slot.date} | {slotTimeStr}</span>
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Khách hàng</label>
                <button 
                  type="button" 
                  style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.8rem', cursor: 'pointer' }}
                  onClick={() => setIsNewCustomer(!isNewCustomer)}
                >
                  {isNewCustomer ? 'Chọn khách hàng có sẵn' : '+ Thêm khách hàng mới'}
                </button>
              </div>

              {isNewCustomer ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius)' }}>
                  <input
                    type="text"
                    placeholder="Họ và tên (*)"
                    className="input-field"
                    value={newCustomerData.full_name}
                    onChange={e => setNewCustomerData({...newCustomerData, full_name: e.target.value})}
                    required={isNewCustomer}
                  />
                  <input
                    type="text"
                    placeholder="Số điện thoại (*)"
                    className="input-field"
                    value={newCustomerData.phone}
                    onChange={e => setNewCustomerData({...newCustomerData, phone: e.target.value})}
                    required={isNewCustomer}
                  />
                  <input
                    type="email"
                    placeholder="Email (tùy chọn)"
                    className="input-field"
                    value={newCustomerData.email}
                    onChange={e => setNewCustomerData({...newCustomerData, email: e.target.value})}
                  />
                </div>
              ) : (
                <div className="input-icon-wrap">
                  <User size={16} className="input-icon" />
                  <select 
                    className="input-field pl-icon" 
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    required={!isNewCustomer}
                  >
                    <option value="">-- Chọn khách hàng --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name} ({c.phone})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Tiền cọc (VNĐ)</label>
              <div className="input-icon-wrap">
                <DollarSign size={16} className="input-icon" />
                <input
                  type="number"
                  className="input-field pl-icon"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="10000"
                />
              </div>
            </div>

            {error && <div className="error-message" style={{ color: 'var(--danger-color)', fontSize: '0.85rem', padding: '0.5rem', background: 'rgba(220,38,38,0.1)', borderRadius: '4px' }}>{error}</div>}
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn-outline" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Xác nhận Đặt sân'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

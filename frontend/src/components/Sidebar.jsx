import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Pill, 
  FileText, 
  Receipt, 
  BarChart3, 
  LogOut,
  Activity
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  // Determine authorized menu items based on role
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Admin', 'Pharmacist', 'Staff'] },
    { name: 'Inventory', path: '/inventory', icon: Pill, roles: ['Admin', 'Pharmacist', 'Staff'] },
    { name: 'Billing (POS)', path: '/billing', icon: Receipt, roles: ['Admin', 'Pharmacist', 'Staff'] },
    { name: 'Prescriptions', path: '/prescriptions', icon: FileText, roles: ['Admin', 'Pharmacist', 'Staff'] },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['Admin', 'Pharmacist'] }
  ];

  const allowedMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Activity size={28} className="upload-icon" style={{ margin: 0, stroke: 'var(--neon-cyan)' }} />
        <span>OJAS ERP</span>
      </div>

      <nav className="sidebar-menu">
        {allowedMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <span className="user-name">{user.username}</span>
            <span className="user-role">{user.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

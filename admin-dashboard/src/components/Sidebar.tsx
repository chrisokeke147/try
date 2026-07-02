import { NavLink } from 'react-router-dom';
import logoMark from '../assets/logo-mark-white.png';
import { useAdminAuth } from '../context/AdminAuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Live Trips', emoji: '🗺️' },
  { to: '/drivers', label: 'Driver Approvals', emoji: '🛺' },
  { to: '/users', label: 'Users', emoji: '👤' },
  { to: '/ledger', label: 'Wallet & Ledger', emoji: '💳' },
  { to: '/waitlist', label: 'Waitlist', emoji: '📋' },
  { to: '/fraud-flags', label: 'Fraud Flags', emoji: '🚩' },
];

export function Sidebar() {
  const { email, logout } = useAdminAuth();

  return (
    <nav className="sidebar">
      <div>
        <img src={logoMark} alt="TRY" className="brand-logo" />
        <div className="brand-sub">Novapath Admin</div>
      </div>
      <ul>
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span>{item.emoji}</span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer">
        {email ? <div className="muted" style={{ marginBottom: 8 }}>{email}</div> : null}
        <button className="btn-secondary" onClick={logout}>Sign out</button>
      </div>
    </nav>
  );
}

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import logoMark from '../assets/logo-mark-white.png';

export function LoginPage() {
  const { login, loading, error } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) navigate('/');
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <img src={logoMark} alt="TRY" className="brand-logo" style={{ marginBottom: 8 }} />
        <h1>Admin sign in</h1>
        <p className="muted">Novapath staff only.</p>

        <label className="field-label" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="filter-select"
          autoComplete="username"
        />

        <label className="field-label" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="filter-select"
          autoComplete="current-password"
        />

        {error ? <p className="muted" style={{ color: 'var(--danger)' }}>{error}</p> : null}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

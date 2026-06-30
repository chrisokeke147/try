import { useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { adminFetch } from '../lib/adminFetch';

interface AccountUser {
  id: string;
  fullName: string;
  phoneNumber: string;
  role: 'rider' | 'driver' | 'admin';
  isSuspended: boolean;
}

// Support/dispute tool: look up every account (a phone number can be both a
// rider and a driver) and suspend/unsuspend either one. Backed by
// GET /admin/users?phone= and PATCH /admin/users/:id/(un)suspend.
export function UsersPage() {
  const [phone, setPhone] = useState('');
  const [results, setResults] = useState<AccountUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await adminFetch(`${API_BASE_URL}/admin/users?phone=${encodeURIComponent(phone.trim())}`);
      if (!res.ok) throw new Error('Search failed');
      setResults(await res.json());
    } catch (e: any) {
      setError(e.message ?? 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSuspend = async (user: AccountUser) => {
    const action = user.isSuspended ? 'unsuspend' : 'suspend';
    try {
      await adminFetch(`${API_BASE_URL}/admin/users/${user.id}/${action}`, { method: 'PATCH' });
      setResults((prev) => prev.map((u) => (u.id === user.id ? { ...u, isSuspended: !u.isSuspended } : u)));
    } catch {
      setError(`Failed to ${action} account`);
    }
  };

  return (
    <div>
      <h1>Users</h1>
      <p className="muted">Search by phone number to suspend or unsuspend a rider or driver account.</p>

      <form className="filter-row" onSubmit={search}>
        <input
          className="filter-select"
          placeholder="e.g. 09133753780"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error ? <p className="muted" style={{ color: 'var(--danger)' }}>{error}</p> : null}

      <div className="card-list">
        {searched && !loading && results.length === 0 && <p className="muted">No accounts found for that number.</p>}
        {results.map((user) => (
          <div key={user.id} className="driver-card">
            <div className="driver-info">
              <strong>{user.fullName}</strong>
              <span className="muted">{user.phoneNumber} · {user.role}</span>
              <span className={user.isSuspended ? 'plate-badge' : 'muted'}>
                {user.isSuspended ? 'Suspended' : 'Active'}
              </span>
            </div>
            <div className="actions">
              <button
                className={user.isSuspended ? 'btn-primary' : 'btn-secondary'}
                onClick={() => toggleSuspend(user)}
              >
                {user.isSuspended ? 'Unsuspend' : 'Suspend'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

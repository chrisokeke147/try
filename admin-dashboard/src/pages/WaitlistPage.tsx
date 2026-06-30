import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { adminFetch } from '../lib/adminFetch';

interface WaitlistEntry {
  id: string;
  phoneNumber: string;
  role: 'rider' | 'driver';
  city: string;
  createdAt: string;
}

interface WaitlistResponse {
  counts: { riders: number; drivers: number; total: number };
  entries: WaitlistEntry[];
}

// Pre-launch lead capture from the tryride.ng marketing site's waitlist form
// — see backend WaitlistModule / GET /admin/waitlist.
export function WaitlistPage() {
  const [data, setData] = useState<WaitlistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch(`${API_BASE_URL}/admin/waitlist`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load waitlist');
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>Waitlist</h1>
      <p className="muted">Early-access signups from the tryride.ng landing page.</p>

      <div className="summary-row">
        <div className="summary-card">
          <span className="muted">Riders waiting</span>
          <strong>{data ? data.counts.riders.toLocaleString() : '—'}</strong>
        </div>
        <div className="summary-card">
          <span className="muted">Drivers waiting</span>
          <strong>{data ? data.counts.drivers.toLocaleString() : '—'}</strong>
        </div>
        <div className="summary-card">
          <span className="muted">Total</span>
          <strong>{data ? data.counts.total.toLocaleString() : '—'}</strong>
        </div>
      </div>

      {error ? <p className="muted" style={{ color: 'var(--danger)' }}>{error}</p> : null}

      <table className="data-table">
        <thead>
          <tr>
            <th>Phone</th>
            <th>Role</th>
            <th>City</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {!loading && (!data || data.entries.length === 0) && (
            <tr><td colSpan={4} className="muted">No waitlist signups yet.</td></tr>
          )}
          {data?.entries.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.phoneNumber}</td>
              <td>{entry.role}</td>
              <td>{entry.city}</td>
              <td>{entry.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

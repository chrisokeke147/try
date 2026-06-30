import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { adminFetch } from '../lib/adminFetch';

interface LedgerRow {
  id: string;
  type: string;
  userName: string;
  amount: number;
  createdAt: string;
}

function isToday(isoDate: string) {
  return isoDate.startsWith(new Date().toISOString().slice(0, 10));
}

export function LedgerPage() {
  const [entries, setEntries] = useState<LedgerRow[]>([]);
  const [commissionAllTime, setCommissionAllTime] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState('All types');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch(`${API_BASE_URL}/admin/ledger`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load ledger');
        return res.json();
      })
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    // Computed server-side over every completed trip, not the capped
    // recent-entries list above, so it stays accurate as volume grows.
    adminFetch(`${API_BASE_URL}/admin/ledger/summary`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCommissionAllTime(data?.commissionAllTime ?? null))
      .catch(() => setCommissionAllTime(null));
  }, []);

  const types = useMemo(() => ['All types', ...Array.from(new Set(entries.map((r) => r.type)))], [entries]);
  const filtered = useMemo(
    () => (typeFilter === 'All types' ? entries : entries.filter((r) => r.type === typeFilter)),
    [entries, typeFilter],
  );

  const commissionToday = entries
    .filter((r) => r.type.startsWith('commission') && isToday(r.createdAt))
    .reduce((sum, r) => sum + Math.abs(r.amount), 0);
  const topUpsToday = entries
    .filter((r) => r.type === 'rider_topup' && isToday(r.createdAt))
    .reduce((sum, r) => sum + r.amount, 0);
  const withdrawalsToday = Math.abs(
    entries.filter((r) => r.type === 'driver_withdrawal' && isToday(r.createdAt)).reduce((sum, r) => sum + r.amount, 0),
  );

  return (
    <div>
      <h1>Wallet & Ledger</h1>

      <div className="summary-row">
        <div className="summary-card">
          <span className="muted">Commission today</span>
          <strong>₦{commissionToday.toLocaleString()}</strong>
        </div>
        <div className="summary-card">
          <span className="muted">Commission all-time</span>
          <strong>{commissionAllTime === null ? '—' : `₦${commissionAllTime.toLocaleString()}`}</strong>
        </div>
        <div className="summary-card">
          <span className="muted">Rider top-ups today</span>
          <strong>₦{topUpsToday.toLocaleString()}</strong>
        </div>
        <div className="summary-card">
          <span className="muted">Driver withdrawals today</span>
          <strong>₦{withdrawalsToday.toLocaleString()}</strong>
        </div>
      </div>

      <div className="filter-row">
        <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          {types.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <span className="muted">{loading ? 'Loading…' : `${filtered.length} entries`}</span>
      </div>

      {error ? <p className="muted" style={{ color: 'var(--danger)' }}>{error}</p> : null}

      <table className="data-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>User</th>
            <th>Amount</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {!loading && filtered.length === 0 && (
            <tr><td colSpan={4} className="muted">No ledger entries yet.</td></tr>
          )}
          {filtered.map((row) => (
            <tr key={row.id}>
              <td>{row.type}</td>
              <td>{row.userName}</td>
              <td className={row.amount < 0 ? 'negative' : 'positive'}>₦{row.amount.toLocaleString()}</td>
              <td>{row.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

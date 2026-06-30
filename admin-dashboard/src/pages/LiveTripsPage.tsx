import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { adminFetch } from '../lib/adminFetch';

interface Trip {
  id: string;
  riderName: string;
  driverName: string | null;
  status: string;
  paymentMethod: 'wallet' | 'cash';
  estimatedFare?: number;
  finalFare?: number;
  createdAt: string;
}

const ACTIVE_STATUSES = new Set(['requested', 'matched', 'driver_enroute', 'in_progress']);

export function LiveTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch(`${API_BASE_URL}/admin/trips`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load trips');
        return res.json();
      })
      .then(setTrips)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const statuses = useMemo(() => ['All statuses', ...Array.from(new Set(trips.map((t) => t.status)))], [trips]);
  const filtered = useMemo(
    () => (statusFilter === 'All statuses' ? trips : trips.filter((t) => t.status === statusFilter)),
    [trips, statusFilter],
  );

  const activeCount = filtered.filter((t) => ACTIVE_STATUSES.has(t.status)).length;
  const totalFare = filtered.reduce((sum, t) => sum + (t.finalFare ?? t.estimatedFare ?? 0), 0);

  return (
    <div>
      <h1>Live Trips</h1>
      <p className="muted">Onitsha pilot, expanding across Anambra — real-time trip monitoring.</p>

      <div className="filter-row">
        <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {statuses.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <span className="muted">{loading ? 'Loading…' : `${filtered.length} trips`}</span>
      </div>

      {error ? <p className="muted" style={{ color: 'var(--danger)' }}>{error}</p> : null}

      <div className="summary-row">
        <div className="summary-card">
          <span className="muted">Active trips</span>
          <strong>{activeCount}</strong>
        </div>
        <div className="summary-card">
          <span className="muted">Fares (filtered)</span>
          <strong>₦{totalFare.toLocaleString()}</strong>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Rider</th>
            <th>Driver</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Fare</th>
          </tr>
        </thead>
        <tbody>
          {!loading && filtered.length === 0 && (
            <tr><td colSpan={5} className="muted">No trips yet.</td></tr>
          )}
          {filtered.map((trip) => (
            <tr key={trip.id}>
              <td>{trip.riderName}</td>
              <td>{trip.driverName ?? '—'}</td>
              <td><span className="status-badge">{trip.status}</span></td>
              <td>{trip.paymentMethod}</td>
              <td>₦{trip.finalFare ?? trip.estimatedFare ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { adminFetch } from '../lib/adminFetch';

interface FraudFlag {
  id: string;
  type: 'rapid_cancellations' | 'trip_velocity' | 'short_trip_pattern';
  userId: string | null;
  userPhone: string | null;
  tripId: string | null;
  reason: string;
  createdAt: string;
}

const TYPE_LABEL: Record<FraudFlag['type'], string> = {
  rapid_cancellations: 'Rapid cancellations',
  trip_velocity: 'Trip velocity',
  short_trip_pattern: 'Short-trip pattern',
};

// A review queue only — see backend FraudFlag's doc comment. Nothing here
// auto-suspends anyone; an admin decides whether a flag is worth acting on
// (via the Users page's suspend button) after looking at the flagged trip.
export function FraudFlagsPage() {
  const [flags, setFlags] = useState<FraudFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminFetch(`${API_BASE_URL}/admin/fraud-flags`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load fraud flags');
        return res.json();
      })
      .then(setFlags)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>Fraud Flags</h1>
      <p className="muted">Automated rule-based signals for review — nothing here is auto-blocked.</p>

      {error ? <p className="muted" style={{ color: 'var(--danger)' }}>{error}</p> : null}

      <table className="data-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Reason</th>
            <th>Phone</th>
            <th>User ID</th>
            <th>Trip ID</th>
            <th>Flagged</th>
          </tr>
        </thead>
        <tbody>
          {!loading && flags.length === 0 && (
            <tr><td colSpan={6} className="muted">No fraud flags — nothing suspicious detected yet.</td></tr>
          )}
          {flags.map((flag) => (
            <tr key={flag.id}>
              <td>{TYPE_LABEL[flag.type]}</td>
              <td>{flag.reason}</td>
              <td>{flag.userPhone ?? '—'}</td>
              <td>{flag.userId ?? '—'}</td>
              <td>{flag.tripId ?? '—'}</td>
              <td>{flag.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

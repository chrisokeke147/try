import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../config/api';
import { adminFetch } from '../lib/adminFetch';

interface Driver {
  id: string;
  fullName: string;
  phoneNumber: string;
  nin: string;
  city: string;
  tricyclePlateNumber: string;
  profilePhotoUrl: string;
  tricyclePlatePhotoUrl: string;
  kycStatus: string;
}

export function DriverApprovalsPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [cityFilter, setCityFilter] = useState('All cities');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    adminFetch(`${API_BASE_URL}/admin/drivers?status=pending`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load drivers');
        return res.json();
      })
      .then(setDrivers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const decide = async (id: string, action: 'approve' | 'reject') => {
    try {
      await adminFetch(`${API_BASE_URL}/admin/drivers/${id}/${action}`, { method: 'PATCH' });
      setDrivers((prev) => prev.filter((d) => d.id !== id));
    } catch {
      setError(`Failed to ${action} driver`);
    }
  };

  const cities = useMemo(() => ['All cities', ...Array.from(new Set(drivers.map((d) => d.city).filter(Boolean)))], [drivers]);
  const filtered = useMemo(
    () => (cityFilter === 'All cities' ? drivers : drivers.filter((d) => d.city === cityFilter)),
    [drivers, cityFilter],
  );

  return (
    <div>
      <h1>Driver KYC Approvals</h1>
      <p className="muted">Review profile photo, NIN, license, plate number + photo, and levy receipt before approving.</p>

      <div className="filter-row">
        <select className="filter-select" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
        <span className="muted">{loading ? 'Loading…' : `${filtered.length} pending`}</span>
      </div>

      {error ? <p className="muted" style={{ color: 'var(--danger)' }}>{error}</p> : null}

      <div className="card-list">
        {!loading && filtered.length === 0 && <p className="muted">No pending drivers.</p>}
        {filtered.map((driver) => (
          <div key={driver.id} className="driver-card">
            <img src={driver.profilePhotoUrl} alt={driver.fullName} className="avatar" />
            <div className="driver-info">
              <strong>{driver.fullName}</strong>
              <span className="muted">{driver.phoneNumber} · {driver.city}</span>
              <span className="muted">NIN: {driver.nin}</span>
              <span className="plate-badge">{driver.tricyclePlateNumber}</span>
            </div>
            <img src={driver.tricyclePlatePhotoUrl} alt="Tricycle plate" className="plate-photo" />
            <div className="actions">
              <button className="btn-primary" onClick={() => decide(driver.id, 'approve')}>Approve</button>
              <button className="btn-secondary" onClick={() => decide(driver.id, 'reject')}>Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

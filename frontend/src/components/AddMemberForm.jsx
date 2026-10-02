import { useState } from 'react';
import { addMember } from '../api.js';

const ZONES = ['Asia/Kolkata', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo', 'Australia/Sydney'];

export default function AddMemberForm() {
  const [form, setForm] = useState({ name: '', role: '', timezone: ZONES[0] });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try { await addMember(form); setForm({ ...form, name: '', role: '' }); setError(''); }
    catch (err) { setError(err.message); }
  };

  return (
    <form className="add" onSubmit={submit}>
      <input placeholder="Name" value={form.name} onChange={set('name')} aria-label="Name" required />
      <input placeholder="Role" value={form.role} onChange={set('role')} aria-label="Role" required />
      <select value={form.timezone} onChange={set('timezone')} aria-label="Timezone">
        {ZONES.map((z) => <option key={z}>{z}</option>)}
      </select>
      <button type="submit">Add member</button>
      {error && <div className="err" role="alert">{error}</div>}
    </form>
  );
}

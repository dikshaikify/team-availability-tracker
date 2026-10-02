import { useCallback, useEffect, useState } from 'react';
import { getMembers, getActivity, setStatus, removeMember, subscribe } from './api.js';
import MemberCard, { STATUSES, ICON } from './components/MemberCard.jsx';
import AddMemberForm from './components/AddMemberForm.jsx';
import ActivityFeed from './components/ActivityFeed.jsx';

export default function App() {
  const [members, setMembers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [live, setLive] = useState(false);
  const [error, setError] = useState('');
  const [, tick] = useState(0);

  const loadActivity = useCallback(() => { getActivity().then(setActivity).catch(() => {}); }, []);
  const load = useCallback(() => {
    getMembers()
      .then((m) => { setMembers(m); setError(''); })
      .catch(() => setError('Could not load the team. Check your connection; retrying automatically.'));
    loadActivity();
  }, [loadActivity]);

  useEffect(() => {
    load();
    const upsert = (u) => {
      setMembers((cur) => (cur.some((m) => m.id === u.id) ? cur.map((m) => (m.id === u.id ? u : m)) : [...cur, u]));
      loadActivity();
    };
    const unsub = subscribe(
      { status: upsert, added: upsert, removed: ({ id }) => setMembers((cur) => cur.filter((m) => m.id !== id)) },
      () => { setLive(true); load(); },
      () => setLive(false)
    );
    const poll = setInterval(load, 30000);   // safety-net refresh
    const clock = setInterval(() => tick((n) => n + 1), 60000);
    return () => { unsub(); clearInterval(poll); clearInterval(clock); };
  }, [load, loadActivity]);

  const change = async (member, status) => {
    if (member.status === status) return;
    const prev = member.status;
    const patch = (s) => setMembers((cur) => cur.map((m) => (m.id === member.id ? { ...m, status: s } : m)));
    patch(status); // optimistic
    try { await setStatus(member.id, status); setError(''); }
    catch { patch(prev); setError(`Could not update ${member.name}. Status restored to ${prev}.`); }
  };

  const remove = async (member) => {
    if (!window.confirm(`Remove ${member.name} from the team?`)) return;
    try { await removeMember(member.id); setMembers((cur) => cur.filter((m) => m.id !== member.id)); }
    catch (e) { setError(e.message); }
  };

  const q = query.trim().toLowerCase();
  const visible = members.filter(
    (m) => (filter === 'All' || m.status === filter) && `${m.name} ${m.role}`.toLowerCase().includes(q)
  );

  return (
    <main>
      <header>
        <h1>Who's available right now</h1>
        <div className={`live ${live ? 'on' : ''}`}><span className="dot" />{live ? 'Live' : 'Reconnecting…'}</div>
      </header>

      <div className="summary">
        {['All', ...STATUSES].map((s) => (
          <button key={s} className={`chip ${s}`} aria-pressed={filter === s} onClick={() => setFilter(s)}>
            {ICON[s] || ''} {s === 'All' ? members.length : members.filter((m) => m.status === s).length} {s}
          </button>
        ))}
        <input className="search" type="search" placeholder="Search name or role" value={query}
          onChange={(e) => setQuery(e.target.value)} aria-label="Search team" />
      </div>

      <div className="layout">
        <section>
          <div className="grid">
            {visible.map((m) => <MemberCard key={m.id} member={m} onChange={change} onRemove={remove} />)}
          </div>
          {visible.length === 0 && <p className="meta">No one matches. Clear the search or pick a different filter.</p>}
          <AddMemberForm />
          <div className="err" role="alert">{error}</div>
        </section>
        <ActivityFeed items={activity} />
      </div>
    </main>
  );
}

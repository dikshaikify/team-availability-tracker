import { ago } from '../time.js';

export default function ActivityFeed({ items }) {
  return (
    <aside className="feed">
      <h2>Recent activity</h2>
      {items.length === 0 && <p className="meta">No changes yet. Change a status to see it here.</p>}
      <ul>
        {items.map((a) => (
          <li key={a.id}>
            <strong>{a.member_name}</strong>{' '}
            {a.from_status ? <>went {a.from_status} → {a.to_status}</> : <>joined as {a.to_status}</>}
            <div className="meta">{ago(a.at)}</div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

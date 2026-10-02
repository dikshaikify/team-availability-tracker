import { ago } from '../time.js';

export const STATUSES = ['Available', 'Busy', 'Away'];
export const ICON = { Available: '●', Busy: '■', Away: '▲' }; // shape + text, not colour alone

const localTime = (tz) =>
  new Intl.DateTimeFormat([], { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(new Date());

export default function MemberCard({ member, onChange, onRemove }) {
  const city = member.timezone.split('/').pop().replace('_', ' ');
  return (
    <article className={`card ${member.status}`}>
      <div className="top">
        <div>
          <div className="name">{member.name}</div>
          <div className="meta">{member.role} · {city} {localTime(member.timezone)}</div>
        </div>
        <span className="badge">{ICON[member.status]} {member.status}</span>
      </div>
      <div className="seg" role="group" aria-label={`Set status for ${member.name}`}>
        {STATUSES.map((s) => (
          <button key={s} className={s} aria-pressed={member.status === s} onClick={() => onChange(member, s)}>
            {s}
          </button>
        ))}
      </div>
      <div className="foot">
        <span className="meta">Updated {ago(member.updated_at)}</span>
        <button className="link" onClick={() => onRemove(member)}>Remove</button>
      </div>
    </article>
  );
}

const express = require('express');
const cors = require('cors');
const { DatabaseSync } = require('node:sqlite'); // built into Node 22.13+, nothing to compile
const fs = require('fs');
const path = require('path');

const STATUSES = ['Available', 'Busy', 'Away'];
const db = new DatabaseSync(process.env.DB_PATH || path.join(__dirname, 'team.db'));
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

const getMember = (id) => db.prepare('SELECT * FROM members WHERE id = ?').get(id);
const logActivity = (m, from, to) =>
  db.prepare('INSERT INTO activity (member_id, member_name, from_status, to_status) VALUES (?, ?, ?, ?)')
    .run(m.id, m.name, from, to);
const validTz = (tz) => { try { new Intl.DateTimeFormat([], { timeZone: tz }); return true; } catch { return false; } };

if (db.prepare('SELECT COUNT(*) AS c FROM members').get().c === 0) {
  const seed = [
    ['Team Member 1', 'Design', 'Europe/London', 'Busy'],
    ['Team Member 2', 'Product', 'Asia/Kolkata', 'Away'],
    ['Team Member 3', 'Engineering', 'Europe/London', 'Available'],
    ['Team Member 4', 'QA', 'Europe/London', 'Away'],
    ['Team Member 5', 'QA', 'Europe/London', 'Busy'],
    ['Team Member 6', 'Product', 'America/New_York', 'Away'],
  ];
  const ins = db.prepare('INSERT INTO members (name, role, timezone, status) VALUES (?, ?, ?, ?)');
  db.exec('BEGIN');
  seed.forEach((r) => ins.run(...r));
  db.exec('COMMIT');
}

const app = express();
app.use(cors());
app.use(express.json());

// Live updates (Server-Sent Events)
const clients = new Set();
const broadcast = (event, data) => {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach((res) => res.write(msg));
};

app.get('/api/members', (req, res) => {
  res.json(db.prepare('SELECT * FROM members ORDER BY id').all());
});

app.post('/api/members', (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  const role = String(req.body?.role ?? '').trim();
  const timezone = String(req.body?.timezone ?? '').trim();
  if (!name || name.length > 60) return res.status(400).json({ error: 'Name is required (max 60 characters).' });
  if (!role || role.length > 40) return res.status(400).json({ error: 'Role is required (max 40 characters).' });
  if (!validTz(timezone)) return res.status(400).json({ error: 'Timezone must be a valid name like Asia/Kolkata.' });
  const info = db.prepare('INSERT INTO members (name, role, timezone) VALUES (?, ?, ?)').run(name, role, timezone);
  const member = getMember(Number(info.lastInsertRowid));
  logActivity(member, null, member.status);
  broadcast('added', member);
  res.status(201).json(member);
});

app.patch('/api/members/:id/status', (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${STATUSES.join(', ')}` });
  }
  const before = getMember(req.params.id);
  if (!before) return res.status(404).json({ error: 'Member not found' });
  if (before.status === status) return res.json(before);
  db.prepare("UPDATE members SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, before.id);
  const member = getMember(before.id);
  logActivity(member, before.status, status);
  broadcast('status', member);
  res.json(member);
});

app.delete('/api/members/:id', (req, res) => {
  const member = getMember(req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });
  db.prepare('DELETE FROM members WHERE id = ?').run(member.id);
  broadcast('removed', { id: member.id });
  res.status(204).end();
});

app.get('/api/activity', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 15, 50);
  res.json(db.prepare('SELECT * FROM activity ORDER BY id DESC LIMIT ?').all(limit));
});

app.get('/api/events', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders();
  res.write('retry: 3000\n\n');
  clients.add(res);
  const ping = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => { clearInterval(ping); clients.delete(res); });
});

app.get('/health', (req, res) => res.send('ok'));

// Production: serve the built React app from the same server (one deployed URL)
const dist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Team availability tracker on :${port}`));

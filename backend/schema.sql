CREATE TABLE IF NOT EXISTS members (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL,
  timezone   TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'Available'
             CHECK (status IN ('Available','Busy','Away')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id   INTEGER NOT NULL,
  member_name TEXT NOT NULL,
  from_status TEXT,
  to_status   TEXT NOT NULL,
  at          TEXT NOT NULL DEFAULT (datetime('now'))
);

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      location TEXT NOT NULL,
      deadline TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS responses (
      event_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      display_name TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('yes', 'no', 'maybe')),
      responded_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (event_id, user_id)
    );
  `);
}

init().catch(console.error);

module.exports = {
  async createEvent(event) {
    await pool.query(
      `INSERT INTO events (id, group_id, title, date, location, deadline, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [event.id, event.group_id, event.title, event.date, event.location, event.deadline, event.created_by]
    );
  },

  async getEvent(eventId) {
    const { rows } = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
    return rows[0] || null;
  },

  async getActiveEventByGroup(groupId) {
    const { rows } = await pool.query(
      `SELECT * FROM events
       WHERE group_id = $1 AND deadline >= CURRENT_DATE
       ORDER BY created_at DESC LIMIT 1`,
      [groupId]
    );
    return rows[0] || null;
  },

  async upsertResponse({ event_id, user_id, display_name, status }) {
    await pool.query(
      `INSERT INTO responses (event_id, user_id, display_name, status, responded_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (event_id, user_id) DO UPDATE SET
         status = $4, display_name = $3, responded_at = NOW()`,
      [event_id, user_id, display_name, status]
    );
  },

  async getResponses(eventId) {
    const { rows } = await pool.query('SELECT * FROM responses WHERE event_id = $1', [eventId]);
    return rows;
  },

  async getEventsNeedingReminder() {
    const { rows } = await pool.query(
      `SELECT * FROM events WHERE deadline = CURRENT_DATE + INTERVAL '1 day'`
    );
    return rows;
  },
};

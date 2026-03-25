const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data.json');

function load() {
  if (!fs.existsSync(DATA_FILE)) {
    return { events: {}, responses: {} };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function save(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
  createEvent(event) {
    const data = load();
    data.events[event.id] = { ...event, created_at: new Date().toISOString() };
    save(data);
  },

  getEvent(eventId) {
    return load().events[eventId] || null;
  },

  getActiveEventByGroup(groupId) {
    const { events } = load();
    const today = new Date().toISOString().slice(0, 10);
    return Object.values(events)
      .filter(e => e.group_id === groupId && e.deadline >= today)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] || null;
  },

  upsertResponse({ event_id, user_id, display_name, status }) {
    const data = load();
    if (!data.responses[event_id]) data.responses[event_id] = {};
    data.responses[event_id][user_id] = {
      display_name,
      status,
      responded_at: new Date().toISOString(),
    };
    save(data);
  },

  getResponses(eventId) {
    const { responses } = load();
    const map = responses[eventId] || {};
    return Object.entries(map).map(([user_id, r]) => ({ user_id, ...r }));
  },

  getEventsNeedingReminder() {
    const { events } = load();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    return Object.values(events).filter(e => e.deadline === tomorrowStr);
  },
};

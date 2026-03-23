import { openDB } from 'idb';

const DB_NAME = 'pruning-advisor';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('date', 'date');
        store.createIndex('species', 'species');
      }
    },
  });
}

export async function saveSession(session) {
  const db = await getDB();
  const id = await db.add(STORE_NAME, {
    ...session,
    date: session.date || new Date().toISOString(),
  });
  return id;
}

export async function getSessions() {
  const db = await getDB();
  const sessions = await db.getAll(STORE_NAME);
  return sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function deleteSession(id) {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

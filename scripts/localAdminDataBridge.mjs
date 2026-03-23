import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';
import admin from 'firebase-admin';

const port = Number(process.env.LOCAL_ADMIN_DATA_BRIDGE_PORT || 8790);
const serviceAccountPath = process.env.LOCAL_FIREBASE_SERVICE_ACCOUNT_PATH;
const allowedOrigin = process.env.LOCAL_ADMIN_DATA_BRIDGE_ALLOW_ORIGIN || '*';

if (!serviceAccountPath) {
  console.error('[localAdminDataBridge] Missing LOCAL_FIREBASE_SERVICE_ACCOUNT_PATH');
  process.exit(1);
}

const rawServiceAccount = await readFile(serviceAccountPath, 'utf8');
const serviceAccount = JSON.parse(rawServiceAccount);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(payload));
};

const mapDocs = (snapshot) => snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

const collectionReaders = {
  bookings: async () => {
    const snapshot = await db.collection('bookings').orderBy('pickupDate', 'desc').limit(1000).get();
    return mapDocs(snapshot);
  },
  locations: async () => {
    const snapshot = await db.collection('locations').get();
    return mapDocs(snapshot);
  },
  inquiries: async () => {
    const snapshot = await db.collection('inquiries').get();
    return mapDocs(snapshot)
      .sort((left, right) => new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime());
  },
  daily_closings: async () => {
    const snapshot = await db.collection('daily_closings').orderBy('date', 'desc').limit(500).get();
    return mapDocs(snapshot);
  },
  expenditures: async () => {
    const snapshot = await db.collection('expenditures').orderBy('date', 'desc').limit(1000).get();
    return mapDocs(snapshot);
  },
  admins: async () => {
    const snapshot = await db.collection('admins').orderBy('createdAt', 'desc').limit(500).get();
    return mapDocs(snapshot);
  },
  notices: async () => {
    const snapshot = await db.collection('notices').orderBy('createdAt', 'desc').limit(500).get();
    return mapDocs(snapshot);
  },
};

const settingsReaders = {
  delivery_prices: async () => {
    const snap = await db.collection('settings').doc('delivery_prices').get();
    return snap.exists ? snap.data() : null;
  },
  storage_tiers: async () => {
    const snap = await db.collection('settings').doc('storage_tiers').get();
    return snap.exists ? (snap.data()?.tiers || null) : null;
  },
  hero: async () => {
    const snap = await db.collection('settings').doc('hero').get();
    return snap.exists ? snap.data() : null;
  },
};

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 400, { message: 'Missing URL' });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { message: 'Method not allowed' });
    return;
  }

  const url = new URL(req.url, `http://127.0.0.1:${port}`);

  try {
    if (url.pathname === '/health') {
      sendJson(res, 200, { ok: true, projectId: serviceAccount.project_id, port });
      return;
    }

    if (url.pathname.startsWith('/api/collections/')) {
      const collectionName = url.pathname.replace('/api/collections/', '');
      const reader = collectionReaders[collectionName];
      if (!reader) {
        sendJson(res, 404, { message: `Unknown collection: ${collectionName}` });
        return;
      }

      const data = await reader();
      sendJson(res, 200, data);
      return;
    }

    if (url.pathname.startsWith('/api/settings/')) {
      const settingName = url.pathname.replace('/api/settings/', '');
      const reader = settingsReaders[settingName];
      if (!reader) {
        sendJson(res, 404, { message: `Unknown setting: ${settingName}` });
        return;
      }

      const data = await reader();
      sendJson(res, 200, data);
      return;
    }

    sendJson(res, 404, { message: 'Not found' });
  } catch (error) {
    console.error('[localAdminDataBridge] request failed:', error);
    sendJson(res, 500, {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

server.listen(port, () => {
  console.log(`[localAdminDataBridge] listening on http://127.0.0.1:${port}`);
});

import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const cleanEnvVar = (val) => {
  if (!val) return '';
  let str = val.trim();
  if (str.startsWith('"') && str.endsWith('"')) {
    str = str.substring(1, str.length - 1);
  }
  if (str.startsWith("'") && str.endsWith("'")) {
    str = str.substring(1, str.length - 1);
  }
  return str.trim();
};

const normalizePrivateKey = (key) => {
  if (!key) return '';
  
  // Strip any wrapping quotes
  let cleaned = key.trim();
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.substring(1, cleaned.length - 1).trim();
  }
  if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
    cleaned = cleaned.substring(1, cleaned.length - 1).trim();
  }

  const header = '-----BEGIN PRIVATE KEY-----';
  const footer = '-----END PRIVATE KEY-----';
  
  if (cleaned.includes(header) && cleaned.includes(footer)) {
    // Extract the base64 part, strip literal \n strings, and remove all whitespace
    const base64Part = cleaned
      .replace(header, '')
      .replace(footer, '')
      .split('\\n').join('')
      .replace(/\s+/g, '');
      
    return `${header}\n${base64Part}\n${footer}`;
  }
  
  return cleaned.replace(/\r/g, '').split('\\n').join('\n');
};

let dbInstance;
let initError = null;

try {
  // Initialize Firebase Admin SDK
  if (!admin.apps.length) {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'serviceAccountKey.json';
    let projectId = '';
    let appConfig = {};

    if (fs.existsSync(serviceAccountPath)) {
      console.log(`Initializing Firebase Admin using local credentials file: ${serviceAccountPath}`);
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      projectId = serviceAccount.project_id;
      appConfig = {
        credential: admin.credential.cert(serviceAccount)
      };
    } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      console.log('Initializing Firebase Admin using environment variables.');
      
      projectId = cleanEnvVar(process.env.FIREBASE_PROJECT_ID);
      const clientEmail = cleanEnvVar(process.env.FIREBASE_CLIENT_EMAIL);
      const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

      appConfig = {
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        })
      };
    } else {
      throw new Error('Firebase credentials not configured! Please provide serviceAccountKey.json or set FIREBASE_ env vars.');
    }

    // Set the Realtime Database URL
    const rawDbUrl = process.env.FIREBASE_DATABASE_URL;
    const databaseURL = rawDbUrl ? cleanEnvVar(rawDbUrl) : `https://${projectId}-default-rtdb.firebaseio.com`;
    console.log(`Using Firebase Realtime Database URL: ${databaseURL}`);
    
    admin.initializeApp({
      ...appConfig,
      databaseURL
    });
  }
  dbInstance = admin.database();
} catch (error) {
  console.error('Firebase initialization error caught:', error);
  let keyDetails = 'none';
  if (process.env.FIREBASE_PRIVATE_KEY) {
    const rawKey = process.env.FIREBASE_PRIVATE_KEY;
    const cleaned = normalizePrivateKey(rawKey);
    keyDetails = `rawLength=${rawKey.length}, cleanedLength=${cleaned.length}, hasHeader=${cleaned.includes('-----BEGIN PRIVATE KEY-----')}, hasFooter=${cleaned.includes('-----END PRIVATE KEY-----')}, first30=${cleaned.substring(0, 30)}, last30=${cleaned.substring(cleaned.length - 30)}, newlines=${cleaned.split('\n').length - 1}`;
  }
  initError = new Error(`${error.message} [Key details: ${keyDetails}]`);
}

// Export a Proxy for db to delay throwing error until request time
const db = new Proxy({}, {
  get(target, prop) {
    if (initError) {
      const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
      const maskedRaw = rawKey.split('').map(c => {
        if (/[a-zA-Z0-9+/=]/.test(c)) return 'X';
        return c;
      }).join('');
      throw new Error(`Firebase failed to initialize: ${initError.message}. Masked Raw Key: [${maskedRaw}]`);
    }
    if (!dbInstance) {
      throw new Error('Firebase database instance is not initialized.');
    }
    return dbInstance[prop];
  }
});

export { db };
export default admin;

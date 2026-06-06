import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

let db;

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
    let privateKey = cleanEnvVar(process.env.FIREBASE_PRIVATE_KEY);
    privateKey = privateKey.replace(/\\n/g, '\n');

    appConfig = {
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      })
    };
  } else {
    console.error('FATAL: Firebase Admin SDK credentials not configured! Please provide serviceAccountKey.json or set FIREBASE_ env vars.');
    process.exit(1);
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

db = admin.database();

export { db };
export default admin;

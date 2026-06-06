import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

let db;

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
    projectId = process.env.FIREBASE_PROJECT_ID;
    appConfig = {
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    };
  } else {
    console.error('FATAL: Firebase Admin SDK credentials not configured! Please provide serviceAccountKey.json or set FIREBASE_ env vars.');
    process.exit(1);
  }

  // Set the Realtime Database URL
  const databaseURL = process.env.FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.firebaseio.com`;
  console.log(`Using Firebase Realtime Database URL: ${databaseURL}`);
  
  admin.initializeApp({
    ...appConfig,
    databaseURL
  });
}

db = admin.database();

export { db };
export default admin;

import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(fs.readFileSync('serviceAccountKey.json', 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://prismax-event-manager-default-rtdb.asia-southeast1.firebasedatabase.app'
  });
}

const db = admin.database();

const run = async () => {
  const [reqsSnap, evtsSnap] = await Promise.all([
    db.ref('host_requests').once('value'),
    db.ref('events').once('value')
  ]);
  
  console.log('--- DATABASE STATUS ---');
  console.log('Pending Requests Keys:', Object.keys(reqsSnap.val() || {}));
  console.log('Events Keys:', Object.keys(evtsSnap.val() || {}));
  
  const events = evtsSnap.val() || {};
  console.log('\nSample Event structure (first key):');
  const firstEventKey = Object.keys(events)[0];
  if (firstEventKey) {
    const sampleEvent = { ...events[firstEventKey] };
    if (sampleEvent.banner_image) sampleEvent.banner_image = sampleEvent.banner_image.substring(0, 50) + '... (base64)';
    if (sampleEvent.host_image) sampleEvent.host_image = sampleEvent.host_image.substring(0, 50) + '... (base64)';
    console.log(JSON.stringify(sampleEvent, null, 2));
  } else {
    console.log('No events found in database.');
  }
  
  process.exit(0);
};

run().catch(console.error);

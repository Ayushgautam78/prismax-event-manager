import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './firebase.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Helper to convert Firebase Realtime Database snapshot to an array of objects
const formatSnapshot = (snapshot) => {
  const data = snapshot.val();
  if (!data) return [];
  return Object.keys(data).map(key => ({
    id: key,
    ...data[key]
  }));
};

// ==================== API ROUTES ====================

// Get all events
app.get('/api/events', async (req, res) => {
  console.log('[API] GET /api/events requested');
  try {
    console.log('[API] Fetching events from Firebase...');
    const snapshot = await db.ref('events').once('value');
    console.log('[API] Events fetched successfully');
    const events = formatSnapshot(snapshot);
    
    // Sort by event_time ascending
    events.sort((a, b) => {
      const timeA = new Date(a.event_time || 0);
      const timeB = new Date(b.event_time || 0);
      return timeA - timeB;
    });

    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit a host request
app.post('/api/host-request', async (req, res) => {
  console.log('[API] POST /api/host-request requested');
  const { title, description, hostName, discordName, requestedTime, hostImage, bannerImage } = req.body;
  try {
    await db.ref('host_requests').push({
      title,
      description,
      host_name: hostName,
      discord_name: discordName,
      requested_time: requestedTime || null,
      host_image: hostImage || null,
      banner_image: bannerImage || null,
      status: 'pending',
      created_at: new Date().toISOString()
    });
    res.json({ success: true, message: 'Host request submitted successfully' });
  } catch (error) {
    console.error('Error submitting host request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin login
app.post('/api/admin/login', (req, res) => {
  console.log('[API] POST /api/admin/login requested');
  const { username, password } = req.body;
  const validUser = process.env.ADMIN_USER;
  const validPass = process.env.ADMIN_PASS;

  if (validUser && validPass && username === validUser && password === validPass) {
    res.json({ success: true, token: 'prismax-admin-token-session-secret' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Get pending host requests
app.get('/api/admin/requests', async (req, res) => {
  console.log('[API] GET /api/admin/requests requested');
  try {
    console.log('[API] Fetching pending requests from Firebase...');
    const snapshot = await db.ref('host_requests').once('value');
    console.log('[API] Requests fetched successfully');
    const allRequests = formatSnapshot(snapshot);
    
    // Filter pending requests
    const pendingRequests = allRequests.filter(req => req.status === 'pending');
    res.json(pendingRequests);
  } catch (error) {
    console.error('Error fetching host requests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Approve a host request
app.post('/api/admin/requests/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { eventTime, bannerImage, hostImage } = req.body;
  try {
    const reqRef = db.ref('host_requests').child(id);
    const docSnap = await reqRef.once('value');
    
    if (docSnap.exists() && eventTime) {
      const request = docSnap.val();
      
      // Create new event in Realtime Database
      await db.ref('events').push({
        title: request.title,
        description: request.description,
        event_time: eventTime,
        type: 'regional',
        host_name: request.host_name,
        banner_image: bannerImage || request.banner_image || null,
        host_image: hostImage || request.host_image || null,
        status: 'upcoming'
      });
      
      // Mark request as approved
      await reqRef.update({ status: 'approved' });
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Request not found or missing event time' });
    }
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reject a host request
app.post('/api/admin/requests/:id/reject', async (req, res) => {
  const { id } = req.params;
  try {
    await db.ref('host_requests').child(id).update({ status: 'rejected' });
    res.json({ success: true });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create an event manually (admin)
app.post('/api/admin/events', async (req, res) => {
  const { title, description, eventTime, type, hostName, bannerImage, hostImage } = req.body;
  try {
    await db.ref('events').push({
      title,
      description,
      event_time: eventTime,
      type,
      host_name: hostName,
      banner_image: bannerImage || null,
      host_image: hostImage || null,
      status: 'upcoming'
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete an event (admin)
app.delete('/api/admin/events/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.ref('events').child(id).remove();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check / API Info
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'PrismaX Event Manager API' });
});

// Start listener if running locally
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Backend running at http://localhost:${port}`);
  });
}

export default app;

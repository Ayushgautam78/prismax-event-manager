import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatEventTime } from '../utils/time';
import { X, Edit, Trash2 } from 'lucide-react';

const formatRequestTime = (isoString) => {
  if (!isoString) return 'TBD';
  const date = new Date(isoString);
  if (isNaN(date)) return 'Invalid Date';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  }).format(date) + ' IST';
};

const parseIstDateTime = (isoString) => {
  if (!isoString) return { date: '', time: '', ampm: 'AM' };
  try {
    const parts = isoString.split('T');
    const date = parts[0] || '';
    const timePart = parts[1]?.substring(0, 5) || '';
    if (!timePart) return { date, time: '', ampm: 'AM' };

    const [hourStr, minute] = timePart.split(':');
    let hour = parseInt(hourStr, 10);
    let ampm = 'AM';
    
    if (hour >= 12) {
      ampm = 'PM';
      if (hour > 12) hour -= 12;
    }
    if (hour === 0) hour = 12;

    const time = `${hour.toString().padStart(2, '0')}:${minute}`;
    return { date, time, ampm };
  } catch (e) {
    console.error('Error parsing IST datetime:', e);
    return { date: '', time: '', ampm: 'AM' };
  }
};

const getEventStatus = (evt) => {
  if (evt.status === 'ended') return 'ended';
  if (!evt.event_time) return 'upcoming';
  const eventMs = new Date(evt.event_time).getTime();
  const currentMs = Date.now();
  const oneHourMs = 60 * 60 * 1000;
  if (currentMs > eventMs + oneHourMs) return 'ended';
  if (currentMs >= eventMs) return 'ongoing';
  return 'upcoming';
};

const compressImage = (file, maxWidth, maxHeight, quality = 0.75) => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [submittingMap, setSubmittingMap] = useState({});
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [updatingEvent, setUpdatingEvent] = useState(false);

  const fetchData = async () => {
    try {
      const [reqsRes, evtsRes] = await Promise.all([
        fetch('/api/admin/requests'),
        fetch('/api/events')
      ]);
      if (reqsRes.ok && evtsRes.ok) {
        setRequests(await reqsRes.json());
        setEvents(await evtsRes.json());
      }
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const sessionStr = localStorage.getItem('adminSession');
    if (!sessionStr) {
      navigate('/admin/login');
      return;
    }

    try {
      const session = JSON.parse(sessionStr);
      if (!session.token || !session.expiry || Date.now() > session.expiry) {
        localStorage.removeItem('adminSession');
        navigate('/admin/login');
        return;
      }
    } catch (e) {
      localStorage.removeItem('adminSession');
      navigate('/admin/login');
      return;
    }

    fetchData();
  }, [navigate]);

  const handleAction = async (requestId, endpoint, body = null) => {
    if (submittingMap[requestId]) return;
    setSubmittingMap(prev => ({ ...prev, [requestId]: true }));

    const options = { method: 'POST' };
    if (body) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }

    try {
      const res = await fetch(endpoint, options);
      if (res.ok) {
        await fetchData();
      } else {
        alert('Action failed');
      }
    } catch (err) {
      console.error('Error executing action:', err);
      alert('Error connecting to backend');
    } finally {
      setSubmittingMap(prev => ({ ...prev, [requestId]: false }));
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this event?')) {
      const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete event');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    navigate('/admin/login');
  };

  const handleCreateGlobal = async (e) => {
    e.preventDefault();
    if (creatingEvent) return;
    setCreatingEvent(true);

    try {
      const timeParts = e.target.timeString.value.split(':');
      let hour = parseInt(timeParts[0], 10);
      const minute = timeParts[1];
      const ampm = e.target.ampm.value;
      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute}`;
      
      const eventTime = `${e.target.date.value}T${timeStr}:00+05:30`;
      
      const bannerFile = e.target.bannerImage.files[0];
      const hostFile = e.target.hostImage.files[0];
      
      // Compress
      const bannerBase64 = bannerFile ? await compressImage(bannerFile, 1000, 562, 0.75) : null;
      const hostBase64 = hostFile ? await compressImage(hostFile, 150, 150, 0.75) : null;

      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: e.target.title.value,
          description: e.target.description.value,
          hostName: e.target.hostName.value,
          discordUsername: e.target.discordUsername.value,
          eventTime: eventTime,
          type: e.target.eventType.value,
          bannerImage: bannerBase64,
          hostImage: hostBase64
        })
      });

      if (res.ok) {
        e.target.reset();
        await fetchData();
      } else {
        alert('Failed to create event');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating event');
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (updatingEvent || !editingEvent) return;
    setUpdatingEvent(true);

    try {
      const timeParts = e.target.timeString.value.split(':');
      let hour = parseInt(timeParts[0], 10);
      const minute = timeParts[1];
      const ampm = e.target.ampm.value;
      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute}`;
      
      const eventTime = `${e.target.date.value}T${timeStr}:00+05:30`;
      
      const bannerFile = e.target.bannerImage.files[0];
      const hostFile = e.target.hostImage.files[0];
      
      const bannerBase64 = bannerFile ? await compressImage(bannerFile, 1000, 562, 0.75) : null;
      const hostBase64 = hostFile ? await compressImage(hostFile, 150, 150, 0.75) : null;

      const res = await fetch(`/api/admin/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: e.target.title.value,
          description: e.target.description.value,
          hostName: e.target.hostName.value,
          discordUsername: e.target.discordUsername.value,
          eventTime: eventTime,
          type: e.target.eventType.value,
          bannerImage: bannerBase64,
          hostImage: hostBase64
        })
      });

      if (res.ok) {
        setEditingEvent(null);
        await fetchData();
      } else {
        alert('Failed to update event');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating event');
    } finally {
      setUpdatingEvent(false);
    }
  };

  const downloadCompletedEventsCSV = () => {
    const completed = events.filter(evt => getEventStatus(evt) === 'ended');
    if (completed.length === 0) {
      alert('No completed events found to export.');
      return;
    }

    const headers = ['S.No', 'Event ID', 'Title', 'Event Time (IST)', 'Type', 'Host Name', 'Discord Username', 'Status'];
    
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = completed.map((evt, index) => {
      const { dateStr, istTime } = formatEventTime(evt.event_time);
      const timeDisplay = `${dateStr} ${istTime}`;
      
      return [
        index + 1,
        evt.id || '',
        evt.title || '',
        timeDisplay,
        evt.type || '',
        evt.host_name || '',
        evt.discord_username || '',
        'ended'
      ].map(escapeCsv).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `completed_events_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
        <h2>Loading admin panel...</h2>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
        <h1 className="gold-text" style={{ margin: 0, fontSize: '2.5rem' }}>Admin Dashboard</h1>
        <button className="btn btn-secondary" onClick={handleLogout} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
          Logout
        </button>
      </div>

      <div className="admin-grid">
        <div>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Pending Host Requests</h2>
          {requests.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No pending requests.</p>}
          {requests.map(req => {
            const prepopulated = parseIstDateTime(req.requested_time);
            const isSubmitting = !!submittingMap[req.id];
            return (
              <div key={req.id} className="card" style={{ marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--gold-primary)' }}>{req.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', whiteSpace: 'pre-wrap' }}>{req.description}</p>
                <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Host: <span style={{ color: 'var(--text-primary)' }}>{req.host_name}</span> <br/>
                  Discord: <span style={{ color: 'var(--text-primary)' }}>{req.discord_name}</span> <br/>
                  Applied At: <span style={{ color: 'var(--text-secondary)' }}>{formatRequestTime(req.created_at)}</span> <br/>
                  Requested Time: <span style={{ color: 'var(--gold-primary)', fontWeight: '500' }}>{formatRequestTime(req.requested_time)}</span>
                </p>
                {req.host_image && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Host PFP:</span>
                    <img src={req.host_image} alt="Host PFP" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--gold-primary)' }} />
                  </div>
                )}
                {req.banner_image && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>Event Banner:</span>
                    <img src={req.banner_image} alt="Event Banner" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--card-border)' }} />
                  </div>
                )}
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (isSubmitting) return;

                  const timeParts = e.target.timeString.value.split(':');
                  let hour = parseInt(timeParts[0], 10);
                  const minute = timeParts[1];
                  const ampm = e.target.ampm.value;
                  if (ampm === 'PM' && hour < 12) hour += 12;
                  if (ampm === 'AM' && hour === 12) hour = 0;
                  const timeStr = `${hour.toString().padStart(2, '0')}:${minute}`;
                  
                  const eventTime = `${e.target.date.value}T${timeStr}:00+05:30`;
                  
                  const bannerFile = e.target.bannerImage.files[0];
                  const hostFile = e.target.hostImage.files[0];
                  
                  // Compress overrides if uploaded
                  const bannerBase64 = bannerFile ? await compressImage(bannerFile, 1000, 562, 0.75) : null;
                  const hostBase64 = hostFile ? await compressImage(hostFile, 150, 150, 0.75) : null;

                  await handleAction(req.id, `/api/admin/requests/${req.id}/approve`, { 
                    eventTime: eventTime,
                    bannerImage: bannerBase64,
                    hostImage: hostBase64
                  });
                }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input type="date" name="date" defaultValue={prepopulated.date} className="form-control" style={{ padding: '0.4rem', fontSize: '0.8rem', flex: 1 }} required />
                    <div style={{ display: 'flex', gap: '5px', flex: 1 }}>
                      <input type="text" name="timeString" defaultValue={prepopulated.time} className="form-control" placeholder="12:30" pattern="^(1[0-2]|0?[1-9]):[0-5][0-9]$" title="Enter time in HH:MM format" style={{ padding: '0.4rem', fontSize: '0.8rem' }} required />
                      <select name="ampm" defaultValue={prepopulated.ampm} className="form-control" style={{ padding: '0.4rem', fontSize: '0.8rem', width: '70px' }} required>
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>Host Image (Overrides original)</label>
                    <input type="file" name="hostImage" accept="image/*" className="form-control" style={{ padding: '0.4rem', fontSize: '0.8rem' }} />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>Event Banner Graphic (Overrides original)</label>
                    <input type="file" name="bannerImage" accept="image/*" className="form-control" style={{ padding: '0.4rem', fontSize: '0.8rem' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} disabled={isSubmitting}>
                      {isSubmitting ? 'Approving...' : 'Approve'}
                    </button>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleAction(req.id, `/api/admin/requests/${req.id}/reject`)} disabled={isSubmitting}>
                      {isSubmitting ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </form>
              </div>
            );
          })}
        </div>

        <div>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Create Event</h2>
          <form className="card" onSubmit={handleCreateGlobal} style={{ marginBottom: '2rem' }}>
            <div className="form-group">
              <label className="form-label">Event Type</label>
              <select name="eventType" className="form-control" required>
                <option value="global">Global Event</option>
                <option value="regional">Regional Event</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Title</label>
              <input type="text" name="title" className="form-control" required />
            </div>
            <div className="form-group">
              <label className="form-label">Host Name (Display Name)</label>
              <input type="text" name="hostName" className="form-control" placeholder="E.g., Ayush Gautam" required />
            </div>
            <div className="form-group">
              <label className="form-label">Discord Username (Not numeric User ID)</label>
              <input type="text" name="discordUsername" className="form-control" placeholder="E.g., @ayush_gautam (or ayushgautam)" required />
            </div>
            <div className="form-group">
              <label className="form-label">Host Image</label>
              <input type="file" name="hostImage" accept="image/*" className="form-control" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea name="description" className="form-control" rows="3" required></textarea>
            </div>
            <div className="form-group">
              <label className="form-label">Event Banner Graphic</label>
              <input type="file" name="bannerImage" accept="image/*" className="form-control" />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Date (IST)</label>
                <input type="date" name="date" className="form-control" required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Time (IST)</label>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input type="text" name="timeString" className="form-control" placeholder="12:30" pattern="^(1[0-2]|0?[1-9]):[0-5][0-9]$" title="Enter time in HH:MM format" required />
                  <select name="ampm" className="form-control" style={{ width: '80px' }} required>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={creatingEvent}>
              {creatingEvent ? 'Creating...' : 'Create Event'}
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Manage Events</h2>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              onClick={downloadCompletedEventsCSV}
            >
              Download Completed CSV ({events.filter(evt => getEventStatus(evt) === 'ended').length})
            </button>
          </div>
          {events.map(evt => {
            const status = getEventStatus(evt);
            const statusColors = {
              ended: 'var(--text-secondary)',
              ongoing: 'var(--success)',
              upcoming: 'var(--gold-primary)'
            };
            return (
              <div key={evt.id} className="card" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ color: evt.type === 'global' ? 'var(--gold-primary)' : 'var(--text-primary)' }}>{evt.title} <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>{evt.type}</span></h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Host: <strong style={{ color: 'var(--text-primary)' }}>{evt.host_name}</strong> {evt.discord_username && <>(Discord: {evt.discord_username})</>}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Status: <span style={{ color: statusColors[status], fontWeight: '600' }}>{status.toUpperCase()}</span>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} 
                    onClick={() => setEditingEvent(evt)}
                  >
                    <Edit size={12} /> Edit
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }} 
                    onClick={() => handleDelete(evt.id)}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editingEvent && (
        <div className="modal-overlay" onClick={() => setEditingEvent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Event</h2>
              <button className="modal-close-btn" onClick={() => setEditingEvent(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleUpdateEvent}>
                <div className="form-group">
                  <label className="form-label">Event Type</label>
                  <select name="eventType" className="form-control" defaultValue={editingEvent.type} required>
                    <option value="global">Global Event</option>
                    <option value="regional">Regional Event</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input type="text" name="title" className="form-control" defaultValue={editingEvent.title} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Host Name (Display Name)</label>
                  <input type="text" name="hostName" className="form-control" defaultValue={editingEvent.host_name} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Discord Username (Not numeric User ID)</label>
                  <input type="text" name="discordUsername" className="form-control" defaultValue={editingEvent.discord_username || ''} placeholder="E.g., @ayush_gautam (or ayushgautam)" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Host Image (Optional - leaves current image if empty)</label>
                  {editingEvent.host_image && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <img src={editingEvent.host_image} alt="Current Host PFP" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Has current avatar</span>
                    </div>
                  )}
                  <input type="file" name="hostImage" accept="image/*" className="form-control" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea name="description" className="form-control" rows="4" defaultValue={editingEvent.description} required></textarea>
                </div>
                <div className="form-group">
                  <label className="form-label">Event Banner Graphic (Optional - leaves current banner if empty)</label>
                  {editingEvent.banner_image && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <img src={editingEvent.banner_image} alt="Current Banner" style={{ width: '80px', height: '45px', objectFit: 'cover', borderRadius: '4px' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Has current banner</span>
                    </div>
                  )}
                  <input type="file" name="bannerImage" accept="image/*" className="form-control" />
                </div>
                
                {/* Time Parsing */}
                {(() => {
                  const prepopulated = parseIstDateTime(editingEvent.event_time);
                  return (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Date (IST)</label>
                        <input type="date" name="date" className="form-control" defaultValue={prepopulated.date} required />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Time (IST)</label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <input type="text" name="timeString" className="form-control" defaultValue={prepopulated.time} placeholder="12:30" pattern="^(1[0-2]|0?[1-9]):[0-5][0-9]$" title="Enter time in HH:MM format" required />
                          <select name="ampm" className="form-control" defaultValue={prepopulated.ampm} style={{ width: '70px' }} required>
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={updatingEvent}>
                  {updatingEvent ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

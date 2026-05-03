import React, { useState, useEffect } from 'react';
import { formatEventTime } from '../utils/time';

export default function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [events, setEvents] = useState([]);

  const fetchData = async () => {
    try {
      const [reqsRes, evtsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/requests`),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/events`)
      ]);
      setRequests(await reqsRes.json());
      setEvents(await evtsRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (endpoint, body = null) => {
    const options = { method: 'POST' };
    if (body) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }
    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${endpoint}`, options);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this event?')) {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/events/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const getBase64 = (file) => new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleCreateGlobal = async (e) => {
    e.preventDefault();
    const timeParts = e.target.timeString.value.split(':');
    let hour = parseInt(timeParts[0], 10);
    const minute = timeParts[1];
    const ampm = e.target.ampm.value;
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute}`;
    const utcDate = new Date(`${e.target.date.value}T${timeStr}:00Z`).toISOString();
    
    const bannerFile = e.target.bannerImage.files[0];
    const hostFile = e.target.hostImage.files[0];
    const bannerBase64 = await getBase64(bannerFile);
    const hostBase64 = await getBase64(hostFile);

    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: e.target.title.value,
        description: e.target.description.value,
        hostName: e.target.hostName.value,
        eventTime: utcDate,
        type: e.target.eventType.value,
        bannerImage: bannerBase64,
        hostImage: hostBase64
      })
    });
    e.target.reset();
    fetchData();
  };

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <h1 className="gold-text" style={{ marginBottom: '2rem' }}>Admin Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Pending Host Requests</h2>
          {requests.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No pending requests.</p>}
          {requests.map(req => {
            return (
              <div key={req.id} className="card" style={{ marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--gold-primary)' }}>{req.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{req.description}</p>
                <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Host: <span style={{ color: 'var(--text-primary)' }}>{req.host_name}</span> <br/>
                  Discord: <span style={{ color: 'var(--text-primary)' }}>{req.discord_name}</span>
                </p>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const timeParts = e.target.timeString.value.split(':');
                  let hour = parseInt(timeParts[0], 10);
                  const minute = timeParts[1];
                  const ampm = e.target.ampm.value;
                  if (ampm === 'PM' && hour < 12) hour += 12;
                  if (ampm === 'AM' && hour === 12) hour = 0;
                  const timeStr = `${hour.toString().padStart(2, '0')}:${minute}`;
                  const utcDate = new Date(`${e.target.date.value}T${timeStr}:00Z`).toISOString();
                  
                  const bannerFile = e.target.bannerImage.files[0];
                  const hostFile = e.target.hostImage.files[0];
                  const bannerBase64 = await getBase64(bannerFile);
                  const hostBase64 = await getBase64(hostFile);

                  handleAction(`/api/admin/requests/${req.id}/approve`, { 
                    eventTime: utcDate,
                    bannerImage: bannerBase64,
                    hostImage: hostBase64
                  });
                }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input type="date" name="date" className="form-control" style={{ padding: '0.4rem', fontSize: '0.8rem', flex: 1 }} required />
                    <div style={{ display: 'flex', gap: '5px', flex: 1 }}>
                      <input type="text" name="timeString" className="form-control" placeholder="12:30" pattern="^(1[0-2]|0?[1-9]):[0-5][0-9]$" title="Enter time in HH:MM format" style={{ padding: '0.4rem', fontSize: '0.8rem' }} required />
                      <select name="ampm" className="form-control" style={{ padding: '0.4rem', fontSize: '0.8rem', width: '70px' }} required>
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>Host Image</label>
                    <input type="file" name="hostImage" accept="image/*" className="form-control" style={{ padding: '0.4rem', fontSize: '0.8rem' }} />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label className="form-label" style={{ fontSize: '0.85rem' }}>Event Banner Graphic</label>
                    <input type="file" name="bannerImage" accept="image/*" className="form-control" style={{ padding: '0.4rem', fontSize: '0.8rem' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>Approve</button>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleAction(`/api/admin/requests/${req.id}/reject`)}>Reject</button>
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
              <label className="form-label">Host Name</label>
              <input type="text" name="hostName" className="form-control" required />
            </div>
            <div className="form-group">
              <label className="form-label">Host Image</label>
              <input type="file" name="hostImage" accept="image/*" className="form-control" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input type="text" name="description" className="form-control" required />
            </div>
            <div className="form-group">
              <label className="form-label">Event Banner Graphic</label>
              <input type="file" name="bannerImage" accept="image/*" className="form-control" />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Date (UTC)</label>
                <input type="date" name="date" className="form-control" required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Time (UTC)</label>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input type="text" name="timeString" className="form-control" placeholder="12:30" pattern="^(1[0-2]|0?[1-9]):[0-5][0-9]$" title="Enter time in HH:MM format" required />
                  <select name="ampm" className="form-control" style={{ width: '80px' }} required>
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Create Event</button>
          </form>

          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Manage Events</h2>
          {events.map(evt => (
            <div key={evt.id} className="card" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ color: evt.type === 'global' ? 'var(--gold-primary)' : 'var(--text-primary)' }}>{evt.title} <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>{evt.type}</span></h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status: {evt.status}</p>
              </div>
              <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleDelete(evt.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

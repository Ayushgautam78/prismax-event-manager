import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function HostEvent() {
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      title: e.target.title.value,
      description: e.target.description.value,
      hostName: e.target.hostName.value,
      discordName: e.target.discordName.value
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/host-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('Your event request has been submitted and is pending admin approval.');
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting request');
    }
  };

  return (
    <div className="container" style={{ paddingTop: '4rem', maxWidth: '600px' }}>
      <h1 className="gold-text" style={{ marginBottom: '1rem', fontSize: '2.5rem' }}>Host a Regional Event</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Fill out the details below to request hosting an event.
      </p>

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label className="form-label">Host Name</label>
          <input type="text" name="hostName" className="form-control" required />
        </div>
        <div className="form-group">
          <label className="form-label">Discord Name</label>
          <input type="text" name="discordName" className="form-control" required />
        </div>
        <div className="form-group">
          <label className="form-label">Event Title</label>
          <input type="text" name="title" className="form-control" required />
        </div>
        <div className="form-group">
          <label className="form-label">Short Description</label>
          <textarea name="description" className="form-control" rows="3" required></textarea>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '10px' }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit Request</button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/')} style={{ flex: 1 }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

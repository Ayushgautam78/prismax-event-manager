import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

export default function HostEvent() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    
    try {
      const timeParts = e.target.timeString.value.split(':');
      let hour = parseInt(timeParts[0], 10);
      const minute = timeParts[1];
      const ampm = e.target.ampm.value;
      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute}`;
      
      const requestedTime = `${e.target.date.value}T${timeStr}:00+05:30`;

      // Compress uploads
      const hostFile = e.target.hostImage.files[0];
      const bannerFile = e.target.bannerImage.files[0];
      const hostBase64 = hostFile ? await compressImage(hostFile, 150, 150, 0.75) : null;
      const bannerBase64 = bannerFile ? await compressImage(bannerFile, 1000, 562, 0.75) : null;

      const payload = {
        title: e.target.title.value,
        description: e.target.description.value,
        hostName: e.target.hostName.value,
        discordName: e.target.discordName.value,
        requestedTime: requestedTime,
        hostImage: hostBase64,
        bannerImage: bannerBase64
      };

      const res = await fetch('/api/host-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert('Your event request has been submitted and is pending admin approval.');
        navigate('/');
      } else {
        let errMsg = 'Failed to submit host request';
        try {
          const errData = await res.json();
          if (errData && errData.error) {
            errMsg += `: ${errData.error}`;
          } else if (errData && errData.message) {
            errMsg += `: ${errData.message}`;
          }
        } catch (e) {
          try {
            const text = await res.text();
            if (text) errMsg += `: ${text.substring(0, 100)}`;
          } catch (e2) {}
        }
        alert(errMsg);
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting request');
    } finally {
      setSubmitting(false);
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
          <label className="form-label">Host Profile Photo (PFP)</label>
          <input type="file" name="hostImage" accept="image/*" className="form-control" />
        </div>
        <div className="form-group">
          <label className="form-label">Event Title</label>
          <input type="text" name="title" className="form-control" required />
        </div>
        <div className="form-group">
          <label className="form-label">Short Description</label>
          <textarea name="description" className="form-control" rows="3" required></textarea>
        </div>
        <div className="form-group">
          <label className="form-label">Event Banner Graphic</label>
          <input type="file" name="bannerImage" accept="image/*" className="form-control" />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Event Date (IST)</label>
            <input type="date" name="date" className="form-control" required />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Event Time (IST)</label>
            <div style={{ display: 'flex', gap: '5px' }}>
              <input type="text" name="timeString" className="form-control" placeholder="12:30" pattern="^(1[0-2]|0?[1-9]):[0-5][0-9]$" title="Enter time in HH:MM format (e.g. 12:30 or 9:45)" required />
              <select name="ampm" className="form-control" style={{ width: '80px' }} required>
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '10px' }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/')} style={{ flex: 1 }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

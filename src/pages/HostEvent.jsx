import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TimePicker from '../components/TimePicker';

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

const parseIstDateTime = (isoString) => {
  if (!isoString) return { date: '', time: '12:00', ampm: 'PM' };
  try {
    const parts = isoString.split('T');
    const date = parts[0] || '';
    const timePart = parts[1]?.substring(0, 5) || '';
    if (!timePart) return { date, time: '12:00', ampm: 'PM' };

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
    return { date: '', time: '12:00', ampm: 'PM' };
  }
};

export default function HostEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/host-request/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch host request');
        return res.json();
      })
      .then(data => {
        if (data.status !== 'pending') {
          alert('This host request is no longer pending and cannot be edited.');
          navigate('/');
          return;
        }
        setRequestData(data);
      })
      .catch(err => {
        console.error(err);
        alert('Error loading host request data.');
        navigate('/');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const confirmMsg = id 
      ? 'Are you sure you want to save changes to this event request?'
      : 'Are you sure you want to submit this event request?';
    if (!confirm(confirmMsg)) {
      return;
    }
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

      const url = id ? `/api/host-request/${id}` : '/api/host-request';
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const responseText = await res.text();
      let errData = {};
      let isJson = false;
      try {
        errData = JSON.parse(responseText);
        isJson = true;
      } catch (e) {}
      
      if (res.ok) {
        if (id) {
          alert('Your event request has been successfully updated.');
        } else {
          alert('Your event request has been submitted and is pending admin approval.');
          if (isJson && errData.id) {
            try {
              const myRequests = JSON.parse(localStorage.getItem('myHostedRequests') || '[]');
              myRequests.push(errData.id);
              localStorage.setItem('myHostedRequests', JSON.stringify(myRequests));
            } catch (e) {
              console.error('Error saving host request ID to localStorage', e);
            }
          }
        }
        navigate('/');
      } else {
        let errMsg = id ? 'Failed to update host request' : 'Failed to submit host request';
        if (isJson) {
          if (errData.error) {
            errMsg += `: ${errData.error}`;
          } else if (errData.message) {
            errMsg += `: ${errData.message}`;
          }
        } else {
          errMsg += `: ${res.status} ${res.statusText} - ${responseText.substring(0, 150)}`;
        }
        alert(errMsg);
      }
    } catch (err) {
      console.error(err);
      alert('Error processing request');
    } finally {
      setSubmitting(false);
    }
  };

  if (id && loading) {
    return (
      <div className="container" style={{ paddingTop: '4rem', maxWidth: '600px', textAlign: 'center' }}>
        <h2>Loading request details...</h2>
      </div>
    );
  }

  const prepopulated = requestData ? parseIstDateTime(requestData.requested_time) : { date: '', time: '12:00', ampm: 'PM' };

  return (
    <div className="container" style={{ paddingTop: '4rem', maxWidth: '600px' }}>
      <h1 className="gold-text" style={{ marginBottom: '1rem', fontSize: '2.5rem' }}>
        {id ? 'Edit Host Application' : 'Host a Regional Event'}
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        {id ? 'Update the details of your pending host request below.' : 'Fill out the details below to request hosting an event.'}
      </p>

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label className="form-label">Host Display Name (Your Name)</label>
          <input 
            type="text" 
            name="hostName" 
            className="form-control" 
            placeholder="E.g., Ayush Gautam" 
            defaultValue={requestData?.host_name || ''} 
            required 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Discord Username (Not numeric User ID)</label>
          <input 
            type="text" 
            name="discordName" 
            className="form-control" 
            placeholder="E.g., @ayush_gautam (or ayushgautam)" 
            defaultValue={requestData?.discord_name || ''} 
            required 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Host Profile Photo (PFP)</label>
          {requestData?.host_image && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <img src={requestData.host_image} alt="Current Host PFP" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--gold-primary)' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Has current profile photo</span>
            </div>
          )}
          <input type="file" name="hostImage" accept="image/*" className="form-control" />
        </div>
        <div className="form-group">
          <label className="form-label">Event Title</label>
          <input 
            type="text" 
            name="title" 
            className="form-control" 
            defaultValue={requestData?.title || ''} 
            required 
          />
        </div>
        <div className="form-group">
          <label className="form-label">Short Description</label>
          <textarea 
            name="description" 
            className="form-control" 
            rows="3" 
            defaultValue={requestData?.description || ''} 
            required
          ></textarea>
        </div>
        <div className="form-group">
          <label className="form-label">Event Banner Graphic</label>
          {requestData?.banner_image && (
            <div style={{ position: 'relative', marginBottom: '8px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--card-border)', maxWidth: '200px' }}>
              <img src={requestData.banner_image} alt="Current Banner" style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>Has current banner</span>
            </div>
          )}
          <input type="file" name="bannerImage" accept="image/*" className="form-control" />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Event Date (IST)</label>
            <input 
              type="date" 
              name="date" 
              className="form-control" 
              defaultValue={prepopulated.date} 
              required 
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Event Time (IST)</label>
            <TimePicker 
              name="timeString" 
              defaultValue={prepopulated.time} 
              defaultAmpm={prepopulated.ampm} 
              required 
            />
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '10px' }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
            {submitting ? (id ? 'Updating...' : 'Submitting...') : (id ? 'Save Changes' : 'Submit Request')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/')} style={{ flex: 1 }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

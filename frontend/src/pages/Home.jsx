import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatEventTime } from '../utils/time';
import { BellRing, CalendarPlus } from 'lucide-react';

function EventCard({ event, onSubscribe }) {
  const { dateStr, istTime, utcTime } = formatEventTime(event.event_time);
  const isEnded = event.status === 'ended';

  return (
    <div className={`card ${isEnded ? 'ended' : ''}`} style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--gold-primary)' }}>{event.title}</h3>
          {event.host_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              {event.host_image && (
                <img src={event.host_image} alt={event.host_name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold-primary)' }} />
              )}
              <p style={{ color: 'var(--text-primary)', margin: 0, fontSize: '0.9rem', fontWeight: '500' }}>
                Host: <span style={{ color: 'var(--gold-secondary)' }}>{event.host_name}</span>
              </p>
            </div>
          )}
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' }}>{event.description}</p>
          
          {event.banner_image && (
            <div style={{ marginBottom: '1.5rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
              <img src={event.banner_image} alt="Event Banner" style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', color: 'var(--text-primary)', fontWeight: '500' }}>
            <span>{dateStr}</span>
            <span>&bull;</span>
            <span>{istTime} <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>({utcTime})</span></span>
          </div>
        </div>
        <div>
          {isEnded ? (
            <span style={{ padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '0.85rem' }}>Ended</span>
          ) : (
            <button className="btn btn-primary" onClick={() => onSubscribe(event.id)}>
              <BellRing size={16} style={{ marginRight: '8px' }} />
              Remind Me
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SubscribeModal({ eventId, onClose }) {
  const [enableEmail, setEnableEmail] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('deviceId', deviceId);
    }
    const finalReminderTime = parseInt(e.target.reminderTime.value);
    const email = enableEmail ? e.target.email.value : null;
    
    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/events/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, email, deviceId, finalReminderTime })
    });
    
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const evtSource = new EventSource(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/notifications/stream?deviceId=${deviceId}`);
        evtSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          new Notification('PrismaX Event Reminder', {
            body: `${data.message} for ${data.title}!`,
          });
        };
      }
    }

    alert('Subscribed successfully!');
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--gold-primary)' }}>Setup Reminders</h3>
        <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>You will receive native web push notifications 1 hour and 30 mins before the event.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <input type="checkbox" id="enableEmail" checked={enableEmail} onChange={(e) => setEnableEmail(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--gold-primary)' }} />
            <label htmlFor="enableEmail" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Enable Email Notifications too</label>
          </div>
          {enableEmail && (
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" name="email" className="form-control" placeholder="you@example.com" required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Final Reminder</label>
            <select name="reminderTime" className="form-control" required>
              <option value="5">5 minutes before</option>
              <option value="1">1 minute before</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '2rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirm</button>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [subscribeEventId, setSubscribeEventId] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/events`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEvents(data);
        } else {
          console.error("Expected array but got:", data);
          setEvents([]);
        }
      })
      .catch(err => console.error(err));

    let savedDeviceId = localStorage.getItem('deviceId');
    if (!savedDeviceId) {
      savedDeviceId = 'device_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('deviceId', savedDeviceId);
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      const evtSource = new EventSource(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/notifications/stream?deviceId=${savedDeviceId}`);
      evtSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        new Notification('PrismaX Event Reminder', {
          body: `${data.message} for ${data.title}!`,
        });
      };
      return () => evtSource.close();
    }
  }, []);

  const safeEvents = Array.isArray(events) ? events : [];
  const globalEvents = safeEvents.filter(e => e.type === 'global');
  const regionalEvents = safeEvents.filter(e => e.type === 'regional');

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 className="gold-text" style={{ fontSize: '3.5rem', marginBottom: '1rem', letterSpacing: '-1px', lineHeight: 1.1 }}>Stay Updated with PrismaX Events</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          Subscribe to get notified right before they start, and apply for the hosting purpose.
        </p>
      </div>

      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>Global Events</h2>
        {globalEvents.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No upcoming global events.</p> : null}
        {globalEvents.map(e => (
          <EventCard key={e.id} event={e} onSubscribe={setSubscribeEventId} />
        ))}
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.8rem' }}>Indian Regional Events</h2>
          <button className="btn btn-secondary" onClick={() => navigate('/host-event')}>
            <CalendarPlus size={16} style={{ marginRight: '8px' }} /> Host an Event
          </button>
        </div>
        {regionalEvents.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No upcoming regional events.</p> : null}
        {regionalEvents.map(e => (
          <EventCard key={e.id} event={e} onSubscribe={setSubscribeEventId} />
        ))}
      </section>

      {subscribeEventId && (
        <SubscribeModal eventId={subscribeEventId} onClose={() => setSubscribeEventId(null)} />
      )}
    </div>
  );
}

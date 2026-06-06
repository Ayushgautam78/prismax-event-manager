import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatEventTime } from '../utils/time';
import { CalendarPlus, Download, Info, X } from 'lucide-react';

const downloadBase64Image = (base64String, fileName) => {
  if (!base64String) return;
  const link = document.createElement('a');
  link.href = base64String;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

function EventCard({ event }) {
  const { dateStr, istTime } = formatEventTime(event.event_time);
  const isEnded = event.status === 'ended';

  return (
    <div className={`card ${isEnded ? 'ended' : ''}`} style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: '100%' }}>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--gold-primary)' }}>{event.title}</h3>
          
          {event.host_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              {event.host_image && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <img src={event.host_image} alt={event.host_name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold-primary)' }} />
                  <button 
                    onClick={() => downloadBase64Image(event.host_image, `${event.host_name}-avatar.png`)}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem', borderRadius: '50%', width: '26px', height: '26px', border: '1px solid rgba(212, 175, 55, 0.4)', color: 'var(--gold-primary)' }}
                    title="Download Host Photo"
                  >
                    <Download size={12} />
                  </button>
                </div>
              )}
              <p style={{ color: 'var(--text-primary)', margin: 0, fontSize: '0.9rem', fontWeight: '500' }}>
                Host: <span style={{ color: 'var(--gold-secondary)' }}>{event.host_name}</span>
              </p>
            </div>
          )}
          
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' }}>{event.description}</p>
          
          {event.banner_image && (
            <div style={{ position: 'relative', marginBottom: '1.5rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
              <img src={event.banner_image} alt="Event Banner" style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }} />
              <button
                onClick={() => downloadBase64Image(event.banner_image, `${event.title}-banner.png`)}
                className="btn btn-secondary"
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(11, 11, 10, 0.75)',
                  border: '1px solid var(--gold-primary)',
                  borderRadius: '4px',
                  color: 'var(--gold-primary)',
                  padding: '4px 8px',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  backdropFilter: 'blur(4px)',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                }}
                title="Download Banner Graphic"
              >
                <Download size={12} /> Download Banner
              </button>
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-primary)', fontWeight: '500' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <span>{dateStr}</span>
              <span>&bull;</span>
              <span>{istTime}</span>
            </div>
            {isEnded && (
              <span style={{ padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '0.85rem' }}>Ended</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PendingRequestCard({ request }) {
  const { dateStr, istTime } = formatEventTime(request.requested_time);
  const applied = request.created_at ? formatEventTime(request.created_at) : null;

  return (
    <div className="card" style={{ marginBottom: '1.5rem', opacity: 0.85, borderStyle: 'dashed', borderColor: 'rgba(212, 175, 55, 0.3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', margin: 0 }}>{request.title}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', background: 'rgba(212,175,55,0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--card-border)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Info size={12} /> Pending Approval
            </span>
          </div>
          
          {request.host_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              {request.host_image && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <img src={request.host_image} alt={request.host_name} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(212, 175, 55, 0.6)' }} />
                  <button 
                    onClick={() => downloadBase64Image(request.host_image, `${request.host_name}-avatar.png`)}
                    className="btn btn-secondary"
                    style={{ padding: '0.25rem', borderRadius: '50%', width: '20px', height: '20px', border: '1px solid rgba(212, 175, 55, 0.3)', color: 'var(--gold-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Download Host Photo"
                  >
                    <Download size={10} />
                  </button>
                </div>
              )}
              <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.85rem' }}>
                Host: <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{request.host_name}</span> (Discord: <span style={{ color: 'var(--text-primary)' }}>{request.discord_name}</span>)
              </p>
            </div>
          )}
          
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>{request.description}</p>
          
          {request.banner_image && (
            <div style={{ position: 'relative', marginBottom: '1.2rem', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.05)', maxWidth: '400px' }}>
              <img src={request.banner_image} alt="Event Banner" style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block', opacity: 0.8 }} />
              <button
                onClick={() => downloadBase64Image(request.banner_image, `${request.title}-banner.png`)}
                className="btn btn-secondary"
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  background: 'rgba(11, 11, 10, 0.8)',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  borderRadius: '4px',
                  color: 'var(--gold-primary)',
                  padding: '2px 6px',
                  fontSize: '0.7rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <Download size={10} /> Download
              </button>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500', flexWrap: 'wrap' }}>
            <span>Requested Date: <strong style={{ color: 'var(--gold-secondary)' }}>{dateStr}</strong></span>
            <span>&bull;</span>
            <span>Requested Time: <strong style={{ color: 'var(--gold-secondary)' }}>{istTime}</strong></span>
            {applied && (
              <>
                <span>&bull;</span>
                <span>Applied On: <strong style={{ color: 'var(--text-primary)' }}>{applied.dateStr} at {applied.istTime}</strong></span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showPendingModal, setShowPendingModal] = useState(false);

  useEffect(() => {
    if (showPendingModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showPendingModal]);

  useEffect(() => {
    // Fetch approved events
    fetch('/api/events')
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

    // Fetch pending host requests
    fetch('/api/admin/requests')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPendingRequests(data);
        } else {
          console.error("Expected array but got:", data);
          setPendingRequests([]);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const safeEvents = Array.isArray(events) ? events : [];
  const globalEvents = safeEvents.filter(e => e.type === 'global');
  const regionalEvents = safeEvents.filter(e => e.type === 'regional');

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 className="gold-text main-title">Stay Updated with PrismaX Events</h1>
        <p className="main-desc" style={{ marginBottom: '1.5rem' }}>
          Explore global and regional events, and submit applications to host your own.
        </p>
        <button 
          onClick={() => setShowPendingModal(true)}
          style={{
            background: 'rgba(212, 175, 55, 0.05)',
            border: '1px dashed rgba(212, 175, 55, 0.4)',
            color: 'var(--gold-primary)',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s',
            outline: 'none'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212, 175, 55, 0.12)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(212, 175, 55, 0.05)'; e.currentTarget.style.transform = 'none'; }}
        >
          <Info size={14} /> View Pending Host Requests ({pendingRequests.length})
        </button>
      </div>

      <section style={{ marginBottom: '4rem' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>Global Events</h2>
        {globalEvents.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No upcoming global events.</p> : null}
        {globalEvents.map(e => (
          <EventCard key={e.id} event={e} />
        ))}
      </section>

      <section style={{ marginBottom: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.8rem' }}>Indian Regional Events</h2>
          <button className="btn btn-secondary" onClick={() => navigate('/host-event')}>
            <CalendarPlus size={16} style={{ marginRight: '8px' }} /> Host an Event
          </button>
        </div>
        {regionalEvents.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No upcoming regional events.</p> : null}
        {regionalEvents.map(e => (
          <EventCard key={e.id} event={e} />
        ))}
      </section>

      {showPendingModal && (
        <div className="modal-overlay" onClick={() => setShowPendingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Pending Host Requests</h2>
              <button className="modal-close-btn" onClick={() => setShowPendingModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {pendingRequests.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: '2rem 0' }}>
                  No pending host requests currently.
                </p>
              ) : (
                pendingRequests.map(req => (
                  <PendingRequestCard key={req.id} request={req} />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

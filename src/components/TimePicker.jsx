import React, { useState, useEffect, useRef } from 'react';

export default function TimePicker({ name, defaultValue, defaultAmpm, required, style }) {
  const [hours, setHours] = useState(12);
  const [minutes, setMinutes] = useState(0);
  const [ampm, setAmpm] = useState('PM');
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('hours'); // 'hours' or 'minutes'
  const [isDragging, setIsDragging] = useState(false);
  const [originalState, setOriginalState] = useState(null);

  const clockFaceRef = useRef(null);

  // Parse initial defaultValue and defaultAmpm
  useEffect(() => {
    if (defaultValue) {
      const parts = defaultValue.split(':');
      setHours(parseInt(parts[0], 10) || 12);
      setMinutes(parseInt(parts[1], 10) || 0);
    }
    if (defaultAmpm) {
      setAmpm(defaultAmpm);
    }
  }, [defaultValue, defaultAmpm]);

  const formattedMinutes = minutes.toString().padStart(2, '0');
  const displayTime = `${hours}:${formattedMinutes} ${ampm}`;

  const openPicker = () => {
    setOriginalState({ hours, minutes, ampm });
    setIsOpen(true);
    setMode('hours');
  };

  const handleCancel = () => {
    if (originalState) {
      setHours(originalState.hours);
      setMinutes(originalState.minutes);
      setAmpm(originalState.ampm);
    }
    setIsOpen(false);
  };

  const handleOk = () => {
    setIsOpen(false);
  };

  const calculateTimeFromCoord = (clientX, clientY) => {
    if (!clockFaceRef.current) return;
    const rect = clockFaceRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    
    let angle = Math.atan2(dy, dx);
    let angleDegrees = (angle * 180 / Math.PI) + 90;
    if (angleDegrees < 0) angleDegrees += 360;
    
    if (mode === 'hours') {
      let hr = Math.round(angleDegrees / 30);
      if (hr === 0) hr = 12;
      if (hr > 12) hr = 12;
      setHours(hr);
    } else {
      let min = Math.round(angleDegrees / 6) % 60;
      setMinutes(min);
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    calculateTimeFromCoord(e.clientX, e.clientY);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    calculateTimeFromCoord(e.touches[0].clientX, e.touches[0].clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      calculateTimeFromCoord(e.clientX, e.clientY);
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      calculateTimeFromCoord(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, mode]);

  const handAngle = mode === 'hours' ? hours * 30 : minutes * 6;

  const getNumberStyle = (index, total = 12, radius = 65) => {
    const angle = (index / total) * 2 * Math.PI;
    const x = Math.sin(angle) * radius;
    const y = -Math.cos(angle) * radius;
    return {
      left: `calc(50% + ${x}px)`,
      top: `calc(50% + ${y}px)`
    };
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input type="hidden" name={name} value={`${hours.toString().padStart(2, '0')}:${formattedMinutes}`} />
      <input type="hidden" name="ampm" value={ampm} />

      <div 
        onClick={openPicker}
        className="form-control"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          userSelect: 'none',
          ...style
        }}
      >
        <span style={{ color: 'var(--text-primary)' }}>{displayTime}</span>
        <svg 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="var(--gold-primary)" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>

      {isOpen && (
        <>
          <div 
            onClick={handleCancel}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              zIndex: 9999,
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)'
            }}
          />

          <div 
            className="clock-picker-modal"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '280px',
              background: '#121211',
              border: '1px solid var(--card-border)',
              borderRadius: '16px',
              padding: '1.25rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(212,175,55,0.15)',
              zIndex: 10000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: '100%',
                marginBottom: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                paddingBottom: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '2rem', fontWeight: 'bold' }}>
                <span 
                  onClick={() => setMode('hours')}
                  style={{ 
                    color: mode === 'hours' ? 'var(--gold-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '0 4px',
                    transition: 'color 0.2s'
                  }}
                >
                  {hours.toString().padStart(2, '0')}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>:</span>
                <span 
                  onClick={() => setMode('minutes')}
                  style={{ 
                    color: mode === 'minutes' ? 'var(--gold-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '0 4px',
                    transition: 'color 0.2s'
                  }}
                >
                  {formattedMinutes}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '12px' }}>
                <span 
                  onClick={() => setAmpm('AM')}
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    color: ampm === 'AM' ? 'var(--gold-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    background: ampm === 'AM' ? 'rgba(212,175,55,0.1)' : 'transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  AM
                </span>
                <span 
                  onClick={() => setAmpm('PM')}
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    color: ampm === 'PM' ? 'var(--gold-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    background: ampm === 'PM' ? 'rgba(212,175,55,0.1)' : 'transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  PM
                </span>
              </div>
            </div>

            <div 
              ref={clockFaceRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              style={{
                position: 'relative',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(212, 175, 55, 0.1)',
                cursor: 'pointer',
                userSelect: 'none',
                marginBottom: '1rem'
              }}
            >
              <div 
                style={{
                  position: 'absolute',
                  width: '6px',
                  height: '6px',
                  background: 'var(--gold-primary)',
                  borderRadius: '50%',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10
                }}
              />

              <div 
                style={{
                  position: 'absolute',
                  width: '2px',
                  height: '70px',
                  background: 'var(--gold-primary)',
                  bottom: '50%',
                  left: 'calc(50% - 1px)',
                  transformOrigin: 'bottom center',
                  transform: `rotate(${handAngle}deg)`,
                  zIndex: 8,
                  pointerEvents: 'none'
                }}
              >
                <div 
                  style={{
                    position: 'absolute',
                    width: '24px',
                    height: '24px',
                    background: 'var(--gold-primary)',
                    borderRadius: '50%',
                    top: '-12px',
                    left: '-11px',
                    boxShadow: '0 0 8px rgba(212,175,55,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    fontWeight: 'bold',
                    fontSize: '0.75rem'
                  }}
                >
                  <div style={{ width: '4px', height: '4px', background: '#000', borderRadius: '50%' }} />
                </div>
              </div>

              {mode === 'hours' ? (
                Array.from({ length: 12 }, (_, i) => {
                  const val = i + 1;
                  const active = hours === val;
                  const style = getNumberStyle(val, 12, 65);
                  return (
                    <div 
                      key={val}
                      style={{
                        position: 'absolute',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: active ? 'bold' : 'normal',
                        color: active ? '#000' : 'var(--text-secondary)',
                        zIndex: active ? 9 : 7,
                        pointerEvents: 'none',
                        transform: 'translate(-50%, -50%)',
                        ...style
                      }}
                    >
                      {val}
                    </div>
                  );
                })
              ) : (
                Array.from({ length: 12 }, (_, i) => {
                  const val = i * 5;
                  const active = minutes === val;
                  const style = getNumberStyle(i, 12, 65);
                  const displayVal = val.toString().padStart(2, '0');
                  return (
                    <div 
                      key={val}
                      style={{
                        position: 'absolute',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: active ? 'bold' : 'normal',
                        color: active ? '#000' : 'var(--text-secondary)',
                        zIndex: active ? 9 : 7,
                        pointerEvents: 'none',
                        transform: 'translate(-50%, -50%)',
                        ...style
                      }}
                    >
                      {displayVal}
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '0.5rem' }}>
              {mode === 'hours' ? (
                <>
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    onClick={handleCancel}
                    style={{
                      flex: 1,
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.8rem',
                      borderRadius: '6px',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    className="btn btn-primary" 
                    onClick={() => setMode('minutes')}
                    style={{
                      flex: 1,
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.8rem',
                      borderRadius: '6px'
                    }}
                  >
                    Next
                  </button>
                </>
              ) : (
                <>
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    onClick={() => setMode('hours')}
                    style={{
                      flex: 1,
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.8rem',
                      borderRadius: '6px',
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    Back
                  </button>
                  <button 
                    type="button"
                    className="btn btn-primary" 
                    onClick={handleOk}
                    style={{
                      flex: 1,
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.8rem',
                      borderRadius: '6px'
                    }}
                  >
                    OK
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

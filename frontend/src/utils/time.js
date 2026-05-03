export const formatEventTime = (utcIsoString) => {
  if (!utcIsoString) return { dateStr: 'TBD', istTime: 'TBD', utcTime: 'TBD' };
  const date = new Date(utcIsoString);
  if (isNaN(date)) return { dateStr: 'Invalid Date', istTime: 'Invalid Date', utcTime: 'Invalid Date' };
  
  const istTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date) + ' IST';
  
  const utcTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }).format(date);
  
  const dateStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);

  return { dateStr, istTime, utcTime };
};

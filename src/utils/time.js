export const formatEventTime = (utcIsoString) => {
  if (!utcIsoString) return { dateStr: 'TBD', istTime: 'TBD' };
  const date = new Date(utcIsoString);
  if (isNaN(date)) return { dateStr: 'Invalid Date', istTime: 'Invalid Date' };
  
  const istTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date) + ' IST';
  
  const dateStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);

  return { dateStr, istTime };
};

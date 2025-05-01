'use client';

import { useState, useEffect } from 'react';

interface ChatTimestampProps {
  timestamp: Date | string | number | null | undefined;
}

export default function ChatTimestamp({ timestamp }: ChatTimestampProps) {
  const [formattedTime, setFormattedTime] = useState('');

  useEffect(() => {
    // Ensure this code only runs on the client after hydration
    if (typeof window !== 'undefined' && timestamp) {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      if (!isNaN(date.getTime())) {
        // Format using client's locale settings
        setFormattedTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      } else {
        setFormattedTime(''); // Handle invalid date
      }
    }
  }, [timestamp]); // Re-run if timestamp changes

  // Render the formatted time, or an empty string/placeholder initially
  return <>{formattedTime}</>;
}

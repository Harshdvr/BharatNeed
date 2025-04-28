
import React from 'react';
import { cn } from '@/lib/utils';

interface BharatNeedLogoProps extends React.SVGProps<SVGSVGElement> {}

// SVG recreation based on the provided logo image
export default function BharatNeedLogo({ className, ...props }: BharatNeedLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 180 45" // Adjusted viewBox
      className={cn("h-8 w-auto", className)} // Default size, can be overridden
      {...props}
    >
      {/* Pin Shape */}
      <g transform="translate(5, 0)">
        {/* Outer Border (very thin) */}
        <path
            d="M20 0 C8.96 0 0 8.96 0 20 C0 34.2 18.4 42.8 19.2 43.2 C19.6 43.4 20.4 43.4 20.8 43.2 C21.6 42.8 40 34.2 40 20 C40 8.96 31.04 0 20 0 Z"
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="0.2"
          />

        {/* Orange Top Part */}
        <path
          d="M20 3.5 C12.54 3.5 6.5 9.54 6.5 17 A 13.5 13.5 0 0 0 20 30.5 A 13.5 13.5 0 0 0 33.5 17 C33.5 9.54 27.46 3.5 20 3.5 Z"
          fill="#FF9800" // Orange color from style guide
        />
        {/* Green Bottom Part */}
        <path
           d="M20 30.5 C6.5 30.5 6.5 17 6.5 17 C6.5 29.8 18.4 38.8 19.2 39.2 C19.6 39.4 20.4 39.4 20.8 39.2 C21.6 38.8 33.5 29.8 33.5 17 C33.5 17 33.5 30.5 20 30.5 Z"
          fill="#388E3C" // Earthy Green color from style guide
        />
         {/* Handshake (Simplified) */}
         <g transform="translate(13, 14) scale(0.3)">
             {/* Hand 1 (Fingers pointing right) */}
             <path d="M10 15 L 20 15 L 20 18 L 25 18 L 25 21 L 20 21 L 20 24 L 10 24 Z" fill="white"/>
             {/* Hand 2 (Fingers pointing left) */}
             <path d="M30 15 L 20 15 L 20 18 L 15 18 L 15 21 L 20 21 L 20 24 L 30 24 Z" fill="white"/>
             {/* Thumbs */}
             <path d="M18 12 L 22 12 L 20 15 Z" fill="white"/>
             <path d="M22 12 L 26 12 L 24 15 Z" fill="white"/>
         </g>

         {/* Small blueish dot at the bottom */}
         <circle cx="20" cy="41.5" r="1.5" fill="hsl(var(--secondary))" />

      </g>

      {/* Text */}
       <style>{`
        .bn-text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; font-weight: 600; font-size: 18px; }
        .bn-subtext { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; font-size: 9px; fill: hsl(var(--muted-foreground)); }
        .bharat-text { fill: hsl(var(--primary)); } /* Orange */
        .need-text { fill: hsl(var(--foreground)); }
      `}</style>
      <text x="55" y="22" className="bn-text bharat-text">Bharat</text>
      <text x="115" y="22" className="bn-text need-text">Need</text>
      {/* Hindi Text "Bharat" */}
      <text x="55" y="35" className="bn-subtext">भारत</text>
    </svg>
  );
}


import React from 'react';
import { cn } from '@/lib/utils';

interface BharatNeedLogoProps extends React.SVGProps<SVGSVGElement> {}

// SVG recreation based on the provided logo image
export default function BharatNeedLogo({ className, ...props }: BharatNeedLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 180 45" // Adjusted viewBox for better text rendering space
      className={cn("h-8 w-auto", className)} // Default size, can be overridden
      {...props}
    >
      {/* Pin Shape */}
      <g transform="translate(5, 0)">
        {/* Outer pin shape */}
        <path
          d="M20 0 C8.96 0 0 8.96 0 20 C0 34.2 18.4 42.8 19.2 43.2 C19.6 43.4 20.4 43.4 20.8 43.2 C21.6 42.8 40 34.2 40 20 C40 8.96 31.04 0 20 0 Z"
          fill="hsl(var(--background))" // Match background or make transparent if needed
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="0.3"
        />

        {/* Orange Top Part */}
        <path
          // Adjusted path for the orange top semicircle within the pin
          d="M3.5 20 C3.5 10.89 10.89 3.5 20 3.5 C29.11 3.5 36.5 10.89 36.5 20 Z"
          fill="hsl(var(--primary))" // Use primary color (Orange)
          transform="translate(0,0)" // No additional transform needed here
        />
        {/* Green Bottom Part */}
        <path
           // Adjusted path for the green bottom part
          d="M3.5 20 C3.5 30 18.4 38.8 19.2 39.2 C19.6 39.4 20.4 39.4 20.8 39.2 C21.6 38.8 36.5 30 36.5 20 Z"
          fill="#388E3C" // Use specific green color from style guide
          transform="translate(0,0)" // No additional transform needed here
        />
         {/* Handshake (Simplified - White) */}
         <g transform="translate(13.5, 14) scale(0.28)">
             {/* Hand 1 (Right side) */}
             <path d="M10 15 C 12 13, 18 13, 20 15 L 20 25 L 23 25 L 23 28 L 20 28 L 20 30 L 10 30 Z" fill="white"/>
             {/* Thumb 1 */}
             <path d="M17 12 L 20 10 L 21 14 Z" fill="white"/>

             {/* Hand 2 (Left side) */}
              <path d="M30 15 C 28 13, 22 13, 20 15 L 20 25 L 17 25 L 17 28 L 20 28 L 20 30 L 30 30 Z" fill="white"/>
             {/* Thumb 2 */}
             <path d="M23 12 L 20 10 L 19 14 Z" fill="white"/>
         </g>

         {/* Small blueish dot at the bottom - removed as it's not clearly visible in the source image */}
         {/* <circle cx="20" cy="41.5" r="1.5" fill="hsl(var(--secondary))" /> */}

      </g>

      {/* Text */}
       <style>{`
        /* Use system font stack for better cross-platform consistency */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap'); /* Example: Using Inter, adjust as needed */

        .bn-text { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; font-weight: 600; font-size: 18px; }
        .bn-subtext { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; font-size: 9px; fill: hsl(var(--muted-foreground)); }
        .bharat-text { fill: hsl(var(--primary)); } /* Orange */
        .need-text { fill: hsl(var(--foreground)); } /* Dark Gray/Black */
      `}</style>
      <text x="55" y="22" className="bn-text bharat-text">Bharat</text>
      <text x="115" y="22" className="bn-text need-text">Need</text>
      {/* Hindi Text "भारत" */}
      <text x="55" y="35" className="bn-subtext">भारत</text>
    </svg>
  );
}

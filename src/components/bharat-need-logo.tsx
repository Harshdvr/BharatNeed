
import React from 'react';
import { cn } from '@/lib/utils';

interface BharatNeedLogoProps extends React.SVGProps<SVGSVGElement> {}

// Updated SVG for clarity and better theme integration
export default function BharatNeedLogo({ className, ...props }: BharatNeedLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 180 45" // Adjusted viewBox
      className={cn("h-8 w-auto", className)} // Default size
      {...props}
    >
      {/* Style Definitions */}
      <style>{`
        /* Use system font stack */
        .bn-text { font-family: 'Aptos', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; font-weight: 600; font-size: 18px; }
        .bn-subtext { font-family: 'Aptos', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; font-size: 9px; fill: hsl(var(--muted-foreground)); }
        .bharat-text { fill: hsl(var(--primary)); } /* Orange */
        .need-text { fill: hsl(var(--foreground)); } /* Default text color */
        .pin-fill-primary { fill: hsl(var(--primary)); } /* Orange */
        .pin-fill-green { fill: #388E3C; } /* Specific Green */
        .pin-handshake { fill: white; }
        .pin-outline { stroke: hsl(var(--muted-foreground)); stroke-width: 0.5; }
      `}</style>

      {/* Pin Group */}
      <g transform="translate(5, 0)">
        {/* Outer Pin Shape (using a path for better control) */}
        <path
          d="M20 0 C9 0 0 9 0 20 C0 35 20 45 20 45 C20 45 40 35 40 20 C40 9 31 0 20 0 Z"
          fill="hsl(var(--card))" // Use card background for the base
          className="pin-outline"
        />

        {/* Top Orange Part (Semicircle) */}
        <path
          d="M3.5 20 A16.5 16.5 0 0 1 36.5 20 Z" // Adjusted arc path
          className="pin-fill-primary"
          transform="rotate(180 20 20)" // Rotate to place at the top
        />

        {/* Bottom Green Part (Rounded bottom) */}
        <path
          d="M3.5 20 C3.5 31 10 39 20 39 C30 39 36.5 31 36.5 20 Z" // Adjusted curve
          className="pin-fill-green"
        />

        {/* Simplified Handshake Icon */}
        <g transform="translate(13.5, 14) scale(0.28)">
          {/* Hand 1 */}
          <path d="M10 15 C 12 13, 18 13, 20 15 L 20 30 L 10 30 Z" className="pin-handshake" />
          <path d="M17 12 L 20 10 L 21 14 Z" className="pin-handshake" />
          {/* Hand 2 */}
          <path d="M30 15 C 28 13, 22 13, 20 15 L 20 30 L 30 30 Z" className="pin-handshake" />
          <path d="M23 12 L 20 10 L 19 14 Z" className="pin-handshake" />
        </g>
      </g>

      {/* Text Elements */}
      <text x="55" y="22" className="bn-text bharat-text">Bharat</text>
      <text x="115" y="22" className="bn-text need-text">Need</text>
      {/* Hindi Text "भारत" */}
      <text x="55" y="35" className="bn-subtext">भारत</text>
    </svg>
  );
}

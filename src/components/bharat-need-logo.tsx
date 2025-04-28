
import React from 'react';
import { cn } from '@/lib/utils';

interface BharatNeedLogoProps extends React.SVGProps<SVGSVGElement> {}

// Updated SVG based on the provided PNG image
export default function BharatNeedLogo({ className, ...props }: BharatNeedLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50" // Adjusted viewBox to accommodate text and shadow
      className={cn("h-10 w-auto", className)} // Slightly increased default height
      {...props}
    >
      {/* Style Definitions */}
      <style>{`
        /* Use Aptos font stack */
        .bn-text { font-family: 'Aptos', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; font-weight: 600; font-size: 22px; }
        .bn-subtext { font-family: 'Aptos', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; font-size: 10px; fill: hsl(var(--muted-foreground)); }

        /* Define specific colors from the image */
        .bn-orange { fill: #F57C00; } /* Adjust orange as needed */
        .bn-green { fill: #388E3C; } /* Specific Green */
        .bn-dark-blue { fill: #1976D2; } /* Specific Dark Blue for text */
        .bn-shadow-blue { fill: #0D47A1; } /* Darker blue for shadow */
        .bn-white { fill: white; }
        .bn-outline { stroke: #424242; stroke-width: 0.5; } /* Optional subtle outline */

         /* Text Styles */
        .bharat-need-text { fill: var(--bn-dark-blue, #1976D2); } /* Use CSS variable or fallback */
      `}</style>

        {/* Define reusable colors */ }
        <defs>
            <style>
              {`
                :root {
                  --bn-orange: #F57C00;
                  --bn-green: #388E3C;
                  --bn-dark-blue: #1976D2;
                  --bn-shadow-blue: #0D47A1;
                  --bn-white: white;
                }
              `}
            </style>
        </defs>


      {/* Pin Group */}
      <g transform="translate(5, 2)"> {/* Adjusted vertical position */}
        {/* Shadow Ellipse */}
        <ellipse cx="20" cy="46" rx="15" ry="3" fill="var(--bn-shadow-blue, #0D47A1)" opacity="0.8"/>

        {/* Outer Pin Shape Path */}
        <path
          d="M20 0 C9 0 0 9 0 20 C0 35 20 45 20 45 C20 45 40 35 40 20 C40 9 31 0 20 0 Z"
          fill="var(--bn-green, #388E3C)" // Base fill is green
          className="bn-outline" // Add outline class
        />

        {/* Top Orange Arc Path */}
         <path
            d="M3.5 20 A16.5 16.5 0 0 1 36.5 20 L 20 20 Z" // Path for the upper semicircle
            fill="var(--bn-orange, #F57C00)" // Orange color
            transform="rotate(180 20 20)" // Rotate to place at the top
        />


         {/* Simplified Handshake Icon (White) - Adjusted scale/position */}
         <g transform="translate(12.5, 15) scale(0.35)">
            {/* Hand 1 */}
            <path d="M10 15 C 12 13, 18 13, 20 15 L 20 30 L 10 30 Z" fill="var(--bn-white, white)" />
            <path d="M17 12 L 20 10 L 21 14 Z" fill="var(--bn-white, white)" />
            {/* Hand 2 */}
            <path d="M30 15 C 28 13, 22 13, 20 15 L 20 30 L 30 30 Z" fill="var(--bn-white, white)" />
            <path d="M23 12 L 20 10 L 19 14 Z" fill="var(--bn-white, white)" />
        </g>
      </g>

      {/* Text Elements */}
      {/* Increased font size and adjusted positioning */}
      <text x="55" y="20" className="bn-text bharat-need-text">Bharat</text>
      <text x="55" y="42" className="bn-text bharat-need-text">Need</text>
      {/* Hindi Text "भारत" - Positioned below "Bharat" */}
      {/* <text x="55" y="35" className="bn-subtext">भारत</text> */}
      {/* Removed Hindi text for now as it wasn't explicitly requested to be added back */ }

    </svg>
  );
}


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

        /* Define specific colors from the image */
        .bn-orange { fill: #F57C00; } /* Extracted orange */
        .bn-green { fill: #388E3C; } /* Extracted Green */
        .bn-dark-blue { fill: #1976D2; } /* Extracted Dark Blue for text */
        .bn-shadow-blue { fill: #0D47A1; } /* Extracted Darker blue for shadow */
        .bn-white { fill: white; }

         /* Text Styles */
        .bharat-need-text { fill: var(--bn-dark-blue, #1976D2); } /* Use CSS variable or fallback */
      `}</style>

        {/* Define reusable colors using CSS variables within SVG */ }
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

        {/* Outer Pin Shape Path - Green Base */}
        <path
          d="M20 0 C9 0 0 9 0 20 C0 35 20 45 20 45 C20 45 40 35 40 20 C40 9 31 0 20 0 Z"
          fill="var(--bn-green, #388E3C)" // Base fill is green
        />

        {/* Top Orange Arc Path */}
         <path
            // Slightly adjusted arc path to better match the shape
            d="M 3.5 19 A 17 17 0 0 1 36.5 19 L 20 19 Z"
            fill="var(--bn-orange, #F57C00)" // Orange color
            transform="rotate(180 20 19)" // Rotate around the center of the arc base
        />


         {/* Handshake Icon (White) - More detailed */}
         <g transform="translate(11.5, 20) scale(0.38)"> {/* Adjusted scale and position */}
             {/* Hand 1 (Left) */}
             <path d="M 5,15 Q 8,12 12,12 L 15,12 Q 18,12 20,15 L 20,25 Q 18,28 15,28 L 8,28 Q 5,28 5,25 Z" fill="var(--bn-white, white)" />
             {/* Thumb 1 */}
             <path d="M 12,12 Q 10,10 12,8 L 15,8 Q 17,10 15,12 Z" fill="var(--bn-white, white)" />

             {/* Hand 2 (Right) */}
             <path d="M 35,15 Q 32,12 28,12 L 25,12 Q 22,12 20,15 L 20,25 Q 22,28 25,28 L 32,28 Q 35,28 35,25 Z" fill="var(--bn-white, white)" />
             {/* Thumb 2 */}
             <path d="M 28,12 Q 30,10 28,8 L 25,8 Q 23,10 25,12 Z" fill="var(--bn-white, white)" />
         </g>
      </g>

      {/* Text Elements */}
      {/* Increased font size and adjusted positioning */}
      <text x="55" y="20" className="bn-text bharat-need-text">Bharat</text>
      <text x="55" y="42" className="bn-text bharat-need-text">Need</text>
      {/* Hindi Text "भारत" - Added back below "Bharat" */}
      {/* <text x="55" y="35" className="bn-subtext" fill="var(--bn-dark-blue, #1976D2)">भारत</text> */}
      {/* Removing Hindi text as per previous versions where it wasn't explicitly kept */}

    </svg>
  );
}

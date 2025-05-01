
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ShoppingBag, Wrench, Briefcase, Tractor, GraduationCap, HandHeart, Home, Shapes } from 'lucide-react'; // Import relevant icons

interface CategoryDetail {
  name: string;
  icon: React.ElementType;
}

// Define category details including icons
const categoryDetails: CategoryDetail[] = [
  { name: 'Buy/Sell', icon: ShoppingBag },
  { name: 'Services', icon: Wrench },
  { name: 'Jobs', icon: Briefcase },
  { name: 'Farming', icon: Tractor },
  { name: 'Education', icon: GraduationCap }, // Changed from Tuitions
  { name: 'Help', icon: HandHeart },
  { name: 'Property', icon: Home }, // Added Property
  { name: 'Other', icon: Shapes },
];

interface CategorySelectorProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export default function CategorySelector({ selectedCategory, onSelectCategory }: CategorySelectorProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4 mb-8"> {/* Increased gap */}
      {categoryDetails.map((category) => (
        <Button
          key={category.name}
          variant="outline"
          className={cn(
            'flex flex-col items-center justify-center h-24 w-24 p-3 rounded-lg border shadow-sm transition-colors', // Increased h-20 w-20 to h-24 w-24, adjusted padding
            selectedCategory === category.name.toLowerCase()
              ? 'bg-primary/10 border-primary text-primary shadow-md' // Added shadow-md on select
              : 'text-foreground hover:bg-primary/10 hover:border-primary hover:text-primary hover:shadow-md'
          )}
          onClick={() => onSelectCategory(category.name.toLowerCase())}
        >
          {/* Apply orange color (primary) to the icon - Ensure it stays orange */}
          <category.icon className={cn(
              "h-8 w-8 mb-1.5 text-primary" // Increased icon size (h-6 w-6 to h-8 w-8), adjusted margin
           )} />
          <span className="text-sm font-medium">{category.name}</span> {/* Increased text size to text-sm */}
        </Button>
      ))}
       {/* Optionally add an "All Categories" button */}
       {/* <Button
        variant={!selectedCategory ? 'secondary' : 'outline'}
        className={cn('h-24 w-24 p-3 rounded-lg border shadow-sm')} // Matched size
        onClick={() => onSelectCategory(null)}
      >
        <span className="text-sm font-medium">All</span>
      </Button> */}
    </div>
  );
}

// Export category details if needed elsewhere
CategorySelector.categoryDetails = categoryDetails;



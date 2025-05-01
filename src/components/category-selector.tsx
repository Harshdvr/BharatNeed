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
    <div className="flex flex-wrap justify-center gap-3 mb-8">
      {categoryDetails.map((category) => (
        <Button
          key={category.name}
          variant="outline"
          className={cn(
            'flex flex-col items-center justify-center h-20 w-20 p-2 rounded-lg border shadow-sm transition-colors',
            selectedCategory === category.name.toLowerCase()
              ? 'bg-primary/10 border-primary text-primary'
              : 'text-foreground hover:bg-muted/50 hover:border-muted-foreground/30'
          )}
          onClick={() => onSelectCategory(category.name.toLowerCase())}
        >
          <category.icon className="h-6 w-6 mb-1" />
          <span className="text-xs font-medium">{category.name}</span>
        </Button>
      ))}
       {/* Optionally add an "All Categories" button */}
       {/* <Button
        variant={!selectedCategory ? 'secondary' : 'outline'}
        className={cn('h-20 w-20 p-2 rounded-lg border shadow-sm')}
        onClick={() => onSelectCategory(null)}
      >
        All
      </Button> */}
    </div>
  );
}

// Export category details if needed elsewhere
CategorySelector.categoryDetails = categoryDetails;

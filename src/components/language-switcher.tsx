'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function LanguageSwitcher() {
  const [language, setLanguage] = React.useState('English'); // Default language

  // TODO: Implement actual language switching logic
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    console.log(`Language switched to ${lang}`);
    // Add logic to update locale/context/storage
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleLanguageChange('English')}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange('Hindi')}>
          हिन्दी (Hindi)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange('Hinglish')}>
          Hinglish
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

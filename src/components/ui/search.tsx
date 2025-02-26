"use client";

import { useState, ChangeEvent, KeyboardEvent } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { Search as SearchIcon } from "lucide-react";

interface SearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
}

export function Search({ onSearch, placeholder = "Search...", className = "", initialValue = "" }: SearchProps) {
  const [query, setQuery] = useState(initialValue);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSearch = () => {
    onSearch(query);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="relative flex-grow">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="pr-10 w-full"
        />
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-0 top-0 h-full" 
          onClick={handleSearch}
          type="button"
        >
          <SearchIcon className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>
      </div>
    </div>
  );
} 
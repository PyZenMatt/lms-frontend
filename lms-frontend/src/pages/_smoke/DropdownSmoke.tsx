import React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function DropdownSmoke() {
  return (
    <div className="p-12">
      <h2 className="mb-4 text-lg">Dropdown smoke test page</h2>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button data-slot="dropdown-menu-trigger" variant="default" size="default">Open menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuItem>First action</DropdownMenuItem>
          <DropdownMenuItem>Second action</DropdownMenuItem>
          <DropdownMenuItem>Third action</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

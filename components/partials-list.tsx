"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import type { PromptPartial } from "@/types";

interface PartialsListProps {
  promptPartials: PromptPartial[];
  onInsertPartial: (partialName: string) => void;
}

export function PartialsList({
  promptPartials,
  onInsertPartial,
}: PartialsListProps) {
  if (!promptPartials || promptPartials.length === 0) {
    return (
      <p className="text-xs text-muted-foreground mt-1">
        No prompt partials defined.
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-2 border p-3 rounded-md bg-muted/30">
      <Label className="text-sm font-medium mb-2 block">Insert Partial</Label>
      <ScrollArea className="max-h-48 pr-3">
        <div className="space-y-1">
          {promptPartials.map((partial) => (
            <Button
              key={partial.id}
              variant="link"
              size="sm"
              className="p-0 h-auto text-left block w-full truncate text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              onClick={() => onInsertPartial(partial.name)}
              title={`Click to insert {% include "_partials/${partial.name}.jinja2" %}`}
            >
              {partial.name}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

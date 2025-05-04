"use client";

import React from "react";
import type { PromptPartial } from "@/types";
import { cn } from "@/lib/utils";

interface PromptPreviewProps {
  rawPrompt: string;
  promptPartials: PromptPartial[];
  className?: string;
}

export function PromptPreview({
  rawPrompt,
  promptPartials,
  className,
}: PromptPreviewProps) {
  const partialMap = new Map(promptPartials.map((p) => [p.name, p.content]));
  const placeholderRegex = /\{%\s*include\s*"_partials\/(.*?)\.jinja2"\s*%\}/g;

  const renderContent = () => {
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = placeholderRegex.exec(rawPrompt)) !== null) {
      const [fullMatch, partialName] = match;
      const index = match.index;

      if (index > lastIndex) {
        elements.push(rawPrompt.substring(lastIndex, index));
      }

      const partialContent = partialMap.get(partialName);

      if (partialContent !== undefined) {
        elements.push(
          <span
            key={index}
            className="prompt-partial prompt-partial-content"
            title={`Partial: ${partialName} (Included via {% include "_partials/${partialName}.jinja2" %})`}
          >
            {partialContent}
          </span>,
        );
      } else {
        elements.push(
          <span
            key={index}
            className="prompt-partial prompt-partial-invalid"
            title={`Invalid partial name: ${partialName} (Referenced via ${fullMatch})`}
          >
            {fullMatch}
          </span>,
        );
      }

      lastIndex = index + fullMatch.length;
    }

    if (lastIndex < rawPrompt.length) {
      elements.push(rawPrompt.substring(lastIndex));
    }

    if (elements.length === 0 && rawPrompt.length === 0) {
      return <span className="text-muted-foreground italic">Empty prompt</span>;
    } else if (elements.length === 0) {
      return rawPrompt;
    }

    return elements;
  };

  return <div className={cn("p-3", className)}> {renderContent()}</div>;
}

"use client"

import React from "react"
import type { PromptPartial } from "@/types"
import { cn } from "@/lib/utils" // Import cn utility

interface PromptPreviewProps {
  rawPrompt: string
  promptPartials: PromptPartial[]
  // showContent: boolean // Remove this prop
  className?: string // Add className prop
}

export function PromptPreview({ rawPrompt, promptPartials, className }: PromptPreviewProps) {
  const partialMap = new Map(promptPartials.map((p) => [p.name, p.content]))
  // Updated regex to match {% include "_partials/NAME.jinja2" %}
  const placeholderRegex = /\{%\s*include\s*"_partials\/(.*?)\.jinja2"\s*%\}/g

  const renderContent = () => {
    const elements: React.ReactNode[] = []
    let lastIndex = 0
    let match

    while ((match = placeholderRegex.exec(rawPrompt)) !== null) {
      const [fullMatch, partialName] = match
      const index = match.index

      // Add text before the match
      if (index > lastIndex) {
        elements.push(rawPrompt.substring(lastIndex, index))
      }

      const partialContent = partialMap.get(partialName)

      if (partialContent !== undefined) {
        // Valid partial found - Always show content
        elements.push(
          // Updated title format
          <span key={index} className="prompt-partial prompt-partial-content" title={`Partial: ${partialName} (Included via {% include "_partials/${partialName}.jinja2" %})`}>
            {partialContent}
          </span>
        )
        // Remove the block that showed the name
        /*
        } else {
          elements.push(
            <span key={index} className="prompt-partial prompt-partial-name" title="Click toggle to expand">
              {fullMatch}
            </span>
          )
        }
        */
      } else {
        // Invalid partial name
        elements.push(
          // Updated title format
          <span key={index} className="prompt-partial prompt-partial-invalid" title={`Invalid partial name: ${partialName} (Referenced via ${fullMatch})`}>
            {fullMatch}
          </span>
        )
      }

      lastIndex = index + fullMatch.length
    }

    // Add any remaining text after the last match
    if (lastIndex < rawPrompt.length) {
      elements.push(rawPrompt.substring(lastIndex))
    }

    // Handle case where rawPrompt is empty or has no partials
    if (elements.length === 0 && rawPrompt.length === 0) {
       return <span className="text-muted-foreground italic">Empty prompt</span>;
    } else if (elements.length === 0) {
       return rawPrompt; // No partials found, just return the raw text
    }


    return elements
  }

  // Apply the passed className to the outer div using cn
  return (
    <div className={cn("p-3", className)}> {/* Apply className here */}
      {renderContent()}
    </div>
  )
}
"use client";

import { useState, useRef, createRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
// Import new icons and PromptPreview, change TrashIcon to Trash2Icon
import {
  Trash2Icon,
  PlusIcon,
  EyeIcon,
  EyeOffIcon,
  VariableIcon,
} from "lucide-react";
// Import Accordion components
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { PromptPartial, State } from "@/types";
import { StateVariableInserter } from "@/components/state-variable-inserter";
// Import PromptPreview
import { PromptPreview } from "@/components/prompt-preview";
// Import defaultMetaFields
import { defaultMetaFields } from "./state-config";

interface PromptPartialsConfigProps {
  promptPartials: PromptPartial[];
  onChange: (promptPartials: PromptPartial[]) => void;
  state: State;
}

export function PromptPartialsConfig({
  promptPartials = [],
  onChange,
  state,
}: PromptPartialsConfigProps) {
  const contentRefs = useRef<
    Record<string, React.RefObject<HTMLTextAreaElement>>
  >({});
  // Add state for preview modes and inserter visibility
  const [previewModes, setPreviewModes] = useState<Record<string, boolean>>({});
  const [inserterVisibility, setInserterVisibility] = useState<
    Record<string, boolean>
  >({});

  promptPartials.forEach((partial) => {
    if (!contentRefs.current[partial.id]) {
      contentRefs.current[partial.id] = createRef<HTMLTextAreaElement>();
    }
  });

  // Create a combined state object for the variable inserter
  const stateForInserter: State = {
    ...state,
    metaInformation: [
      ...defaultMetaFields,
      ...(state.metaInformation || []).filter(
        (field) =>
          !defaultMetaFields.some(
            (defaultField) => defaultField.name === field.name,
          ),
      ),
    ],
  };

  const handleAddPartial = () => {
    const newPartial: PromptPartial = {
      id: crypto.randomUUID(),
      name: `partial_${promptPartials.length + 1}`,
      content: "",
    };
    onChange([...promptPartials, newPartial]);
    // Reset inserter visibility for the new partial
    setInserterVisibility((prev) => ({ ...prev, [newPartial.id]: false }));
  };

  const handleUpdatePartial = (
    id: string,
    field: keyof PromptPartial,
    value: string,
  ) => {
    const updatedPartials = promptPartials.map((partial) =>
      partial.id === id ? { ...partial, [field]: value } : partial,
    );
    onChange(updatedPartials);
  };

  const handleDeletePartial = (id: string) => {
    delete contentRefs.current[id];
    const updatedPartials = promptPartials.filter(
      (partial) => partial.id !== id,
    );
    onChange(updatedPartials);
    // Clean up inserter visibility state
    setInserterVisibility((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  // Helper function to toggle preview mode for a specific partial
  const togglePreviewMode = (id: string) => {
    setPreviewModes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper function to toggle visibility for state variables inserter
  const toggleInserterVisibility = (id: string) => {
    setInserterVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prompt Partials</CardTitle>
        <p className="text-muted-foreground text-sm">
          Define reusable text snippets (partials) that can be included in your
          agent prompts using
          <code>{'{% include "_partials/partial_name.jinja2" %}'}</code> syntax.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wrap partials list in an Accordion */}
        <Accordion type="single" collapsible className="w-full space-y-4">
          {promptPartials.map((partial) => (
            // Add flex container div, remove relative class from previous container
            <div
              key={partial.id}
              className="flex items-start gap-2 mb-2 w-full"
            >
              {/* Use AccordionItem instead of Card - Remove relative and overflow-visible */}
              {/* Add flex-1 to AccordionItem to allow button to take its space */}
              <AccordionItem
                value={partial.id}
                className="flex-1 border rounded-md bg-background shadow-sm"
              >
                {/* Trigger shows the partial name */}
                <AccordionTrigger className="flex justify-between items-center w-full p-4 hover:no-underline text-left">
                  <div className="flex-1">
                    <span className="font-medium">{partial.name}</span>
                    <p className="text-xs text-muted-foreground font-normal">
                      {'{% include "_partials/' + partial.name + '.jinja2" %}'}
                    </p>
                  </div>
                </AccordionTrigger>
                {/* Content holds the editing form */}
                <AccordionContent className="p-4 pt-0">
                  {/* Remove inner Card and CardContent, keep grid */}
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor={`partial-name-${partial.id}`}>
                        Partial Name
                      </Label>
                      <Input
                        id={`partial-name-${partial.id}`}
                        value={partial.name}
                        onChange={(e) =>
                          handleUpdatePartial(
                            partial.id,
                            "name",
                            e.target.value,
                          )
                        }
                        placeholder="e.g., common_instructions"
                      />
                      {/* Removed redundant usage display here, it's in the trigger now */}
                    </div>
                    <div className="grid gap-2">
                      {/* Add Preview Toggle Button */}
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`partial-content-${partial.id}`}>
                          Content
                        </Label>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePreviewMode(partial.id)}
                          title={
                            previewModes[partial.id]
                              ? "Switch to Edit Mode"
                              : "Switch to Preview Mode"
                          }
                          className="h-7 w-7"
                        >
                          {previewModes[partial.id] ? (
                            <EyeOffIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {/* Conditional Rendering: Preview or Edit */}
                      <div className="space-y-2">
                        {previewModes[partial.id] ? (
                          <PromptPreview
                            rawPrompt={partial.content}
                            promptPartials={[]} // Partials don't include other partials in preview
                            className="min-h-[100px] border rounded-md p-3 bg-muted/50 text-sm whitespace-pre-wrap" // Adjusted background
                          />
                        ) : (
                          <>
                            <Textarea
                              ref={contentRefs.current[partial.id]}
                              id={`partial-content-${partial.id}`}
                              value={partial.content}
                              onChange={(e) =>
                                handleUpdatePartial(
                                  partial.id,
                                  "content",
                                  e.target.value,
                                )
                              }
                              placeholder="Enter the reusable prompt text here..."
                              rows={4}
                              className="font-mono text-sm min-h-[100px]"
                            />
                            {/* Add Toggle Button for StateVariableInserter */}
                            <div className="flex gap-2 mt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  toggleInserterVisibility(partial.id)
                                }
                                className="gap-1 text-xs"
                              >
                                <VariableIcon className="h-3 w-3" />
                                {inserterVisibility[partial.id]
                                  ? "Hide"
                                  : "Show"}{" "}
                                State Vars
                              </Button>
                            </div>
                            {/* Conditionally render StateVariableInserter */}
                            {inserterVisibility[partial.id] && (
                              <StateVariableInserter
                                state={stateForInserter} // Use combined state
                                textareaRef={contentRefs.current[partial.id]}
                                onInsert={(newValue) =>
                                  handleUpdatePartial(
                                    partial.id,
                                    "content",
                                    newValue,
                                  )
                                }
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              {/* Position Delete Button outside using flex */}
              <Button
                variant="ghost"
                size="sm"
                // Apply styling similar to AgentRolesConfig delete button
                className="mt-1 text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent accordion toggle
                  handleDeletePartial(partial.id);
                }}
                aria-label={`Delete partial ${partial.name}`}
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
              {/* Close the flex container div */}
            </div>
          ))}
        </Accordion>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={handleAddPartial} className="gap-2">
          <PlusIcon className="h-4 w-4" /> Add Partial
        </Button>
      </CardFooter>
    </Card>
  );
}

"use client";

import type React from "react";
import type { State, StateField } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StateVariableInserterProps {
  state: State | undefined;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onInsert: (textToInsert: string) => void;
}

export function StateVariableInserter({
  state,
  textareaRef,
  onInsert,
}: StateVariableInserterProps) {
  if (!state) {
    return null;
  }

  const handleInsert = (variablePath: string) => {
    if (!textareaRef.current) return;

    const { selectionStart, selectionEnd, value } = textareaRef.current;
    // Updated Jinja2 syntax with spaces
    const textToInsert = `{{ ${variablePath} }}`;

    const newValue =
      value.substring(0, selectionStart) +
      textToInsert +
      value.substring(selectionEnd);

    onInsert(newValue);

    // Set cursor position after the inserted text
    // Need setTimeout to ensure the update happens after the state change is rendered
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
          selectionStart + textToInsert.length;
      }
    }, 0);
  };

  // Map internal type names to desired Jinja2 variable names
  const renderFields = (
    fields: StateField[],
    type: string,
    jinjaTypeName: string
  ) => {
    if (!fields || fields.length === 0) {
      return null;
    }
    return (
      <div className="space-y-1">
        <Label className="text-xs uppercase text-muted-foreground">
          {type} Information
        </Label>
        <div className="flex flex-wrap gap-1">
          {fields.map((field) => (
            <Badge
              key={`${type}-${field.name}`}
              variant="secondary"
              className="cursor-pointer"
              // Use jinjaTypeName for the path
              onClick={() => handleInsert(`${jinjaTypeName}.${field.name}`)}
              title={`Click to insert {{ ${jinjaTypeName}.${field.name} }}`}
            >
              {field.name}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  const publicFields = renderFields(
    state.publicInformation,
    "public",
    "public_information"
  );
  const privateFields = renderFields(
    state.privateInformation,
    "private",
    "private_information"
  );
  const metaFields = renderFields(state.metaInformation, "meta", "meta");

  return (
    <div className="mt-2 p-2 border rounded-md bg-muted/30">
      {publicFields}
      {privateFields && publicFields && <Separator className="my-1" />}
      {privateFields}
      {metaFields && (privateFields || publicFields) && (
        <Separator className="my-1" />
      )}
      {metaFields}
    </div>
  );
}

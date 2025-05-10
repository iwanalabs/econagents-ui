"use client";

import type React from "react";
import type { State, StateField } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface StateVariableInserterProps {
  state: State | undefined;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
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
    const textToInsert = `{{ ${variablePath} }}`;

    const newValue =
      value.substring(0, selectionStart) +
      textToInsert +
      value.substring(selectionEnd);

    onInsert(newValue);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd =
          selectionStart + textToInsert.length;
      }
    }, 0);
  };

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

  const metaFields = renderFields(state.metaInformation, "meta", "meta");
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

  return (
    <div className="mt-2 p-2 border rounded-md bg-muted/30">
      {metaFields}
      {publicFields && metaFields && <Separator className="my-1" />}
      {publicFields}
      {privateFields && (publicFields || metaFields) && (
        <Separator className="my-1" />
      )}
      {privateFields}
    </div>
  );
}

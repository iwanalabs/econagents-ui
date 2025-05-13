"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlusIcon,
  Trash2Icon,
  EditIcon,
  LockIcon,
  KeyRound,
  Link2,
  Variable,
  CalendarDays,
  CalendarX2,
  List,
} from "lucide-react";
import type { State, StateField, StateFieldType } from "@/types/project";

interface StateConfigProps {
  state: State;
  onChange: (state: State) => void;
}

export const defaultMetaFields: StateField[] = [
  {
    name: "game_id",
    type: "int",
    default: 0,
    excludeFromMapping: true,
    optional: false,
  },
  {
    name: "player_name",
    type: "str",
    default: null,
    excludeFromMapping: false,
    optional: true,
  },
  {
    name: "player_number",
    type: "int",
    default: null,
    excludeFromMapping: false,
    optional: true,
  },
  {
    name: "players",
    type: "list",
    defaultFactory: "list",
    excludeFromMapping: false,
    optional: false,
  },
  {
    name: "phase",
    type: "int",
    default: 0,
    excludeFromMapping: false,
    optional: false,
  },
];

const defaultMetaFieldNames = new Set(defaultMetaFields.map((f) => f.name));

const typeColorMapping: Record<string, string> = {
  str: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  int: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  float: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  bool: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  list: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  dict: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  MarketState:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};
const defaultTypeColor =
  "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"; // Fallback color

const validateDefaultValue = (type: string, value: string): string | null => {
  if (type === "MarketState") {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null; // Empty is valid (will likely use defaultFactory or be null if optional)
  }

  if (type === "list" || type === "dict") {
    try {
      const parsedValue = JSON.parse(trimmedValue);
      if (type === "list" && !Array.isArray(parsedValue)) {
        return "Default value must be a valid JSON list (e.g., [1, 2]).";
      }
      if (
        type === "dict" &&
        (typeof parsedValue !== "object" ||
          parsedValue === null ||
          Array.isArray(parsedValue))
      ) {
        return 'Default value must be a valid JSON object (e.g., {"key": "value"}).';
      }
    } catch (error) {
      return "Invalid JSON format for default value. " + error;
    }
  }
  // No need to validate boolean here anymore as Select handles it
  return null; // Valid or not a list/dict type requiring JSON validation
};

export function StateConfig({ state, onChange }: StateConfigProps) {
  const [activeTab, setActiveTab] = useState("meta");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentField, setCurrentField] = useState<StateField>({
    name: "",
    type: "str",
    default: "",
    events: [],
    excludedEvents: [],
  });
  const [defaultValidationError, setDefaultValidationError] = useState<
    string | null
  >(null);

  const handleAddField = () => {
    setCurrentField({
      name: "",
      type: "str",
      default: "",
      events: [],
      excludedEvents: [],
    });
    setEditingIndex(null);
    setIsDialogOpen(true);
    setDefaultValidationError(null);
  };

  const handleEditField = (field: StateField, index: number) => {
    const initialCurrentField = { ...field };

    const hasEvents =
      initialCurrentField.events && initialCurrentField.events.length > 0;
    const hasExcludedEvents =
      initialCurrentField.excludedEvents &&
      initialCurrentField.excludedEvents.length > 0;

    if (hasEvents && hasExcludedEvents) {
      initialCurrentField.excludedEvents = [];
    }

    setCurrentField(initialCurrentField);
    setEditingIndex(index);
    setIsDialogOpen(true);
    setDefaultValidationError(null);
  };

  const handleDeleteField = (index: number) => {
    // Determine the correct key based on the active tab
    const fieldTypeKey =
      activeTab === "meta"
        ? "metaInformation"
        : activeTab === "private"
          ? "privateInformation"
          : "publicInformation";

    // Ensure the array exists before trying to modify it
    const currentFields = state[fieldTypeKey] || []; // Use the correct key
    if (index < 0 || index >= currentFields.length) {
      console.error("Index out of bounds for deletion.");
      return; // Prevent accessing invalid index
    }
    const fieldToDelete = currentFields[index];

    // Prevent deletion of default meta fields
    if (
      fieldTypeKey === "metaInformation" &&
      defaultMetaFieldNames.has(fieldToDelete.name)
    ) {
      // Optionally show a toast or message here
      console.warn(`Cannot delete default meta field: ${fieldToDelete.name}`);
      return;
    }

    const newFields = [...currentFields];
    newFields.splice(index, 1);

    onChange({
      ...state,
      [fieldTypeKey]: newFields, // Use the correct key here as well
    });
  };

  const handleSaveField = () => {
    if (!currentField.name) return;

    // Clear previous validation error
    setDefaultValidationError(null);

    const fieldTypeKey =
      activeTab === "meta"
        ? "metaInformation"
        : activeTab === "private"
          ? "privateInformation"
          : "publicInformation";

    // Work on a copy to modify before saving
    const fieldToSave: StateField = { ...currentField };

    // Process events and excluded_events: convert comma-separated strings to arrays
    // Ensure only one of them is populated.
    if (typeof fieldToSave.events === "string") {
      const eventsArray = (fieldToSave.events as string)
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
      if (eventsArray.length > 0) {
        fieldToSave.events = eventsArray;
        delete fieldToSave.excludedEvents; // Ensure excluded_events is not set if events is
      } else {
        delete fieldToSave.events;
      }
    } else if (
      Array.isArray(fieldToSave.events) &&
      fieldToSave.events.length === 0
    ) {
      delete fieldToSave.events;
    }

    if (typeof fieldToSave.excludedEvents === "string") {
      const excludedEventsArray = (fieldToSave.excludedEvents as string)
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
      if (excludedEventsArray.length > 0) {
        if (fieldToSave.events && fieldToSave.events.length > 0) {
          setDefaultValidationError(
            "Cannot set both Events and Excluded Events."
          );
          return;
        }
        fieldToSave.excludedEvents = excludedEventsArray;
        delete fieldToSave.events; // Ensure events is not set if excluded_events is
      } else {
        delete fieldToSave.excludedEvents;
      }
    } else if (
      Array.isArray(fieldToSave.excludedEvents) &&
      fieldToSave.excludedEvents.length === 0
    ) {
      delete fieldToSave.excludedEvents;
    }

    let finalDefaultValue: any = fieldToSave.default;
    const isNullOrUndefined =
      finalDefaultValue === null || finalDefaultValue === undefined;
    const isEmptyString =
      typeof finalDefaultValue === "string" && finalDefaultValue.trim() === "";

    // Check if the field is required and has no effective default value provided
    if (
      !fieldToSave.optional &&
      (isNullOrUndefined || isEmptyString) && // Check if effectively no value is provided
      fieldToSave.type !== "list" && // list/dict can use defaultFactory implicitly if empty
      fieldToSave.type !== "dict" &&
      fieldToSave.type !== "MarketState" // MarketState uses defaultFactory
    ) {
      console.error(
        `Field '${fieldToSave.name}' is required and needs a default value.`
      );
      setDefaultValidationError(
        "Default value is required for non-optional fields."
      );
      return;
    }

    // Validate list/dict default values if provided as a non-empty string
    let jsonValidationError: string | null = null;
    if (
      typeof finalDefaultValue === "string" &&
      !isEmptyString &&
      (fieldToSave.type === "list" || fieldToSave.type === "dict")
    ) {
      jsonValidationError = validateDefaultValue(
        fieldToSave.type,
        finalDefaultValue
      );
      if (jsonValidationError) {
        setDefaultValidationError(jsonValidationError);
        return;
      }
    }
    // --- End Validation ---

    // Automatically set/unset defaultFactory based on type and if default is provided
    if (fieldToSave.type === "list" || fieldToSave.type === "dict") {
      // If a specific default like '[]' or '{}' is provided (and is valid JSON), don't use factory
      if (!isNullOrUndefined && !isEmptyString) {
        try {
          // Attempt to parse JSON string for list/dict, keep as is if already object/array
          if (typeof finalDefaultValue === "string") {
            finalDefaultValue = JSON.parse(finalDefaultValue);
          }
          delete fieldToSave.defaultFactory;
        } catch (e) {
          // This should ideally be caught by validateDefaultValue earlier
          setDefaultValidationError("Invalid JSON format for default value.");
          return;
        }
      } else {
        // Otherwise, ensure factory is set (even if optional, the type needs a default constructor)
        fieldToSave.defaultFactory = fieldToSave.type;
        // Clear default value if factory is used
        finalDefaultValue = null; // Set to null when factory is used
      }
    } else if (fieldToSave.type === "bool") {
      // Boolean value is already set correctly by the Select's onChange
      delete fieldToSave.defaultFactory;
      // If optional and value is null, keep it as null
      if (fieldToSave.optional && finalDefaultValue === null) {
        // Keep finalDefaultValue as null
      }
      // The case where !optional and finalDefaultValue is null is handled by the validation above
    } else if (fieldToSave.type === "MarketState") {
      // Always use defaultFactory for MarketState
      fieldToSave.defaultFactory = "MarketState";
      finalDefaultValue = null; // No default value allowed
    } else {
      // Handle other types (str, int, float)
      delete fieldToSave.defaultFactory;
      // If optional and no default provided (null, undefined, empty string), explicitly set to null
      if (fieldToSave.optional && (isNullOrUndefined || isEmptyString)) {
        finalDefaultValue = null;
      } else if (!isNullOrUndefined && !isEmptyString) {
        // Attempt to parse int/float if needed
        if (fieldToSave.type === "int") {
          const parsedInt = parseInt(String(finalDefaultValue), 10);
          if (!isNaN(parsedInt)) {
            finalDefaultValue = parsedInt;
          } else {
            // Add validation error if parsing fails for a required field
            if (!fieldToSave.optional) {
              setDefaultValidationError(
                `Invalid integer value: "${finalDefaultValue}"`
              );
              return;
            }
            console.warn(
              `Could not parse default value "${finalDefaultValue}" as int for field "${fieldToSave.name}"`
            );
            // Keep as potentially invalid string or handle as needed for optional fields
          }
        } else if (fieldToSave.type === "float") {
          const parsedFloat = parseFloat(String(finalDefaultValue));
          if (!isNaN(parsedFloat)) {
            finalDefaultValue = parsedFloat;
          } else {
            // Add validation error if parsing fails for a required field
            if (!fieldToSave.optional) {
              setDefaultValidationError(
                `Invalid float value: "${finalDefaultValue}"`
              );
              return;
            }
            console.warn(
              `Could not parse default value "${finalDefaultValue}" as float for field "${fieldToSave.name}"`
            );
          }
        }
      }
    }

    // Update the field with the processed default value
    fieldToSave.default = finalDefaultValue;

    // Prevent adding meta fields with names matching defaults
    if (
      fieldTypeKey === "metaInformation" &&
      defaultMetaFieldNames.has(fieldToSave.name) &&
      editingIndex === null // Only check when adding a new field
    ) {
      console.error(
        `Cannot add a meta field with the reserved name: ${fieldToSave.name}`
      );
      // Optionally show a toast notification here
      setDefaultValidationError(
        `Cannot use reserved meta field name: ${fieldToSave.name}`
      );
      return;
    }

    // Ensure the array exists before trying to modify it
    const currentFields = state[fieldTypeKey] || [];
    let newFields: StateField[];

    if (editingIndex !== null) {
      const originalField = currentFields[editingIndex];
      if (
        fieldTypeKey === "metaInformation" &&
        defaultMetaFieldNames.has(originalField.name)
      ) {
        console.warn(
          `Attempting to edit default meta field: ${originalField.name}. Only 'default' value might be updated.`
        );
        newFields = [...currentFields];
        newFields[editingIndex] = fieldToSave;
      } else {
        newFields = [...currentFields];
        newFields[editingIndex] = fieldToSave;
      }
    } else {
      newFields = [...currentFields, fieldToSave];
    }

    onChange({
      ...state,
      [fieldTypeKey]: newFields,
    });

    setIsDialogOpen(false);
  };

  const renderFields = (fields: StateField[], isMetaTab: boolean) => {
    // Directly use the fields passed in. Default fields are now part of the project state.
    const displayFields = fields;

    if (!displayFields || displayFields.length === 0) {
      // Check if displayFields is null or empty
      return (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-muted-foreground">
            No fields defined. Add a field to get started.
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-2">
        {displayFields.map((field, index) => {
          // Check if the current field is one of the default ones by name
          const isDefault = isMetaTab && defaultMetaFieldNames.has(field.name);
          // The index passed to map is the correct index in the current `displayFields` array.
          // No need for complex index calculation anymore.
          const originalIndex = index;

          return (
            <div
              key={field.name}
              className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto] items-center gap-x-3 rounded-md border bg-card p-3 shadow-sm"
            >
              {/* Lock Icon (Column 1) */}
              <div className="flex justify-center items-center w-5">
                {isDefault && (
                  <span title="Default Field (Locked)">
                    <LockIcon className="h-4 w-4 text-muted-foreground" />
                  </span>
                )}
              </div>

              {/* Field Name (Column 2 - Takes remaining space) */}
              <p className="text-sm font-medium text-foreground truncate min-w-0">
                {field.name}
                {field.optional && ( // Add indicator if optional
                  <span className="text-xs text-muted-foreground ml-1">
                    (Optional)
                  </span>
                )}
              </p>

              {/* Type (Column 3) */}
              <span
                className={` inline-flex justify-center items-center rounded-sm px-10 py-1 text-xs font-medium w-[70px] text-center ${
                  typeColorMapping[field.type] ?? defaultTypeColor
                }`}
                title={`Type: ${field.type}`}
              >
                {field.type}
              </span>

              {/* Default Value (Column 4) */}
              <span
                className="inline-flex items-center justify-start rounded-sm border border-gray-300 dark:border-gray-600 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 w-[80px] truncate"
                title={`Default: ${
                  field.type === "MarketState"
                    ? "Not applicable"
                    : field.default === undefined || field.default === null
                      ? "-"
                      : JSON.stringify(field.default)
                }`}
              >
                <Variable className="h-3 w-3 mr-1.5 flex-shrink-0" />
                <span className="truncate">
                  {field.type === "MarketState"
                    ? "Not applicable"
                    : field.default !== undefined && field.default !== null
                      ? JSON.stringify(field.default)
                      : "-"}
                </span>
              </span>

              {/* Event Key (Column 5) */}
              <span
                className={`inline-flex items-center justify-start rounded-sm border border-gray-300 dark:border-gray-600 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 w-[80px] truncate`}
                title={`Event Key: ${field.eventKey || "-"}`}
              >
                <KeyRound className="h-3 w-3 mr-1.5 flex-shrink-0" />
                <span className="truncate">{field.eventKey || "-"}</span>
              </span>

              {/* Exclude Mapping (Column 6) */}
              <span
                className={`inline-flex items-center justify-start rounded-sm border border-gray-300 dark:border-gray-600 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 w-[80px] truncate`}
                title={field.excludeFromMapping ? "Mapping: N" : "Mapping: Y"}
              >
                <Link2 className="h-4 w-4 mr-1.5 flex-shrink-0" />
                {field.excludeFromMapping ? "N" : "Y"}
              </span>

              {/* Events (Column 7) */}
              <span
                className={`inline-flex items-center justify-start rounded-sm border border-gray-300 dark:border-gray-600 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 w-[80px] truncate`}
                title={`Events: ${field.events && field.events.length > 0 ? "Y" : field.excludedEvents && field.excludedEvents.length > 0 ? "N" : "-"}`}
              >
                <List className="h-4 w-4 mr-1.5 flex-shrink-0" />
                <span className="truncate">
                  {field.events && field.events.length > 0
                    ? "Y"
                    : field.excludedEvents && field.excludedEvents.length > 0
                      ? "N"
                      : "-"}
                </span>
              </span>

              {/* Action Buttons (Column 7) */}
              <div className="flex flex-shrink-0 space-x-1 justify-self-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handleDeleteField(originalIndex)}
                  disabled={isDefault}
                  aria-label={
                    isDefault
                      ? `Cannot delete default field ${field.name}`
                      : `Delete field ${field.name}`
                  }
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handleEditField(field, originalIndex)}
                  aria-label={
                    isDefault
                      ? `Cannot edit default field ${field.name}`
                      : `Edit field ${field.name}`
                  }
                >
                  <EditIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">State Configuration</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="meta">Meta Information</TabsTrigger>
          <TabsTrigger value="private">Private Information</TabsTrigger>
          <TabsTrigger value="public">Public Information</TabsTrigger>
        </TabsList>

        <div className="mt-4 flex justify-end">
          <Button onClick={handleAddField} className="gap-2">
            <PlusIcon className="h-4 w-4" />
            Add Field
          </Button>
        </div>

        <TabsContent value="meta" className="mt-4">
          {renderFields(state.metaInformation || [], true)}
        </TabsContent>

        <TabsContent value="private" className="mt-4">
          {renderFields(state.privateInformation || [], false)}
        </TabsContent>

        <TabsContent value="public" className="mt-4">
          {renderFields(state.publicInformation || [], false)}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? "Edit Field" : "Add Field"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Determine if the field being edited is a default one */}
            {(() => {
              const isEditingDefault =
                editingIndex !== null &&
                activeTab === "meta" &&
                defaultMetaFieldNames.has(
                  (state.metaInformation || [])[editingIndex]?.name
                );

              return (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="field-name">Field Name</Label>
                    <Input
                      id="field-name"
                      value={currentField.name}
                      onChange={(e) =>
                        setCurrentField({
                          ...currentField,
                          name: e.target.value,
                        })
                      }
                      placeholder="e.g., game_id"
                      // Disable if editing a default field
                      disabled={isEditingDefault}
                    />
                    {activeTab === "meta" &&
                      defaultMetaFieldNames.has(currentField.name) &&
                      editingIndex === null && (
                        <p className="text-xs text-destructive mt-1">
                          Cannot use a reserved meta field name.
                        </p>
                      )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="field-type">Type</Label>
                      <Select
                        value={currentField.type}
                        onValueChange={(value) =>
                          setCurrentField({
                            ...currentField,
                            type: value as StateFieldType,
                          })
                        }
                        // Disable if editing a default field
                        disabled={isEditingDefault}
                      >
                        <SelectTrigger id="field-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="str">String</SelectItem>
                          <SelectItem value="int">Integer</SelectItem>
                          <SelectItem value="float">Float</SelectItem>
                          <SelectItem value="bool">Boolean</SelectItem>
                          <SelectItem value="list">List</SelectItem>
                          <SelectItem value="dict">Dictionary</SelectItem>
                          <SelectItem value="MarketState">
                            MarketState
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="field-default">Default Value</Label>
                      {currentField.type === "bool" ? (
                        <Select
                          value={
                            currentField.default === true
                              ? "true"
                              : currentField.default === false
                                ? "false"
                                : "" // Represent null/undefined as empty string for the Select placeholder
                          }
                          onValueChange={(value) => {
                            setCurrentField({
                              ...currentField,
                              default:
                                value === "true"
                                  ? true
                                  : value === "false"
                                    ? false
                                    : null, // Store actual boolean or null
                            });
                            // Boolean select doesn't need text validation
                            setDefaultValidationError(null);
                          }}
                        >
                          <SelectTrigger id="field-default">
                            <SelectValue placeholder="True/False" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : // Hide default input for MarketState
                      currentField.type === "MarketState" ? (
                        <Input
                          id="field-default"
                          value="Not Applicable"
                          disabled
                          className="text-muted-foreground italic"
                        />
                      ) : (
                        // Existing Input for other types
                        <Input
                          id="field-default"
                          value={currentField.default?.toString() || ""}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            // Validate immediately on change for non-boolean types
                            const validationError = validateDefaultValue(
                              currentField.type,
                              newValue
                            );
                            setDefaultValidationError(validationError);
                            // Update the field state
                            setCurrentField({
                              ...currentField,
                              default: newValue,
                            });
                          }}
                          placeholder={
                            currentField.type === "list" ||
                            currentField.type === "dict"
                              ? `e.g., ${currentField.type === "list" ? "[1, 2, 3]" : "{'key': 'value'}"}`
                              : "e.g., 0"
                          }
                        />
                      )}
                      {/* Display validation error */}
                      {defaultValidationError &&
                        currentField.type !== "MarketState" && (
                          <p className="text-xs text-destructive mt-1">
                            {defaultValidationError}
                          </p>
                        )}
                    </div>
                  </div>

                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="field-events">Events</Label>
                        <Input
                          id="field-events"
                          value={
                            Array.isArray(currentField.events)
                              ? currentField.events.join(", ")
                              : currentField.events || ""
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            setCurrentField({
                              ...currentField,
                              events: value.split(",").map((s) => s.trim()),
                              excludedEvents: value
                                ? []
                                : currentField.excludedEvents,
                            });
                          }}
                          placeholder="e.g., event1, event2"
                          disabled={
                            !!(Array.isArray(currentField.excludedEvents)
                              ? currentField.excludedEvents.join(", ")
                              : currentField.excludedEvents)
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="field-excluded-events">
                          Excluded Events
                        </Label>
                        <Input
                          id="field-excluded-events"
                          value={
                            Array.isArray(currentField.excludedEvents)
                              ? currentField.excludedEvents.join(", ")
                              : currentField.excludedEvents || ""
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            setCurrentField({
                              ...currentField,
                              excludedEvents: value
                                .split(",")
                                .map((s) => s.trim()),
                              events: value ? [] : currentField.events,
                            });
                          }}
                          placeholder="e.g., event3, event4"
                          disabled={
                            !!(Array.isArray(currentField.events)
                              ? currentField.events.join(", ")
                              : currentField.events)
                          }
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="event-key">Event Key</Label>
                      <Input
                        id="event-key"
                        value={currentField.eventKey || ""}
                        onChange={(e) =>
                          setCurrentField({
                            ...currentField,
                            eventKey: e.target.value,
                          })
                        }
                        placeholder="e.g., round"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="exclude-mapping"
                        checked={currentField.excludeFromMapping || false}
                        onCheckedChange={(checked) =>
                          setCurrentField({
                            ...currentField,
                            excludeFromMapping: checked === true,
                          })
                        }
                      />
                      <Label htmlFor="exclude-mapping">
                        Exclude from mapping?
                      </Label>
                    </div>
                  </>

                  {/* Add Optional Checkbox */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="field-optional"
                      checked={currentField.optional || false}
                      onCheckedChange={(checked) =>
                        setCurrentField({
                          ...currentField,
                          optional: checked === true,
                        })
                      }
                    />
                    <Label htmlFor="field-optional">
                      Is optional? / Can be null?
                    </Label>
                  </div>
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveField}
              disabled={
                !currentField.name ||
                (activeTab === "meta" &&
                  defaultMetaFieldNames.has(currentField.name) &&
                  editingIndex === null) ||
                !!defaultValidationError
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

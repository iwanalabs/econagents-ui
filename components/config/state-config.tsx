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
} from "lucide-react";
import type { State, StateField } from "@/types/project";

interface StateConfigProps {
  state: State;
  onChange: (state: State) => void;
}

export const defaultMetaFields: ReadonlyArray<StateField> = [
  {
    name: "game_id",
    type: "int",
    default: 0,
    eventKey: "game_id",
    excludeFromMapping: false,
    optional: false, // Add optional flag
  },
  {
    name: "player_name",
    type: "str",
    default: null,
    eventKey: "player_name",
    excludeFromMapping: false,
    optional: true, // Add optional flag (can be null)
  },
  {
    name: "player_number",
    type: "int",
    default: null,
    eventKey: "player_number",
    excludeFromMapping: false,
    optional: true, // Add optional flag (can be null)
  },
  {
    name: "players",
    type: "list",
    defaultFactory: "list",
    eventKey: "players",
    excludeFromMapping: false,
    optional: false, // Add optional flag
  },
  {
    name: "phase",
    type: "int",
    default: 0,
    eventKey: "phase",
    excludeFromMapping: false,
    optional: false, // Add optional flag
  },
];

const defaultMetaFieldNames = new Set(defaultMetaFields.map((f) => f.name));

// Define a mapping from field type to Tailwind CSS color classes
const typeColorMapping: Record<string, string> = {
  str: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  int: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  float: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  bool: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  list: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  dict: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
};
const defaultTypeColor =
  "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"; // Fallback color

export function StateConfig({ state, onChange }: StateConfigProps) {
  const [activeTab, setActiveTab] = useState("meta");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentField, setCurrentField] = useState<StateField>({
    name: "",
    type: "str",
    default: "",
  });

  const handleAddField = () => {
    setCurrentField({
      name: "",
      type: "str",
      default: "",
    });
    setEditingIndex(null);
    setIsDialogOpen(true);
  };

  const handleEditField = (field: StateField, index: number) => {
    // Prevent editing default meta fields
    if (activeTab === "meta" && defaultMetaFieldNames.has(field.name)) {
      // Optionally show a toast or message here
      console.warn(`Cannot edit default meta field: ${field.name}`);
      return;
    }
    setCurrentField({ ...field });
    setEditingIndex(index);
    setIsDialogOpen(true);
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

    const fieldTypeKey =
      activeTab === "meta"
        ? "metaInformation"
        : activeTab === "private"
          ? "privateInformation"
          : "publicInformation";

    // Work on a copy to modify before saving
    const fieldToSave: StateField = { ...currentField };

    // Validation for non-optional fields needing a default
    if (
      !fieldToSave.optional &&
      (fieldToSave.default === undefined ||
        fieldToSave.default === null ||
        fieldToSave.default === "") &&
      fieldToSave.type !== "list" && // list/dict can use defaultFactory
      fieldToSave.type !== "dict"
    ) {
      console.error(
        `Field '${fieldToSave.name}' is not optional and requires a default value.`
      );
      // TODO: Show toast notification to the user
      // toast({ title: "Error", description: `Field '${fieldToSave.name}' requires a default value.`, variant: "destructive" });
      return;
    }

    // Automatically set/unset defaultFactory based on type and if default is provided
    if (fieldToSave.type === "list" || fieldToSave.type === "dict") {
      // If a specific default like '[]' or '{}' is provided, don't use factory
      if (
        fieldToSave.default !== undefined &&
        fieldToSave.default !== null &&
        fieldToSave.default !== ""
      ) {
        delete fieldToSave.defaultFactory;
      } else {
        // Otherwise, ensure factory is set (even if optional, the type needs a default constructor)
        fieldToSave.defaultFactory = fieldToSave.type;
        // Clear default value if factory is used
        delete fieldToSave.default;
      }
    } else {
      // Ensure defaultFactory is not present for other types
      delete fieldToSave.defaultFactory;
      // If optional and no default provided, explicitly set to null
      if (
        fieldToSave.optional &&
        (fieldToSave.default === undefined ||
          fieldToSave.default === null ||
          fieldToSave.default === "")
      ) {
        fieldToSave.default = null;
      }
    }

    // Prevent adding meta fields with names matching defaults
    if (
      fieldTypeKey === "metaInformation" &&
      defaultMetaFieldNames.has(fieldToSave.name) &&
      editingIndex === null
    ) {
      console.error(
        `Cannot add a meta field with the reserved name: ${fieldToSave.name}`
      );
      // Optionally show a toast notification here
      // toast({ title: "Error", description: `Cannot use reserved meta field name: ${fieldToSave.name}`, variant: "destructive" });
      return;
    }

    // Ensure the array exists before trying to modify it
    const currentFields = state[fieldTypeKey] || [];
    let newFields: StateField[];

    if (editingIndex !== null) {
      // Ensure we don't try to edit a default meta field's core properties if somehow opened
      const originalField = currentFields[editingIndex];
      if (
        fieldTypeKey === "metaInformation" &&
        defaultMetaFieldNames.has(originalField.name)
      ) {
        // Allow editing only 'default' for default meta fields? Or block all edits?
        // For now, let's just update the default value if changed.
        // More robust logic might be needed depending on requirements.
        console.warn(
          `Attempting to edit default meta field: ${originalField.name}. Only 'default' value might be updated.`
        );
        // Example: Only allow updating default value
        // newFields = [...currentFields];
        // newFields[editingIndex] = { ...originalField, default: fieldToSave.default };
        // Let's stick to the original plan: block editing default fields entirely via handleEditField.
        // If somehow the dialog opens, this save should ideally not proceed or only update allowed fields.
        // Reverting to just updating the field as is, relying on handleEditField to prevent opening the dialog.
        newFields = [...currentFields];
        newFields[editingIndex] = fieldToSave; // Use the modified field
      } else {
        newFields = [...currentFields];
        newFields[editingIndex] = fieldToSave; // Use the modified field
      }
    } else {
      newFields = [...currentFields, fieldToSave]; // Use the modified field
    }

    onChange({
      ...state,
      [fieldTypeKey]: newFields,
    });

    setIsDialogOpen(false);
  };

  const renderFields = (fields: StateField[], isMetaTab: boolean) => {
    // Combine default and custom fields for the meta tab
    const displayFields = isMetaTab
      ? [
          ...defaultMetaFields,
          ...fields.filter((f) => !defaultMetaFieldNames.has(f.name)),
        ]
      : fields;

    if (displayFields.length === 0) {
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
          const isDefault = isMetaTab && defaultMetaFieldNames.has(field.name);
          const originalIndex =
            isMetaTab && !isDefault
              ? fields.findIndex((f) => f.name === field.name)
              : index;

          return (
            <div
              key={field.name}
              className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-x-3 rounded-md border bg-card p-3 shadow-sm"
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
                className={`inline-flex justify-center items-center rounded-sm px-2 py-0.5 text-xs font-medium w-[70px] text-center ${
                  typeColorMapping[field.type] ?? defaultTypeColor
                }`}
                title={`Type: ${field.type}`}
              >
                {field.type}
              </span>

              {/* Default Value (Column 4) */}
              <span
                className="inline-flex items-center justify-start rounded-sm border border-gray-300 dark:border-gray-600 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 w-[120px] truncate"
                title={`Default: ${
                  field.default === undefined || field.default === null
                    ? "None"
                    : JSON.stringify(field.default)
                }`}
              >
                <Variable className="h-3 w-3 mr-1.5 flex-shrink-0" />
                <span className="truncate">
                  {field.default !== undefined && field.default !== null
                    ? JSON.stringify(field.default)
                    : "None"}
                </span>
              </span>

              {/* Event Key (Column 5 - Meta only) */}
              <span
                className={`inline-flex items-center justify-start rounded-sm border border-gray-300 dark:border-gray-600 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 w-[120px] truncate ${
                  !isMetaTab && "invisible" // Hide column if not the meta tab
                }`}
                title={
                  isMetaTab ? `Event Key: ${field.eventKey || "None"}` : ""
                }
              >
                {isMetaTab ? (
                  <>
                    <KeyRound className="h-3 w-3 mr-1.5 flex-shrink-0" />
                    <span className="truncate">{field.eventKey || "None"}</span>
                  </>
                ) : (
                  // Render placeholder content to maintain layout even when hidden
                  <>&nbsp;</>
                )}
              </span>

              {/* Exclude Mapping (Column 6 - Meta only) */}
              <span
                className={`inline-flex items-center justify-start rounded-sm border border-gray-300 dark:border-gray-600 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 w-[80px] truncate ${
                  !isMetaTab && "invisible" // Hide column if not the meta tab
                }`}
                title={
                  isMetaTab
                    ? field.excludeFromMapping
                      ? "Mapping: N"
                      : "Mapping: Y"
                    : ""
                }
              >
                {isMetaTab ? (
                  <>
                    <Link2 className="h-4 w-4 mr-1.5 flex-shrink-0" />
                    {field.excludeFromMapping ? "N" : "Y"}
                  </>
                ) : (
                  <>&nbsp;</>
                )}
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
                  disabled={isDefault}
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
            <div className="grid gap-2">
              <Label htmlFor="field-name">Field Name</Label>
              <Input
                id="field-name"
                value={currentField.name}
                onChange={(e) =>
                  setCurrentField({ ...currentField, name: e.target.value })
                }
                placeholder="e.g., game_id"
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
                    setCurrentField({ ...currentField, type: value })
                  }
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
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="field-default">Default Value</Label>
                <Input
                  id="field-default"
                  value={currentField.default?.toString() || ""}
                  onChange={(e) =>
                    setCurrentField({
                      ...currentField,
                      default: e.target.value,
                    })
                  }
                  placeholder="e.g., 0"
                />
              </div>
            </div>

            {activeTab === "meta" && (
              <>
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
                  <Label htmlFor="exclude-mapping">Exclude from mapping</Label>
                </div>
              </>
            )}

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
              <Label htmlFor="field-optional">Optional field</Label>
            </div>
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
                  editingIndex === null)
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

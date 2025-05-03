"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PlusIcon, Trash2Icon, EditIcon, LockIcon } from "lucide-react";
import type { State, StateField } from "@/types/project";

interface StateConfigProps {
  state: State;
  onChange: (state: State) => void;
}

// Define the default meta fields that cannot be removed or edited (except maybe default value)
// Export this constant
export const defaultMetaFields: ReadonlyArray<StateField> = [
  { name: "game_id", type: "int", default: 0, eventKey: "game_id", excludeFromMapping: false },
  { name: "player_name", type: "str", default: null, eventKey: "player_name", excludeFromMapping: false }, // Use null for optional string
  { name: "player_number", type: "int", default: null, eventKey: "player_number", excludeFromMapping: false }, // Use null for optional int
  { name: "players", type: "list", defaultFactory: "list", eventKey: "players", excludeFromMapping: false },
  { name: "phase", type: "int", default: 0, eventKey: "phase", excludeFromMapping: false },
];

const defaultMetaFieldNames = new Set(defaultMetaFields.map(f => f.name));

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
    const fieldType =
      activeTab === "meta"
        ? "metaFields"
        : activeTab === "private"
        ? "privateFields"
        : "publicFields";

    // Ensure the array exists before trying to modify it
    const currentFields = state[fieldType] || [];
    const fieldToDelete = currentFields[index];

    // Prevent deletion of default meta fields
    if (fieldType === "metaFields" && defaultMetaFieldNames.has(fieldToDelete.name)) {
      // Optionally show a toast or message here
      console.warn(`Cannot delete default meta field: ${fieldToDelete.name}`);
      return;
    }

    const newFields = [...currentFields];
    newFields.splice(index, 1);

    onChange({
      ...state,
      metaInformation:
        fieldType === "metaFields" ? newFields : state.metaInformation || [],
      privateInformation:
        fieldType === "privateFields" ? newFields : state.privateInformation || [],
      publicInformation:
        fieldType === "publicFields" ? newFields : state.publicInformation || [],
    });
  };

  const handleSaveField = () => {
    if (!currentField.name) return;

    const fieldType =
      activeTab === "meta"
        ? "metaFields"
        : activeTab === "private"
        ? "privateFields"
        : "publicFields";

    // Prevent adding meta fields with names matching defaults
    if (fieldType === "metaFields" && defaultMetaFieldNames.has(currentField.name) && editingIndex === null) {
       // Optionally show a toast or message here
       console.error(`Cannot add a meta field with the reserved name: ${currentField.name}`);
       // Maybe clear the input or keep the dialog open? For now, just return.
       return;
    }

    // Ensure the array exists before trying to modify it
    const currentFields = state[fieldType] || [];
    let newFields: StateField[];

    if (editingIndex !== null) {
      newFields = [...currentFields];
      newFields[editingIndex] = currentField;
    } else {
      newFields = [...currentFields, currentField];
    }

    onChange({
      ...state,
      metaInformation:
        fieldType === "metaFields" ? newFields : state.metaInformation || [],
      privateInformation:
        fieldType === "privateFields" ? newFields : state.privateInformation || [],
      publicInformation:
        fieldType === "publicFields" ? newFields : state.publicInformation || [],
    });

    setIsDialogOpen(false);
  };

  const renderFields = (fields: StateField[], isMetaTab: boolean) => {
    // Combine default and custom fields for the meta tab
    const displayFields = isMetaTab
      ? [...defaultMetaFields, ...fields.filter(f => !defaultMetaFieldNames.has(f.name))]
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
      <div className="space-y-4">
        {displayFields.map((field, index) => {
          const isDefault = isMetaTab && defaultMetaFieldNames.has(field.name);
          // Adjust index for deletion/editing if it's a custom meta field
          const originalIndex = isMetaTab && !isDefault
            ? fields.findIndex(f => f.name === field.name)
            : index;

          return (
            <Card key={field.name}> {/* Use field.name as key for stability */}
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  {isDefault && <LockIcon className="h-4 w-4 text-muted-foreground" title="Default Field (Locked)" />}
                  <div>
                    <CardTitle className="text-lg">{field.name}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Type: {field.type}
                      {field.default !== undefined && field.default !== null && // Check for null too
                        ` • Default: ${JSON.stringify(field.default)}`} {/* Use JSON.stringify for clarity */}
                      {field.defaultFactory && ` • Default Factory: ${field.defaultFactory}`}
                      {field.eventKey && ` • Event Key: ${field.eventKey}`}
                      {field.excludeFromMapping && ` • Excluded from mapping`}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteField(originalIndex)}
                    disabled={isDefault} // Disable delete for default fields
                    aria-label={isDefault ? `Cannot delete default field ${field.name}` : `Delete field ${field.name}`}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditField(field, originalIndex)}
                    disabled={isDefault} // Disable edit for default fields
                    aria-label={isDefault ? `Cannot edit default field ${field.name}` : `Edit field ${field.name}`}
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
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
              {activeTab === 'meta' && defaultMetaFieldNames.has(currentField.name) && editingIndex === null && (
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

            {currentField.type === "list" || currentField.type === "dict" ? (
              <div className="grid gap-2">
                <Label htmlFor="default-factory">Default Factory</Label>
                <Input
                  id="default-factory"
                  value={currentField.defaultFactory || ""}
                  onChange={(e) =>
                    setCurrentField({
                      ...currentField,
                      defaultFactory: e.target.value,
                    })
                  }
                  placeholder="e.g., list"
                />
              </div>
            ) : null}

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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveField}
              disabled={!currentField.name || (activeTab === 'meta' && defaultMetaFieldNames.has(currentField.name) && editingIndex === null)}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

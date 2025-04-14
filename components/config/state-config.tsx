"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusIcon, Trash2Icon, EditIcon } from "lucide-react"
import type { State, StateField } from "@/types/project"

interface StateConfigProps {
  state: State
  onChange: (state: State) => void
}

export function StateConfig({ state, onChange }: StateConfigProps) {
  const [activeTab, setActiveTab] = useState("meta")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [currentField, setCurrentField] = useState<StateField>({
    name: "",
    type: "str",
    default: "",
  })

  const handleAddField = () => {
    setCurrentField({
      name: "",
      type: "str",
      default: "",
    })
    setEditingIndex(null)
    setIsDialogOpen(true)
  }

  const handleEditField = (field: StateField, index: number) => {
    setCurrentField({ ...field })
    setEditingIndex(index)
    setIsDialogOpen(true)
  }

  const handleDeleteField = (index: number) => {
    const fieldType = activeTab === "meta" ? "metaFields" : activeTab === "private" ? "privateFields" : "publicFields"

    // Ensure the array exists before trying to modify it
    const currentFields = state[fieldType] || []
    const newFields = [...currentFields]
    newFields.splice(index, 1)

    onChange({
      ...state,
      metaFields: fieldType === "metaFields" ? newFields : state.metaFields || [],
      privateFields: fieldType === "privateFields" ? newFields : state.privateFields || [],
      publicFields: fieldType === "publicFields" ? newFields : state.publicFields || [],
    })
  }

  const handleSaveField = () => {
    if (!currentField.name) return

    const fieldType = activeTab === "meta" ? "metaFields" : activeTab === "private" ? "privateFields" : "publicFields"

    // Ensure the array exists before trying to modify it
    const currentFields = state[fieldType] || []
    let newFields: StateField[]

    if (editingIndex !== null) {
      newFields = [...currentFields]
      newFields[editingIndex] = currentField
    } else {
      newFields = [...currentFields, currentField]
    }

    onChange({
      ...state,
      metaFields: fieldType === "metaFields" ? newFields : state.metaFields || [],
      privateFields: fieldType === "privateFields" ? newFields : state.privateFields || [],
      publicFields: fieldType === "publicFields" ? newFields : state.publicFields || [],
    })

    setIsDialogOpen(false)
  }

  const renderFields = (fields: StateField[]) => {
    if (fields.length === 0) {
      return (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-muted-foreground">
            No fields defined. Add a field to get started.
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        {fields.map((field, index) => (
          <Card key={index}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">{field.name}</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Type: {field.type}
                  {field.default !== undefined && ` • Default: ${field.default}`}
                  {field.event_key && ` • Event Key: ${field.event_key}`}
                  {field.exclude_from_mapping && ` • Excluded from mapping`}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" onClick={() => handleDeleteField(index)}>
                  <Trash2Icon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleEditField(field, index)}>
                  <EditIcon className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">State Configuration</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="meta">Meta Fields</TabsTrigger>
          <TabsTrigger value="private">Private Fields</TabsTrigger>
          <TabsTrigger value="public">Public Fields</TabsTrigger>
        </TabsList>

        <div className="mt-4 flex justify-end">
          <Button onClick={handleAddField} className="gap-2">
            <PlusIcon className="h-4 w-4" />
            Add Field
          </Button>
        </div>

        <TabsContent value="meta" className="mt-4">
          {renderFields(state.metaFields || [])}
        </TabsContent>

        <TabsContent value="private" className="mt-4">
          {renderFields(state.privateFields || [])}
        </TabsContent>

        <TabsContent value="public" className="mt-4">
          {renderFields(state.publicFields || [])}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Edit Field" : "Add Field"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="field-name">Field Name</Label>
              <Input
                id="field-name"
                value={currentField.name}
                onChange={(e) => setCurrentField({ ...currentField, name: e.target.value })}
                placeholder="e.g., game_id"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="field-type">Type</Label>
                <Select
                  value={currentField.type}
                  onValueChange={(value) => setCurrentField({ ...currentField, type: value })}
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
                  value={currentField.default_factory || ""}
                  onChange={(e) =>
                    setCurrentField({
                      ...currentField,
                      default_factory: e.target.value,
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
                    value={currentField.event_key || ""}
                    onChange={(e) =>
                      setCurrentField({
                        ...currentField,
                        event_key: e.target.value,
                      })
                    }
                    placeholder="e.g., round"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="exclude-mapping"
                    checked={currentField.exclude_from_mapping || false}
                    onCheckedChange={(checked) =>
                      setCurrentField({
                        ...currentField,
                        exclude_from_mapping: checked === true,
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
            <Button onClick={handleSaveField} disabled={!currentField.name}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusIcon, Trash2Icon, EditIcon } from "lucide-react"
import type { AgentRole } from "@/types/project"

interface AgentRolesConfigProps {
  agentRoles: AgentRole[]
  onChange: (agentRoles: AgentRole[]) => void
}

export function AgentRolesConfig({ agentRoles, onChange }: AgentRolesConfigProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [currentRole, setCurrentRole] = useState<AgentRole>({
    role_id: 0,
    name: "",
    llm_type: "ChatOpenAI",
    llm_params: {
      model_name: "gpt-4o",
    },
    prompts: {},
  })

  const handleAddRole = () => {
    setCurrentRole({
      role_id: agentRoles.length > 0 ? Math.max(...agentRoles.map((r) => r.role_id)) + 1 : 1,
      name: "",
      llm_type: "ChatOpenAI",
      llm_params: {
        model_name: "gpt-4o",
      },
      prompts: {},
    })
    setEditingIndex(null)
    setIsDialogOpen(true)
  }

  const handleEditRole = (index: number) => {
    setCurrentRole({ ...agentRoles[index] })
    setEditingIndex(index)
    setIsDialogOpen(true)
  }

  const handleDeleteRole = (index: number) => {
    const newRoles = [...agentRoles]
    newRoles.splice(index, 1)
    onChange(newRoles)
  }

  const handleSaveRole = () => {
    if (!currentRole.name) return

    let newRoles: AgentRole[]
    if (editingIndex !== null) {
      newRoles = [...agentRoles]
      newRoles[editingIndex] = currentRole
    } else {
      newRoles = [...agentRoles, currentRole]
    }

    onChange(newRoles)
    setIsDialogOpen(false)
  }

  const handlePromptChange = (key: string, value: string) => {
    setCurrentRole({
      ...currentRole,
      prompts: {
        ...currentRole.prompts,
        [key]: value,
      },
    })
  }

  const handleAddPrompt = () => {
    const promptKey = `prompt_${Object.keys(currentRole.prompts || {}).length + 1}`
    handlePromptChange(promptKey, "")
  }

  const handleDeletePrompt = (key: string) => {
    const newPrompts = { ...currentRole.prompts }
    delete newPrompts[key]
    setCurrentRole({
      ...currentRole,
      prompts: newPrompts,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Agent Roles</h2>
        <Button onClick={handleAddRole} className="gap-2">
          <PlusIcon className="h-4 w-4" />
          Add Role
        </Button>
      </div>

      {agentRoles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-muted-foreground">
            No agent roles defined. Add a role to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agentRoles.map((role, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>{role.name}</span>
                  <span className="text-sm text-muted-foreground">ID: {role.role_id}</span>
                </CardTitle>
                <CardDescription>
                  {role.llm_type} - {role.llm_params.model_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="text-sm">
                  <strong>Prompts:</strong> {Object.keys(role.prompts || {}).length} defined
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="ghost" size="sm" onClick={() => handleDeleteRole(index)}>
                  <Trash2Icon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleEditRole(index)}>
                  <EditIcon className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Edit Agent Role" : "Add Agent Role"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="role-name">Role Name</Label>
                <Input
                  id="role-name"
                  value={currentRole.name}
                  onChange={(e) => setCurrentRole({ ...currentRole, name: e.target.value })}
                  placeholder="e.g., Prisoner"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role-id">Role ID</Label>
                <Input
                  id="role-id"
                  type="number"
                  value={currentRole.role_id}
                  onChange={(e) =>
                    setCurrentRole({
                      ...currentRole,
                      role_id: Number.parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="llm-type">LLM Type</Label>
                <Select
                  value={currentRole.llm_type}
                  onValueChange={(value) => setCurrentRole({ ...currentRole, llm_type: value })}
                >
                  <SelectTrigger id="llm-type">
                    <SelectValue placeholder="Select LLM type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ChatOpenAI">ChatOpenAI</SelectItem>
                    <SelectItem value="Anthropic">Anthropic</SelectItem>
                    <SelectItem value="Gemini">Gemini</SelectItem>
                    <SelectItem value="Llama">Llama</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="model-name">Model Name</Label>
                <Input
                  id="model-name"
                  value={currentRole.llm_params.model_name}
                  onChange={(e) =>
                    setCurrentRole({
                      ...currentRole,
                      llm_params: {
                        ...currentRole.llm_params,
                        model_name: e.target.value,
                      },
                    })
                  }
                  placeholder="e.g., gpt-4o"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label>Model Parameters</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={currentRole.llm_params.temperature || 0.7}
                    onChange={(e) =>
                      setCurrentRole({
                        ...currentRole,
                        llm_params: {
                          ...currentRole.llm_params,
                          temperature: Number.parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="top-p">Top P</Label>
                  <Input
                    id="top-p"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={currentRole.llm_params.top_p || 1}
                    onChange={(e) =>
                      setCurrentRole({
                        ...currentRole,
                        llm_params: {
                          ...currentRole.llm_params,
                          top_p: Number.parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label>Prompts</Label>
                <Button variant="outline" size="sm" onClick={handleAddPrompt} className="gap-1">
                  <PlusIcon className="h-3 w-3" />
                  Add Prompt
                </Button>
              </div>
              {Object.entries(currentRole.prompts || {}).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor={`prompt-${key}`}>{key}</Label>
                    <Button variant="ghost" size="sm" onClick={() => handleDeletePrompt(key)}>
                      <Trash2Icon className="h-3 w-3" />
                    </Button>
                  </div>
                  <Textarea
                    id={`prompt-${key}`}
                    value={value}
                    onChange={(e) => handlePromptChange(key, e.target.value)}
                    rows={3}
                  />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={!currentRole.name}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

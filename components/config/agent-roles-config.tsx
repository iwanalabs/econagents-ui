"use client"

import { useState, useRef, createRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusIcon, Trash2Icon, EditIcon, LockIcon, EyeIcon, EyeOffIcon, VariableIcon, ListIcon } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { AgentRole, Agent } from "@/types/project"
import { PromptPartial } from "@/types"
import { State } from "@/types"
import { Separator } from "@/components/ui/separator"
import { StateVariableInserter } from "@/components/state-variable-inserter"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { PartialsList } from "@/components/partials-list"
import { PromptPreview } from "@/components/prompt-preview"
// Import defaultMetaFields
import { defaultMetaFields } from "./state-config";

interface AgentRolesConfigProps {
  agentRoles: AgentRole[]
  onChange: (agentRoles: AgentRole[]) => void
  promptPartials: PromptPartial[]
  state: State
  agents: Agent[]
  onAgentsChange: (agents: Agent[]) => void
}

// Helper type for phase-specific prompts within the state
interface PhasePrompt {
  phase: number | string // Allow string initially for input flexibility
  system: string
  user: string
}

export function AgentRolesConfig({
  agentRoles,
  onChange,
  promptPartials,
  state,
  agents,
  onAgentsChange,
}: AgentRolesConfigProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  // Role state only needs default prompts, phase prompts are managed separately in UI state
  const [currentRole, setCurrentRole] = useState<
    Omit<AgentRole, "prompts"> & { prompts: Record<string, string> }
  >({
    role_id: 0,
    name: "",
    llm_type: "ChatOpenAI",
    llm_params: {
      model_name: "gpt-4o",
    },
    prompts: { system: "", user: "" }, // Initialize with default keys
  })
  const [phasePrompts, setPhasePrompts] = useState<PhasePrompt[]>([])
  const [activeMainTab, setActiveMainTab] = useState("basic")
  const [previewModes, setPreviewModes] = useState<Record<string, boolean>>({})
  // State to manage visibility of StateVariableInserter and PartialsList per prompt key
  const [inserterVisibility, setInserterVisibility] = useState<Record<string, { state: boolean; partials: boolean }>>({})
  
  // Create a combined state object for the variable inserter
  const stateForInserter: State = {
    ...state,
    metaInformation: [
      ...defaultMetaFields,
      ...(state.metaInformation || []).filter(
        (field) => !defaultMetaFields.some((defaultField) => defaultField.name === field.name)
      ),
    ],
  };
  
  // Refs for Textareas - Simplified as we removed custom prompts
  const contentRefs = useRef<{
    system: React.RefObject<HTMLTextAreaElement>
    user: React.RefObject<HTMLTextAreaElement>
    [key: string]: React.RefObject<HTMLTextAreaElement> // For phase prompts
  }>({
    system: createRef<HTMLTextAreaElement>(),
    user: createRef<HTMLTextAreaElement>(),
  })

  // Function to ensure ref exists for a given key (mostly for phase prompts now)
  const ensureRef = (key: string) => {
    if (!contentRefs.current[key]) {
      contentRefs.current[key] = createRef<HTMLTextAreaElement>()
    }
    return contentRefs.current[key]
  }

  // Clean up refs when dialog closes or component unmounts might be needed
  // depending on lifecycle, but usually React handles this okay.
  // Clear refs when starting add/edit to avoid stale refs
  const clearRefs = () => {
    contentRefs.current = {
      system: createRef<HTMLTextAreaElement>(),
      user: createRef<HTMLTextAreaElement>(),
    } // Reset default refs, phase refs created dynamically
  }
  
  // Helper function to toggle visibility for state variables or partials for a specific key
  const toggleInserterVisibility = (key: string, type: 'state' | 'partials') => {
    setInserterVisibility(prev => {
      const currentVisibility = prev[key] || { state: false, partials: false }; // Default to hidden
      return {
        ...prev,
        [key]: {
          ...currentVisibility,
          [type]: !currentVisibility[type] // Toggle the specific type
        }
      };
    });
  };
  
  // Helper function to check if an inserter/list is visible for a specific key and type
  const isInserterVisible = (key: string, type: 'state' | 'partials'): boolean => {
    return inserterVisibility[key]?.[type] ?? false; // Default to hidden
  };
  
  // Helper function to toggle preview mode for a specific prompt key
  const togglePreviewMode = (key: string) => {
    setPreviewModes(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  // Helper function to parse phase prompts from the role data
  const parsePhasePrompts = (prompts: Record<string, string>): PhasePrompt[] => {
    const parsed: PhasePrompt[] = []
    const phaseKeys = new Set<number>()

    // Collect all phase numbers present
    for (const key in prompts) {
      const sysMatch = key.match(/^system_phase_(\d+)$/)
      const userMatch = key.match(/^user_phase_(\d+)$/)
      if (sysMatch?.[1]) {
        phaseKeys.add(parseInt(sysMatch[1], 10))
      }
      if (userMatch?.[1]) {
        phaseKeys.add(parseInt(userMatch[1], 10))
      }
    }

    // Create PhasePrompt objects
    phaseKeys.forEach((phaseNum) => {
      parsed.push({
        phase: phaseNum,
        system: prompts[`system_phase_${phaseNum}`] ?? "",
        user: prompts[`user_phase_${phaseNum}`] ?? "",
      })
    })
    return parsed.sort((a, b) => (a.phase as number) - (b.phase as number)) // Sort by phase number
  }

  // Helper function to combine prompts back for saving
  const combinePrompts = (): Record<string, string> => {
    const combined: Record<string, string> = {}
    // Add default prompts
    if (currentRole.prompts.system?.trim()) {
      combined["system"] = currentRole.prompts.system
    }
    if (currentRole.prompts.user?.trim()) {
      combined["user"] = currentRole.prompts.user
    }

    // Add phase-specific prompts
    phasePrompts.forEach((pp) => {
      const phaseNum = parseInt(pp.phase as string, 10)
      if (!isNaN(phaseNum) && phaseNum > 0) {
        if (pp.system.trim()) {
          combined[`system_phase_${phaseNum}`] = pp.system
        }
        if (pp.user.trim()) {
          combined[`user_phase_${phaseNum}`] = pp.user
        }
      }
    })
    return combined
  }

  const handleAddRole = () => {
    setCurrentRole({
      role_id: agentRoles.length > 0
        ? Math.max(...agentRoles.map(r => r.role_id)) + 1
        : 1,
      name: "",
      llm_type: "ChatOpenAI",
      llm_params: { model_name: "gpt-4o" },
      prompts: { system: "", user: "" },
    })
    setPhasePrompts([])
    clearRefs()
    setEditingIndex(null)
    setActiveMainTab("basic")
    setPreviewModes({}) // Reset preview modes
    setInserterVisibility({}) // Reset inserter visibility
    setPreviewModes({}) // Reset preview modes
    setInserterVisibility({}) // Reset inserter visibility
    setIsDialogOpen(true)
  }

  const handleEditRole = (index: number) => {
    const roleToEdit = { ...agentRoles[index] }
    const defaultPrompts: Record<string, string> = {
      system: roleToEdit.prompts?.system ?? "",
      user: roleToEdit.prompts?.user ?? "",
    }

    setCurrentRole({
      ...roleToEdit,
      prompts: defaultPrompts
    })
    setPhasePrompts(parsePhasePrompts(roleToEdit.prompts || {}))
    clearRefs()
    setEditingIndex(index)
    setActiveMainTab("basic")
    setIsDialogOpen(true)
  }

  const handleDeleteRole = (index: number) => {
    // Get the role ID before deleting the role
    const roleIdToDelete = agentRoles[index].role_id;

    // Filter out the deleted role
    const newRoles = [...agentRoles]
    newRoles.splice(index, 1)
    onChange(newRoles)

    // Filter out agents associated with the deleted role
    const newAgents = agents.filter(agent => agent.role_id !== roleIdToDelete);
    onAgentsChange(newAgents); // Call the callback to update agents in the parent
  }

  const handleSaveRole = () => {
    if (!currentRole.name) return

    const finalRole: AgentRole = {
      ...currentRole,
      prompts: combinePrompts(), // Combine prompts before saving
    }

    let newRoles: AgentRole[]
    if (editingIndex !== null) {
      newRoles = [...agentRoles]
      newRoles[editingIndex] = finalRole
    } else {
      newRoles = [...agentRoles, finalRole]
    }

    onChange(newRoles)
    setIsDialogOpen(false)
  }

  // Handler for default system/user prompt changes
  const handleDefaultPromptChange = (key: "system" | "user", value: string) => {
    setCurrentRole((prev) => ({
      ...prev,
      prompts: {
        ...prev.prompts,
        [key]: value,
      },
    }))
  }

  // Handler for phase-specific prompt changes
  const handlePhasePromptChange = (
    index: number,
    field: keyof PhasePrompt,
    value: string | number
  ) => {
    setPhasePrompts((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const handleAddPhasePrompt = () => {
    setPhasePrompts((prev) => [...prev, { phase: "", system: "", user: "" }])
  }

  const handleDeletePhasePrompt = (index: number) => {
    // Clean up ref for the deleted phase prompt
    delete contentRefs.current[`phase_${index}_system`]
    delete contentRefs.current[`phase_${index}_user`]
    setPhasePrompts((prev) => prev.filter((_, i) => i !== index))
  }
  
  // Function to insert partial placeholder into textarea
  const handleInsertPartial = (
    textareaRef: React.RefObject<HTMLTextAreaElement>,
    partialName: string,
    updateFn: (value: string) => void
  ) => {
    if (!textareaRef.current) return
  
    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentVal = textarea.value
    // Updated Jinja2 include syntax
    const textToInsert = `{% include "_partials/${partialName}.jinja2" %}`
  
    const newValue =
      currentVal.substring(0, start) +
      textToInsert +
      currentVal.substring(end)
  
    updateFn(newValue)
  
    // Set cursor position after the inserted text
    const newCursorPosition = start + textToInsert.length
    // Use setTimeout to ensure the cursor position is updated after the re-render
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPosition, newCursorPosition)
    }, 0)
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
        <DialogContent className="sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Edit Agent Role" : "Add Agent Role"}</DialogTitle>
          </DialogHeader>

          <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="prompts">Prompts</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <div className="space-y-6 py-4 max-h-[75vh] overflow-y-auto px-1">
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
                  {/* Remove the role ID input field */}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="llm-type">LLM Type</Label>
                    <Select
                      value={currentRole.llm_type}
                      onValueChange={(value) =>
                        setCurrentRole({ ...currentRole, llm_type: value })
                      }
                    >
                      <SelectTrigger id="llm-type">
                        <SelectValue placeholder="Select LLM type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ChatOpenAI">ChatOpenAI</SelectItem>
                        <SelectItem value="ChatOllama">ChatOllama</SelectItem>
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
              </div>
            </TabsContent>

            <TabsContent value="prompts">
              <div className="py-4 space-y-2 max-h-[75vh] overflow-y-scroll px-1">
                <Accordion type="single" defaultValue="default" collapsible={false}>
                  <div className="flex items-start gap-2 mb-2 w-full">
                    <AccordionItem
                      value="default"
                      className="flex-1 border-x border-t rounded-t-md data-[state=closed]:border-b data-[state=closed]:rounded-b-md px-4 shadow-none bg-background"
                    >
                      <AccordionTrigger className="text-base py-3 hover:no-underline">
                        <div>
                          Default Prompts
                          <p className="text-xs text-muted-foreground font-normal">
                            Used when no phase-specific prompt is defined.
                          </p>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4">
                        <div className="grid gap-4">
                          <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="prompt-system">System Prompt</Label>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => togglePreviewMode('system')}
                                title={previewModes['system'] ? "Switch to Edit Mode" : "Switch to Preview Mode"}
                                className="h-7 w-7"
                              >
                                {previewModes['system'] ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {previewModes['system'] ? (
                                <PromptPreview
                                  rawPrompt={currentRole.prompts?.system || ""}
                                  promptPartials={promptPartials}
                                  className="min-h-[100px] border rounded-md p-3 bg-background text-sm whitespace-pre-wrap"
                                />
                              ) : (
                                <>
                                  <Textarea
                                    ref={contentRefs.current.system}
                                    id="prompt-system"
                                    value={currentRole.prompts?.system || ""}
                                    onChange={(e) => handleDefaultPromptChange("system", e.target.value)}
                                    rows={5}
                                    placeholder="General system prompt for this role..."
                                    className="min-h-[100px]"
                                  />
                                  {/* Add Toggle Buttons */}
                                  <div className="flex gap-2 mt-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleInserterVisibility('system', 'state')}
                                      className="gap-1 text-xs"
                                    >
                                      <VariableIcon className="h-3 w-3" />
                                      {isInserterVisible('system', 'state') ? 'Hide' : 'Show'} State Vars
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleInserterVisibility('system', 'partials')}
                                      className="gap-1 text-xs"
                                    >
                                      <ListIcon className="h-3 w-3" />
                                      {isInserterVisible('system', 'partials') ? 'Hide' : 'Show'} Partials
                                    </Button>
                                  </div>
                                  {/* Conditionally render StateVariableInserter */}
                                  {isInserterVisible('system', 'state') && (
                                    <StateVariableInserter
                                      state={stateForInserter} // Use combined state
                                      textareaRef={contentRefs.current.system}
                                      onInsert={(newValue) =>
                                        handleDefaultPromptChange("system", newValue)
                                      }
                                    />
                                  )}
                                  {/* Conditionally render PartialsList */}
                                  {isInserterVisible('system', 'partials') && (
                                    <PartialsList
                                      promptPartials={promptPartials}
                                      onInsertPartial={(partialName) =>
                                        handleInsertPartial(
                                          contentRefs.current.system,
                                          partialName,
                                          (val) => handleDefaultPromptChange("system", val)
                                        )
                                      }
                                    />
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          <Separator />

                          <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="prompt-user">User Prompt</Label>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => togglePreviewMode('user')}
                                title={previewModes['user'] ? "Switch to Edit Mode" : "Switch to Preview Mode"}
                                className="h-7 w-7"
                              >
                                {previewModes['user'] ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {previewModes['user'] ? (
                                <PromptPreview
                                  rawPrompt={currentRole.prompts?.user || ""}
                                  promptPartials={promptPartials}
                                  className="min-h-[100px] border rounded-md p-3 bg-background text-sm whitespace-pre-wrap"
                                />
                              ) : (
                                <>
                                  <Textarea
                                    ref={contentRefs.current.user}
                                    id="prompt-user"
                                    value={currentRole.prompts?.user || ""}
                                    onChange={(e) => handleDefaultPromptChange("user", e.target.value)}
                                    rows={5}
                                    placeholder="General user prompt for this role..."
                                    className="min-h-[100px]"
                                  />
                                  {/* Add Toggle Buttons */}
                                  <div className="flex gap-2 mt-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleInserterVisibility('user', 'state')}
                                      className="gap-1 text-xs"
                                    >
                                      <VariableIcon className="h-3 w-3" />
                                      {isInserterVisible('user', 'state') ? 'Hide' : 'Show'} State Vars
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleInserterVisibility('user', 'partials')}
                                      className="gap-1 text-xs"
                                    >
                                      <ListIcon className="h-3 w-3" />
                                      {isInserterVisible('user', 'partials') ? 'Hide' : 'Show'} Partials
                                    </Button>
                                  </div>
                                  {/* Conditionally render StateVariableInserter */}
                                  {isInserterVisible('user', 'state') && (
                                    <StateVariableInserter
                                      state={stateForInserter} // Use combined state
                                      textareaRef={contentRefs.current.user}
                                      onInsert={(newValue) =>
                                        handleDefaultPromptChange("user", newValue)
                                      }
                                    />
                                  )}
                                  {/* Conditionally render PartialsList */}
                                  {isInserterVisible('user', 'partials') && (
                                    <PartialsList
                                      promptPartials={promptPartials}
                                      onInsertPartial={(partialName) =>
                                        handleInsertPartial(
                                          contentRefs.current.user,
                                          partialName,
                                          (val) => handleDefaultPromptChange("user", val)
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
                    <div className="h-9 px-3 mt-1 flex items-center justify-center" aria-hidden="true">
                      <LockIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  {phasePrompts.map((phasePrompt, index) => (
                    <div key={index} className="flex items-start gap-2 mb-2 w-full">
                      <AccordionItem
                        value={`phase-${index}`}
                        className="flex-1 border-x border-t rounded-t-md data-[state=closed]:border-b data-[state=closed]:rounded-b-md px-4 shadow-none bg-background"
                      >
                        <AccordionTrigger className="text-base py-3 hover:no-underline">
                          <div>
                            Phase {phasePrompt.phase || 'X'} Prompts
                            <p className="text-xs text-muted-foreground font-normal text-left">
                              Overrides defaults for phase {phasePrompt.phase || '...'}
                            </p>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                          <div className="grid gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor={`phase-number-${index}`}>Phase Number</Label>
                              <Input
                                id={`phase-number-${index}`}
                                type="number"
                                min="1"
                                value={phasePrompt.phase}
                                onChange={(e) => handlePhasePromptChange(index, "phase", e.target.value)}
                                placeholder="e.g., 3"
                              />
                            </div>
                            <div className="grid gap-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor={`phase-system-${index}`}>
                                  System Prompt (Phase {phasePrompt.phase || 'X'})
                                </Label>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => togglePreviewMode(`phase_${index}_system`)}
                                  title={previewModes[`phase_${index}_system`] ? "Switch to Edit Mode" : "Switch to Preview Mode"}
                                  className="h-7 w-7"
                                >
                                  {previewModes[`phase_${index}_system`] ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {previewModes[`phase_${index}_system`] ? (
                                  <PromptPreview
                                    rawPrompt={phasePrompt.system}
                                    promptPartials={promptPartials}
                                    className="min-h-[80px] border rounded-md p-3 bg-background text-sm whitespace-pre-wrap"
                                  />
                                ) : (
                                  <>
                                    <Textarea
                                      ref={ensureRef(`phase_${index}_system`)}
                                      id={`phase-system-${index}`}
                                      value={phasePrompt.system}
                                      onChange={(e) =>
                                        handlePhasePromptChange(
                                          index,
                                          "system",
                                          e.target.value
                                        )
                                      }
                                      rows={4}
                                      placeholder={`System prompt specific to phase ${phasePrompt.phase || '...'}`}
                                      className="min-h-[80px]"
                                    />
                                    {/* Add Toggle Buttons */}
                                    <div className="flex gap-2 mt-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleInserterVisibility(`phase_${index}_system`, 'state')}
                                        className="gap-1 text-xs"
                                      >
                                        <VariableIcon className="h-3 w-3" />
                                        {isInserterVisible(`phase_${index}_system`, 'state') ? 'Hide' : 'Show'} State Vars
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleInserterVisibility(`phase_${index}_system`, 'partials')}
                                        className="gap-1 text-xs"
                                      >
                                        <ListIcon className="h-3 w-3" />
                                        {isInserterVisible(`phase_${index}_system`, 'partials') ? 'Hide' : 'Show'} Partials
                                      </Button>
                                    </div>
                                    {/* Conditionally render StateVariableInserter */}
                                    {isInserterVisible(`phase_${index}_system`, 'state') && (
                                      <StateVariableInserter
                                        state={stateForInserter} // Use combined state
                                        textareaRef={ensureRef(`phase_${index}_system`)}
                                        onInsert={(newValue) => handlePhasePromptChange(index, "system", newValue)}
                                      />
                                    )}
                                    {/* Conditionally render PartialsList */}
                                    {isInserterVisible(`phase_${index}_system`, 'partials') && (
                                      <PartialsList
                                        promptPartials={promptPartials}
                                        onInsertPartial={(partialName) =>
                                          handleInsertPartial(
                                            ensureRef(`phase_${index}_system`),
                                            partialName,
                                            (val) => handlePhasePromptChange(index, "system", val)
                                          )
                                        }
                                      />
                                    )}
                                  </>
                                )}
                              </div>
</div>
                            <div className="grid gap-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor={`phase-user-${index}`}>
                                  User Prompt (Phase {phasePrompt.phase || 'X'})
                                </Label>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => togglePreviewMode(`phase_${index}_user`)}
                                  title={previewModes[`phase_${index}_user`] ? "Switch to Edit Mode" : "Switch to Preview Mode"}
                                  className="h-7 w-7"
                                >
                                  {previewModes[`phase_${index}_user`] ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {previewModes[`phase_${index}_user`] ? (
                                  <PromptPreview
                                    rawPrompt={phasePrompt.user}
                                    promptPartials={promptPartials}
                                    className="min-h-[80px] border rounded-md p-3 bg-background text-sm whitespace-pre-wrap"
                                  />
                                ) : (
                                  <>
                                    <Textarea
                                      ref={ensureRef(`phase_${index}_user`)}
                                      id={`phase-user-${index}`}
                                      value={phasePrompt.user}
                                      onChange={(e) =>
                                        handlePhasePromptChange(
                                          index,
                                          "user",
                                          e.target.value
                                        )
                                      }
                                      rows={4}
                                      placeholder={`User prompt specific to phase ${phasePrompt.phase || '...'}`}
                                      className="min-h-[80px]"
                                    />
                                    {/* Add Toggle Buttons */}
                                    <div className="flex gap-2 mt-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleInserterVisibility(`phase_${index}_user`, 'state')}
                                        className="gap-1 text-xs"
                                      >
                                        <VariableIcon className="h-3 w-3" />
                                        {isInserterVisible(`phase_${index}_user`, 'state') ? 'Hide' : 'Show'} State Vars
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => toggleInserterVisibility(`phase_${index}_user`, 'partials')}
                                        className="gap-1 text-xs"
                                      >
                                        <ListIcon className="h-3 w-3" />
                                        {isInserterVisible(`phase_${index}_user`, 'partials') ? 'Hide' : 'Show'} Partials
                                      </Button>
                                    </div>
                                    {/* Conditionally render StateVariableInserter */}
                                    {isInserterVisible(`phase_${index}_user`, 'state') && (
                                      <StateVariableInserter
                                        state={stateForInserter} // Use combined state
                                        textareaRef={ensureRef(`phase_${index}_user`)}
                                        onInsert={(newValue) => handlePhasePromptChange(index, "user", newValue)}
                                      />
                                    )}
                                    {/* Conditionally render PartialsList */}
                                    {isInserterVisible(`phase_${index}_user`, 'partials') && (
                                      <PartialsList
                                        promptPartials={promptPartials}
                                        onInsertPartial={(partialName) =>
                                          handleInsertPartial(
                                            ensureRef(`phase_${index}_user`),
                                            partialName,
                                            (val) => handlePhasePromptChange(index, "user", val)
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePhasePrompt(index)
                        }}
                        aria-label={`Delete Phase ${phasePrompt.phase || 'X'} Prompt`}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </Accordion>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddPhasePrompt}
                    className="gap-1 w-full"
                  >
                    <PlusIcon className="h-3 w-3" />
                    Add Phase-Specific Prompt
                  </Button>
                </div>

              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-4 border-t">
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
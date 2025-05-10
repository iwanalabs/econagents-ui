"use client";

import { useState, useRef, createRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  PlusIcon,
  Trash2Icon,
  EditIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  VariableIcon,
  ListIcon,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { AgentRole, Agent } from "@/types/project";
import { PromptPartial } from "@/types";
import { State } from "@/types";
import { Separator } from "@/components/ui/separator";
import { StateVariableInserter } from "@/components/state-variable-inserter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PartialsList } from "@/components/partials-list";
import { PromptPreview } from "@/components/prompt-preview";

interface AgentRolesConfigProps {
  agentRoles: AgentRole[];
  onChange: (agentRoles: AgentRole[]) => void;
  promptPartials: PromptPartial[];
  state: State;
}

interface PhasePrompt {
  phase: number | string;
  system: string;
  user: string;
}

// Helper function to parse comma-separated numbers
const parseCommaSeparatedNumbers = (str: string | undefined): number[] => {
  if (!str || str.trim() === "") return [];
  return str
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "")
    .map(Number)
    .filter((n) => !isNaN(n));
};

// Helper function to convert array of numbers to comma-separated string
const numbersToCommaSeparatedString = (nums: number[] | undefined): string => {
  if (!nums || nums.length === 0) return "";
  return nums.join(", ");
};

export function AgentRolesConfig({
  agentRoles,
  onChange,
  promptPartials,
  state,
}: AgentRolesConfigProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  // Update currentRole to store llmParamsModelName separately
  const [currentRole, setCurrentRole] = useState<
    Omit<AgentRole, "prompts" | "taskPhases" | "llmParams"> & {
      prompts: Record<string, string>;
      taskPhasesString?: string;
      llmParamsModelName: string; // Store only modelName here
    }
  >({
    roleId: 0,
    name: "",
    llmType: "ChatOpenAI",
    llmParamsModelName: "gpt-4o", // Default modelName
    prompts: { system: "", user: "" },
    taskPhasesString: "",
    numberOfAgents: 1,
  });
  // Add state for dynamic LLM parameters
  const [dynamicLlmParams, setDynamicLlmParams] = useState<
    Array<{ id: string; key: string; value: string }>
  >([]);

  const [phasePrompts, setPhasePrompts] = useState<PhasePrompt[]>([]);
  const [activeMainTab, setActiveMainTab] = useState("basic");
  const [previewModes, setPreviewModes] = useState<Record<string, boolean>>({});
  const [inserterVisibility, setInserterVisibility] = useState<
    Record<string, { state: boolean; partials: boolean }>
  >({});
  const [roleIdError, setRoleIdError] = useState<string | null>(null);

  const stateForInserter: State = state;

  const contentRefs = useRef<{
    system: React.RefObject<HTMLTextAreaElement | null>;
    user: React.RefObject<HTMLTextAreaElement | null>;
    [key: string]: React.RefObject<HTMLTextAreaElement | null>;
  }>({
    system: createRef<HTMLTextAreaElement>(),
    user: createRef<HTMLTextAreaElement>(),
  });

  const ensureRef = (key: string) => {
    if (!contentRefs.current[key]) {
      contentRefs.current[key] = createRef<HTMLTextAreaElement>();
    }
    return contentRefs.current[key];
  };

  const clearRefs = () => {
    contentRefs.current = {
      system: createRef<HTMLTextAreaElement>(),
      user: createRef<HTMLTextAreaElement>(),
    }; // Reset default refs, phase refs created dynamically
  };

  const toggleInserterVisibility = (
    key: string,
    type: "state" | "partials"
  ) => {
    setInserterVisibility((prev) => {
      const currentVisibility = prev[key] || { state: false, partials: false }; // Default to hidden
      return {
        ...prev,
        [key]: {
          ...currentVisibility,
          [type]: !currentVisibility[type], // Toggle the specific type
        },
      };
    });
  };

  const isInserterVisible = (
    key: string,
    type: "state" | "partials"
  ): boolean => {
    return inserterVisibility[key]?.[type] ?? false; // Default to hidden
  };

  // Helper function to toggle preview mode for a specific prompt key
  const togglePreviewMode = (key: string) => {
    setPreviewModes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper function to parse phase prompts from the role data
  const parsePhasePrompts = (
    prompts: Record<string, string>
  ): PhasePrompt[] => {
    const parsed: PhasePrompt[] = [];
    const phaseKeys = new Set<number>();

    // Collect all phase numbers present
    for (const key in prompts) {
      const sysMatch = key.match(/^system_phase_(\d+)$/);
      const userMatch = key.match(/^user_phase_(\d+)$/);
      if (sysMatch?.[1]) {
        phaseKeys.add(parseInt(sysMatch[1], 10));
      }
      if (userMatch?.[1]) {
        phaseKeys.add(parseInt(userMatch[1], 10));
      }
    }

    // Create PhasePrompt objects
    phaseKeys.forEach((phaseNum) => {
      parsed.push({
        phase: phaseNum,
        system: prompts[`system_phase_${phaseNum}`] ?? "",
        user: prompts[`user_phase_${phaseNum}`] ?? "",
      });
    });
    return parsed.sort((a, b) => (a.phase as number) - (b.phase as number)); // Sort by phase number
  };

  // Helper function to combine prompts back for saving
  const combinePrompts = (): Record<string, string> => {
    const combined: Record<string, string> = {};
    // Add default prompts
    if (currentRole.prompts.system?.trim()) {
      combined["system"] = currentRole.prompts.system;
    }
    if (currentRole.prompts.user?.trim()) {
      combined["user"] = currentRole.prompts.user;
    }

    // Add phase-specific prompts
    phasePrompts.forEach((pp) => {
      const phaseNum = parseInt(pp.phase as string, 10);
      if (!isNaN(phaseNum) && phaseNum > 0) {
        if (pp.system.trim()) {
          combined[`system_phase_${phaseNum}`] = pp.system;
        }
        if (pp.user.trim()) {
          combined[`user_phase_${phaseNum}`] = pp.user;
        }
      }
    });
    return combined;
  };

  const handleAddRole = () => {
    setCurrentRole({
      roleId:
        agentRoles.length > 0
          ? Math.max(...agentRoles.map((r) => r.roleId)) + 1
          : 1,
      name: "",
      llmType: "ChatOpenAI",
      llmParamsModelName: "gpt-4o", // Set modelName here
      prompts: { system: "", user: "" },
      taskPhasesString: "",
      numberOfAgents: 1,
    });
    setDynamicLlmParams([]); // Initialize dynamic params as empty
    setPhasePrompts([]);
    clearRefs();
    setEditingIndex(null);
    setActiveMainTab("basic");
    setPreviewModes({}); // Reset preview modes
    setInserterVisibility({}); // Reset inserter visibility
    setRoleIdError(null); // Reset roleIdError
    setIsDialogOpen(true);
  };

  const handleEditRole = (index: number) => {
    const roleToEdit = { ...agentRoles[index] };
    const defaultPrompts: Record<string, string> = {
      system: roleToEdit.prompts?.system ?? "",
      user: roleToEdit.prompts?.user ?? "",
    };

    setCurrentRole({
      ...roleToEdit, // Spreads original llmParams, but llmParamsModelName below takes precedence for its part
      prompts: defaultPrompts,
      taskPhasesString: numbersToCommaSeparatedString(roleToEdit.taskPhases),
      llmParamsModelName: roleToEdit.llmParams.modelName, // Explicitly set modelName
      numberOfAgents:
        roleToEdit.numberOfAgents === undefined ? 0 : roleToEdit.numberOfAgents,
    });

    // Populate dynamicLlmParams from roleToEdit.llmParams (excluding modelName)
    const paramsForUi = Object.entries(roleToEdit.llmParams)
      .filter(([key]) => key !== "modelName")
      .map(([key, value], i) => ({
        id: `param-${roleToEdit.roleId}-${i}-${Date.now()}`, // unique id for react key
        key,
        value: String(value ?? ""), // Store as string for input, handle null/undefined
      }));
    setDynamicLlmParams(paramsForUi);

    setPhasePrompts(parsePhasePrompts(roleToEdit.prompts || {}));
    clearRefs();
    setEditingIndex(index);
    setActiveMainTab("basic");
    setRoleIdError(null); // Reset roleIdError
    setIsDialogOpen(true);
  };

  const handleDeleteRole = (index: number) => {
    // Filter out the deleted role
    const newRoles = [...agentRoles];
    newRoles.splice(index, 1);
    onChange(newRoles);
  };

  const handleSaveRole = () => {
    if (!currentRole.name) return;
    setRoleIdError(null); // Clear previous errors

    const newRoleId = currentRole.roleId; // This is already a number from the input's onChange

    if (isNaN(newRoleId) || newRoleId <= 0) {
      setRoleIdError("Role ID must be a positive integer.");
      return;
    }

    // Uniqueness check for new roles (editingIndex === null)
    // For existing roles (editingIndex !== null), ID is disabled and shouldn't change.
    if (editingIndex === null) {
      if (agentRoles.some((role) => role.roleId === newRoleId)) {
        setRoleIdError(
          `Role ID ${newRoleId} is already in use. Please choose a unique ID.`
        );
        return;
      }
    }

    // Construct final llmParams
    const finalLlmParams: Record<string, any> = {
      modelName: currentRole.llmParamsModelName,
    };
    dynamicLlmParams.forEach((param) => {
      const key = param.key.trim();
      if (key) {
        let parsedValue: any = param.value;
        const trimmedValue = param.value.trim();

        if (trimmedValue === "") {
          // Keep as empty string or handle as null if appropriate for your backend
          // For now, let's keep it as an empty string if user explicitly typed it.
          // If it was initially null/undefined and became an empty string, it's still empty.
          parsedValue = "";
        } else if (!isNaN(Number(trimmedValue))) {
          parsedValue = Number(trimmedValue);
        } else if (trimmedValue.toLowerCase() === "true") {
          parsedValue = true;
        } else if (trimmedValue.toLowerCase() === "false") {
          parsedValue = false;
        }
        // Otherwise, it remains a string (param.value)
        finalLlmParams[key] = parsedValue;
      }
    });

    const finalRole: AgentRole = {
      roleId: newRoleId,
      name: currentRole.name,
      llmType: currentRole.llmType,
      llmParams: finalLlmParams,
      prompts: combinePrompts(),
      taskPhases: parseCommaSeparatedNumbers(currentRole.taskPhasesString),
      numberOfAgents: currentRole.numberOfAgents,
    };

    let newRoles: AgentRole[];
    if (editingIndex !== null) {
      newRoles = [...agentRoles];
      newRoles[editingIndex] = finalRole;
    } else {
      newRoles = [...agentRoles, finalRole];
    }

    onChange(newRoles);
    setIsDialogOpen(false);
  };

  // Handler for default system/user prompt changes
  const handleDefaultPromptChange = (key: "system" | "user", value: string) => {
    setCurrentRole((prev) => ({
      ...prev,
      prompts: {
        ...prev.prompts,
        [key]: value,
      },
    }));
  };

  // Handler for phase-specific prompt changes
  const handlePhasePromptChange = (
    index: number,
    field: keyof PhasePrompt,
    value: string | number
  ) => {
    setPhasePrompts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddPhasePrompt = () => {
    setPhasePrompts((prev) => [...prev, { phase: "", system: "", user: "" }]);
  };

  const handleDeletePhasePrompt = (index: number) => {
    // Clean up ref for the deleted phase prompt
    delete contentRefs.current[`phase_${index}_system`];
    delete contentRefs.current[`phase_${index}_user`];
    setPhasePrompts((prev) => prev.filter((_, i) => i !== index));
  };

  // Function to insert partial placeholder into textarea
  const handleInsertPartial = (
    textareaRef: React.RefObject<HTMLTextAreaElement | null>,
    partialName: string,
    updateFn: (value: string) => void
  ) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;
    // Updated Jinja2 include syntax
    const textToInsert = `{% include "_partials/${partialName}.jinja2" %}`;

    const newValue =
      currentVal.substring(0, start) + textToInsert + currentVal.substring(end);

    updateFn(newValue);

    // Set cursor position after the inserted text
    const newCursorPosition = start + textToInsert.length;
    // Use setTimeout to ensure the cursor position is updated after the re-render
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

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
                  <span className="text-sm text-muted-foreground">
                    ID: {role.roleId}
                  </span>
                </CardTitle>
                <CardDescription>
                  {role.llmType} - {role.llmParams.modelName}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2 text-xs space-y-1">
                <div>
                  <strong>Prompts:</strong>{" "}
                  {Object.keys(role.prompts || {}).length} defined
                </div>
                {role.taskPhases && role.taskPhases.length > 0 && (
                  <div>
                    <strong>Task Phases:</strong> {role.taskPhases.join(", ")}
                  </div>
                )}
                <div>
                  <strong>Number of Agents:</strong>{" "}
                  {role.numberOfAgents === undefined
                    ? "N/A"
                    : role.numberOfAgents}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteRole(index)}
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditRole(index)}
                >
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
            <DialogTitle>
              {editingIndex !== null ? "Edit Agent Role" : "Add Agent Role"}
            </DialogTitle>
          </DialogHeader>

          <Tabs
            value={activeMainTab}
            onValueChange={setActiveMainTab}
            className="pt-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="prompts">Prompts</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <div className="space-y-6 py-4 max-h-[75vh] overflow-y-auto px-1">
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="role-id">Role ID</Label>
                    <Input
                      id="role-id"
                      type="number"
                      value={
                        currentRole.roleId === 0 && editingIndex === null
                          ? ""
                          : currentRole.roleId.toString()
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        const numVal = parseInt(val, 10);
                        setCurrentRole({
                          ...currentRole,
                          roleId: isNaN(numVal) ? 0 : numVal,
                        });
                        setRoleIdError(null);
                      }}
                      placeholder="e.g., 1"
                      disabled={editingIndex !== null}
                      min="1"
                    />
                    {roleIdError && (
                      <p className="text-xs text-destructive mt-1">
                        {roleIdError}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role-name">Role Name</Label>
                    <Input
                      id="role-name"
                      value={currentRole.name}
                      onChange={(e) =>
                        setCurrentRole({ ...currentRole, name: e.target.value })
                      }
                      placeholder="e.g., Prisoner"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="num-agents">Number of Agents</Label>
                    <Input
                      id="num-agents"
                      type="number"
                      value={
                        currentRole.numberOfAgents === undefined
                          ? ""
                          : currentRole.numberOfAgents.toString()
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        const numVal = parseInt(val, 10);
                        setCurrentRole({
                          ...currentRole,
                          numberOfAgents: isNaN(numVal)
                            ? 1
                            : Math.max(0, numVal), // Default to 1, ensure non-negative
                        });
                      }}
                      placeholder="e.g., 3"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="llm-type">LLM Type</Label>
                    <Select
                      value={currentRole.llmType}
                      onValueChange={(value) =>
                        setCurrentRole({ ...currentRole, llmType: value })
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
                      value={currentRole.llmParamsModelName} // Use llmParamsModelName
                      onChange={(e) =>
                        setCurrentRole({
                          ...currentRole,
                          llmParamsModelName: e.target.value, // Update llmParamsModelName
                        })
                      }
                      placeholder="e.g., gpt-4o"
                    />
                  </div>
                  <div className="grid gap-2 col-span-2">
                    <Label htmlFor="task-phases">
                      Task Phases (comma-separated)
                    </Label>
                    <Input
                      id="task-phases"
                      value={currentRole.taskPhasesString || ""}
                      onChange={(e) =>
                        setCurrentRole({
                          ...currentRole,
                          taskPhasesString: e.target.value,
                        })
                      }
                      placeholder="e.g., 1, 2, 5"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <Label>Model Parameters</Label>
                  </div>
                  {/* Container for dynamic LLM parameters */}
                  <div className="space-y-3 rounded-md border p-4">
                    {dynamicLlmParams.map((param, index) => (
                      <div key={param.id} className="flex items-center gap-2">
                        <Input
                          type="text"
                          placeholder="Parameter Name"
                          value={param.key}
                          onChange={(e) => {
                            const newDynamicParams = [...dynamicLlmParams];
                            newDynamicParams[index].key = e.target.value;
                            setDynamicLlmParams(newDynamicParams);
                          }}
                          className="flex-1"
                        />
                        <Input
                          type="text"
                          placeholder="Parameter Value"
                          value={param.value}
                          onChange={(e) => {
                            const newDynamicParams = [...dynamicLlmParams];
                            newDynamicParams[index].value = e.target.value;
                            setDynamicLlmParams(newDynamicParams);
                          }}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const newDynamicParams = dynamicLlmParams.filter(
                              (p) => p.id !== param.id
                            );
                            setDynamicLlmParams(newDynamicParams);
                          }}
                          className="text-destructive hover:bg-destructive/10"
                          aria-label="Remove LLM parameter"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button" // Prevent form submission if it's inside a form
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDynamicLlmParams([
                          ...dynamicLlmParams,
                          { id: `new-param-${Date.now()}`, key: "", value: "" },
                        ]);
                      }}
                      className="mt-2 gap-1 text-xs"
                    >
                      <PlusIcon className="h-3 w-3" />
                      Add LLM Parameter
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prompts">
              <div className="py-4 space-y-2 max-h-[75vh] overflow-y-scroll px-1">
                <Accordion
                  type="single"
                  defaultValue="default"
                  collapsible={false}
                >
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
                              <Label htmlFor="prompt-system">
                                System Prompt
                              </Label>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => togglePreviewMode("system")}
                                title={
                                  previewModes["system"]
                                    ? "Switch to Edit Mode"
                                    : "Switch to Preview Mode"
                                }
                                className="h-7 w-7"
                              >
                                {previewModes["system"] ? (
                                  <EyeOffIcon className="h-4 w-4" />
                                ) : (
                                  <EyeIcon className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {previewModes["system"] ? (
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
                                    onChange={(e) =>
                                      handleDefaultPromptChange(
                                        "system",
                                        e.target.value
                                      )
                                    }
                                    rows={5}
                                    placeholder="General system prompt for this role..."
                                    className="min-h-[100px]"
                                  />
                                  {/* Add Toggle Buttons */}
                                  <div className="flex gap-2 mt-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        toggleInserterVisibility(
                                          "system",
                                          "state"
                                        )
                                      }
                                      className="gap-1 text-xs"
                                    >
                                      <VariableIcon className="h-3 w-3" />
                                      {isInserterVisible("system", "state")
                                        ? "Hide"
                                        : "Show"}{" "}
                                      State Vars
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        toggleInserterVisibility(
                                          "system",
                                          "partials"
                                        )
                                      }
                                      className="gap-1 text-xs"
                                    >
                                      <ListIcon className="h-3 w-3" />
                                      {isInserterVisible("system", "partials")
                                        ? "Hide"
                                        : "Show"}{" "}
                                      Partials
                                    </Button>
                                  </div>
                                  {/* Conditionally render StateVariableInserter */}
                                  {isInserterVisible("system", "state") && (
                                    <StateVariableInserter
                                      state={stateForInserter} // Use combined state
                                      textareaRef={contentRefs.current.system}
                                      onInsert={(newValue) =>
                                        handleDefaultPromptChange(
                                          "system",
                                          newValue
                                        )
                                      }
                                    />
                                  )}
                                  {/* Conditionally render PartialsList */}
                                  {isInserterVisible("system", "partials") && (
                                    <PartialsList
                                      promptPartials={promptPartials}
                                      onInsertPartial={(partialName) =>
                                        handleInsertPartial(
                                          contentRefs.current.system,
                                          partialName,
                                          (val) =>
                                            handleDefaultPromptChange(
                                              "system",
                                              val
                                            )
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
                                onClick={() => togglePreviewMode("user")}
                                title={
                                  previewModes["user"]
                                    ? "Switch to Edit Mode"
                                    : "Switch to Preview Mode"
                                }
                                className="h-7 w-7"
                              >
                                {previewModes["user"] ? (
                                  <EyeOffIcon className="h-4 w-4" />
                                ) : (
                                  <EyeIcon className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {previewModes["user"] ? (
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
                                    onChange={(e) =>
                                      handleDefaultPromptChange(
                                        "user",
                                        e.target.value
                                      )
                                    }
                                    rows={5}
                                    placeholder="General user prompt for this role..."
                                    className="min-h-[100px]"
                                  />
                                  {/* Add Toggle Buttons */}
                                  <div className="flex gap-2 mt-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        toggleInserterVisibility(
                                          "user",
                                          "state"
                                        )
                                      }
                                      className="gap-1 text-xs"
                                    >
                                      <VariableIcon className="h-3 w-3" />
                                      {isInserterVisible("user", "state")
                                        ? "Hide"
                                        : "Show"}{" "}
                                      State Vars
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        toggleInserterVisibility(
                                          "user",
                                          "partials"
                                        )
                                      }
                                      className="gap-1 text-xs"
                                    >
                                      <ListIcon className="h-3 w-3" />
                                      {isInserterVisible("user", "partials")
                                        ? "Hide"
                                        : "Show"}{" "}
                                      Partials
                                    </Button>
                                  </div>
                                  {/* Conditionally render StateVariableInserter */}
                                  {isInserterVisible("user", "state") && (
                                    <StateVariableInserter
                                      state={stateForInserter} // Use combined state
                                      textareaRef={contentRefs.current.user}
                                      onInsert={(newValue) =>
                                        handleDefaultPromptChange(
                                          "user",
                                          newValue
                                        )
                                      }
                                    />
                                  )}
                                  {/* Conditionally render PartialsList */}
                                  {isInserterVisible("user", "partials") && (
                                    <PartialsList
                                      promptPartials={promptPartials}
                                      onInsertPartial={(partialName) =>
                                        handleInsertPartial(
                                          contentRefs.current.user,
                                          partialName,
                                          (val) =>
                                            handleDefaultPromptChange(
                                              "user",
                                              val
                                            )
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
                    <div
                      className="h-9 px-3 mt-1 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <LockIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  {phasePrompts.map((phasePrompt, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 mb-2 w-full"
                    >
                      <AccordionItem
                        value={`phase-${index}`}
                        className="flex-1 border-x border-t rounded-t-md data-[state=closed]:border-b data-[state=closed]:rounded-b-md px-4 shadow-none bg-background"
                      >
                        <AccordionTrigger className="text-base py-3 hover:no-underline">
                          <div>
                            Phase {phasePrompt.phase || "X"} Prompts
                            <p className="text-xs text-muted-foreground font-normal text-left">
                              Overrides defaults for phase{" "}
                              {phasePrompt.phase || "..."}
                            </p>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-2 pb-4">
                          <div className="grid gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor={`phase-number-${index}`}>
                                Phase Number
                              </Label>
                              <Input
                                id={`phase-number-${index}`}
                                type="number"
                                min="1"
                                value={phasePrompt.phase}
                                onChange={(e) =>
                                  handlePhasePromptChange(
                                    index,
                                    "phase",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., 3"
                              />
                            </div>
                            <div className="grid gap-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor={`phase-system-${index}`}>
                                  System Prompt (Phase{" "}
                                  {phasePrompt.phase || "X"})
                                </Label>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    togglePreviewMode(`phase_${index}_system`)
                                  }
                                  title={
                                    previewModes[`phase_${index}_system`]
                                      ? "Switch to Edit Mode"
                                      : "Switch to Preview Mode"
                                  }
                                  className="h-7 w-7"
                                >
                                  {previewModes[`phase_${index}_system`] ? (
                                    <EyeOffIcon className="h-4 w-4" />
                                  ) : (
                                    <EyeIcon className="h-4 w-4" />
                                  )}
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
                                      placeholder={`System prompt specific to phase ${phasePrompt.phase || "..."}`}
                                      className="min-h-[80px]"
                                    />
                                    {/* Add Toggle Buttons */}
                                    <div className="flex gap-2 mt-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          toggleInserterVisibility(
                                            `phase_${index}_system`,
                                            "state"
                                          )
                                        }
                                        className="gap-1 text-xs"
                                      >
                                        <VariableIcon className="h-3 w-3" />
                                        {isInserterVisible(
                                          `phase_${index}_system`,
                                          "state"
                                        )
                                          ? "Hide"
                                          : "Show"}{" "}
                                        State Vars
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          toggleInserterVisibility(
                                            `phase_${index}_system`,
                                            "partials"
                                          )
                                        }
                                        className="gap-1 text-xs"
                                      >
                                        <ListIcon className="h-3 w-3" />
                                        {isInserterVisible(
                                          `phase_${index}_system`,
                                          "partials"
                                        )
                                          ? "Hide"
                                          : "Show"}{" "}
                                        Partials
                                      </Button>
                                    </div>
                                    {/* Conditionally render StateVariableInserter */}
                                    {isInserterVisible(
                                      `phase_${index}_system`,
                                      "state"
                                    ) && (
                                      <StateVariableInserter
                                        state={stateForInserter} // Use combined state
                                        textareaRef={ensureRef(
                                          `phase_${index}_system`
                                        )}
                                        onInsert={(newValue) =>
                                          handlePhasePromptChange(
                                            index,
                                            "system",
                                            newValue
                                          )
                                        }
                                      />
                                    )}
                                    {/* Conditionally render PartialsList */}
                                    {isInserterVisible(
                                      `phase_${index}_system`,
                                      "partials"
                                    ) && (
                                      <PartialsList
                                        promptPartials={promptPartials}
                                        onInsertPartial={(partialName) =>
                                          handleInsertPartial(
                                            ensureRef(`phase_${index}_system`),
                                            partialName,
                                            (val) =>
                                              handlePhasePromptChange(
                                                index,
                                                "system",
                                                val
                                              )
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
                                  User Prompt (Phase {phasePrompt.phase || "X"})
                                </Label>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    togglePreviewMode(`phase_${index}_user`)
                                  }
                                  title={
                                    previewModes[`phase_${index}_user`]
                                      ? "Switch to Edit Mode"
                                      : "Switch to Preview Mode"
                                  }
                                  className="h-7 w-7"
                                >
                                  {previewModes[`phase_${index}_user`] ? (
                                    <EyeOffIcon className="h-4 w-4" />
                                  ) : (
                                    <EyeIcon className="h-4 w-4" />
                                  )}
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
                                      placeholder={`User prompt specific to phase ${phasePrompt.phase || "..."}`}
                                      className="min-h-[80px]"
                                    />
                                    {/* Add Toggle Buttons */}
                                    <div className="flex gap-2 mt-1">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          toggleInserterVisibility(
                                            `phase_${index}_user`,
                                            "state"
                                          )
                                        }
                                        className="gap-1 text-xs"
                                      >
                                        <VariableIcon className="h-3 w-3" />
                                        {isInserterVisible(
                                          `phase_${index}_user`,
                                          "state"
                                        )
                                          ? "Hide"
                                          : "Show"}{" "}
                                        State Vars
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          toggleInserterVisibility(
                                            `phase_${index}_user`,
                                            "partials"
                                          )
                                        }
                                        className="gap-1 text-xs"
                                      >
                                        <ListIcon className="h-3 w-3" />
                                        {isInserterVisible(
                                          `phase_${index}_user`,
                                          "partials"
                                        )
                                          ? "Hide"
                                          : "Show"}{" "}
                                        Partials
                                      </Button>
                                    </div>
                                    {/* Conditionally render StateVariableInserter */}
                                    {isInserterVisible(
                                      `phase_${index}_user`,
                                      "state"
                                    ) && (
                                      <StateVariableInserter
                                        state={stateForInserter} // Use combined state
                                        textareaRef={ensureRef(
                                          `phase_${index}_user`
                                        )}
                                        onInsert={(newValue) =>
                                          handlePhasePromptChange(
                                            index,
                                            "user",
                                            newValue
                                          )
                                        }
                                      />
                                    )}
                                    {/* Conditionally render PartialsList */}
                                    {isInserterVisible(
                                      `phase_${index}_user`,
                                      "partials"
                                    ) && (
                                      <PartialsList
                                        promptPartials={promptPartials}
                                        onInsertPartial={(partialName) =>
                                          handleInsertPartial(
                                            ensureRef(`phase_${index}_user`),
                                            partialName,
                                            (val) =>
                                              handlePhasePromptChange(
                                                index,
                                                "user",
                                                val
                                              )
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
                          e.stopPropagation();
                          handleDeletePhasePrompt(index);
                        }}
                        aria-label={`Delete Phase ${phasePrompt.phase || "X"} Prompt`}
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
            <Button
              onClick={handleSaveRole}
              disabled={!currentRole.name || !!roleIdError}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

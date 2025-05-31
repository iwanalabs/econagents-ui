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
} from "lucide-react";
import type { AgentRole, Agent } from "@/types/project";
import { PromptPartial } from "@/types";
import { State } from "@/types";

interface AgentRolesConfigProps {
  agentRoles: AgentRole[];
  onChange: (agentRoles: AgentRole[]) => void;
  promptPartials: PromptPartial[];
  state: State;
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
      taskPhasesString?: string;
      llmParamsModelName: string; // Store only modelName here
    }
  >({
    roleId: 0,
    name: "",
    llmType: "ChatOpenAI",
    llmParamsModelName: "gpt-4o", // Default modelName
    taskPhasesString: "",
    numberOfAgents: 1,
  });
  // Add state for dynamic LLM parameters
  const [dynamicLlmParams, setDynamicLlmParams] = useState<
    Array<{ id: string; key: string; value: string }>
  >([]);
  
  const [roleIdError, setRoleIdError] = useState<string | null>(null);

  const handleAddRole = () => {
    setCurrentRole({
      roleId:
        agentRoles.length > 0
          ? Math.max(...agentRoles.map((r) => r.roleId)) + 1
          : 1,
      name: "",
      llmType: "ChatOpenAI",
      llmParamsModelName: "gpt-4o", // Set modelName here
      taskPhasesString: "",
      numberOfAgents: 1,
    });
    setDynamicLlmParams([]); // Initialize dynamic params as empty
    setEditingIndex(null);
    setRoleIdError(null); // Reset roleIdError
    setIsDialogOpen(true);
  };

  const handleEditRole = (index: number) => {
    const roleToEdit = { ...agentRoles[index] };

    setCurrentRole({
      ...roleToEdit, // Spreads original llmParams, but llmParamsModelName below takes precedence for its part
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

    setEditingIndex(index);
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
      prompts: {}, // Set empty prompts object
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
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? "Edit Agent Role" : "Add Agent Role"}
            </DialogTitle>
          </DialogHeader>

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

"use client";

import React, { useState, useRef, createRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { EyeIcon, EyeOffIcon, VariableIcon, ListIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { AgentRole, PromptPartial, State } from "@/types";
import { StateVariableInserter } from "@/components/state-variable-inserter";
import { PartialsList } from "@/components/partials-list";
import { PromptPreview } from "@/components/prompt-preview";

interface ProjectPromptsConfigProps {
  agentRoles: AgentRole[];
  promptPartials: PromptPartial[];
  state: State;
  onUpdateAgentRoles: (updatedAgentRoles: AgentRole[]) => void;
}

interface PhasePrompt {
  phase: number | string;
  system: string;
  user: string;
}

export function ProjectPromptsConfig({
  agentRoles,
  promptPartials,
  state,
  onUpdateAgentRoles,
}: ProjectPromptsConfigProps) {
  const [expandedRole, setExpandedRole] = useState<number | null>(null);
  const [previewModes, setPreviewModes] = useState<Record<string, boolean>>({});
  const [inserterVisibility, setInserterVisibility] = useState<
    Record<string, { state: boolean; partials: boolean }>
  >({});

  // Refs for textareas, dynamically created
  const contentRefs = useRef<
    Record<string, React.RefObject<HTMLTextAreaElement | null>>
  >({});

  const ensureRef = (key: string) => {
    if (!contentRefs.current[key]) {
      contentRefs.current[key] = createRef<HTMLTextAreaElement>();
    }
    return contentRefs.current[key];
  };

  const togglePreviewMode = (key: string) => {
    setPreviewModes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleInserterVisibility = (
    key: string,
    type: "state" | "partials"
  ) => {
    setInserterVisibility((prev) => {
      const currentVisibility = prev[key] || { state: false, partials: false };
      return {
        ...prev,
        [key]: {
          ...currentVisibility,
          [type]: !currentVisibility[type],
        },
      };
    });
  };

  const isInserterVisible = (
    key: string,
    type: "state" | "partials"
  ): boolean => {
    return inserterVisibility[key]?.[type] ?? false;
  };

  const parsePhasePrompts = (
    prompts: Record<string, string>
  ): PhasePrompt[] => {
    const parsed: PhasePrompt[] = [];
    const phaseKeys = new Set<number>();

    for (const key in prompts) {
      const sysMatch = key.match(/^system_phase_(\d+)$/);
      const userMatch = key.match(/^user_phase_(\d+)$/);
      if (sysMatch?.[1]) phaseKeys.add(parseInt(sysMatch[1], 10));
      if (userMatch?.[1]) phaseKeys.add(parseInt(userMatch[1], 10));
    }

    phaseKeys.forEach((phaseNum) => {
      parsed.push({
        phase: phaseNum,
        system: prompts[`system_phase_${phaseNum}`] ?? "",
        user: prompts[`user_phase_${phaseNum}`] ?? "",
      });
    });
    return parsed.sort((a, b) => (a.phase as number) - (b.phase as number));
  };

  const handlePromptChange = (
    roleId: number,
    promptKey: string, // e.g., "system", "user", "system_phase_1", "user_phase_1"
    value: string
  ) => {
    const updatedAgentRoles = agentRoles.map((role) => {
      if (role.roleId === roleId) {
        const newPrompts = { ...role.prompts, [promptKey]: value };
        // Remove prompt if value is empty to keep data clean
        if (value.trim() === "") {
            delete newPrompts[promptKey];
        }
        return { ...role, prompts: newPrompts };
      }
      return role;
    });
    onUpdateAgentRoles(updatedAgentRoles);
  };
  
  const handlePhaseNumberChange = (
    roleId: number,
    oldPhaseKeyPart: string, // e.g., "phase_1"
    newPhaseNumber: string | number
  ) => {
    const updatedAgentRoles = agentRoles.map((role) => {
        if (role.roleId === roleId) {
            const newPrompts = { ...role.prompts };
            const oldSystemKey = `system_${oldPhaseKeyPart}`;
            const oldUserKey = `user_${oldPhaseKeyPart}`;
            
            const systemValue = newPrompts[oldSystemKey];
            const userValue = newPrompts[oldUserKey];

            delete newPrompts[oldSystemKey];
            delete newPrompts[oldUserKey];

            if (newPhaseNumber !== "" && Number(newPhaseNumber) > 0) {
                const newPhaseKeyPart = `phase_${newPhaseNumber}`;
                if (systemValue !== undefined) newPrompts[`system_${newPhaseKeyPart}`] = systemValue;
                if (userValue !== undefined) newPrompts[`user_${newPhaseKeyPart}`] = userValue;
            }
            // If newPhaseNumber is empty or invalid, prompts are effectively deleted, which is fine.
            
            return { ...role, prompts: newPrompts };
        }
        return role;
    });
    onUpdateAgentRoles(updatedAgentRoles);
  };


  const handleAddPhasePrompt = (roleId: number) => {
    const updatedAgentRoles = agentRoles.map((role) => {
      if (role.roleId === roleId) {
        const existingPhases = parsePhasePrompts(role.prompts);
        let newPhaseNum = 1;
        if (existingPhases.length > 0) {
          newPhaseNum = Math.max(...existingPhases.map(p => Number(p.phase))) + 1;
        }
        const newPrompts = {
          ...role.prompts,
          // Add empty strings so the keys exist for editing
          [`system_phase_${newPhaseNum}`]: "",
          [`user_phase_${newPhaseNum}`]: "",
        };
        return { ...role, prompts: newPrompts };
      }
      return role;
    });
    onUpdateAgentRoles(updatedAgentRoles);
  };

  const handleDeletePhasePrompt = (roleId: number, phaseKeyPart: string) => {
    const updatedAgentRoles = agentRoles.map((role) => {
      if (role.roleId === roleId) {
        const newPrompts = { ...role.prompts };
        delete newPrompts[`system_${phaseKeyPart}`];
        delete newPrompts[`user_${phaseKeyPart}`];
        // Clean up refs if any were associated with this exact key, though dynamic refs handle this better
        delete contentRefs.current[`${role.roleId}_system_${phaseKeyPart}`];
        delete contentRefs.current[`${role.roleId}_user_${phaseKeyPart}`];
        return { ...role, prompts: newPrompts };
      }
      return role;
    });
    onUpdateAgentRoles(updatedAgentRoles);
  };

  const handleInsertText = (
    textareaRefKey: string,
    textToInsert: string,
    currentValue: string,
    updateFn: (value: string) => void
  ) => {
    const textarea = contentRefs.current[textareaRefKey]?.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue =
      currentValue.substring(0, start) +
      textToInsert +
      currentValue.substring(end);

    updateFn(newValue);

    const newCursorPosition = start + textToInsert.length;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  const getPromptsSummary = (prompts: Record<string, string>): string => {
    const summaryItems: string[] = [];
    
    // Check for default prompts
    const hasDefaultSystem = prompts.system && prompts.system.trim() !== "";
    const hasDefaultUser = prompts.user && prompts.user.trim() !== "";
    
    if (hasDefaultSystem || hasDefaultUser) {
      const defaultParts: string[] = [];
      if (hasDefaultSystem) defaultParts.push("S");
      if (hasDefaultUser) defaultParts.push("U");
      summaryItems.push(`default(${defaultParts.join(", ")})`);
    }
    
    // Check for phase-specific prompts
    const phasePrompts = new Map<number, { system: boolean; user: boolean }>();
    
    for (const key in prompts) {
      const systemMatch = key.match(/^system_phase_(\d+)$/);
      const userMatch = key.match(/^user_phase_(\d+)$/);
      
      if (systemMatch && prompts[key].trim() !== "") {
        const phase = parseInt(systemMatch[1], 10);
        if (!phasePrompts.has(phase)) {
          phasePrompts.set(phase, { system: false, user: false });
        }
        phasePrompts.get(phase)!.system = true;
      }
      
      if (userMatch && prompts[key].trim() !== "") {
        const phase = parseInt(userMatch[1], 10);
        if (!phasePrompts.has(phase)) {
          phasePrompts.set(phase, { system: false, user: false });
        }
        phasePrompts.get(phase)!.user = true;
      }
    }
    
    // Sort phases and add to summary
    const sortedPhases = Array.from(phasePrompts.keys()).sort((a, b) => a - b);
    for (const phase of sortedPhases) {
      const { system, user } = phasePrompts.get(phase)!;
      const phaseParts: string[] = [];
      if (system) phaseParts.push("S");
      if (user) phaseParts.push("U");
      if (phaseParts.length > 0) {
        summaryItems.push(`${phase}(${phaseParts.join(", ")})`);
      }
    }
    
    return summaryItems.length > 0 ? summaryItems.join(" • ") : "No prompts defined";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Prompts</CardTitle>
        <CardDescription>
          Configure default and phase-specific prompts for each agent role.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion
          type="single"
          collapsible
          className="w-full space-y-4"
          value={expandedRole !== null ? `role-${expandedRole}` : undefined}
          onValueChange={(value) => {
            const roleId = value ? parseInt(value.replace("role-", ""), 10) : null;
            setExpandedRole(roleId);
          }}
        >
          {agentRoles.map((role) => {
            const phasePromptsList = parsePhasePrompts(role.prompts);
            const defaultSystemPromptKey = `${role.roleId}_system`;
            const defaultUserPromptKey = `${role.roleId}_user`;

            return (
              <AccordionItem
                key={role.roleId}
                value={`role-${role.roleId}`}
                className="border rounded-md bg-background shadow-sm"
              >
                <AccordionTrigger className="flex justify-between items-center w-full p-4 hover:no-underline text-left">
                  <div className="flex-1">
                    <span className="font-medium">{role.name} (ID: {role.roleId})</span>
                    <p className="text-xs text-muted-foreground font-normal">
                      {role.llmType} - {role.llmParams.modelName}
                    </p>
                  </div>
                  <div className="flex items-center justify-end">
                    <span className="text-xs text-muted-foreground font-normal">
                      {getPromptsSummary(role.prompts)}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 pt-0">
                  {/* Default Prompts */}
                  <div className="mb-6 border-b pb-6">
                    <h4 className="text-md font-semibold mb-3">Default Prompts</h4>
                    {/* System Prompt */}
                    <div className="grid gap-2 mb-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={defaultSystemPromptKey}>System Prompt</Label>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePreviewMode(defaultSystemPromptKey)}
                          title={previewModes[defaultSystemPromptKey] ? "Edit" : "Preview"}
                          className="h-7 w-7"
                        >
                          {previewModes[defaultSystemPromptKey] ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </Button>
                      </div>
                      {previewModes[defaultSystemPromptKey] ? (
                        <PromptPreview rawPrompt={role.prompts.system || ""} promptPartials={promptPartials} className="min-h-[100px] border rounded-md p-3 bg-muted/50 text-sm whitespace-pre-wrap" />
                      ) : (
                        <>
                          <Textarea
                            ref={ensureRef(defaultSystemPromptKey)}
                            id={defaultSystemPromptKey}
                            value={role.prompts.system || ""}
                            onChange={(e) => handlePromptChange(role.roleId, "system", e.target.value)}
                            rows={5}
                            className="min-h-[100px]"
                          />
                          <div className="flex gap-2 mt-1">
                            <Button variant="outline" size="sm" onClick={() => toggleInserterVisibility(defaultSystemPromptKey, "state")} className="gap-1 text-xs">
                              <VariableIcon className="h-3 w-3" /> {isInserterVisible(defaultSystemPromptKey, "state") ? "Hide" : "Show"} State
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => toggleInserterVisibility(defaultSystemPromptKey, "partials")} className="gap-1 text-xs">
                              <ListIcon className="h-3 w-3" /> {isInserterVisible(defaultSystemPromptKey, "partials") ? "Hide" : "Show"} Partials
                            </Button>
                          </div>
                          {isInserterVisible(defaultSystemPromptKey, "state") && (
                            <StateVariableInserter state={state} textareaRef={contentRefs.current[defaultSystemPromptKey]} onInsert={(text) => handleInsertText(defaultSystemPromptKey, text, role.prompts.system || "", (val) => handlePromptChange(role.roleId, "system", val))} />
                          )}
                          {isInserterVisible(defaultSystemPromptKey, "partials") && (
                            <PartialsList promptPartials={promptPartials} onInsertPartial={(name) => handleInsertText(defaultSystemPromptKey, `{% include "_partials/${name}.jinja2" %}`, role.prompts.system || "", (val) => handlePromptChange(role.roleId, "system", val))} />
                          )}
                        </>
                      )}
                    </div>
                    {/* User Prompt */}
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={defaultUserPromptKey}>User Prompt</Label>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePreviewMode(defaultUserPromptKey)}
                          title={previewModes[defaultUserPromptKey] ? "Edit" : "Preview"}
                          className="h-7 w-7"
                        >
                          {previewModes[defaultUserPromptKey] ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </Button>
                      </div>
                      {previewModes[defaultUserPromptKey] ? (
                        <PromptPreview rawPrompt={role.prompts.user || ""} promptPartials={promptPartials} className="min-h-[100px] border rounded-md p-3 bg-muted/50 text-sm whitespace-pre-wrap" />
                      ) : (
                        <>
                          <Textarea
                            ref={ensureRef(defaultUserPromptKey)}
                            id={defaultUserPromptKey}
                            value={role.prompts.user || ""}
                            onChange={(e) => handlePromptChange(role.roleId, "user", e.target.value)}
                            rows={5}
                            className="min-h-[100px]"
                          />
                          <div className="flex gap-2 mt-1">
                            <Button variant="outline" size="sm" onClick={() => toggleInserterVisibility(defaultUserPromptKey, "state")} className="gap-1 text-xs">
                              <VariableIcon className="h-3 w-3" /> {isInserterVisible(defaultUserPromptKey, "state") ? "Hide" : "Show"} State
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => toggleInserterVisibility(defaultUserPromptKey, "partials")} className="gap-1 text-xs">
                              <ListIcon className="h-3 w-3" /> {isInserterVisible(defaultUserPromptKey, "partials") ? "Hide" : "Show"} Partials
                            </Button>
                          </div>
                          {isInserterVisible(defaultUserPromptKey, "state") && (
                            <StateVariableInserter state={state} textareaRef={contentRefs.current[defaultUserPromptKey]} onInsert={(text) => handleInsertText(defaultUserPromptKey, text, role.prompts.user || "", (val) => handlePromptChange(role.roleId, "user", val))} />
                          )}
                          {isInserterVisible(defaultUserPromptKey, "partials") && (
                            <PartialsList promptPartials={promptPartials} onInsertPartial={(name) => handleInsertText(defaultUserPromptKey, `{% include "_partials/${name}.jinja2" %}`, role.prompts.user || "", (val) => handlePromptChange(role.roleId, "user", val))} />
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Phase-Specific Prompts */}
                  <div>
                    <h4 className="text-md font-semibold mb-3">Phase-Specific Prompts</h4>
                    {phasePromptsList.map((pp, idx) => {
                      const phaseSystemKey = `${role.roleId}_system_phase_${pp.phase}`;
                      const phaseUserKey = `${role.roleId}_user_phase_${pp.phase}`;
                      const originalPhaseKeyPart = `phase_${pp.phase}`;

                      return (
                        <div key={`${role.roleId}-phase-${pp.phase}-${idx}`} className="mb-4 p-3 border rounded-md">
                           <div className="flex justify-between items-center mb-2">
                            <Label htmlFor={`${role.roleId}-phase-number-${idx}`}>Phase Number</Label>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive/80"
                                onClick={() => handleDeletePhasePrompt(role.roleId, `phase_${pp.phase}`)}
                                title={`Delete Phase ${pp.phase} Prompts`}
                            >
                                <Trash2Icon className="h-4 w-4" />
                            </Button>
                           </div>
                          <Input
                            id={`${role.roleId}-phase-number-${idx}`}
                            type="number"
                            min="1"
                            value={pp.phase}
                            onChange={(e) => handlePhaseNumberChange(role.roleId, originalPhaseKeyPart, e.target.value)}
                            className="mb-3 w-1/4"
                          />
                          {/* System Prompt for Phase */}
                          <div className="grid gap-2 mb-4">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={phaseSystemKey}>System Prompt (Phase {pp.phase})</Label>
                              <Button variant="ghost" size="icon" onClick={() => togglePreviewMode(phaseSystemKey)} title={previewModes[phaseSystemKey] ? "Edit" : "Preview"} className="h-7 w-7">
                                {previewModes[phaseSystemKey] ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                              </Button>
                            </div>
                            {previewModes[phaseSystemKey] ? (
                              <PromptPreview rawPrompt={pp.system} promptPartials={promptPartials} className="min-h-[80px] border rounded-md p-3 bg-muted/50 text-sm whitespace-pre-wrap" />
                            ) : (
                              <>
                                <Textarea
                                  ref={ensureRef(phaseSystemKey)}
                                  id={phaseSystemKey}
                                  value={pp.system}
                                  onChange={(e) => handlePromptChange(role.roleId, `system_phase_${pp.phase}`, e.target.value)}
                                  rows={4}
                                  className="min-h-[80px]"
                                />
                                <div className="flex gap-2 mt-1">
                                  <Button variant="outline" size="sm" onClick={() => toggleInserterVisibility(phaseSystemKey, "state")} className="gap-1 text-xs">
                                    <VariableIcon className="h-3 w-3" /> {isInserterVisible(phaseSystemKey, "state") ? "Hide" : "Show"} State
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => toggleInserterVisibility(phaseSystemKey, "partials")} className="gap-1 text-xs">
                                    <ListIcon className="h-3 w-3" /> {isInserterVisible(phaseSystemKey, "partials") ? "Hide" : "Show"} Partials
                                  </Button>
                                </div>
                                {isInserterVisible(phaseSystemKey, "state") && (
                                  <StateVariableInserter state={state} textareaRef={contentRefs.current[phaseSystemKey]} onInsert={(text) => handleInsertText(phaseSystemKey, text, pp.system, (val) => handlePromptChange(role.roleId, `system_phase_${pp.phase}`, val))} />
                                )}
                                {isInserterVisible(phaseSystemKey, "partials") && (
                                  <PartialsList promptPartials={promptPartials} onInsertPartial={(name) => handleInsertText(phaseSystemKey, `{% include "_partials/${name}.jinja2" %}`, pp.system, (val) => handlePromptChange(role.roleId, `system_phase_${pp.phase}`, val))} />
                                )}
                              </>
                            )}
                          </div>
                          {/* User Prompt for Phase */}
                          <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={phaseUserKey}>User Prompt (Phase {pp.phase})</Label>
                              <Button variant="ghost" size="icon" onClick={() => togglePreviewMode(phaseUserKey)} title={previewModes[phaseUserKey] ? "Edit" : "Preview"} className="h-7 w-7">
                                {previewModes[phaseUserKey] ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                              </Button>
                            </div>
                            {previewModes[phaseUserKey] ? (
                              <PromptPreview rawPrompt={pp.user} promptPartials={promptPartials} className="min-h-[80px] border rounded-md p-3 bg-muted/50 text-sm whitespace-pre-wrap" />
                            ) : (
                              <>
                                <Textarea
                                  ref={ensureRef(phaseUserKey)}
                                  id={phaseUserKey}
                                  value={pp.user}
                                  onChange={(e) => handlePromptChange(role.roleId, `user_phase_${pp.phase}`, e.target.value)}
                                  rows={4}
                                  className="min-h-[80px]"
                                />
                                <div className="flex gap-2 mt-1">
                                  <Button variant="outline" size="sm" onClick={() => toggleInserterVisibility(phaseUserKey, "state")} className="gap-1 text-xs">
                                    <VariableIcon className="h-3 w-3" /> {isInserterVisible(phaseUserKey, "state") ? "Hide" : "Show"} State
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => toggleInserterVisibility(phaseUserKey, "partials")} className="gap-1 text-xs">
                                    <ListIcon className="h-3 w-3" /> {isInserterVisible(phaseUserKey, "partials") ? "Hide" : "Show"} Partials
                                  </Button>
                                </div>
                                {isInserterVisible(phaseUserKey, "state") && (
                                  <StateVariableInserter state={state} textareaRef={contentRefs.current[phaseUserKey]} onInsert={(text) => handleInsertText(phaseUserKey, text, pp.user, (val) => handlePromptChange(role.roleId, `user_phase_${pp.phase}`, val))} />
                                )}
                                {isInserterVisible(phaseUserKey, "partials") && (
                                  <PartialsList promptPartials={promptPartials} onInsertPartial={(name) => handleInsertText(phaseUserKey, `{% include "_partials/${name}.jinja2" %}`, pp.user, (val) => handlePromptChange(role.roleId, `user_phase_${pp.phase}`, val))} />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddPhasePrompt(role.roleId)}
                      className="mt-2 gap-1 w-full"
                    >
                      <PlusIcon className="h-3 w-3" />
                      Add Phase-Specific Prompt
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        {agentRoles.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
                No agent roles defined. Please add roles in the "Agents & Roles" tab first.
            </p>
        )}
      </CardContent>
    </Card>
  );
}

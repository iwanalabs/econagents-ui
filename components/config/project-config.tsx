"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeftIcon, FileOutput, SaveIcon, Import } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Project } from "@/types/project";
import { AgentRolesConfig } from "@/components/config/agent-roles-config";
import { StateConfig } from "@/components/config/state-config";
import { PromptPartialsConfig } from "@/components/config/prompt-partials-config";
import { ProjectPromptsConfig } from "@/components/config/project-prompts-config";
import { exportToYaml } from "@/lib/export-yaml";
import { useToast } from "@/hooks/use-toast";
import { useServerConfigs } from "@/hooks/use-server-configs";
import { ImportProjectModal } from "@/components/import-project-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface ProjectConfigProps {
  projectId: string;
}

export function ProjectConfig({ projectId }: ProjectConfigProps) {
  const [projects] = useLocalStorage<Project[]>("projects", []);
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState("basic");
  const router = useRouter();
  const { toast } = useToast();
  const [serverConfigs] = useServerConfigs();
  const [isImportOverwriteModalOpen, setIsImportOverwriteModalOpen] =
    useState(false);
  const [isConfirmOverwriteDialogOpen, setIsConfirmOverwriteDialogOpen] =
    useState(false);
  const [projectDataToOverwrite, setProjectDataToOverwrite] = useState<Omit<
    Project,
    "id" | "createdAt"
  > | null>(null);

  useEffect(() => {
    const foundProject = projects.find((p) => p.id === projectId);
    if (foundProject) {
      setProject(foundProject);
    } else {
      router.push("/");
    }
  }, [projectId, projects, router]);

  useEffect(() => {
    if (!project || !project.manager) return;

    if (project.manager.type === "HybridPhaseManager") {
      const expectedString = (project.manager.continuousPhases || []).join(
        ", "
      );
      if (project.manager.continuousPhasesString !== expectedString) {
        setProject((prevProject) => {
          if (!prevProject || !prevProject.manager) return prevProject;
          return {
            ...prevProject,
            manager: {
              ...prevProject.manager,
              continuousPhasesString: expectedString,
            },
          };
        });
      }
    } else {
      if (project.manager.continuousPhasesString !== undefined) {
        setProject((prevProject) => {
          if (!prevProject || !prevProject.manager) return prevProject;
          const { continuousPhasesString, ...restManager } =
            prevProject.manager;
          return {
            ...prevProject,
            manager: restManager,
          };
        });
      }
    }
  }, [project]);

  const handleSave = () => {
    if (!project) return;

    const currentProjects = JSON.parse(
      localStorage.getItem("projects") || "[]"
    );
    const updatedProjects = currentProjects.map((p: Project) =>
      p.id === project.id ? project : p
    );
    localStorage.setItem("projects", JSON.stringify(updatedProjects));

    toast({
      title: "Project saved",
      description: "Your project configuration has been saved successfully.",
    });
  };

  const handleOpenImportOverwriteModal = () => {
    setIsImportOverwriteModalOpen(true);
  };

  const handleParseSuccess = (
    parsedData: Omit<Project, "id" | "createdAt">
  ) => {
    setProjectDataToOverwrite(parsedData);
    setIsImportOverwriteModalOpen(false);
    setIsConfirmOverwriteDialogOpen(true);
  };

  const confirmOverwrite = () => {
    if (!project || !projectDataToOverwrite) return;

    const updatedProjectData: Project = {
      ...projectDataToOverwrite,
      id: project.id,
      createdAt: project.createdAt,
      serverConfigId: projectDataToOverwrite.serverConfigId,
    };

    setProject(updatedProjectData);

    const currentProjects = JSON.parse(
      localStorage.getItem("projects") || "[]"
    );
    const updatedProjects = currentProjects.map((p: Project) =>
      p.id === project.id ? updatedProjectData : p
    );
    localStorage.setItem("projects", JSON.stringify(updatedProjects));

    setProjectDataToOverwrite(null);
    setIsConfirmOverwriteDialogOpen(false);

    toast({
      title: "Project Overwritten",
      description: `Project "${updatedProjectData.name}" has been updated with the imported configuration.`,
    });

    // // Refresh the page to reflect the changes from localStorage
    window.location.reload();
  };

  const handleExport = async () => {
    if (!project) return;
    if (!project.serverConfigId) {
      toast({
        title: "Export failed",
        description:
          "Please select a server configuration for this project before exporting.",
        variant: "destructive",
      });
      return;
    }

    const selectedServerConfig = serverConfigs.find(
      (sc) => sc.id === project.serverConfigId
    );

    if (!selectedServerConfig) {
      toast({
        title: "Export failed",
        description: `Selected server configuration (ID: ${project.serverConfigId}) not found.`,
        variant: "destructive",
      });
      return;
    }

    try {
      await exportToYaml(project, selectedServerConfig);
      toast({
        title: "Configuration saved",
        description: "Your YAML configuration file has been saved.",
      });
    } catch (error: unknown) {
      console.error("Error exporting YAML:", error);
      if (
        error instanceof Error &&
        error.message === "Save cancelled by user."
      ) {
        toast({
          title: "Export cancelled",
          description: "You cancelled the file save operation.",
          variant: "default",
        });
      } else if (
        error instanceof Error &&
        error.message === "Failed to save file."
      ) {
        toast({
          title: "Export failed",
          description:
            "Could not save the file. The browser might not support the File System Access API or another error occurred.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Export failed",
          description: "An unexpected error occurred during export.",
          variant: "destructive",
        });
      }
    }
  };

  const updateProject = (updates: Partial<Project>) => {
    setProject((prevProject) => {
      if (!prevProject) return null;

      const newManager = updates.manager
        ? { ...prevProject.manager, ...updates.manager }
        : prevProject.manager;

      const newProjectState: Project = {
        ...prevProject,
        ...updates,
        manager: newManager,
      };

      if (newProjectState.manager.type !== "HybridPhaseManager") {
        delete newProjectState.manager.continuousPhases;
        delete newProjectState.manager.continuousPhasesString;
        delete newProjectState.manager.minActionDelay;
        delete newProjectState.manager.maxActionDelay;
      }

      return newProjectState;
    });
  };

  if (!project) {
    return <div className="container py-8">Loading project...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </Button>
            <div className="bg-primary text-primary-foreground p-1 rounded text-sm font-bold">
              EA
            </div>
            <h1 className="text-lg font-semibold">Project: {project.name}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2"
              disabled={!project.serverConfigId}
            >
              <FileOutput className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenImportOverwriteModal}
              className="gap-2"
            >
              <Import className="h-4 w-4" />
              Import & Overwrite
            </Button>
            <Button size="sm" onClick={handleSave} className="gap-2">
              <SaveIcon className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-6 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="basic">Project</TabsTrigger>
            <TabsTrigger value="state">State</TabsTrigger>
            <TabsTrigger value="agents-roles">Agents & Roles</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="prompt-partials">Prompt Partials</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-8 w-full">
                  {/* Left column: everything above Logs Directory */}
                  <div className="flex-1 flex flex-col gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="project-name">Project Name</Label>
                      <Input
                        id="project-name"
                        value={project.name}
                        onChange={(e) =>
                          updateProject({ name: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="project-description">Description</Label>
                      <Textarea
                        id="project-description"
                        value={project.description || ""}
                        onChange={(e) =>
                          updateProject({ description: e.target.value })
                        }
                        rows={4}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="project-server-config">
                        Server Configuration
                      </Label>
                      <Select
                        value={project.serverConfigId ?? ""}
                        onValueChange={(value) =>
                          updateProject({ serverConfigId: value || null })
                        }
                        disabled={serverConfigs.length === 0}
                      >
                        <SelectTrigger id="project-server-config">
                          <SelectValue
                            placeholder={
                              serverConfigs.length > 0
                                ? "Select server configuration"
                                : "No server configs available"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {serverConfigs.map((config) => (
                            <SelectItem key={config.id} value={config.id}>
                              {config.name} ({config.hostname}:{config.port})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {serverConfigs.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          Please create a server configuration first via the{" "}
                          <span className="font-bold">Manage Servers</span>{" "}
                          button on the dashboard.
                        </p>
                      )}
                      {!project.serverConfigId && serverConfigs.length > 0 && (
                        <p className="text-xs text-destructive">
                          Please select a server configuration for this project.
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="manager-type">Manager Type</Label>
                      <Select
                        value={project.manager.type}
                        onValueChange={(type) =>
                          updateProject({
                            manager: {
                              ...project.manager,
                              type,
                              ...(type === "HybridPhaseManager" && {
                                continuousPhases:
                                  project.manager.continuousPhases || [],
                                minActionDelay:
                                  project.manager.minActionDelay ?? 5,
                                maxActionDelay:
                                  project.manager.maxActionDelay ?? 10,
                              }),
                            },
                          })
                        }
                      >
                        <SelectTrigger id="manager-type">
                          <SelectValue placeholder="Select manager type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TurnBasedPhaseManager">
                            Turn-Based Phase Manager
                          </SelectItem>
                          <SelectItem value="HybridPhaseManager">
                            Hybrid Phase Manager
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {project.manager.type === "HybridPhaseManager" && (
                      <>
                        <div className="grid gap-2">
                          <Label htmlFor="manager-continuous-phases">
                            Continuous Phases (comma-separated)
                          </Label>
                          <Input
                            id="manager-continuous-phases"
                            value={project.manager.continuousPhasesString || ""}
                            onChange={(e) =>
                              updateProject({
                                manager: {
                                  ...project.manager,
                                  continuousPhasesString: e.target.value,
                                  continuousPhases: parseCommaSeparatedNumbers(
                                    e.target.value
                                  ),
                                },
                              })
                            }
                            placeholder="e.g., 1, 3, 5"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="manager-min-action-delay">
                              Min Action Delay (seconds)
                            </Label>
                            <Input
                              id="manager-min-action-delay"
                              type="number"
                              min="0"
                              value={project.manager.minActionDelay ?? ""}
                              onChange={(e) =>
                                updateProject({
                                  manager: {
                                    ...project.manager,
                                    minActionDelay:
                                      e.target.value === ""
                                        ? undefined
                                        : parseInt(e.target.value, 10),
                                  },
                                })
                              }
                              placeholder="e.g., 5"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="manager-max-action-delay">
                              Max Action Delay (seconds)
                            </Label>
                            <Input
                              id="manager-max-action-delay"
                              type="number"
                              min="0"
                              value={project.manager.maxActionDelay ?? ""}
                              onChange={(e) =>
                                updateProject({
                                  manager: {
                                    ...project.manager,
                                    maxActionDelay:
                                      e.target.value === ""
                                        ? undefined
                                        : parseInt(e.target.value, 10),
                                  },
                                })
                              }
                              placeholder="e.g., 10"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="project-logs-dir">Logs Directory</Label>
                        <Input
                          id="project-logs-dir"
                          value={project.logsDir || ""}
                          onChange={(e) =>
                            updateProject({ logsDir: e.target.value || null })
                          }
                          placeholder="e.g., ./logs/my_experiment"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="project-log-level">Log Level</Label>
                        <Select
                          value={project.logLevel || "none"}
                          onValueChange={(value) =>
                            updateProject({
                              logLevel: value === "none" ? null : value,
                            })
                          }
                        >
                          <SelectTrigger id="project-log-level">
                            <SelectValue placeholder="Select log level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None (default)</SelectItem>
                            <SelectItem value="DEBUG">DEBUG</SelectItem>
                            <SelectItem value="INFO">INFO</SelectItem>
                            <SelectItem value="WARNING">WARNING</SelectItem>
                            <SelectItem value="ERROR">ERROR</SelectItem>
                            <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="project-observability-provider">
                        Observability Provider
                      </Label>
                      <Select
                        value={project.observabilityProvider || "none"}
                        onValueChange={(value) =>
                          updateProject({ observabilityProvider: value })
                        }
                      >
                        <SelectTrigger id="project-observability-provider">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="langsmith">LangSmith</SelectItem>
                          <SelectItem value="langfuse">LangFuse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="project-phase-transition-event">
                          Phase Transition Event
                        </Label>
                        <Input
                          id="project-phase-transition-event"
                          value={project.phaseTransitionEvent || ""}
                          onChange={(e) =>
                            updateProject({
                              phaseTransitionEvent: e.target.value || null,
                            })
                          }
                          placeholder="e.g., next_phase_event"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="project-phase-identifier-key">
                          Phase Identifier Key
                        </Label>
                        <Input
                          id="project-phase-identifier-key"
                          value={project.phaseIdentifierKey || ""}
                          onChange={(e) =>
                            updateProject({
                              phaseIdentifierKey: e.target.value || null,
                            })
                          }
                          placeholder="e.g., current_phase"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="state">
            <StateConfig
              state={project.state}
              onChange={(state) => updateProject({ state })}
            />
          </TabsContent>

          <TabsContent value="prompt-partials">
            <PromptPartialsConfig
              promptPartials={project.promptPartials || []}
              onChange={(promptPartials) => updateProject({ promptPartials })}
              state={project.state}
            />
          </TabsContent>

          {/* Add combined Agents & Roles Tab Content */}
          <TabsContent value="agents-roles" className="space-y-6">
            <AgentRolesConfig
              agentRoles={project.agentRoles}
              onChange={(agentRoles) => updateProject({ agentRoles })}
              state={project.state}
              promptPartials={project.promptPartials || []}
            />
          </TabsContent>

          {/* Add new TabsContent for Prompts */}
          <TabsContent value="prompts">
            <ProjectPromptsConfig
              agentRoles={project.agentRoles}
              promptPartials={project.promptPartials || []}
              state={project.state}
              onUpdateAgentRoles={(updatedAgentRoles) =>
                updateProject({ agentRoles: updatedAgentRoles })
              }
            />
          </TabsContent>
        </Tabs>
      </main>

      <ImportProjectModal
        isOpen={isImportOverwriteModalOpen}
        onClose={() => setIsImportOverwriteModalOpen(false)}
        mode="overwrite"
        onParseSuccess={handleParseSuccess}
      />

      <AlertDialog
        open={isConfirmOverwriteDialogOpen}
        onOpenChange={setIsConfirmOverwriteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Overwrite?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace the current project configuration (
              <strong>{project.name}</strong>) with the content from the
              imported file (
              <strong>{projectDataToOverwrite?.name || "Unknown"}</strong>).
              <br />
              <br />
              This action cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setProjectDataToOverwrite(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmOverwrite}>
              Confirm Overwrite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

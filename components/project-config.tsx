"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeftIcon, DownloadIcon, SaveIcon } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Project } from "@/types/project";
import { AgentRolesConfig } from "@/components/config/agent-roles-config";
import { AgentsConfig } from "@/components/config/agents-config";
import { StateConfig } from "@/components/config/state-config";
import { PromptPartialsConfig } from "@/components/config/prompt-partials-config";
import { exportToYaml } from "@/lib/export-yaml";
import { useToast } from "@/hooks/use-toast";
import { useServerConfigs } from "@/hooks/use-server-configs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  useEffect(() => {
    const foundProject = projects.find((p) => p.id === projectId);
    if (foundProject) {
      if (!foundProject.serverConfigId && serverConfigs.length > 0) {
        foundProject.serverConfigId = serverConfigs[0].id;
      }
      setProject(foundProject);
    } else {
      router.push("/");
    }
  }, [projectId, projects, router, serverConfigs]);

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

  const handleExport = () => {
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
      exportToYaml(project, selectedServerConfig);
      toast({
        title: "Configuration exported",
        description: "Your YAML configuration file has been downloaded.",
      });
    } catch (error) {
      console.error("Error exporting YAML:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your configuration.",
        variant: "destructive",
      });
    }
  };

  const updateProject = (updates: Partial<Project>) => {
    setProject((prevProject) => {
      if (!prevProject) return null;
      return { ...prevProject, ...updates };
    });
  };

  if (!project) {
    return <div className="container py-8">Loading project...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
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
              <DownloadIcon className="h-4 w-4" />
              Export
            </Button>
            <Button size="sm" onClick={handleSave} className="gap-2">
              <SaveIcon className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-6 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="state">State</TabsTrigger>
            <TabsTrigger value="prompt-partials">Prompt Partials</TabsTrigger>
            <TabsTrigger value="agents-roles">Agents & Roles</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-6 max-w-xl">
                  {" "}
                  <div className="grid gap-2">
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      value={project.name}
                      onChange={(e) => updateProject({ name: e.target.value })}
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
                    <Label htmlFor="project-game-id">Game ID (Optional)</Label>
                    <Input
                      id="project-game-id"
                      type="number"
                      value={project.gameId ?? ""}
                      onChange={(e) =>
                        updateProject({
                          gameId:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        })
                      }
                      placeholder="Leave blank if not needed"
                      min="0"
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
                        Please create a server configuration first via the
                        "Manage Servers" button on the dashboard.
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
                        updateProject({ manager: { ...project.manager, type } })
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
            {/* Agent Roles Section */}
            <AgentRolesConfig
              agentRoles={project.agentRoles}
              onChange={(agentRoles) => updateProject({ agentRoles })}
              state={project.state}
              promptPartials={project.promptPartials || []}
              agents={project.agents}
              onAgentsChange={(agents) => updateProject({ agents })}
            />
            {/* Agents Section */}
            <AgentsConfig
              agents={project.agents}
              agentRoles={project.agentRoles}
              onChange={(agents) => updateProject({ agents })}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

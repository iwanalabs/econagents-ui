"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeftIcon, DownloadIcon, SaveIcon } from "lucide-react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Project } from "@/types/project"
import { AgentRolesConfig } from "@/components/config/agent-roles-config"
import { AgentsConfig } from "@/components/config/agents-config"
import { StateConfig } from "@/components/config/state-config"
import { ManagerConfig } from "@/components/config/manager-config"
import { ServerConfig } from "@/components/config/server-config"
import { exportToYaml } from "@/lib/export-yaml"
import { useToast } from "@/hooks/use-toast"

interface ProjectConfigProps {
  projectId: string
}

export function ProjectConfig({ projectId }: ProjectConfigProps) {
  const [projects] = useLocalStorage<Project[]>("projects", [])
  const [project, setProject] = useState<Project | null>(null)
  const [activeTab, setActiveTab] = useState("basic")
  const router = useRouter()
  const { toast } = useToast()

  // Load the project only once when the component mounts or projectId changes
  useEffect(() => {
    const foundProject = projects.find((p) => p.id === projectId)
    if (foundProject) {
      setProject(foundProject)
    } else {
      router.push("/")
    }
  }, [projectId, projects, router])

  const handleSave = () => {
    if (!project) return

    // Get the current projects from localStorage directly
    const currentProjects = JSON.parse(localStorage.getItem("projects") || "[]")
    const updatedProjects = currentProjects.map((p: Project) => (p.id === project.id ? project : p))
    localStorage.setItem("projects", JSON.stringify(updatedProjects))

    toast({
      title: "Project saved",
      description: "Your project configuration has been saved successfully.",
    })
  }

  const handleExport = () => {
    if (!project) return

    try {
      exportToYaml(project)
      toast({
        title: "Configuration exported",
        description: "Your YAML configuration file has been downloaded.",
      })
    } catch (error) {
      console.error("Error exporting YAML:", error)
      toast({
        title: "Export failed",
        description: "There was an error exporting your configuration.",
        variant: "destructive",
      })
    }
  }

  const updateProject = (updates: Partial<Project>) => {
    if (!project) return
    setProject({ ...project, ...updates })
  }

  if (!project) {
    return <div className="container py-8">Loading project...</div>
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ChevronLeftIcon className="h-5 w-5" />
            </Button>
            <div className="bg-primary text-primary-foreground p-1 rounded text-sm font-bold">EA</div>
            <h1 className="text-lg font-semibold">Project: {project.name}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
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
            <TabsTrigger value="agent-roles">Agent Roles</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="state">State</TabsTrigger>
            <TabsTrigger value="manager">Manager</TabsTrigger>
            <TabsTrigger value="server">Server</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-4 max-w-xl">
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
                      onChange={(e) => updateProject({ description: e.target.value })}
                      rows={4}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agent-roles">
            <AgentRolesConfig
              agentRoles={project.agentRoles}
              onChange={(agentRoles) => updateProject({ agentRoles })}
            />
          </TabsContent>

          <TabsContent value="agents">
            <AgentsConfig
              agents={project.agents}
              agentRoles={project.agentRoles}
              onChange={(agents) => updateProject({ agents })}
            />
          </TabsContent>

          <TabsContent value="state">
            <StateConfig state={project.state} onChange={(state) => updateProject({ state })} />
          </TabsContent>

          <TabsContent value="manager">
            <ManagerConfig manager={project.manager} onChange={(manager) => updateProject({ manager })} />
          </TabsContent>

          <TabsContent value="server">
            <ServerConfig runner={project.runner} onChange={(runner) => updateProject({ runner })} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

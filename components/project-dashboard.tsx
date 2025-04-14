"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { PlusIcon, SearchIcon, ServerIcon, XIcon } from "lucide-react"
import { CreateProjectModal } from "@/components/create-project-modal"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Project } from "@/types/project"

export function ProjectDashboard() {
  const [projects, setProjects] = useLocalStorage<Project[]>("projects", [])
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const router = useRouter()

  const filteredProjects = projects.filter((project) => project.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleCreateProject = (project: Project) => {
    const newProjects = [...projects, project]
    setProjects(newProjects)
    setIsModalOpen(false)
  }

  const handleDeleteProject = (id: string) => {
    // Get current projects directly from localStorage to avoid stale state
    const currentProjects = JSON.parse(localStorage.getItem("projects") || "[]")
    const newProjects = currentProjects.filter((project: Project) => project.id !== id)
    setProjects(newProjects)
  }

  const handleOpenProject = (id: string) => {
    router.push(`/projects/${id}`)
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-border">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center space-x-4">
            <div className="bg-primary text-primary-foreground p-1 rounded text-sm font-bold">EA</div>
            <h1 className="text-lg font-semibold">EconAgents Config</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="gap-2">
              <ServerIcon className="h-4 w-4" />
              Manage Server
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Create your own pipeline</h2>
          <div className="relative w-64">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setIsModalOpen(true)}>
            <CardContent className="flex flex-col items-center justify-center h-40 p-6">
              <PlusIcon className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-center font-medium">Create New Project</p>
            </CardContent>
          </Card>

          {filteredProjects.map((project) => (
            <Card key={project.id} className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteProject(project.id)
                }}
              >
                <XIcon className="h-4 w-4" />
              </Button>
              <CardContent className="h-40 p-6 cursor-pointer" onClick={() => handleOpenProject(project.id)}>
                <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  )
}

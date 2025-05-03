"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import type { Project } from "@/types/project"
// Import server config types and hook
import type { ServerConfig } from "@/types"
import { useServerConfigs } from "@/hooks/use-server-configs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateProject: (project: Project) => void
}

export function CreateProjectModal({ isOpen, onClose, onCreateProject }: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState("")
  const [projectDescription, setProjectDescription] = useState("")
  // Add state for gameId
  const [projectGameId, setProjectGameId] = useState<number | null>(null)
  // Fetch server configs
  const [serverConfigs] = useServerConfigs()
  const [selectedServerConfigId, setSelectedServerConfigId] = useState<string | null>(
    serverConfigs.length > 0 ? serverConfigs[0].id : null
  )

  // Update selected server config if serverConfigs list changes (e.g., on initial load)
  useState(() => {
    if (!selectedServerConfigId && serverConfigs.length > 0) {
      setSelectedServerConfigId(serverConfigs[0].id)
    }
  }, [serverConfigs, selectedServerConfigId])


  const handleSubmit = () => {
    if (!projectName.trim() || !selectedServerConfigId) return

    // Add game_id to the new project object
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: projectName,
      description: projectDescription,
      createdAt: new Date().toISOString(),
      gameId: projectGameId, // Add game_id here
      agentRoles: [],
      agents: [],
      state: {
        metaInformation: [],
        privateInformation: [],
        publicInformation: [],
      },
      manager: {
        type: "TurnBasedPhaseManager",
      },
      // Remove runner field
      // runner: { ... },
      // Add serverConfigId
      serverConfigId: selectedServerConfigId,
      promptPartials: [], // Initialize promptPartials
    }

    onCreateProject(newProject)
    // Reset state
    setProjectName("")
    setProjectDescription("")
    setProjectGameId(null) // Reset gameId
    setSelectedServerConfigId(serverConfigs.length > 0 ? serverConfigs[0].id : null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Experiment"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="A brief description of your experiment"
              rows={3}
            />
          </div>
          {/* Add Game ID Input */}
          <div className="grid gap-2">
            <Label htmlFor="game-id">Game ID (Optional)</Label>
            <Input
              id="game-id"
              type="number"
              value={projectGameId ?? ""}
              onChange={(e) => setProjectGameId(e.target.value === "" ? null : Number(e.target.value))}
              placeholder="Leave blank if not needed"
              min="0"
            />
          </div>
          {/* Add Game ID Input */}
          <div className="grid gap-2">
            <Label htmlFor="game-id">Game ID (Optional)</Label>
            <Input
              id="game-id"
              type="number"
              value={projectGameId ?? ""}
              onChange={(e) => setProjectGameId(e.target.value === "" ? null : Number(e.target.value))}
              placeholder="Leave blank if not needed"
              min="0"
            />
          </div>
          {/* Add Server Config Selector */}
          <div className="grid gap-2">
            <Label htmlFor="server-config">Server Configuration *</Label>
            <Select
              value={selectedServerConfigId ?? ""}
              onValueChange={(value) => setSelectedServerConfigId(value || null)}
              disabled={serverConfigs.length === 0}
            >
              <SelectTrigger id="server-config">
                <SelectValue placeholder={serverConfigs.length > 0 ? "Select server configuration" : "No server configs available"} />
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
                Please create a server configuration first via the "Manage Servers" button.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!projectName.trim() || !selectedServerConfigId}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

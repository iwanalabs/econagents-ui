"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Project } from "@/types/project";
import { useServerConfigs } from "@/hooks/use-server-configs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: Project) => void;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onCreateProject,
}: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectGameId, setProjectGameId] = useState<number | null>(null);
  const [serverConfigs] = useServerConfigs();
  const [selectedServerConfigId, setSelectedServerConfigId] = useState<
    string | null
  >(serverConfigs.length > 0 ? serverConfigs[0].id : null);

  useEffect(() => {
    if (!selectedServerConfigId && serverConfigs.length > 0) {
      setSelectedServerConfigId(serverConfigs[0].id);
    }
  }, [serverConfigs, selectedServerConfigId]);

  const handleSubmit = () => {
    if (!projectName.trim() || !selectedServerConfigId) return;

    const newProject: Project = {
      id: crypto.randomUUID(),
      name: projectName,
      description: projectDescription,
      createdAt: new Date().toISOString(),
      gameId: projectGameId,
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
      serverConfigId: selectedServerConfigId,
      promptPartials: [],
    };

    onCreateProject(newProject);
    setProjectName("");
    setProjectDescription("");
    setProjectGameId(null);
    setSelectedServerConfigId(
      serverConfigs.length > 0 ? serverConfigs[0].id : null,
    );
  };

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
          <div className="grid gap-2">
            <Label htmlFor="server-config">Server Configuration *</Label>
            <Select
              value={selectedServerConfigId ?? ""}
              onValueChange={(value) =>
                setSelectedServerConfigId(value || null)
              }
              disabled={serverConfigs.length === 0}
            >
              <SelectTrigger id="server-config">
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
                <Button variant="link" size="sm" onClick={() => router.push("/servers")}>
                  Manage Servers
                </Button>
                button.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!projectName.trim() || !selectedServerConfigId}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

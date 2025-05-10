"use client";

import { useState } from "react";
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
import { defaultMetaFields } from "@/components/config/state-config";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectGameId, setProjectGameId] = useState<number | null>(null);

  const handleSubmit = () => {
    if (!projectName.trim()) return;

    const newProject: Project = {
      id: crypto.randomUUID(),
      name: projectName,
      description: projectDescription,
      createdAt: new Date().toISOString(),
      gameId: projectGameId,
      agentRoles: [],
      agents: [],
      state: {
        metaInformation: [...defaultMetaFields],
        privateInformation: [],
        publicInformation: [],
      },
      manager: {
        type: "TurnBasedPhaseManager",
      },
      serverConfigId: null,
      promptPartials: [],
      logsDir: null,
      logLevel: null,
      phaseTransitionEvent: null,
      phaseIdentifierKey: null,
      observabilityProvider: "none",
    };

    onCreateProject(newProject);
    setProjectName("");
    setProjectDescription("");
    setProjectGameId(null);
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!projectName.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

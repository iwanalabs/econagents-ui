"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useServerConfigs } from "@/hooks/use-server-configs";
import { useToast } from "@/hooks/use-toast";
import { importFromYaml } from "@/lib/import-yaml";
import type { Project } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface ImportProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportProject?: (project: Project) => void;
  mode?: "create" | "overwrite";
  onParseSuccess?: (
    parsedData: Omit<Project, "id" | "createdAt">,
    selectedServerConfigId: string
  ) => void;
}

export function ImportProjectModal({
  isOpen,
  onClose,
  onImportProject,
  mode = "create",
  onParseSuccess,
}: ImportProjectModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [parsedProjectData, setParsedProjectData] = useState<Omit<
    Project,
    "id" | "createdAt"
  > | null>(null);
  const [serverConfigs] = useServerConfigs();
  const [selectedServerConfigId, setSelectedServerConfigId] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Set default server config when modal opens or configs load
  useEffect(() => {
    if (isOpen && serverConfigs.length > 0 && !selectedServerConfigId) {
      setSelectedServerConfigId(serverConfigs[0].id);
    }
  }, [isOpen, serverConfigs, selectedServerConfigId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setFileContent(null);
      setParsedProjectData(null);
      setError(null);
      // Keep selectedServerConfigId as it might be useful if reopened quickly
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear file input
      }
    }
  }, [isOpen]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (
        selectedFile.type === "application/x-yaml" ||
        selectedFile.type === "text/yaml" ||
        selectedFile.name.endsWith(".yaml") ||
        selectedFile.name.endsWith(".yml")
      ) {
        setFile(selectedFile);
        setError(null);
        setParsedProjectData(null); // Clear previous parse results

        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setFileContent(content);
          // Attempt to parse immediately if server config is selected
          if (selectedServerConfigId) {
            tryParseYaml(content, selectedServerConfigId);
          } else if (serverConfigs.length > 0) {
            // If no server config selected yet, but available, select first and parse
            const defaultId = serverConfigs[0].id;
            setSelectedServerConfigId(defaultId);
            tryParseYaml(content, defaultId);
          } else {
             setError("Please select a server configuration.");
          }
        };
        reader.onerror = () => {
          setError("Failed to read file.");
          setFileContent(null);
        };
        reader.readAsText(selectedFile);
      } else {
        setError("Please select a valid YAML file (.yaml or .yml).");
        setFile(null);
        setFileContent(null);
      }
    }
  };

  const handleServerConfigChange = (value: string) => {
     setSelectedServerConfigId(value || null);
     // Re-parse if file content exists and a new server is selected
     if (fileContent && value) {
       tryParseYaml(fileContent, value);
     } else if (!value) {
       setParsedProjectData(null); // Clear parsed data if server config is deselected
       setError("Please select a server configuration.");
     }
  };

  const tryParseYaml = (content: string, serverId: string) => {
    try {
      const data = importFromYaml(content, serverId);
      setParsedProjectData(data);
      setError(null); // Clear previous errors
    } catch (err) {
      console.error("YAML Parsing Error:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during parsing.';
      setError(`YAML Parsing Error: ${errorMessage}`);
      setParsedProjectData(null);
    }
  };

  const handlePrimaryAction = () => {
    if (!parsedProjectData || !selectedServerConfigId || error) {
      toast({
        title: mode === "create" ? "Import Failed" : "Parse Failed",
        description: error || "Could not parse the file or missing server config.",
        variant: "destructive",
      });
      return;
    }

    if (mode === "overwrite" && onParseSuccess) {
      onParseSuccess(parsedProjectData, selectedServerConfigId);
      onClose();
    } else if (mode === "create" && onImportProject) {
      const newProject: Project = {
        ...parsedProjectData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        serverConfigId: selectedServerConfigId,
      };
      onImportProject(newProject);
      toast({
        title: "Project Imported",
        description: `Project "${newProject.name}" has been imported successfully.`,
      });
      onClose();
    } else {
       console.error("ImportProjectModal: Invalid mode or missing callback.");
       toast({
         title: "Error",
         description: "An internal error occurred during import setup.",
         variant: "destructive",
       });
    }
  };

  const primaryButtonText = mode === "overwrite" ? "Parse & Stage for Overwrite" : "Import Project";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Project from YAML</DialogTitle>
          <DialogDescription>
            Select a YAML configuration file and choose a server configuration
            to associate with the new project.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="yaml-file">YAML File *</Label>
            <Input
              id="yaml-file"
              type="file"
              ref={fileInputRef}
              accept=".yaml,.yml,application/x-yaml,text/yaml"
              onChange={handleFileChange}
              className="cursor-pointer file:cursor-pointer"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="server-config">Server Configuration *</Label>
            <Select
              value={selectedServerConfigId ?? ""}
              onValueChange={handleServerConfigChange}
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
                Please create a server configuration first via the "Manage
                Servers" button on the dashboard.
              </p>
            )}
          </div>

          {error && (
             <Alert variant="destructive">
               <AlertTriangle className="h-4 w-4" />
               <AlertTitle>Error</AlertTitle>
               <AlertDescription>{error}</AlertDescription>
             </Alert>
          )}

          {parsedProjectData && !error && (
             <Alert variant="default">
               <AlertTitle>Ready to Import</AlertTitle>
               <AlertDescription>
                 Project Name: <strong>{parsedProjectData.name}</strong>
                 <br />
                 {parsedProjectData.description && (
                    <>Description: {parsedProjectData.description}<br /></>
                 )}
                 Roles: {parsedProjectData.agentRoles.length}, Agents: {parsedProjectData.agents.length}
               </AlertDescription>
             </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handlePrimaryAction}
            disabled={!file || !selectedServerConfigId || !parsedProjectData || !!error}
          >
            {primaryButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

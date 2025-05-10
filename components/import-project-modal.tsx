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
  onParseSuccess?: (parsedData: Omit<Project, "id" | "createdAt">) => void;
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
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
          tryParseYaml(content);
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

  const tryParseYaml = (content: string) => {
    try {
      const data = importFromYaml(content);
      setParsedProjectData(data);
      setError(null); // Clear previous errors
    } catch (err) {
      console.error("YAML Parsing Error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unknown error occurred during parsing.";
      setError(`YAML Parsing Error: ${errorMessage}`);
      setParsedProjectData(null);
    }
  };

  const handlePrimaryAction = () => {
    if (!parsedProjectData || error) {
      toast({
        title: mode === "create" ? "Import Failed" : "Parse Failed",
        description: error || "Could not parse the file.",
        variant: "destructive",
      });
      return;
    }

    if (mode === "overwrite" && onParseSuccess) {
      onParseSuccess(parsedProjectData);
      onClose();
    } else if (mode === "create" && onImportProject) {
      const newProject: Project = {
        ...parsedProjectData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
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

  const primaryButtonText =
    mode === "overwrite" ? "Parse & Stage for Overwrite" : "Import Project";

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
                  <>
                    Description: {parsedProjectData.description}
                    <br />
                  </>
                )}
                Roles: {parsedProjectData.agentRoles.length}, Agents:{" "}
                {parsedProjectData.agents.length}
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
            disabled={!file || !parsedProjectData || !!error}
          >
            {primaryButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

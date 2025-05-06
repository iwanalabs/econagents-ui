"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { useServerConfigs } from "@/hooks/use-server-configs";
import { useToast } from "@/hooks/use-toast";
import { importServerConfigsFromYaml } from "@/lib/import-server-configs-yaml";
import type { ServerConfig } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, UploadCloudIcon } from "lucide-react";

interface ImportServerConfigsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportServerConfigsModal({
  isOpen,
  onClose,
}: ImportServerConfigsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedConfigs, setParsedConfigs] = useState<ServerConfig[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [
    existingServerConfigs,
    ,
    addServerConfig,,
  ] = useServerConfigs();
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setParsedConfigs(null);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
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
        setParsedConfigs(null);

        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          try {
            const configs = importServerConfigsFromYaml(content);
            setParsedConfigs(configs);
            setError(null);
          } catch (err) {
            console.error("YAML Parsing Error:", err);
            const errorMessage =
              err instanceof Error
                ? err.message
                : "An unknown error occurred during parsing.";
            setError(`YAML Parsing Error: ${errorMessage}`);
            setParsedConfigs(null);
          }
        };
        reader.onerror = () => {
          setError("Failed to read file.");
          setParsedConfigs(null);
        };
        reader.readAsText(selectedFile);
      } else {
        setError("Please select a valid YAML file (.yaml or .yml).");
        setFile(null);
        setParsedConfigs(null);
      }
    }
  };

  const handleImport = () => {
    if (!parsedConfigs || parsedConfigs.length === 0) {
      toast({
        title: "Import Failed",
        description: error || "No configurations found in the file to import.",
        variant: "destructive",
      });
      return;
    }

    const existingIds = new Set(existingServerConfigs.map((c) => c.id));
    let importedCount = 0;
    let skippedCount = 0;

    parsedConfigs.forEach((importedConfig) => {
      let finalId = importedConfig.id;
      // Ensure ID is unique, generate a new one if it's a duplicate or was just generated and happens to collide (unlikely)
      if (existingIds.has(finalId)) {
        console.warn(`ID conflict for ${importedConfig.name} (ID: ${finalId}). Generating new ID.`);
        finalId = crypto.randomUUID();
      }
      
      const configToAdd: ServerConfig = { ...importedConfig, id: finalId };
      addServerConfig(configToAdd);
      existingIds.add(finalId); // Add to set to prevent collision with items in the same import batch
      importedCount++;
    });

    toast({
      title: "Import Successful",
      description: `${importedCount} server configuration(s) imported. ${skippedCount > 0 ? `${skippedCount} skipped due to issues.` : ""}`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Server Configurations</DialogTitle>
          <DialogDescription>
            Select a YAML file containing server configurations to import.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="server-yaml-file">YAML File *</Label>
            <Input
              id="server-yaml-file"
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

          {parsedConfigs && !error && (
            <Alert variant="default">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>File Ready for Import</AlertTitle>
              <AlertDescription>
                Found {parsedConfigs.length} server configuration(s) in the
                file.
                <ul className="mt-2 list-disc list-inside text-xs">
                  {parsedConfigs.slice(0, 5).map((config) => (
                    <li key={config.id}>
                      {config.name} ({config.hostname}:{config.port})
                    </li>
                  ))}
                  {parsedConfigs.length > 5 && <li>...and more.</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || !parsedConfigs || !!error || parsedConfigs.length === 0}
            className="gap-2"
          >
            <UploadCloudIcon className="h-4 w-4" />
            Import Configurations
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
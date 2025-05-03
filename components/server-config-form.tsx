"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ServerConfig } from "@/types"; // Import ServerConfig type

interface ServerConfigFormProps {
  config: ServerConfig; // Use ServerConfig type
  onChange: (config: ServerConfig) => void; // Use ServerConfig type
}

// Rename component and update props
export function ServerConfigForm({
  config: initialConfig,
  onChange,
}: ServerConfigFormProps) {
  const [config, setConfig] = useState<ServerConfig>(initialConfig);

  // Update local state when the initialConfig prop changes (e.g., when selecting a different config to edit)
  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const handleChange = (
    field: keyof ServerConfig,
    value: string | number | null
  ) => {
    // Handle empty string for optional fields -> null
    const processedValue = value === "" ? null : value;
    const updatedConfig = { ...config, [field]: processedValue };
    setConfig(updatedConfig);
    onChange(updatedConfig); // Propagate changes up immediately
  };

  const handleNumberChange = (field: keyof ServerConfig, value: string) => {
    const num = value === "" ? null : Number.parseInt(value, 10);
    if (value === "" || (!isNaN(num) && num >= 0)) {
      handleChange(field, num);
    }
  };

  return (
    // Remove outer div and title, as this will be part of a modal/page
    <Card>
      <CardHeader>
        <CardTitle>Server Details</CardTitle>{" "}
        {/* Keep Card structure for reuse */}
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-6 max-w-2xl">
          {/* Add Name Field */}
          <div className="grid gap-2">
            <Label htmlFor="server-name">Configuration Name *</Label>
            <Input
              id="server-name"
              value={config.name || ""} // Use config instead of runner
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., Local Dev Server"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Remove the Runner Type Select field */}
            {/*
            <div className="grid gap-2">
              <Label htmlFor="server-type">Runner Type</Label>
              <Select
                value={config.type || "TurnBasedGameRunner"} // Use config instead of runner
                onValueChange={(value) => handleChange("type", value)}
              >
                <SelectTrigger id="server-type">
                  <SelectValue placeholder="Select runner type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TurnBasedGameRunner">
                    Turn-Based Game Runner
                  </SelectItem>
                  {/* Add other runner types if needed * /}
                </SelectContent>
              </Select>
            </div>
            */}
            <div className="grid gap-2">
              <Label htmlFor="hostname">Hostname</Label>
              <Input
                id="hostname"
                value={config.hostname || ""} // Use config instead of runner
                onChange={(e) => handleChange("hostname", e.target.value)}
                placeholder="localhost"
              />
            </div>
          </div>

          {/* Adjust grid layout - Hostname now takes full width or stays half? Let's keep it half for now */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={config.port?.toString() || ""} // Use config instead of runner
                onChange={(e) => handleNumberChange("port", e.target.value)}
                placeholder="8765"
                min="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="path">Path</Label>
              <Input
                id="path"
                value={config.path || ""} // Use config instead of runner
                onChange={(e) => handleChange("path", e.target.value)}
                placeholder="wss"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Remove the Game ID field */}
            {/*
            <div className="grid gap-2">
              <Label htmlFor="game-id">Game ID (Optional)</Label>
              <Input
                id="game-id"
                type="number"
                value={config.game_id?.toString() ?? ""} // Use config instead of runner, handle null/undefined
                onChange={(e) => handleNumberChange("game_id", e.target.value)}
                placeholder="Leave blank if not needed"
                min="0"
              />
            </div>
            */}
            <div className="grid gap-2">
              <Label htmlFor="logs-dir">Logs Directory (Optional)</Label>
              <Input
                id="logs-dir"
                value={config.logsDir || ""}
                onChange={(e) => handleChange("logs_dir", e.target.value)}
                placeholder="./logs"
              />
            </div>
            <div className="grid gap-2">
              {" "}
              {/* Placeholder or another field */}{" "}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="log-level">Log Level (Optional)</Label>
              <Select
                value={config.logLevel || "none"} // Use config instead of runner
                onValueChange={(value) => handleChange("log_level", value)}
              >
                <SelectTrigger id="log-level">
                  <SelectValue placeholder="Select log level (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">(Default)</SelectItem>
                  <SelectItem value="DEBUG">DEBUG</SelectItem>
                  <SelectItem value="INFO">INFO</SelectItem>
                  <SelectItem value="WARNING">WARNING</SelectItem>
                  <SelectItem value="ERROR">ERROR</SelectItem>
                  <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="observability-provider">
                Observability Provider (Optional)
              </Label>
              <Select
                value={config.observabilityProvider || "none"} // Use config instead of runner
                onValueChange={(value) =>
                  handleChange("observability_provider", value)
                }
              >
                <SelectTrigger id="observability-provider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="langsmith">LangSmith</SelectItem>
                  {/* Add other providers if needed */}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phase-transition-event">
                Phase Transition Event (Optional)
              </Label>
              <Input
                id="phase-transition-event"
                value={config.phaseTransitionEvent || ""} // Use config instead of runner
                onChange={(e) =>
                  handleChange("phase_transition_event", e.target.value)
                }
                placeholder="e.g., next_phase"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phase-identifier-key">
                Phase Identifier Key (Optional)
              </Label>
              <Input
                id="phase-identifier-key"
                value={config.phaseIdentifierKey || ""} // Use config instead of runner
                onChange={(e) =>
                  handleChange("phase_identifier_key", e.target.value)
                }
                placeholder="e.g., current_phase"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

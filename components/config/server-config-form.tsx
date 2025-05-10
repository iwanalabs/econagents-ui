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
import type { ServerConfig } from "@/types";

interface ServerConfigFormProps {
  config: ServerConfig;
  onChange: (config: ServerConfig) => void;
}

export function ServerConfigForm({
  config: initialConfig,
  onChange,
}: ServerConfigFormProps) {
  const [config, setConfig] = useState<ServerConfig>(initialConfig);

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const handleChange = (
    field: keyof ServerConfig,
    value: string | number | null
  ) => {
    const processedValue = value === "" ? null : value;
    const updatedConfig = { ...config, [field]: processedValue };
    setConfig(updatedConfig);
    onChange(updatedConfig);
  };

  const handleNumberChange = (field: keyof ServerConfig, value: string) => {
    if (value === "") {
      handleChange(field, null);
    } else {
      const num = Number.parseInt(value, 10);
      if (!isNaN(num) && num >= 0) {
        handleChange(field, num);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Server Details</CardTitle>{" "}
        {/* Keep Card structure for reuse */}
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-6 max-w-2xl">
          <div className="grid gap-2">
            <Label htmlFor="server-name">Configuration Name *</Label>
            <Input
              id="server-name"
              value={config.name || ""}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., Local Dev Server"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="grid col-span-2 gap-2">
              <Label htmlFor="hostname">Hostname</Label>
              <Input
                id="hostname"
                value={config.hostname || ""}
                onChange={(e) => handleChange("hostname", e.target.value)}
                placeholder="localhost"
              />
            </div>
            <div className="grid col-span-1 gap-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={config.port?.toString() || ""}
                onChange={(e) => handleNumberChange("port", e.target.value)}
                placeholder="8765"
                min="0"
              />
            </div>
            <div className="grid col-span-1 gap-2">
              <Label htmlFor="path">Path</Label>
              <Input
                id="path"
                value={config.path || ""}
                onChange={(e) => handleChange("path", e.target.value)}
                placeholder="wss"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
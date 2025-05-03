"use client";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Manager } from "@/types/project";

interface ManagerConfigProps {
  manager: Manager;
  onChange: (manager: Manager) => void;
}

export function ManagerConfig({ manager, onChange }: ManagerConfigProps) {
  const handleTypeChange = (type: string) => {
    onChange({ ...manager, type });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Manager Configuration</h2>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 max-w-xl">
            <div className="grid gap-2">
              <Label htmlFor="manager-type">Manager Type</Label>
              <Select value={manager.type} onValueChange={handleTypeChange}>
                <SelectTrigger id="manager-type">
                  <SelectValue placeholder="Select manager type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TurnBasedPhaseManager">
                    Turn-Based Phase Manager
                  </SelectItem>
                  <SelectItem value="HybridPhaseManager">
                    Hybrid Phase Manager
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Runner } from "@/types/project"

interface ServerConfigProps {
  runner: Runner
  onChange: (runner: Runner) => void
}

export function ServerConfig({ runner, onChange }: ServerConfigProps) {
  const handleChange = (key: keyof Runner, value: string | number) => {
    onChange({ ...runner, [key]: value })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Server Configuration</h2>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 max-w-xl">
            <div className="grid gap-2">
              <Label htmlFor="runner-type">Runner Type</Label>
              <Select value={runner.type} onValueChange={(value) => handleChange("type", value)}>
                <SelectTrigger id="runner-type">
                  <SelectValue placeholder="Select runner type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TurnBasedGameRunner">Turn-Based Game Runner</SelectItem>
                  <SelectItem value="ContinuousGameRunner">Continuous Game Runner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="hostname">Hostname</Label>
                <Input
                  id="hostname"
                  value={runner.hostname}
                  onChange={(e) => handleChange("hostname", e.target.value)}
                  placeholder="localhost"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={runner.port}
                  onChange={(e) => handleChange("port", Number.parseInt(e.target.value) || 8765)}
                  placeholder="8765"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="path">Path</Label>
                <Input
                  id="path"
                  value={runner.path}
                  onChange={(e) => handleChange("path", e.target.value)}
                  placeholder="wss"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="game-id">Game ID</Label>
                <Input
                  id="game-id"
                  type="number"
                  value={runner.game_id || ""}
                  onChange={(e) => handleChange("game_id", Number.parseInt(e.target.value) || 0)}
                  placeholder="123"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="logs-dir">Logs Directory</Label>
                <Input
                  id="logs-dir"
                  value={runner.logs_dir || ""}
                  onChange={(e) => handleChange("logs_dir", e.target.value)}
                  placeholder="logs"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="log-level">Log Level</Label>
                <Select value={runner.log_level || "INFO"} onValueChange={(value) => handleChange("log_level", value)}>
                  <SelectTrigger id="log-level">
                    <SelectValue placeholder="Select log level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEBUG">DEBUG</SelectItem>
                    <SelectItem value="INFO">INFO</SelectItem>
                    <SelectItem value="WARNING">WARNING</SelectItem>
                    <SelectItem value="ERROR">ERROR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phase-transition">Phase Transition Event</Label>
                <Input
                  id="phase-transition"
                  value={runner.phase_transition_event || ""}
                  onChange={(e) => handleChange("phase_transition_event", e.target.value)}
                  placeholder="round-started"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phase-identifier">Phase Identifier Key</Label>
                <Input
                  id="phase-identifier"
                  value={runner.phase_identifier_key || ""}
                  onChange={(e) => handleChange("phase_identifier_key", e.target.value)}
                  placeholder="round"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="observability">Observability Provider</Label>
                <Select
                  value={runner.observability_provider || ""}
                  onValueChange={(value) => handleChange("observability_provider", value)}
                >
                  <SelectTrigger id="observability">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="langfuse">Langfuse</SelectItem>
                    <SelectItem value="wandb">Weights & Biases</SelectItem>
                    <SelectItem value="mlflow">MLflow</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="prompts-dir">Prompts Directory</Label>
                <Input
                  id="prompts-dir"
                  value={runner.prompts_dir || ""}
                  onChange={(e) => handleChange("prompts_dir", e.target.value)}
                  placeholder="prompts"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

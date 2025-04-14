"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusIcon, Trash2Icon, EditIcon } from "lucide-react"
import type { Agent, AgentRole } from "@/types/project"

interface AgentsConfigProps {
  agents: Agent[]
  agentRoles: AgentRole[]
  onChange: (agents: Agent[]) => void
}

export function AgentsConfig({ agents, agentRoles, onChange }: AgentsConfigProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [currentAgent, setCurrentAgent] = useState<Agent>({
    id: 0,
    role_id: 0,
  })

  const handleAddAgent = () => {
    setCurrentAgent({
      id: agents.length > 0 ? Math.max(...agents.map((a) => a.id)) + 1 : 1,
      role_id: agentRoles.length > 0 ? agentRoles[0].role_id : 0,
    })
    setEditingIndex(null)
    setIsDialogOpen(true)
  }

  const handleEditAgent = (index: number) => {
    setCurrentAgent({ ...agents[index] })
    setEditingIndex(index)
    setIsDialogOpen(true)
  }

  const handleDeleteAgent = (index: number) => {
    const newAgents = [...agents]
    newAgents.splice(index, 1)
    onChange(newAgents)
  }

  const handleSaveAgent = () => {
    if (currentAgent.role_id === 0) return

    let newAgents: Agent[]
    if (editingIndex !== null) {
      newAgents = [...agents]
      newAgents[editingIndex] = currentAgent
    } else {
      newAgents = [...agents, currentAgent]
    }

    onChange(newAgents)
    setIsDialogOpen(false)
  }

  const getRoleName = (roleId: number) => {
    const role = agentRoles.find((r) => r.role_id === roleId)
    return role ? role.name : "Unknown Role"
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Agents</h2>
        <Button onClick={handleAddAgent} className="gap-2" disabled={agentRoles.length === 0}>
          <PlusIcon className="h-4 w-4" />
          Add Agent
        </Button>
      </div>

      {agentRoles.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-muted-foreground">
            You need to define agent roles before adding agents.
          </CardContent>
        </Card>
      ) : agents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center text-muted-foreground">
            No agents defined. Add an agent to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Agent {agent.id}</CardTitle>
                <CardDescription>Role: {getRoleName(agent.role_id)}</CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-end space-x-2">
                <Button variant="ghost" size="sm" onClick={() => handleDeleteAgent(index)}>
                  <Trash2Icon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleEditAgent(index)}>
                  <EditIcon className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Edit Agent" : "Add Agent"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="agent-id">Agent ID</Label>
              <Input
                id="agent-id"
                type="number"
                value={currentAgent.id}
                onChange={(e) =>
                  setCurrentAgent({
                    ...currentAgent,
                    id: Number.parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role-id">Role</Label>
              <Select
                value={currentAgent.role_id.toString()}
                onValueChange={(value) =>
                  setCurrentAgent({
                    ...currentAgent,
                    role_id: Number.parseInt(value),
                  })
                }
              >
                <SelectTrigger id="role-id">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {agentRoles.map((role) => (
                    <SelectItem key={role.role_id} value={role.role_id.toString()}>
                      {role.name} (ID: {role.role_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAgent} disabled={currentAgent.role_id === 0}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

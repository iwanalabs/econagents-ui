"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PlusIcon, EditIcon, Trash2Icon } from "lucide-react"
import { useServerConfigs } from "@/hooks/use-server-configs"
import { ServerConfigForm } from "@/components/server-config-form"
import type { ServerConfig } from "@/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"

interface ServerManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

const createDefaultServerConfig = (): ServerConfig => ({
  id: crypto.randomUUID(),
  name: "New Server Config",
  hostname: "localhost",
  port: 8765,
  path: "wss",
  observabilityProvider: "none",
})

export function ServerManagementModal({ isOpen, onClose }: ServerManagementModalProps) {
  const [serverConfigs, , addServerConfig, updateServerConfig, deleteServerConfig] = useServerConfigs()
  const [editingConfig, setEditingConfig] = useState<ServerConfig | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const { toast } = useToast()

  const handleAddNew = () => {
    setEditingConfig(createDefaultServerConfig())
    setIsFormOpen(true)
  }

  const handleEdit = (config: ServerConfig) => {
    setEditingConfig({ ...config }) // Create a copy to edit
    setIsFormOpen(true)
  }

  const handleDelete = (id: string) => {
    // Add confirmation dialog here if desired
    deleteServerConfig(id)
    toast({ title: "Server configuration deleted." })
  }

  const handleSave = (configToSave: ServerConfig) => {
    if (!configToSave.name?.trim()) {
      toast({ title: "Error", description: "Configuration name cannot be empty.", variant: "destructive" })
      return
    }

    const isUpdating = serverConfigs.some((c) => c.id === configToSave.id)
    if (isUpdating) {
      updateServerConfig(configToSave)
      toast({ title: "Server configuration updated." })
    } else {
      addServerConfig(configToSave)
      toast({ title: "Server configuration added." })
    }
    setIsFormOpen(false)
    setEditingConfig(null)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingConfig(null)
  }

  // Close form modal if the main modal is closed
  useEffect(() => {
    if (!isOpen) {
      setIsFormOpen(false)
      setEditingConfig(null)
    }
  }, [isOpen])

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Server Configurations</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-6">
            <div className="py-4 space-y-4">
              {serverConfigs.length === 0 ? (
                <p className="text-muted-foreground text-center">No server configurations found.</p>
              ) : (
                serverConfigs.map((config) => (
                  <Card key={config.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{config.name}</CardTitle>
                          <CardDescription>
                            {config.hostname}:{config.port}/{config.path}
                          </CardDescription>
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(config)}>
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(config.id)}
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4 border-t pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleAddNew} className="gap-2">
              <PlusIcon className="h-4 w-4" /> Add New Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={handleFormClose}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingConfig?.id && serverConfigs.some(c => c.id === editingConfig.id) ? "Edit Server Configuration" : "Add New Server Configuration"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-6">
            <div className="py-4">
              {editingConfig && (
                <ServerConfigForm
                  config={editingConfig}
                  onChange={setEditingConfig} // Update the temporary editing state
                />
              )}
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4 border-t pt-4">
            <Button variant="outline" onClick={handleFormClose}>
              Cancel
            </Button>
            <Button onClick={() => editingConfig && handleSave(editingConfig)} disabled={!editingConfig?.name?.trim()}>
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

"use client"

import { useState, useRef, createRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { TrashIcon, PlusIcon } from "lucide-react"
import type { PromptPartial, State } from "@/types"
import { StateVariableInserter } from "@/components/state-variable-inserter"

interface PromptPartialsConfigProps {
  promptPartials: PromptPartial[]
  onChange: (promptPartials: PromptPartial[]) => void
  state: State
}

export function PromptPartialsConfig({ promptPartials = [], onChange, state }: PromptPartialsConfigProps) {
  const contentRefs = useRef<Record<string, React.RefObject<HTMLTextAreaElement>>>({})
  promptPartials.forEach((partial) => {
    if (!contentRefs.current[partial.id]) {
      contentRefs.current[partial.id] = createRef<HTMLTextAreaElement>()
    }
  })

  const handleAddPartial = () => {
    const newPartial: PromptPartial = {
      id: crypto.randomUUID(),
      name: `partial_${promptPartials.length + 1}`,
      content: "",
    }
    onChange([...promptPartials, newPartial])
  }

  const handleUpdatePartial = (id: string, field: keyof PromptPartial, value: string) => {
    const updatedPartials = promptPartials.map((partial) =>
      partial.id === id ? { ...partial, [field]: value } : partial
    )
    onChange(updatedPartials)
  }

  const handleDeletePartial = (id: string) => {
    delete contentRefs.current[id]
    const updatedPartials = promptPartials.filter((partial) => partial.id !== id)
    onChange(updatedPartials)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prompt Partials</CardTitle>
        <p className="text-muted-foreground text-sm">
          Define reusable text snippets (partials) that can be included in your agent prompts using
          <code>{'{% include "_partials/partial_name.jinja2" %}'}</code> syntax.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {promptPartials.map((partial) => (
          <Card key={partial.id} className="relative overflow-visible">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 bg-background border rounded-full"
              onClick={() => handleDeletePartial(partial.id)}
            >
              <TrashIcon className="h-4 w-4 text-destructive" />
            </Button>
            <CardContent className="pt-6 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor={`partial-name-${partial.id}`}>Partial Name</Label>
                <Input
                  id={`partial-name-${partial.id}`}
                  value={partial.name}
                  onChange={(e) => handleUpdatePartial(partial.id, "name", e.target.value)}
        placeholder="e.g., common_instructions"
      />
      <p className="text-xs text-muted-foreground">Use this name in prompts like: {'{% include "_partials/' + partial.name + '.jinja2" %}'}</p>
    </div>
    <div className="grid gap-2">
      <Label htmlFor={`partial-content-${partial.id}`}>Content</Label>
                <Textarea
                  ref={contentRefs.current[partial.id]}
                  id={`partial-content-${partial.id}`}
                  value={partial.content}
                  onChange={(e) => handleUpdatePartial(partial.id, "content", e.target.value)}
                  placeholder="Enter the reusable prompt text here..."
                  rows={4}
                  className="font-mono text-sm"
                />
                <StateVariableInserter
                  state={state}
                  textareaRef={contentRefs.current[partial.id]}
                  onInsert={(newValue) => handleUpdatePartial(partial.id, "content", newValue)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={handleAddPartial} className="gap-2">
          <PlusIcon className="h-4 w-4" /> Add Partial
        </Button>
      </CardFooter>
    </Card>
  )
} 
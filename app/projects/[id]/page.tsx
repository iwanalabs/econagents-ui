"use client"

import { useParams } from "next/navigation"
import { ProjectConfig } from "@/components/project-config"

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string

  return (
    <main className="flex min-h-screen flex-col">
      <ProjectConfig projectId={projectId} />
    </main>
  )
}

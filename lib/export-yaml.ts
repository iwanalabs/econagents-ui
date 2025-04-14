import type { Project } from "@/types/project"

export function exportToYaml(project: Project) {
  // Basic project info
  let yaml = `name: "${project.name}"\n`
  if (project.description) {
    yaml += `description: "${project.description}"\n`
  }
  yaml += "\n"

  // Agent roles
  if (project.agentRoles && project.agentRoles.length > 0) {
    yaml += "agent_roles:\n"
    project.agentRoles.forEach((role) => {
      yaml += `  - role_id: ${role.role_id}\n`
      yaml += `    name: "${role.name}"\n`
      yaml += `    llm_type: "${role.llm_type}"\n`
      yaml += "    llm_params:\n"
      yaml += `      model_name: "${role.llm_params.model_name}"\n`

      if (role.llm_params.temperature !== undefined) {
        yaml += `      temperature: ${role.llm_params.temperature}\n`
      }

      if (role.llm_params.top_p !== undefined) {
        yaml += `      top_p: ${role.llm_params.top_p}\n`
      }

      if (role.prompts && Object.keys(role.prompts).length > 0) {
        yaml += "    prompts:\n"
        Object.entries(role.prompts).forEach(([key, value]) => {
          yaml += `      ${key}: |\n`
          // Indent each line of the prompt
          value.split("\n").forEach((line) => {
            yaml += `        ${line}\n`
          })
        })
      }
    })
    yaml += "\n"
  }

  // Agents
  if (project.agents && project.agents.length > 0) {
    yaml += "agents:\n"
    project.agents.forEach((agent) => {
      yaml += `  - id: ${agent.id}\n`
      yaml += `    role_id: ${agent.role_id}\n`
    })
    yaml += "\n"
  }

  // State
  yaml += "state:\n"

  // Meta fields
  if (project.state.metaFields && project.state.metaFields.length > 0) {
    yaml += "  meta_fields:\n"
    project.state.metaFields.forEach((field) => {
      yaml += `    - name: "${field.name}"\n`
      yaml += `      type: "${field.type}"\n`

      if (field.default !== undefined && field.default !== "") {
        yaml += `      default: ${field.default}\n`
      }

      if (field.default_factory) {
        yaml += `      default_factory: "${field.default_factory}"\n`
      }

      if (field.event_key) {
        yaml += `      event_key: "${field.event_key}"\n`
      }

      if (field.exclude_from_mapping) {
        yaml += `      exclude_from_mapping: true\n`
      }
    })
  }

  // Private fields
  if (project.state.privateFields && project.state.privateFields.length > 0) {
    yaml += "  private_fields:\n"
    project.state.privateFields.forEach((field) => {
      yaml += `    - name: "${field.name}"\n`
      yaml += `      type: "${field.type}"\n`

      if (field.default !== undefined && field.default !== "") {
        yaml += `      default: ${field.default}\n`
      }

      if (field.default_factory) {
        yaml += `      default_factory: "${field.default_factory}"\n`
      }
    })
  }

  // Public fields
  if (project.state.publicFields && project.state.publicFields.length > 0) {
    yaml += "  public_fields:\n"
    project.state.publicFields.forEach((field) => {
      yaml += `    - name: "${field.name}"\n`
      yaml += `      type: "${field.type}"\n`

      if (field.default !== undefined && field.default !== "") {
        yaml += `      default: ${field.default}\n`
      }

      if (field.default_factory) {
        yaml += `      default_factory: "${field.default_factory}"\n`
      }
    })
  }

  yaml += "\n"

  // Manager
  yaml += "manager:\n"
  yaml += `  type: "${project.manager.type}"\n\n`

  // Runner
  yaml += "runner:\n"
  yaml += `  type: "${project.runner.type}"\n`
  yaml += `  hostname: "${project.runner.hostname}"\n`
  yaml += `  port: ${project.runner.port}\n`
  yaml += `  path: "${project.runner.path}"\n`

  if (project.runner.game_id) {
    yaml += `  game_id: ${project.runner.game_id}\n`
  }

  if (project.runner.logs_dir) {
    yaml += `  logs_dir: "${project.runner.logs_dir}"\n`
  }

  if (project.runner.log_level) {
    yaml += `  log_level: "${project.runner.log_level}"\n`
  }

  if (project.runner.phase_transition_event) {
    yaml += `  phase_transition_event: "${project.runner.phase_transition_event}"\n`
  }

  if (project.runner.phase_identifier_key) {
    yaml += `  phase_identifier_key: "${project.runner.phase_identifier_key}"\n`
  }

  if (project.runner.observability_provider) {
    yaml += `  observability_provider: "${project.runner.observability_provider}"\n`
  }

  if (project.runner.prompts_dir) {
    yaml += `  prompts_dir: "${project.runner.prompts_dir}"\n`
  }

  // Create a safe filename from the project name
  const safeFilename = project.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()

  // Download the YAML file
  const blob = new Blob([yaml], { type: "text/yaml" })
  const url = URL.createObjectURL(blob)

  // Create a temporary link element and trigger the download
  const a = document.createElement("a")
  a.href = url
  a.download = `${safeFilename}_config.yaml`
  document.body.appendChild(a)
  a.click()

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}

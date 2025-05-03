import type { Project } from "@/types/project"

// Helper function to format multiline strings for YAML
function formatYamlMultilineString(str: string, indentLevel: number): string {
  const indent = " ".repeat(indentLevel)
  // Add | for multiline indicator, then indent each line
  return `|\n${str
    .split("\n")
    .map((line) => `${indent}${line}`)
    .join("\n")}`
}

export function exportToYaml(project: Project) {
  // Basic project info
  let yaml = `name: "${project.name}"\n`
  if (project.description) {
    yaml += `description: "${project.description}"\n`
  }
  yaml += "\n"

  // Prompt Partials
  if (project.promptPartials && project.promptPartials.length > 0) {
    yaml += "prompt_partials:\n"
    project.promptPartials.forEach((partial) => {
      yaml += `  - name: "${partial.name}"\n`
      yaml += `    content: ${formatYamlMultilineString(partial.content, 6)}\n` // Indent level 6 (2 spaces * 3 levels)
    })
    yaml += "\n"
  }

  // Agent roles
  if (project.agentRoles && project.agentRoles.length > 0) {
    yaml += "agent_roles:\n"
    project.agentRoles.forEach((role) => {
      yaml += `  - role_id: ${role.role_id}\n`
      yaml += `    name: "${role.name}"\n`
      yaml += `    llm_type: "${role.llm_type}"\n`
      yaml += "    llm_params:\n"
      yaml += `      model_name: "${role.llm_params.model_name}"\n`

      // Add optional llm params if they exist
      if (role.llm_params.temperature !== undefined) {
        yaml += `      temperature: ${role.llm_params.temperature}\n`
      }
      if (role.llm_params.top_p !== undefined) {
        yaml += `      top_p: ${role.llm_params.top_p}\n`
      }
      // Add any other llm_params dynamically
      Object.entries(role.llm_params)
        .filter(([key]) => !["model_name", "temperature", "top_p"].includes(key))
        .forEach(([key, value]) => {
          yaml += `      ${key}: ${JSON.stringify(value)}\n` // Use JSON.stringify for safety
        })

      if (role.prompts && Object.keys(role.prompts).length > 0) {
        yaml += "    prompts:\n"
        // Format prompts as a list of single-key dictionaries
        Object.entries(role.prompts).forEach(([key, value]) => {
          yaml += `      - ${key}: ${formatYamlMultilineString(value, 10)}\n` // Indent level 10 (2 spaces * 5 levels)
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

  // Meta fields (rename to meta_information)
  if (project.state.metaFields && project.state.metaFields.length > 0) {
    yaml += "  meta_information:\n" // Changed key name
    project.state.metaFields.forEach((field) => {
      yaml += `    - name: "${field.name}"\n`
      yaml += `      type: "${field.type}"\n`

      // Handle default vs default_factory
      if (field.default_factory) {
        yaml += `      default_factory: "${field.default_factory}"\n`
      } else if (field.default !== undefined && field.default !== "") {
        // Attempt to parse default based on type for correct YAML output
        let defaultValue = field.default
        try {
          switch (field.type) {
            case "int":
              defaultValue = Number.parseInt(field.default, 10)
              break
            case "float":
              defaultValue = Number.parseFloat(field.default)
              break
            case "bool":
              defaultValue = String(field.default).toLowerCase() === "true"
              break
            // Add other types if necessary
            default: // Keep as string if unsure
              defaultValue = `"${field.default}"`
              break
          }
        } catch (e) {
          // Fallback to string if parsing fails
          defaultValue = `"${field.default}"`
        }
        yaml += `      default: ${defaultValue}\n`
      }

      if (field.event_key) {
        yaml += `      event_key: "${field.event_key}"\n`
      }

      if (field.exclude_from_mapping) {
        yaml += `      exclude_from_mapping: true\n`
      }
    })
  }

  // Private fields (rename to private_information)
  if (project.state.privateFields && project.state.privateFields.length > 0) {
    yaml += "  private_information:\n" // Changed key name
    project.state.privateFields.forEach((field) => {
      yaml += `    - name: "${field.name}"\n`
      yaml += `      type: "${field.type}"\n`

      if (field.default_factory) {
        yaml += `      default_factory: "${field.default_factory}"\n`
      } else if (field.default !== undefined && field.default !== "") {
        let defaultValue = field.default
        try {
          switch (field.type) {
            case "int":
              defaultValue = Number.parseInt(field.default, 10)
              break
            case "float":
              defaultValue = Number.parseFloat(field.default)
              break
            case "bool":
              defaultValue = String(field.default).toLowerCase() === "true"
              break
            default:
              defaultValue = `"${field.default}"`
              break
          }
        } catch (e) {
          defaultValue = `"${field.default}"`
        }
        yaml += `      default: ${defaultValue}\n`
      }
    })
  }

  // Public fields (rename to public_information)
  if (project.state.publicFields && project.state.publicFields.length > 0) {
    yaml += "  public_information:\n" // Changed key name
    project.state.publicFields.forEach((field) => {
      yaml += `    - name: "${field.name}"\n`
      yaml += `      type: "${field.type}"\n`

      if (field.default_factory) {
        yaml += `      default_factory: "${field.default_factory}"\n`
      } else if (field.default !== undefined && field.default !== "") {
        let defaultValue = field.default
        try {
          switch (field.type) {
            case "int":
              defaultValue = Number.parseInt(field.default, 10)
              break
            case "float":
              defaultValue = Number.parseFloat(field.default)
              break
            case "bool":
              defaultValue = String(field.default).toLowerCase() === "true"
              break
            default:
              defaultValue = `"${field.default}"`
              break
          }
        } catch (e) {
          defaultValue = `"${field.default}"`
        }
        yaml += `      default: ${defaultValue}\n`
      }
    })
  }

  yaml += "\n"

  // Manager
  yaml += "manager:\n"
  yaml += `  type: "${project.manager.type}"\n\n` // Added newline for spacing

  // Runner
  yaml += "runner:\n"
  yaml += `  type: "${project.runner.type}"\n`
  yaml += `  hostname: "${project.runner.hostname}"\n`
  yaml += `  port: ${project.runner.port}\n`
  yaml += `  path: "${project.runner.path}"\n`

  if (project.runner.game_id !== undefined && project.runner.game_id !== null) {
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

  if (project.runner.observability_provider && project.runner.observability_provider !== "none") {
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
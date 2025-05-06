import type { Project } from "@/types/project";
// Import ServerConfig type
import type { ServerConfig } from "@/types";
import type { StateField } from "@/types/project";

// Helper function to format multiline strings for YAML
function formatYamlMultilineString(str: string, indentLevel: number): string {
  const indent = " ".repeat(indentLevel);
  // Add | for multiline indicator, then indent each line
  // Ensure empty strings are handled correctly (e.g., output `|`)
  if (!str) return "|";
  return `|\n${str
    .split("\n")
    .map((line) => `${indent}${line}`)
    .join("\n")}`;
}

export async function exportToYaml(
  project: Project,
  serverConfig: ServerConfig
): Promise<void> {
  let yaml = `name: "${project.name}"\n`;
  if (project.description) {
    yaml += `description: "${project.description}"\n`;
  }
  if (project.gameId !== undefined && project.gameId !== null) {
    yaml += `game_id: ${project.gameId}\n`;
  }
  yaml += "\n";

  // Prompt Partials
  if (project.promptPartials && project.promptPartials.length > 0) {
    yaml += "prompt_partials:\n";
    project.promptPartials.forEach((partial) => {
      yaml += `  - name: "${partial.name}"\n`;
      // Use 6 spaces indent for content under a list item
      yaml += `    content: ${formatYamlMultilineString(partial.content, 6)}\n`;
    });
    yaml += "\n";
  }

  // Agent roles
  if (project.agentRoles && project.agentRoles.length > 0) {
    yaml += "agent_roles:\n";
    project.agentRoles.forEach((role) => {
      yaml += `  - role_id: ${role.roleId}\n`;
      yaml += `    name: "${role.name}"\n`;
      yaml += `    llm_type: "${role.llmType}"\n`;
      yaml += "    llm_params:\n";
      yaml += `      model_name: "${role.llmParams.modelName}"\n`;

      if (
        role.llmParams.temperature !== undefined &&
        role.llmParams.temperature !== null
      ) {
        yaml += `      temperature: ${role.llmParams.temperature}\n`;
      }
      if (role.llmParams.topP !== undefined && role.llmParams.topP !== null) {
        yaml += `      top_p: ${role.llmParams.topP}\n`;
      }
      Object.entries(role.llmParams)
        .filter(
          ([key]) =>
            !["modelName", "temperature", "topP"].includes(key) &&
            role.llmParams[key] !== undefined &&
            role.llmParams[key] !== null
        )
        .forEach(([key, value]) => {
          yaml += `      ${key}: ${JSON.stringify(value)}\n`;
        });

      if (role.task_phases && role.task_phases.length > 0) {
        yaml += `    task_phases: [${role.task_phases.join(", ")}]\n`;
      }

      if (role.prompts && Object.keys(role.prompts).length > 0) {
        yaml += "    prompts:\n";
        Object.entries(role.prompts).forEach(([key, value]) => {
          yaml += `      - ${key}: ${formatYamlMultilineString(value, 10)}\n`;
        });
      }
    });
    yaml += "\n";
  }

  // Agents
  if (project.agents && project.agents.length > 0) {
    yaml += "agents:\n";
    project.agents.forEach((agent) => {
      yaml += `  - id: ${agent.id}\n`;
      yaml += `    role_id: ${agent.roleId}\n`;
    });
    yaml += "\n";
  }

  // State
  yaml += "state:\n";

  // Helper to format state fields
  const formatStateFields = (fields: StateField[], indent: string): string => {
    let fieldYaml = "";
    fields.forEach((field) => {
      fieldYaml += `${indent}- name: "${field.name}"\n`;
      fieldYaml += `${indent}  type: "${field.type}"\n`;

      // Always add default_factory for list and dict
      if (
        field.type === "list" ||
        field.type === "dict" ||
        field.type === "MarketState"
      ) {
        fieldYaml += `${indent}  default_factory: "${field.type}"\n`;
      }

      // Handle default value if it exists and is meaningful
      if (
        field.default !== undefined &&
        field.default !== null &&
        field.default !== "" && // Also check for empty string as potentially non-meaningful
        field.type !== "MarketState"
      ) {
        let defaultValueString: string;
        switch (field.type) {
          case "list":
          case "dict":
            // Use JSON.stringify for complex types
            try {
              // Ensure the value is stringified correctly
              defaultValueString = JSON.stringify(field.default);
            } catch (e) {
              console.error(
                `Error stringifying default value for ${field.name}:`,
                field.default,
                e
              );
              defaultValueString = ""; // Skip outputting default if stringify fails
            }
            break;
          case "bool":
            // Output boolean literals directly
            defaultValueString = String(field.default);
            break;
          case "int":
          case "float":
            // Output number literals directly
            defaultValueString = String(field.default);
            break;
          case "str":
          default:
            // Quote strings
            defaultValueString = `"${String(field.default).replace(/"/g, '\\"')}"`; // Escape quotes within the string
            break;
        }
        // Only add the default line if defaultValueString is not empty
        if (defaultValueString) {
          fieldYaml += `${indent}  default: ${defaultValueString}\n`;
        }
      }

      if (field.eventKey) {
        fieldYaml += `${indent}  event_key: "${field.eventKey}"\n`;
      }

      if (field.excludeFromMapping === true) {
        fieldYaml += `${indent}  exclude_from_mapping: true\n`;
      }

      // Explicitly add optional: true if the field is marked as optional
      if (field.optional === true) {
        fieldYaml += `${indent}  optional: true\n`;
      }
    });
    return fieldYaml;
  };

  // Meta information is now directly part of the project state
  if (
    project.state.metaInformation &&
    project.state.metaInformation.length > 0
  ) {
    yaml += "  meta_information:\n";
    // No need to merge defaults here, just format what's in the state
    yaml += formatStateFields(project.state.metaInformation, "    ");
  }

  if (
    project.state.privateInformation &&
    project.state.privateInformation.length > 0
  ) {
    yaml += "  private_information:\n";
    yaml += formatStateFields(project.state.privateInformation, "    ");
  }

  if (
    project.state.publicInformation &&
    project.state.publicInformation.length > 0
  ) {
    yaml += "  public_information:\n";
    yaml += formatStateFields(project.state.publicInformation, "    ");
  }

  yaml += "\n";

  // Manager
  yaml += "manager:\n";
  yaml += `  type: "${project.manager.type}"\n\n`;

  // Runner
  yaml += "runner:\n";
  let runnerType = "TurnBasedGameRunner";
  if (project.manager.type === "HybridPhaseManager") {
    runnerType = "HybridGameRunner";
  } else if (project.manager.type === "TurnBasedPhaseManager") {
    runnerType = "TurnBasedGameRunner";
  }

  yaml += `  game_id: 0\n`;
  yaml += `  type: "${runnerType}"\n`;
  yaml += `  hostname: "${serverConfig.hostname}"\n`;
  yaml += `  port: ${serverConfig.port}\n`;
  yaml += `  path: "${serverConfig.path}"\n`;

  if (serverConfig.logsDir) {
    yaml += `  logs_dir: "${serverConfig.logsDir}"\n`;
  }
  if (serverConfig.logLevel) {
    yaml += `  log_level: "${serverConfig.logLevel}"\n`;
  }
  if (serverConfig.phaseTransitionEvent) {
    yaml += `  phase_transition_event: "${serverConfig.phaseTransitionEvent}"\n`;
  }
  if (serverConfig.phaseIdentifierKey) {
    yaml += `  phase_identifier_key: "${serverConfig.phaseIdentifierKey}"\n`;
  }
  if (
    serverConfig.observabilityProvider &&
    serverConfig.observabilityProvider !== "none"
  ) {
    yaml += `  observability_provider: "${serverConfig.observabilityProvider}"\n`;
  }

  const safeFilename = project.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const suggestedName = `${safeFilename}_config.yaml`;

  if (typeof window !== "undefined" && window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: suggestedName,
        types: [
          {
            description: "YAML files",
            accept: {
              "text/yaml": [".yaml", ".yml"],
              "application/yaml": [".yaml", ".yml"],
            },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(yaml);
      await writable.close();
      return;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log("User cancelled the save dialog.");
      } else {
        console.error("Error saving file:", err);
        throw new Error("Failed to save file.");
      }
    }
  } else {
    console.warn(
      "File System Access API not supported. Using fallback download method."
    );
    const blob = new Blob([yaml], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = suggestedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }
}

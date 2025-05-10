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

      // Iterate over all other llmParams (excluding modelName)
      Object.entries(role.llmParams)
        .filter(
          ([key]) =>
            key !== "modelName" &&
            role.llmParams[key] !== undefined &&
            role.llmParams[key] !== null
        )
        .forEach(([key, value]) => {
          if (typeof value === 'number') {
            yaml += `      ${key}: ${value}\n`;
          } else {
            yaml += `      ${key}: ${JSON.stringify(value)}\n`;
          }
        });

      if (role.taskPhases && role.taskPhases.length > 0) {
        yaml += `    task_phases: [${role.taskPhases.join(", ")}]\n`;
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

  let agentIdCounter = 1;
  const agentsToExport: { id: number; role_id: number }[] = [];
  if (project.agentRoles && project.agentRoles.length > 0) {
    project.agentRoles.forEach(role => {
      const numAgents = role.numberOfAgents === undefined ? 0 : role.numberOfAgents; // Default to 0 if undefined
      for (let i = 0; i < numAgents; i++) {
        agentsToExport.push({ id: agentIdCounter++, role_id: role.roleId });
      }
    });
  }

  if (agentsToExport.length > 0) {
    yaml += "agents:\n";
    agentsToExport.forEach((agent) => {
      yaml += `  - id: ${agent.id}\n`;
      yaml += `    role_id: ${agent.role_id}\n`;
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

      if (field.events && field.events.length > 0) {
        fieldYaml += `${indent}  events: [${field.events.map((e) => `"${e}"`).join(", ")}]\n`;
      } else if (field.excludedEvents && field.excludedEvents.length > 0) {
        fieldYaml += `${indent}  excluded_events: [${field.excludedEvents.map((e) => `"${e}"`).join(", ")}]\n`;
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
  yaml += `  game_id: 0\n`;

  // Runner Type
  let runnerType = "TurnBasedGameRunner";
  if (project.manager.type === "HybridPhaseManager") {
    runnerType = "HybridGameRunner";
  } else if (project.manager.type === "TurnBasedPhaseManager") {
    runnerType = "TurnBasedGameRunner";
  }
  yaml += `  type: "${runnerType}"\n`;
  if (
    project.manager.continuousPhases &&
    project.manager.continuousPhases.length > 0
  ) {
    yaml += `  continuous_phases: [${project.manager.continuousPhases.join(
      ", "
    )}]\n`;

    if (project.manager.maxActionDelay) {
      yaml += `  max_action_delay: ${project.manager.maxActionDelay}\n`;
    }

    if (project.manager.minActionDelay) {
      yaml += `  min_action_delay: ${project.manager.minActionDelay}\n`;
    }
  }

  // Server Config
  yaml += `  hostname: "${serverConfig.hostname}"\n`;
  yaml += `  port: ${serverConfig.port}\n`;
  yaml += `  path: "${serverConfig.path}"\n`;

  if (project.logsDir) {
    yaml += `  logs_dir: "${project.logsDir}"\n`;
  }
  if (project.logLevel && project.logLevel !== "none") {
    yaml += `  log_level: "${project.logLevel}"\n`;
  }
  if (project.phaseTransitionEvent) {
    yaml += `  phase_transition_event: "${project.phaseTransitionEvent}"\n`;
  }
  if (project.phaseIdentifierKey) {
    yaml += `  phase_identifier_key: "${project.phaseIdentifierKey}"\n`;
  }
  if (
    project.observabilityProvider &&
    project.observabilityProvider !== "none"
  ) {
    yaml += `  observability_provider: "${project.observabilityProvider}"\n`;
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

import type { Project } from "@/types/project";
// Import ServerConfig type
import type { ServerConfig } from "@/types";
import type { StateField } from "@/types/project";
// Import defaultMetaFields
import { defaultMetaFields } from "@/components/config/state-config";

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

      // Add optional llm params if they exist
      if (
        role.llmParams.temperature !== undefined &&
        role.llmParams.temperature !== null
      ) {
        yaml += `      temperature: ${role.llmParams.temperature}\n`;
      }
      if (
        role.llmParams.topP !== undefined &&
        role.llmParams.topP !== null
      ) {
        yaml += `      top_p: ${role.llmParams.topP}\n`;
      }
      // Add any other llm_params dynamically
      Object.entries(role.llmParams)
        .filter(
          ([key]) =>
            !["model_name", "temperature", "top_p"].includes(key) &&
            role.llmParams[key] !== undefined &&
            role.llmParams[key] !== null
        )
        .forEach(([key, value]) => {
          yaml += `      ${key}: ${JSON.stringify(value)}\n`; // Use JSON.stringify for safety
        });

      if (role.prompts && Object.keys(role.prompts).length > 0) {
        yaml += "    prompts:\n";
        // Format prompts as a list of single-key dictionaries
        Object.entries(role.prompts).forEach(([key, value]) => {
          // Use 10 spaces indent for content under a list item's key
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

      if (field.defaultFactory) {
        fieldYaml += `${indent}  default_factory: "${field.defaultFactory}"\n`;
      } else if (
        field.default !== undefined &&
        field.default !== null &&
        field.default !== ""
      ) {
        let defaultValue = field.default;
        try {
          switch (field.type) {
            case "int":
              defaultValue = Number.parseInt(String(field.default), 10);
              if (isNaN(defaultValue)) defaultValue = `"${field.default}"`;
              break;
            case "float":
              defaultValue = Number.parseFloat(String(field.default));
              if (isNaN(defaultValue)) defaultValue = `"${field.default}"`;
              break;
            case "bool":
              defaultValue = String(field.default).toLowerCase() === "true";
              break;
            case "list":
            case "dict":
              try {
                defaultValue = JSON.stringify(
                  JSON.parse(String(field.default))
                );
              } catch {
                defaultValue = `"${field.default}"`;
              }
              break;
            default:
              defaultValue = `"${field.default}"`;
              break;
          }
        } catch (e) {
          console.error("Error parsing default value:", e);
          defaultValue = `"${field.default}"`;
        }
        fieldYaml += `${indent}  default: ${defaultValue}\n`;
      }

      if (field.eventKey) {
        fieldYaml += `${indent}  event_key: "${field.eventKey}"\n`;
      }

      if (field.excludeFromMapping === true) {
        fieldYaml += `${indent}  exclude_from_mapping: true\n`;
      }
    });
    return fieldYaml;
  };

  if (project.state.metaInformation || defaultMetaFields.length > 0) {
    yaml += "  meta_information:\n";
    const customMetaFields = project.state.metaInformation || [];
    const defaultMetaFieldNames = new Set(defaultMetaFields.map((f) => f.name));
    const combinedMetaFields = [
      ...defaultMetaFields,
      ...customMetaFields.filter(
        (field) => !defaultMetaFieldNames.has(field.name)
      ),
    ];
    yaml += formatStateFields(combinedMetaFields, "    ");
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
            accept: { "text/yaml": [".yaml", ".yml"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(yaml);
      await writable.close();
      return;
    } catch (err: any) {
      if (err.name === "AbortError") {
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

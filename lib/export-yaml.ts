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

export function exportToYaml(project: Project, serverConfig: ServerConfig) {
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
      yaml += `  - role_id: ${role.role_id}\n`;
      yaml += `    name: "${role.name}"\n`;
      yaml += `    llm_type: "${role.llm_type}"\n`;
      yaml += "    llm_params:\n";
      yaml += `      model_name: "${role.llm_params.model_name}"\n`;

      // Add optional llm params if they exist
      if (
        role.llm_params.temperature !== undefined &&
        role.llm_params.temperature !== null
      ) {
        yaml += `      temperature: ${role.llm_params.temperature}\n`;
      }
      if (
        role.llm_params.top_p !== undefined &&
        role.llm_params.top_p !== null
      ) {
        yaml += `      top_p: ${role.llm_params.top_p}\n`;
      }
      // Add any other llm_params dynamically
      Object.entries(role.llm_params)
        .filter(
          ([key]) =>
            !["model_name", "temperature", "top_p"].includes(key) &&
            role.llm_params[key] !== undefined &&
            role.llm_params[key] !== null
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
      } else {
        // Ensure prompts key exists even if empty, as per schema? Check econagents requirement.
        // yaml += "    prompts: {}\n" // Or omit if empty is allowed
      }
    });
    yaml += "\n";
  }

  // Agents
  if (project.agents && project.agents.length > 0) {
    yaml += "agents:\n";
    project.agents.forEach((agent) => {
      yaml += `  - id: ${agent.id}\n`;
      yaml += `    role_id: ${agent.role_id}\n`;
    });
    yaml += "\n";
  }

  // State
  yaml += "state:\n";

  // Helper to format state fields
  const formatStateFields = (fields: StateField[], indent: string): string => {
    // Use StateField type
    let fieldYaml = "";
    fields.forEach((field) => {
      fieldYaml += `${indent}- name: "${field.name}"\n`;
      fieldYaml += `${indent}  type: "${field.type}"\n`;

      // Use field.defaultFactory from TS interface
      if (field.defaultFactory) {
        // Output as default_factory in YAML
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
              if (isNaN(defaultValue)) defaultValue = `"${field.default}"`; // Fallback if parsing fails
              break;
            case "float":
              defaultValue = Number.parseFloat(String(field.default));
              if (isNaN(defaultValue)) defaultValue = `"${field.default}"`; // Fallback if parsing fails
              break;
            case "bool":
              defaultValue = String(field.default).toLowerCase() === "true";
              break;
            case "list":
            case "dict":
              // Try parsing JSON, otherwise quote it
              try {
                defaultValue = JSON.stringify(
                  JSON.parse(String(field.default))
                );
              } catch {
                defaultValue = `"${field.default}"`;
              }
              break;
            default: // Keep as string if unsure or 'str'
              defaultValue = `"${field.default}"`;
              break;
          }
        } catch (e) {
          defaultValue = `"${field.default}"`; // Fallback to string
        }
        fieldYaml += `${indent}  default: ${defaultValue}\n`;
      }

      // Use field.eventKey from TS interface
      if (field.eventKey) {
        // Output as event_key in YAML
        fieldYaml += `${indent}  event_key: "${field.eventKey}"\n`;
      }

      // Use field.excludeFromMapping from TS interface
      if (field.excludeFromMapping === true) {
        // Explicitly check for true
        // Output as exclude_from_mapping in YAML
        fieldYaml += `${indent}  exclude_from_mapping: true\n`;
      }
    });
    return fieldYaml;
  };

  if (project.state.metaInformation || defaultMetaFields.length > 0) {
    // Check if either default or custom meta fields exist
    yaml += "  meta_information:\n"; // Changed key name
    // Combine default fields with custom ones, ensuring defaults are present and custom ones don't override defaults by name
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
    yaml += "  private_information:\n"; // Changed key name
    yaml += formatStateFields(project.state.privateInformation, "    ");
  }

  if (
    project.state.publicInformation &&
    project.state.publicInformation.length > 0
  ) {
    yaml += "  public_information:\n"; // Changed key name
    yaml += formatStateFields(project.state.publicInformation, "    ");
  }

  yaml += "\n";

  // Manager
  yaml += "manager:\n";
  yaml += `  type: "${project.manager.type}"\n\n`; // Added newline for spacing

  // Runner - Use details from the passed serverConfig
  yaml += "runner:\n";
  // Infer runner type based on manager type
  let runnerType = "TurnBasedGameRunner"; // Default
  if (project.manager.type === "HybridPhaseManager") {
    runnerType = "HybridGameRunner"; // Assuming this is the correct name
  } else if (project.manager.type === "TurnBasedPhaseManager") {
    runnerType = "TurnBasedGameRunner";
  }

  yaml += `  type: "${runnerType}"\n`; // Use inferred type
  yaml += `  hostname: "${serverConfig.hostname}"\n`;
  yaml += `  port: ${serverConfig.port}\n`;
  yaml += `  path: "${serverConfig.path}"\n`;

  // Add game_id from the project object if it exists
  if (project.gameId !== undefined && project.gameId !== null) {
    yaml += `  game_id: ${project.gameId}\n`;
  }

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
  // Only include observability_provider if it's not 'none' or empty
  if (
    serverConfig.observabilityProvider &&
    serverConfig.observabilityProvider !== "none"
  ) {
    yaml += `  observability_provider: "${serverConfig.observabilityProvider}"\n`;
  }

  // Create a safe filename from the project name
  const safeFilename = project.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();

  // Download the YAML file
  const blob = new Blob([yaml], { type: "text/yaml;charset=utf-8" }); // Specify charset
  const url = URL.createObjectURL(blob);

  // Create a temporary link element and trigger the download
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeFilename}_config.yaml`;
  document.body.appendChild(a);
  a.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

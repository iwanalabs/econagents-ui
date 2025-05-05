import type { Project, AgentRole, StateField, State, Manager, Agent, PromptPartial, ServerConfig } from "@/types";
import yaml from "js-yaml";

// Helper to convert YAML prompt list (array of single-key objects) to TS prompt record
function parsePrompts(yamlPrompts: any[] | undefined): Record<string, string> {
  const prompts: Record<string, string> = {};
  if (Array.isArray(yamlPrompts)) {
    yamlPrompts.forEach((promptEntry) => {
      if (typeof promptEntry === "object" && promptEntry !== null) {
        const keys = Object.keys(promptEntry);
        if (keys.length === 1) {
          const key = keys[0];
          const value = promptEntry[key];
          if (typeof value === "string") {
            prompts[key] = value;
          }
        }
      }
    });
  }
  return prompts;
}

// Helper to map YAML state field keys to TS keys
function mapStateField(yamlField: any): StateField {
  return {
    name: yamlField.name,
    type: yamlField.type,
    default: yamlField.default, // Keep as is, export handles type conversion
    defaultFactory: yamlField.default_factory, // Map from snake_case
    eventKey: yamlField.event_key, // Map from snake_case
    excludeFromMapping: yamlField.exclude_from_mapping, // Map from snake_case
    optional: yamlField.optional ?? false, // Add optional, default to false if missing
  };
}

// Main import function
export function importFromYaml(
  yamlString: string,
  selectedServerConfigId: string
): Omit<Project, "id" | "createdAt"> {
  const doc: any = yaml.load(yamlString);

  if (!doc || typeof doc !== "object") {
    throw new Error("Invalid YAML content: Root level must be an object.");
  }

  if (!doc.name || typeof doc.name !== "string") {
    throw new Error("Invalid YAML content: Project 'name' is required and must be a string.");
  }

  // Map Agent Roles
  const agentRoles: AgentRole[] = (doc.agent_roles || []).map((role: any) => ({
    role_id: role.role_id,
    name: role.name,
    llm_type: role.llm_type,
    llm_params: {
      model_name: role.llm_params?.model_name || "unknown", // Ensure model_name exists
      temperature: role.llm_params?.temperature,
      top_p: role.llm_params?.top_p,
      // Include other potential params dynamically? Or assume known ones?
      // For now, only include known ones explicitly.
      ...(role.llm_params || {}), // Spread remaining params
    },
    prompts: parsePrompts(role.prompts), // Use helper to parse prompts
  }));

  // Map Agents
  const agents: Agent[] = (doc.agents || []).map((agent: any) => ({
    id: agent.id,
    role_id: agent.role_id,
  }));

  // Map State
  const state: State = {
    metaInformation: (doc.state?.meta_information || []).map(mapStateField),
    privateInformation: (doc.state?.private_information || []).map(mapStateField),
    publicInformation: (doc.state?.public_information || []).map(mapStateField),
  };

  // Map Manager
  const manager: Manager = doc.manager || { type: "TurnBasedPhaseManager" }; // Default manager if missing

  // Map Prompt Partials
  const promptPartials: PromptPartial[] = (doc.prompt_partials || []).map(
    (partial: any, index: number) => ({
      // Generate a temporary ID during import, real components might need stable ones
      // Or rely on the fact that the parent component will assign UUIDs when saving
      id: `imported_partial_${index}_${Date.now()}`, // Temporary ID
      name: partial.name,
      content: partial.content || "", // Ensure content is string
    })
  );

  const importedProjectData: Omit<Project, "id" | "createdAt"> = {
    name: doc.name,
    description: doc.description || undefined,
    gameId: doc.game_id !== undefined ? Number(doc.game_id) : null,
    agentRoles,
    agents,
    state,
    manager,
    promptPartials,
    serverConfigId: selectedServerConfigId, // Assign the selected server config ID
  };

  // Basic Validation (can be expanded)
  if (!importedProjectData.agentRoles || importedProjectData.agentRoles.length === 0) {
     console.warn("YAML Warning: No 'agent_roles' found or empty.");
     // Decide if this should be an error or just a warning
  }
   if (!importedProjectData.agents || importedProjectData.agents.length === 0) {
     console.warn("YAML Warning: No 'agents' found or empty.");
     // Decide if this should be an error or just a warning
  }


  return importedProjectData;
}
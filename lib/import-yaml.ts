import type {
  Project,
  AgentRole,
  StateField,
  State,
  Manager,
  Agent,
  PromptPartial,
  ProjectYaml,
} from "@/types";
import yaml from "js-yaml";

function parsePrompts(
  yamlPrompts: Record<string, string>[] | undefined
): Record<string, string> {
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

function mapStateField(yamlField: Record<string, any>): StateField {
  return {
    name: yamlField.name,
    type: yamlField.type,
    default: yamlField.default,
    defaultFactory: yamlField.default_factory,
    eventKey: yamlField.event_key,
    excludeFromMapping: yamlField.exclude_from_mapping,
    optional: yamlField.optional ?? false,
  };
}

// Main import function
export function importFromYaml(
  yamlString: string,
  selectedServerConfigId: string
): Omit<Project, "id" | "createdAt"> {
  const doc = yaml.load(yamlString) as ProjectYaml;

  if (!doc || typeof doc !== "object") {
    throw new Error("Invalid YAML content: Root level must be an object.");
  }

  if (!doc.name || typeof doc.name !== "string") {
    throw new Error(
      "Invalid YAML content: Project 'name' is required and must be a string."
    );
  }

  // Map Agent Roles
  const agentRoles: AgentRole[] = (doc.agent_roles || []).map((role: any) => {
    const { model_name, temperature, top_p, ...otherParams } =
      role.llm_params || {};

    return {
      roleId: role.role_id,
      name: role.name,
      llmType: role.llm_type,
      llmParams: {
        modelName: model_name || "unknown",
        temperature: temperature,
        topP: top_p,
        ...otherParams,
      },
      prompts: parsePrompts(role.prompts),
    };
  });

  // Map Agents
  const agents: Agent[] = (doc.agents || []).map((agent: any) => ({
    id: agent.id,
    roleId: agent.role_id,
  }));

  // Map State
  const state: State = {
    metaInformation: (doc.state?.meta_information || []).map(mapStateField),
    privateInformation: (doc.state?.private_information || []).map(
      mapStateField
    ),
    publicInformation: (doc.state?.public_information || []).map(mapStateField),
  };


  // Map Manager
  const manager: Manager = doc.manager || { type: "TurnBasedPhaseManager" }; // Default manager if missing

  // Map Prompt Partials
  const promptPartials: PromptPartial[] = (doc.prompt_partials || []).map(
    (partial: any, index: number) => ({
      id: `imported_partial_${index}_${Date.now()}`,
      name: partial.name,
      content: partial.content || "",
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
    serverConfigId: selectedServerConfigId,
  };

  if (
    !importedProjectData.agentRoles ||
    importedProjectData.agentRoles.length === 0
  ) {
    console.warn("YAML Warning: No 'agentRoles' found or empty.");
  }
  if (!importedProjectData.agents || importedProjectData.agents.length === 0) {
    console.warn("YAML Warning: No 'agents' found or empty.");
  }

  return importedProjectData;
}

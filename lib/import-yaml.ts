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
    events: Array.isArray(yamlField.events)
      ? yamlField.events.filter((e: any) => typeof e === "string")
      : undefined,
    excludedEvents: Array.isArray(yamlField.excluded_events)
      ? yamlField.excluded_events.filter((e: any) => typeof e === "string")
      : undefined,
  };
}

// Main import function
export function importFromYaml(
  yamlString: string
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
    const { model_name, ...otherParams } = role.llm_params || {};

    return {
      roleId: role.role_id,
      name: role.name,
      llmType: role.llm_type,
      llmParams: {
        modelName: model_name || "unknown",
        ...otherParams, // temperature, topP, and any other params will be included here
      },
      prompts: parsePrompts(role.prompts),
      taskPhases: Array.isArray(role.task_phases)
        ? role.task_phases.filter((tp: any) => typeof tp === "number")
        : [],
      numberOfAgents: 0, // Initialize with 0, will be updated below
    };
  });

  // Map Agents from YAML (temporary)
  const yamlAgents: Agent[] = (doc.agents || []).map((agent: any) => ({
    id: agent.id,
    roleId: agent.role_id,
  }));

  // Populate numberOfAgents in agentRoles based on yamlAgents
  agentRoles.forEach(role => {
    const count = yamlAgents.filter(agent => agent.roleId === role.roleId).length;
    role.numberOfAgents = count > 0 ? count : (doc.agents === undefined ? 1 : 0); // Default to 1 if no agents section, else 0
  });

  // Map State
  const state: State = {
    metaInformation: (doc.state?.meta_information || []).map(mapStateField),
    privateInformation: (doc.state?.private_information || []).map(
      mapStateField
    ),
    publicInformation: (doc.state?.public_information || []).map(mapStateField),
  };

  // Map Manager
  const managerDataFromYaml = doc.manager || {};
  const manager: Manager = {
    type: managerDataFromYaml.type || "TurnBasedPhaseManager",
  };

  if (manager.type === "HybridPhaseManager" && doc.runner) {
    const runnerDataFromYaml = doc.runner;
    if (
      runnerDataFromYaml.continuous_phases &&
      Array.isArray(runnerDataFromYaml.continuous_phases)
    ) {
      manager.continuousPhases = runnerDataFromYaml.continuous_phases.filter(
        (cp: any) => typeof cp === "number"
      );
    }
    if (typeof runnerDataFromYaml.min_action_delay === "number") {
      manager.minActionDelay = runnerDataFromYaml.min_action_delay;
    }
    if (typeof runnerDataFromYaml.max_action_delay === "number") {
      manager.maxActionDelay = runnerDataFromYaml.max_action_delay;
    }
  }

  // Map Prompt Partials
  const promptPartials: PromptPartial[] = (doc.prompt_partials || []).map(
    (partial: any, index: number) => ({
      id: `imported_partial_${index}_${Date.now()}`,
      name: partial.name,
      content: partial.content || "",
    })
  );

  const importedProjectData: Omit<
    Project,
    "id" | "createdAt" | "serverConfigId"
  > = {
    name: doc.name,
    description: doc.description || undefined,
    gameId: doc.game_id !== undefined ? Number(doc.game_id) : null,
    agentRoles,
    agents: [], // Initialize as empty; agents are now derived from numberOfAgents in roles
    state,
    manager,
    promptPartials,
  };

  // Populate new project-level fields from runner section
  if (doc.runner) {
    importedProjectData.logsDir = doc.runner.logs_dir ?? null;
    importedProjectData.logLevel = doc.runner.log_level ?? null;
    importedProjectData.phaseTransitionEvent =
      doc.runner.phase_transition_event ?? null;
    importedProjectData.phaseIdentifierKey =
      doc.runner.phase_identifier_key ?? null;
    importedProjectData.observabilityProvider =
      doc.runner.observability_provider || "none";
  }

  if (
    !importedProjectData.agentRoles ||
    importedProjectData.agentRoles.length === 0
  ) {
    console.warn("YAML Warning: No 'agentRoles' found or empty.");
  }

  return importedProjectData;
}
export interface ProjectYaml {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  agent_roles: AgentRoleYaml[];
  agents: AgentYaml[];
  state: StateYaml;
  manager: ManagerYaml;
  runner?: RunnerYaml;
  server_config_id?: string | null;
  prompt_partials?: PromptPartialYaml[];
  game_id?: number | null;
}

export interface AgentRoleYaml {
  role_id: number;
  name: string;
  llm_type: string;
  llm_params: {
    model_name: string;
    [key: string]: any;
  };
  prompts: Record<string, string>;
  task_phases?: number[];
}

export interface AgentYaml {
  id: number;
  role_id: number;
}

export interface StateFieldYaml {
  name: string;
  type: string;
  default?: any;
  default_factory?: string;
  event_key?: string;
  exclude_from_mapping?: boolean;
  optional?: boolean;
  events?: string[];
  excluded_events?: string[];
}

export interface StateYaml {
  meta_information: StateFieldYaml[];
  private_information: StateFieldYaml[];
  public_information: StateFieldYaml[];
}

export interface ManagerYaml {
  type: string;
  [key: string]: any;
}

export interface RunnerYaml {
  type?: string;
  game_id?: number;
  continuous_phases?: number[];
  min_action_delay?: number;
  max_action_delay?: number;
  hostname?: string;
  port?: number;
  path?: string;
  logs_dir?: string | null;
  log_level?: string | null;
  phase_transition_event?: string | null;
  phase_identifier_key?: string | null;
  observability_provider?: string;
  [key: string]: any;
}

export interface ServerConfigYaml {
  id: string;
  name: string;
  hostname: string;
  port: number;
  path: string;
  logs_dir?: string | null;
  log_level?: string | null;
  phase_transition_event?: string | null;
  phase_identifier_key?: string | null;
  [key: string]: any;
}

export interface PromptPartialYaml {
  id: string;
  name: string;
  content: string;
}
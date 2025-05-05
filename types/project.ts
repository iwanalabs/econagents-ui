export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  agentRoles: AgentRole[];
  agents: Agent[];
  state: State;
  manager: Manager;
  serverConfigId?: string | null;
  promptPartials?: PromptPartial[];
  gameId?: number | null;
}

export interface AgentRole {
  role_id: number;
  name: string;
  llm_type: string;
  llm_params: {
    model_name: string;
    temperature?: number;
    top_p?: number;
    [key: string]: any;
  };
  prompts: Record<string, string>;
}

export interface Agent {
  id: number;
  role_id: number;
}

export interface StateField {
  name: string;
  type: string;
  default?: any;
  defaultFactory?: string;
  eventKey?: string;
  excludeFromMapping?: boolean;
  optional?: boolean;
}

export interface State {
  metaInformation: StateField[];
  privateInformation: StateField[];
  publicInformation: StateField[];
}

export interface Manager {
  type: string;
  [key: string]: any;
}

export interface ServerConfig {
  id: string;
  name: string;
  hostname: string;
  port: number;
  path: string;
  logsDir?: string | null;
  logLevel?: string | null;
  phaseTransitionEvent?: string | null;
  phaseIdentifierKey?: string | null;
  [key: string]: any;
}

export interface PromptPartial {
  id: string;
  name: string;
  content: string;
}
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

// Define a union type for allowed state field types
export type StateFieldType =
  | "str"
  | "int"
  | "float"
  | "bool"
  | "list"
  | "dict"
  | "MarketState";

export interface AgentRole {
  roleId: number;
  name: string;
  llmType: string;
  llmParams: {
    modelName: string;
    temperature?: number;
    topP?: number;
    [key: string]: any;
  };
  prompts: Record<string, string>;
}

export interface Agent {
  id: number;
  roleId: number;
}

export interface StateField {
  name: string;
  type: StateFieldType; // Use the union type
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

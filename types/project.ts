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
  logsDir?: string | null;
  logLevel?: string | null;
  phaseTransitionEvent?: string | null;
  phaseIdentifierKey?: string | null;
  observabilityProvider?: string;
}

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
    [key: string]: any;
  };
  prompts: Record<string, string>;
  taskPhases?: number[];
  numberOfAgents: number;
}

export interface Agent {
  id: number;
  roleId: number;
}

export interface StateField {
  name: string;
  type: StateFieldType;
  default?: any;
  defaultFactory?: string;
  eventKey?: string;
  excludeFromMapping?: boolean;
  optional?: boolean;
  events?: string[];
  excludedEvents?: string[];
}

export interface State {
  metaInformation: StateField[];
  privateInformation: StateField[];
  publicInformation: StateField[];
}

export interface Manager {
  type: string;
  continuousPhases?: number[];
  continuousPhasesString?: string;
  minActionDelay?: number;
  maxActionDelay?: number;
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
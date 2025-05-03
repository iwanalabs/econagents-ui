export interface Project {
  id: string
  name: string
  description?: string
  createdAt: string
  agentRoles: AgentRole[]
  agents: Agent[]
  state: State
  manager: Manager
  runner: Runner
  promptPartials?: PromptPartial[]
}

export interface AgentRole {
  role_id: number
  name: string
  llm_type: string
  llm_params: {
    model_name: string
    temperature?: number
    top_p?: number
    [key: string]: any
  }
  prompts: {
    [key: string]: string
  }
}

export interface Agent {
  id: number
  role_id: number
}

export interface StateField {
  name: string
  type: string
  default?: any
  default_factory?: string
  event_key?: string
  exclude_from_mapping?: boolean
}

export interface State {
  metaFields: StateField[]
  privateFields: StateField[]
  publicFields: StateField[]
}

export interface Manager {
  type: string
  [key: string]: any
}

export interface Runner {
  type: string
  hostname: string
  port: number
  path: string
  game_id?: number
  logs_dir?: string
  log_level?: string
  phase_transition_event?: string
  phase_identifier_key?: string
  observability_provider?: string
  prompts_dir?: string
  [key: string]: any
}

export interface PromptPartial {
  id: string
  name: string
  content: string
}

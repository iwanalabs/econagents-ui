import { useState, useEffect, useCallback } from "react"
import type { ServerConfig } from "@/types"

const STORAGE_KEY = "serverConfigs"

export function useServerConfigs(): [
  ServerConfig[],
  (serverConfigs: ServerConfig[]) => void,
  (newConfig: ServerConfig) => void,
  (updatedConfig: ServerConfig) => void,
  (id: string) => void,
] {
  const [serverConfigs, setServerConfigsState] = useState<ServerConfig[]>([])

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(STORAGE_KEY)
      if (item) {
        setServerConfigsState(JSON.parse(item))
      } else {
        // Initialize with a default if none exist
        const defaultConfig: ServerConfig = {
          id: crypto.randomUUID(),
          name: "Default Local Server",
          // type: "TurnBasedGameRunner", // Remove type
          hostname: "localhost",
          port: 8765,
          path: "wss",
          observabilityProvider: "none",
        }
        setServerConfigsState([defaultConfig])
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultConfig]))
      }
    } catch (error) {
      console.error("Error reading server configs from localStorage", error)
      setServerConfigsState([])
    }
  }, [])

  const setServerConfigs = useCallback((value: ServerConfig[]) => {
    try {
      setServerConfigsState(value)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch (error) {
      console.error("Error saving server configs to localStorage", error)
    }
  }, [])

  const addServerConfig = useCallback(
    (newConfig: ServerConfig) => {
      setServerConfigs([...serverConfigs, newConfig])
    },
    [serverConfigs, setServerConfigs]
  )

  const updateServerConfig = useCallback(
    (updatedConfig: ServerConfig) => {
      setServerConfigs(
        serverConfigs.map((config) => (config.id === updatedConfig.id ? updatedConfig : config))
      )
    },
    [serverConfigs, setServerConfigs]
  )

  const deleteServerConfig = useCallback(
    (id: string) => {
      setServerConfigs(serverConfigs.filter((config) => config.id !== id))
    },
    [serverConfigs, setServerConfigs]
  )

  return [serverConfigs, setServerConfigs, addServerConfig, updateServerConfig, deleteServerConfig]
}

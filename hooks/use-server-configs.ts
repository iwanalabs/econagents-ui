import { useState, useEffect, useCallback } from "react";
import type { ServerConfig } from "@/types";

const STORAGE_KEY = "serverConfigs";

export function useServerConfigs(): [
  ServerConfig[],
  (serverConfigs: ServerConfig[]) => void,
  (newConfig: ServerConfig) => void,
  (updatedConfig: ServerConfig) => void,
  (id: string) => void,
] {
  const [serverConfigs, setServerConfigsState] = useState<ServerConfig[]>([]);

  // Effect to load initial state from localStorage
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      if (item) {
        setServerConfigsState(JSON.parse(item));
      }
    } catch (error) {
      console.error("Error reading server configs from localStorage", error);
      setServerConfigsState([]);
    }
  }, []);

  // Effect to listen for storage changes from other tabs/windows or scripts
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          console.log("Detected storage change for server configs, updating state...");
          setServerConfigsState(JSON.parse(event.newValue));
        } catch (error) {
          console.error(
            "Error parsing server configs from storage event",
            error
          );
        }
      } else if (event.key === STORAGE_KEY && !event.newValue) {
        // Handle case where the item is removed entirely
        setServerConfigsState([]);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const setServerConfigs = useCallback((value: ServerConfig[]) => {
    try {
      const stringValue = JSON.stringify(value);
      setServerConfigsState(value); // Update local state first
      window.localStorage.setItem(STORAGE_KEY, stringValue); // Update localStorage

      // Manually dispatch a storage event for the current window to react
      // This is necessary because the 'storage' event typically only fires in *other* windows
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEY,
          oldValue: JSON.stringify(serverConfigs), // Pass the *previous* state as oldValue
          newValue: stringValue,
          storageArea: window.localStorage,
        })
      );

    } catch (error) {
      console.error("Error saving server configs to localStorage", error);
    }
  }, [serverConfigs]);

  const addServerConfig = useCallback(
    (newConfig: ServerConfig) => {
      // Read current value directly from state to avoid stale closure issues
      setServerConfigs([...serverConfigs, newConfig]);
    },
    [serverConfigs, setServerConfigs]
  );

  const updateServerConfig = useCallback(
    (updatedConfig: ServerConfig) => {
      // Read current value directly from state
      setServerConfigs(
        serverConfigs.map((config) =>
          config.id === updatedConfig.id ? updatedConfig : config
        )
      );
    },
    [serverConfigs, setServerConfigs]
  );

  const deleteServerConfig = useCallback(
    (id: string) => {
      // Read current value directly from state
      setServerConfigs(serverConfigs.filter((config) => config.id !== id));
    },
    [serverConfigs, setServerConfigs]
  );

  return [
    serverConfigs,
    setServerConfigs,
    addServerConfig,
    updateServerConfig,
    deleteServerConfig,
  ];
}

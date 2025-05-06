import type { ServerConfig } from "@/types";
import yaml from "js-yaml";

function isValidServerConfig(obj: any): obj is Partial<ServerConfig> {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  // Required fields
  if (typeof obj.name !== "string" || !obj.name.trim()) return false;
  if (typeof obj.hostname !== "string" || !obj.hostname.trim()) return false;
  if (typeof obj.port !== "number" || obj.port <= 0) return false;
  if (typeof obj.path !== "string") return false; // Path can be empty

  // Optional fields type checks (if present)
  if (obj.id !== undefined && typeof obj.id !== "string") return false;
  if (
    obj.logsDir !== undefined &&
    obj.logsDir !== null &&
    typeof obj.logsDir !== "string"
  )
    return false;
  if (
    obj.logLevel !== undefined &&
    obj.logLevel !== null &&
    typeof obj.logLevel !== "string"
  )
    return false;
  if (
    obj.phaseTransitionEvent !== undefined &&
    obj.phaseTransitionEvent !== null &&
    typeof obj.phaseTransitionEvent !== "string"
  )
    return false;
  if (
    obj.phaseIdentifierKey !== undefined &&
    obj.phaseIdentifierKey !== null &&
    typeof obj.phaseIdentifierKey !== "string"
  )
    return false;
  if (
    obj.observabilityProvider !== undefined &&
    obj.observabilityProvider !== null &&
    typeof obj.observabilityProvider !== "string"
  )
    return false;

  return true;
}

export function importServerConfigsFromYaml(
  yamlString: string
): ServerConfig[] {
  const parsedData = yaml.load(yamlString);

  if (!Array.isArray(parsedData)) {
    throw new Error(
      "Invalid YAML format: Expected an array of server configurations."
    );
  }

  const serverConfigs: ServerConfig[] = [];
  parsedData.forEach((item: any, index: number) => {
    if (!isValidServerConfig(item)) {
      console.warn(`Invalid server configuration at index ${index}:`, item);
      throw new Error(
        `Invalid server configuration data at index ${index}. Required fields: name, hostname, port, path. Check types.`
      );
    }

    console.log(`Inserting server config: ${item.name}`);

    const config: ServerConfig = {
      id:
        typeof item.id === "string" && item.id.trim()
          ? item.id
          : crypto.randomUUID(),
      name: item.name || "",
      hostname: item.hostname || "",
      port: item.port || 0,
      path: item.path || "",
      logsDir: item.logsDir !== undefined ? item.logsDir : null,
      logLevel: item.logLevel !== undefined ? item.logLevel : null,
      phaseTransitionEvent:
        item.phaseTransitionEvent !== undefined
          ? item.phaseTransitionEvent
          : null,
      phaseIdentifierKey:
        item.phaseIdentifierKey !== undefined ? item.phaseIdentifierKey : null,
      observabilityProvider:
        item.observabilityProvider !== undefined
          ? item.observabilityProvider
          : "none",
      ...Object.fromEntries(
        Object.entries(item).filter(
          ([key]) =>
            ![
              "id",
              "name",
              "hostname",
              "port",
              "path",
              "logsDir",
              "logLevel",
              "phaseTransitionEvent",
              "phaseIdentifierKey",
              "observabilityProvider",
            ].includes(key)
        )
      ),
    };
    serverConfigs.push(config);
  });

  return serverConfigs;
}

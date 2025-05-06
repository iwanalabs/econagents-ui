import type { ServerConfig } from "@/types";
import yaml from "js-yaml";

export async function exportServerConfigsToYaml(
  serverConfigs: ServerConfig[],
): Promise<{ success: boolean; message?: string }> {
  if (!serverConfigs || serverConfigs.length === 0) {
    return { success: false, message: "No server configurations to export." };
  }

  try {
    // Create a deep copy to avoid modifying the original objects, especially for removing transient properties if any
    const configsToExport = JSON.parse(JSON.stringify(serverConfigs));

    const yamlString = yaml.dump(configsToExport, {
      indent: 2,
      skipInvalid: true, // Skip properties that cannot be represented in YAML
    });

    const suggestedName = "server_configurations.yaml";

    if (typeof window !== "undefined" && window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: suggestedName,
          types: [
            {
              description: "YAML files",
              accept: {
                "text/yaml": [".yaml", ".yml"],
                "application/yaml": [".yaml", ".yml"],
              },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(yamlString);
        await writable.close();
        return { success: true, message: "Exported successfully." };
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          console.log("User cancelled the save dialog.");
          return { success: false, message: "Export cancelled by user." };
        }
        console.error("Error saving file via File System Access API:", err);
        // Fallback or specific error message could be handled here if needed
        throw new Error("Failed to save file using File System Access API.");
      }
    } else {
      // Fallback for browsers that don't support showSaveFilePicker
      console.warn(
        "File System Access API not supported. Using fallback download method.",
      );
      const blob = new Blob([yamlString], {
        type: "text/yaml;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = suggestedName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true, message: "Exported successfully using fallback." };
    }
  } catch (error: unknown) {
    console.error("Error exporting server configurations to YAML:", error);
    const message =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: `Export failed: ${message}` };
  }
}
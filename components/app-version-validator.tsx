"use client";

import React, { useState, useEffect } from "react";
import { VersionMismatchWarning } from "@/components/version-mismatch-warning";
import {
  CURRENT_APP_VERSION,
  LOCAL_STORAGE_APP_VERSION_KEY,
} from "@/lib/constants";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { toast } from "@/hooks/use-toast";

export default function AppVersionValidator() {
  const [storedVersion, setStoredVersion] = useLocalStorage<string | null>(
    LOCAL_STORAGE_APP_VERSION_KEY,
    null
  );
  const [isWarningVisible, setIsWarningVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const LsVersion = localStorage.getItem(LOCAL_STORAGE_APP_VERSION_KEY);
      const currentStoredVersion = LsVersion ? JSON.parse(LsVersion) : null;

      if (currentStoredVersion === null) {
        let otherDataExists = false;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key !== LOCAL_STORAGE_APP_VERSION_KEY) {
            otherDataExists = true;
            break;
          }
        }

        if (otherDataExists) {
          setIsWarningVisible(true);
        } else {
          setStoredVersion(CURRENT_APP_VERSION);
          setIsWarningVisible(false);
        }
      } else if (currentStoredVersion !== CURRENT_APP_VERSION) {
        setIsWarningVisible(true);
      } else {
        setIsWarningVisible(false);
      }
    }
  }, [setStoredVersion]);

  const handleConfirmClear = () => {
    try {
      localStorage.clear();
      toast({
        title: "Local Storage Cleared",
        description: "Application data has been reset. Reloading...",
      });
      localStorage.setItem(
        LOCAL_STORAGE_APP_VERSION_KEY,
        JSON.stringify(CURRENT_APP_VERSION)
      );
      setIsWarningVisible(false);
      window.location.reload();
    } catch (error) {
      console.error("Failed to clear local storage:", error);
      toast({
        title: "Error",
        description: "Failed to clear local storage.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (storedVersion !== null && storedVersion !== CURRENT_APP_VERSION) {
      setIsWarningVisible(true);
    } else if (storedVersion === CURRENT_APP_VERSION) {
      setIsWarningVisible(false);
    }
  }, [storedVersion]);

  return (
    <VersionMismatchWarning
      isVisible={isWarningVisible}
      storedVersion={storedVersion}
      onConfirmClear={handleConfirmClear}
    />
  );
}

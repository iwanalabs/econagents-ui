"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CURRENT_APP_VERSION } from "@/lib/constants";

interface VersionMismatchWarningProps {
  isVisible: boolean;
  storedVersion: string | null;
  onConfirmClear: () => void;
}

export function VersionMismatchWarning({
  isVisible,
  storedVersion,
  onConfirmClear,
}: VersionMismatchWarningProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 p-4 z-50 w-full md:w-auto md:max-w-md">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>App Version Mismatch!</AlertTitle>
        <AlertDescription>
          <p>
            The application has been updated (current: {CURRENT_APP_VERSION},
            stored: {storedVersion || "unknown"}).
          </p>
          <p className="mt-1">
            To ensure compatibility and prevent potential issues, we recommend
            clearing your local storage.
          </p>
          <p className="mt-1 font-semibold">
            Please back up any server configurations and project data before
            proceeding.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full bg-destructive-foreground hover:bg-destructive-foreground/90 text-destructive"
              >
                Clear Local Storage
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Clear Local Storage</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove ALL locally stored data, including projects
                  and server configurations. Make sure you have backed them up
                  if needed. This action cannot be undone.
                  <br />
                  <br />
                  Are you sure you want to continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onConfirmClear}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Yes, Clear Local Storage
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </AlertDescription>
      </Alert>
    </div>
  );
}

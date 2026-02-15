/**
 * TravelPlanner Web - Dialog Component
 *
 * Modal/dialog component (for forms, confirmations).
 * Replaces SwiftUI sheets.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Content */}
      <div className="relative z-50 w-full sm:max-w-lg max-h-[90vh] overflow-auto bg-white dark:bg-slate-900 rounded-t-xl sm:rounded-xl shadow-lg">
        {children}
      </div>
    </div>
  );
};

const DialogHeader: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white dark:bg-gray-900",
        className
      )}
    >
      {children}
    </div>
  );
};

const DialogTitle: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => {
  return (
    <h2
      className={cn("text-lg font-semibold text-gray-900 dark:text-gray-100", className)}
    >
      {children}
    </h2>
  );
};

const DialogDescription: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => {
  return (
    <p className={cn("text-sm text-gray-600 dark:text-gray-400", className)}>
      {children}
    </p>
  );
};

const DialogContent: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => {
  return <div className={cn("", className)}>{children}</div>;
};

const DialogClose: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="p-2 -mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    >
      <X className="w-5 h-5" />
    </button>
  );
};

const DialogFooter: React.FC<{
  className?: string;
  children: React.ReactNode;
}> = ({ className, children }) => {
  return (
    <div
      className={cn(
        "sticky bottom-0 flex items-center justify-end gap-2 p-4 border-t bg-white dark:bg-gray-900",
        className
      )}
    >
      {children}
    </div>
  );
};

export {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogClose,
  DialogFooter,
};

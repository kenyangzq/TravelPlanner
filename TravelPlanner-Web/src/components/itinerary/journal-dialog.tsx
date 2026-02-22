/**
 * TravelPlanner Web - Journal Dialog Component
 *
 * Modal dialog for viewing and editing daily journal entries.
 */

"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogClose,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";

interface JournalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  dayNumber?: number;
  initialContent: string;
  onSave: (content: string) => void;
}

export const JournalDialog: React.FC<JournalDialogProps> = ({
  isOpen,
  onClose,
  date,
  dayNumber,
  initialContent,
  onSave,
}) => {
  const [content, setContent] = React.useState(initialContent);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Reset content when dialog opens with new initial content
  React.useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
    }
  }, [isOpen, initialContent]);

  // Focus textarea when dialog opens
  React.useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
      // Place cursor at end
      textareaRef.current.selectionStart = textareaRef.current.value.length;
      textareaRef.current.selectionEnd = textareaRef.current.value.length;
    }
  }, [isOpen]);

  const handleSave = () => {
    onSave(content);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogHeader>
        <DialogTitle>
          Day {dayNumber || format(date, "d")} - {format(date, "EEEE, MMMM d")}
        </DialogTitle>
        <DialogClose onClick={onClose} />
      </DialogHeader>

      <DialogContent className="p-4">
        <label
          htmlFor="journal-content"
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
        >
          Journal Entry
        </label>
        <textarea
          ref={textareaRef}
          id="journal-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write about your day... memories, experiences, thoughts, or anything you'd like to remember..."
          className="w-full min-h-[200px] max-h-[50vh] p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 text-right">
          {wordCount} {wordCount === 1 ? "word" : "words"}
        </p>
      </DialogContent>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Entry
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

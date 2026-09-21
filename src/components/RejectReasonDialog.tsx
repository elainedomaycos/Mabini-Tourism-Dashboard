import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, XCircle } from "lucide-react";

interface RejectReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  count?: number;
  itemLabel: string;
  onConfirm: (reason: string) => void;
}

export function RejectReasonDialog({
  open,
  onOpenChange,
  title,
  count,
  itemLabel,
  onConfirm,
}: RejectReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>("");

  const confirm = () => {
    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      setError("Please provide a rejection note (at least 5 characters).");
      return;
    }
    onConfirm(trimmed);
    setReason("");
    setError("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setError("");
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="size-5 text-destructive" /> {title}
          </DialogTitle>
          <DialogDescription className="pt-1">
            {count && count > 1
              ? `Rejecting ${count} ${itemLabel}s`
              : `Rejecting ${itemLabel}`}{" "}
            — a note is required for the audit trail.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <span>
              This note will be recorded and included in the audit log for
              transparency.
            </span>
          </div>
          <div className="space-y-1.5">
            <Label>
              Rejection note <span className="text-destructive">*</span>
            </Label>
            <Textarea
              autoFocus
              rows={3}
              placeholder="e.g. Missing bank reference match — amount differs from statement."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              className={
                error
                  ? "border-destructive focus-visible:ring-destructive/30"
                  : ""
              }
            />
            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {error}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-destructive text-destructive-foreground hover:opacity-90"
            onClick={confirm}
          >
            <XCircle className="size-4 mr-1.5" /> Confirm Rejection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

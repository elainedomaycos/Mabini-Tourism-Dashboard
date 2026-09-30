import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Move,
  X,
  Maximize,
} from "lucide-react";

interface ReceiptLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: any;
}

function ReceiptImage({
  receipt,
  className,
}: {
  receipt: any;
  className?: string;
}) {
  // Live mode resolves a signed storage URL onto receipt.imageUrl —
  // show the real upload. A failed signed URL (receipt.imageError) renders
  // an explicit error — never the stylized mock, which would look like a
  // loaded receipt. The mock below is demo-data only (no imageUrl, no error).
  if (receipt?.imageUrl) {
    return (
      <div className={`relative overflow-hidden bg-background ${className ?? ""}`}>
        <img
          src={receipt.imageUrl}
          alt={`Receipt ${receipt?.ref ?? ""}`}
          className="absolute inset-0 h-full w-full object-contain"
        />
      </div>
    );
  }
  if (receipt?.imageError) {
    return (
      <div
        className={`relative overflow-hidden bg-background flex flex-col items-center justify-center gap-2 p-6 text-center ${className ?? ""}`}
      >
        <X className="size-8 text-destructive" />
        <div className="text-sm font-semibold text-foreground">
          Receipt image unavailable
        </div>
        <div className="text-xs text-muted-foreground max-w-xs">
          Could not load the upload for {receipt?.ref ?? receipt?.id ?? "this receipt"}.
          Check the <span className="font-mono">operator_uploads</span> bucket policy,
          then close and reopen.
        </div>
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary-soft via-secondary to-primary/20" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, oklch(1 0 0 / 0.5), transparent 40%), radial-gradient(circle at 80% 70%, oklch(0.5 0.2 250 / 0.25), transparent 45%)",
        }}
      />
      <div className="relative flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="rounded-xl bg-background/90 shadow-glow px-6 py-5 w-full max-w-sm">
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-3">
            <span>BANK TRANSFER</span>
            <span>{receipt?.ref ?? "BNK-0000000"}</span>
          </div>
          <div className="text-lg font-display font-bold">
            {receipt?.amount ?? "$0.00"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            to {receipt?.operator ?? "Operator"}
          </div>
          <div className="h-px bg-border my-3" />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Date</span>
            <span className="font-mono">{receipt?.date ?? "—"}</span>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Status</span>
            <span className="font-mono">{receipt?.status ?? "Pending"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReceiptLightbox({
  open,
  onOpenChange,
  receipt,
}: ReceiptLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{
    startX: number;
    startY: number;
    posX: number;
    posY: number;
  } | null>(null);

  const reset = () => {
    setZoom(1);
    setRotation(0);
    setPos({ x: 0, y: 0 });
  };

  const onClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Maximize className="size-4 text-primary" /> Receipt {receipt?.id}{" "}
              — {receipt?.operator}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={() => onClose(false)}
            >
              <X className="size-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div
          className="relative m-6 mt-4 rounded-xl overflow-hidden bg-secondary/40 border border-border/60 h-[480px] select-none"
          onPointerDown={(e) => {
            dragRef.current = {
              startX: e.clientX,
              startY: e.clientY,
              posX: pos.x,
              posY: pos.y,
            };
            (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!dragRef.current) return;
            setPos({
              x: dragRef.current.posX + (e.clientX - dragRef.current.startX),
              y: dragRef.current.posY + (e.clientY - dragRef.current.startY),
            });
          }}
          onPointerUp={() => {
            dragRef.current = null;
          }}
          onPointerCancel={() => {
            dragRef.current = null;
          }}
          onWheel={(e) =>
            setZoom((z) => Math.min(4, Math.max(1, z - e.deltaY * 0.001)))
          }
        >
          {pos.x !== 0 || pos.y !== 0 ? (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-lg bg-background/90 backdrop-blur px-2 py-1 text-[10px] text-muted-foreground border border-border/60">
              <Move className="size-3" /> Drag to pan
            </div>
          ) : null}
          <div
            className="absolute inset-0 flex items-center justify-center transition-transform duration-200"
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              cursor: zoom > 1 ? "grab" : "default",
            }}
          >
            <ReceiptImage
              receipt={receipt}
              className="w-[92%] aspect-[4/3] rounded-xl shadow-elegant"
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 px-6 pb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom((z) => Math.min(4, z + 0.5))}
            disabled={zoom >= 4}
          >
            <ZoomIn className="size-4 mr-1" /> Zoom In
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
            disabled={zoom <= 1}
          >
            <ZoomOut className="size-4 mr-1" /> Zoom Out
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRotation((r) => (r + 90) % 360)}
          >
            <RotateCcw className="size-4 mr-1" /> Rotate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            disabled={
              zoom === 1 && rotation === 0 && pos.x === 0 && pos.y === 0
            }
          >
            <RotateCw className="size-4 mr-1" /> Reset
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import * as React from "react";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ConfirmTone = "default" | "warning" | "danger";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
};

type ConfirmState = (ConfirmOptions & {
  open: boolean;
  resolve: (value: boolean) => void;
}) | null;

let externalConfirm: ((opts: ConfirmOptions) => Promise<boolean>) | null = null;

export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
  if (!externalConfirm) {
    // Fallback if the provider isn't mounted yet.
    if (typeof window !== "undefined") return Promise.resolve(window.confirm(opts.description ?? opts.title));
    return Promise.resolve(false);
  }
  return externalConfirm(opts);
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ConfirmState>(null);

  React.useEffect(() => {
    externalConfirm = (opts) => {
      return new Promise<boolean>((resolve) => {
        setState({ ...opts, open: true, resolve });
      });
    };
    return () => {
      externalConfirm = null;
    };
  }, []);

  const close = (value: boolean) => {
    if (!state) return;
    state.resolve(value);
    setState(null);
  };

  const tone = state?.tone ?? "default";
  const toneStyles: Record<ConfirmTone, { icon: React.ReactNode; button: string }> = {
    default: {
      icon: <Info className="h-5 w-5 text-[#405742]" aria-hidden />,
      button: "bg-[#405742] hover:bg-[#2f422e] border-[#405742]",
    },
    warning: {
      icon: <AlertTriangle className="h-5 w-5 text-[#b28124]" aria-hidden />,
      button: "bg-[#b28124] hover:bg-[#93681d] border-[#b28124]",
    },
    danger: {
      icon: <ShieldAlert className="h-5 w-5 text-[#b4413b]" aria-hidden />,
      button: "bg-[#b4413b] hover:bg-[#8f3129] border-[#b4413b]",
    },
  };

  return (
    <>
      {children}
      <Dialog open={Boolean(state?.open)} onOpenChange={(open) => { if (!open) close(false); }}>
        <DialogContent className="max-w-md border-[#d9d1c2]">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0 rounded-full bg-[#f7f1e5] p-2">{toneStyles[tone].icon}</div>
              <div className="space-y-1">
                <DialogTitle className="text-base font-semibold text-stone-950">
                  {state?.title}
                </DialogTitle>
                {state?.description ? (
                  <p className="text-sm text-stone-600">{state.description}</p>
                ) : null}
              </div>
            </div>
          </DialogHeader>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => close(false)}
              className="inline-flex h-10 items-center justify-center border border-[#d9d1c2] bg-white px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-700 transition-colors hover:bg-[#faf6ee]"
            >
              {state?.cancelLabel ?? "Cancel"}
            </button>
            <button
              type="button"
              onClick={() => close(true)}
              className={`inline-flex h-10 items-center justify-center border px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors ${toneStyles[tone].button}`}
            >
              {state?.confirmLabel ?? "Confirm"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}


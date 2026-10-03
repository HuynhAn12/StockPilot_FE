import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export function Drawer({ trigger, title, children }: { trigger: ReactNode; title: string; children: ReactNode }) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[#0f172a]/25" />
        <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-50 w-[min(420px,calc(100vw-24px))] border-l border-(--sp-border) bg-white p-5 shadow-(--sp-shadow-md)">
          <div className="flex items-center justify-between gap-4">
            <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close className="sp-focus rounded-md p-1 text-(--sp-text-muted) hover:bg-(--sp-bg-subtle)">
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="mt-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const Sheet = Drawer;

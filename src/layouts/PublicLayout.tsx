import { Home } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

export function PublicAuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-155 overflow-hidden rounded-[10px] border border-(--sp-border) bg-white shadow-(--sp-shadow-sm) lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="flex flex-col justify-between bg-[#0f172a] p-6 text-white lg:p-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-lg bg-white text-sm font-bold text-[#0f172a]">
              SP
            </div>
            <div>
              <p className="font-semibold">StockPilot</p>
              <p className="text-sm text-white/65">Inventory decision support</p>
            </div>
          </div>
          <div className="mt-12 max-w-sm">
            <h2 className="text-2xl font-bold leading-tight lg:text-3xl">Kiểm soát tồn kho và gợi ý giá rõ ràng hơn.</h2>
            <p className="mt-4 text-sm leading-6 text-white/72">
              Giao diện nền tảng cho đăng nhập, đăng ký và onboarding chủ cửa hàng. Đây là shell, chưa phải flow đăng ký.
            </p>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 text-sm text-white/72">
          <div className="rounded-lg border border-white/12 p-3">Một cửa hàng MVP</div>
          <div className="rounded-lg border border-white/12 p-3">Một kho MVP</div>
        </div>
      </aside>
      <main className="flex items-center justify-center p-5 sm:p-8">{children}</main>
    </div>
  );
}

export function PublicShellDemo() {
  return (
    <PublicAuthShell>
      <Card className="w-full max-w-md p-5">
        <div className="flex items-center gap-2">
          <Home className="size-5 text-(--sp-primary)" />
          <h2 className="text-lg font-semibold">Auth shell demo</h2>
        </div>
        <p className="mt-2 text-sm text-(--sp-text-muted)">
          Khu vực form sẽ dùng cho đăng nhập và đăng ký ở phase sau. Chưa triển khai nghiệp vụ.
        </p>
        <div className="mt-5 grid gap-3">
          <div className="h-9.5 rounded-lg border border-(--sp-border) bg-(--sp-bg-subtle)" />
          <div className="h-9.5 rounded-lg border border-(--sp-border) bg-(--sp-bg-subtle)" />
          <Button>Tiếp tục demo</Button>
        </div>
      </Card>
    </PublicAuthShell>
  );
}

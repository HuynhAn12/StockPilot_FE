import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail, ShieldAlert, Sparkles } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { FormField } from "../../../components/ui/FormField";
import { Input, PasswordInput } from "../../../components/ui/Input";
import { PublicAuthShell } from "../../../layouts/PublicLayout";
import { useLogin } from "../hooks/useAuth";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    loginMutation.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => {
          navigate("/app/dashboard");
        },
        onError: (err) => {
          setErrorMessage(
            err instanceof Error
              ? err.message
              : "Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin."
          );
        },
      }
    );
  };

  const handleFillDemo = () => {
    setEmail("owner@stockpilot.vn");
    setPassword("Password123!");
    setErrorMessage(null);
  };

  return (
    <PublicAuthShell>
      <Card className="w-full max-w-md p-6 sm:p-8 bg-white border border-(--sp-border) shadow-(--sp-shadow-sm)">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-lg bg-(--sp-primary) font-bold text-white text-sm">
              SP
            </div>
            <div>
              <h2 className="text-xl font-bold text-(--sp-text)">Đăng nhập</h2>
              <p className="text-xs text-(--sp-text-muted)">Hệ thống quản lý StockPilot</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="flex items-center gap-1 rounded-md border border-(--sp-border) bg-(--sp-bg-subtle) px-2 py-1 text-xs font-medium text-(--sp-primary) hover:bg-(--sp-border)/50 transition"
            title="Điền tài khoản mẫu để test nhanh"
          >
            <Sparkles className="size-3" />
            <span>Tài khoản mẫu</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <ShieldAlert className="size-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <FormField label="Email đăng nhập">
            <div className="relative">
              <Input
                type="email"
                placeholder="chushop@cuahang.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={loginMutation.isPending}
              />
              <Mail className="absolute right-3 top-2.5 size-4 text-(--sp-text-muted) pointer-events-none" />
            </div>
          </FormField>

          <FormField label="Mật khẩu">
            <div className="relative">
              <PasswordInput
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={loginMutation.isPending}
              />
              <Lock className="absolute right-3 top-2.5 size-4 text-(--sp-text-muted) pointer-events-none" />
            </div>
          </FormField>

          <Button
            type="submit"
            className="mt-2 w-full flex items-center justify-center gap-2"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <span>Đang xác thực...</span>
            ) : (
              <>
                <span>Đăng nhập vào cửa hàng</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 border-t border-(--sp-border) pt-4 text-center">
          <p className="text-sm text-(--sp-text-muted)">
            Chưa có cửa hàng trên StockPilot?{" "}
            <Link
              to="/register"
              className="font-semibold text-(--sp-primary) hover:underline"
            >
              Đăng ký mở cửa hàng
            </Link>
          </p>
        </div>
      </Card>
    </PublicAuthShell>
  );
}

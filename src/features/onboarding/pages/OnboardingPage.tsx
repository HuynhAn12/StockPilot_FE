import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Globe, Lock, Mail, Phone, ShieldAlert, Sparkles, User } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { FormField } from "../../../components/ui/FormField";
import { Input, PasswordInput } from "../../../components/ui/Input";
import { PublicAuthShell } from "../../../layouts/PublicLayout";
import { useRegisterOwner } from "../hooks/useOnboarding";

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeCode, setStoreCode] = useState("");
  const [address, setAddress] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const registerMutation = useRegisterOwner();

  const handleStoreNameChange = (val: string) => {
    setStoreName(val);
    if (autoSlug) {
      setStoreCode(generateSlug(val));
    }
  };

  const handleFillDemo = () => {
    const randomSuffix = Math.floor(Math.random() * 900 + 100);
    setFullName("Nguyễn Văn An");
    setEmail(`owner${randomSuffix}@shopdemo.vn`);
    setPhone("0901234567");
    setPassword("Password123!");
    setStoreName(`Thời Trang An Phát ${randomSuffix}`);
    setStoreCode(`an-phat-${randomSuffix}`);
    setAddress("123 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh");
    setAutoSlug(false);
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim() || !password || !storeName.trim() || !storeCode.trim()) {
      setErrorMessage("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    registerMutation.mutate(
      {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        storeName: storeName.trim(),
        storeCode: storeCode.trim().toLowerCase(),
        address: address.trim() || undefined,
      },
      {
        onSuccess: () => {
          navigate("/app/dashboard");
        },
        onError: (err) => {
          setErrorMessage(
            err instanceof Error
              ? err.message
              : "Đăng ký cửa hàng không thành công. Vui lòng kiểm tra lại thông tin."
          );
        },
      }
    );
  };

  return (
    <PublicAuthShell>
      <Card className="w-full max-w-xl p-6 sm:p-8 bg-white border border-(--sp-border) shadow-(--sp-shadow-sm)">
        <div className="flex items-center justify-between gap-2 border-b border-(--sp-border) pb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-10 place-items-center rounded-lg bg-(--sp-primary) font-bold text-white text-base">
              SP
            </div>
            <div>
              <h2 className="text-xl font-bold text-(--sp-text)">Đăng ký mở cửa hàng</h2>
              <p className="text-xs text-(--sp-text-muted)">Khởi tạo tài khoản Chủ cửa hàng StockPilot</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="flex items-center gap-1 rounded-md border border-(--sp-border) bg-(--sp-bg-subtle) px-2.5 py-1.5 text-xs font-medium text-(--sp-primary) hover:bg-(--sp-border)/50 transition"
            title="Điền thông tin mẫu hợp lệ để test nhanh"
          >
            <Sparkles className="size-3.5" />
            <span>Điền mẫu</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <ShieldAlert className="size-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Họ và tên chủ cửa hàng *">
              <div className="relative">
                <Input
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={registerMutation.isPending}
                />
                <User className="absolute right-3 top-2.5 size-4 text-(--sp-text-muted) pointer-events-none" />
              </div>
            </FormField>

            <FormField label="Số điện thoại liên hệ">
              <div className="relative">
                <Input
                  type="tel"
                  placeholder="0901234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={registerMutation.isPending}
                />
                <Phone className="absolute right-3 top-2.5 size-4 text-(--sp-text-muted) pointer-events-none" />
              </div>
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Email đăng nhập *">
              <div className="relative">
                <Input
                  type="email"
                  placeholder="chushop@cuahang.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={registerMutation.isPending}
                />
                <Mail className="absolute right-3 top-2.5 size-4 text-(--sp-text-muted) pointer-events-none" />
              </div>
            </FormField>

            <FormField label="Mật khẩu khởi tạo * (min 8 ký tự)">
              <div className="relative">
                <PasswordInput
                  placeholder="Tối thiểu 8 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  disabled={registerMutation.isPending}
                />
                <Lock className="absolute right-3 top-2.5 size-4 text-(--sp-text-muted) pointer-events-none" />
              </div>
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Tên cửa hàng *">
              <div className="relative">
                <Input
                  placeholder="Thời Trang An Phát"
                  value={storeName}
                  onChange={(e) => handleStoreNameChange(e.target.value)}
                  required
                  disabled={registerMutation.isPending}
                />
                <Building2 className="absolute right-3 top-2.5 size-4 text-(--sp-text-muted) pointer-events-none" />
              </div>
            </FormField>

            <FormField label="Mã định danh Slug cửa hàng *">
              <div className="relative">
                <Input
                  placeholder="an-phat-store"
                  value={storeCode}
                  onChange={(e) => {
                    setStoreCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                    setAutoSlug(false);
                  }}
                  required
                  disabled={registerMutation.isPending}
                />
                <Globe className="absolute right-3 top-2.5 size-4 text-(--sp-text-muted) pointer-events-none" />
              </div>
            </FormField>
          </div>

          {storeCode && (
            <div className="rounded-lg border border-(--sp-border) bg-(--sp-bg-subtle) p-2.5 text-xs text-(--sp-text-muted) flex items-center gap-2">
              <Globe className="size-4 text-(--sp-primary) shrink-0" />
              <span>
                Địa chỉ truy cập riêng của cửa hàng:{" "}
                <strong className="text-(--sp-text)">{storeCode}.stockpilot.vn</strong>
              </span>
            </div>
          )}

          <FormField label="Địa chỉ cửa hàng / Kho hàng">
            <Input
              placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={registerMutation.isPending}
            />
          </FormField>

          <Button
            type="submit"
            className="mt-2 w-full flex items-center justify-center gap-2"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <span>Đang khởi tạo cửa hàng & tài khoản...</span>
            ) : (
              <>
                <span>Hoàn tất đăng ký & Mở Dashboard</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 border-t border-(--sp-border) pt-4 text-center">
          <p className="text-sm text-(--sp-text-muted)">
            Đã có tài khoản cửa hàng?{" "}
            <Link to="/login" className="font-semibold text-(--sp-primary) hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </Card>
    </PublicAuthShell>
  );
}

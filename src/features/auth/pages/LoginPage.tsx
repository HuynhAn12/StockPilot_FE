import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { FormField } from "../../../components/ui/FormField";
import { Input, PasswordInput } from "../../../components/ui/Input";
import { PublicAuthShell } from "../../../layouts/PublicLayout";

export function LoginPage() {
  return (
    <PublicAuthShell>
      <Card className="w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-(--sp-text)">Đăng nhập StockPilot</h2>
        <p className="mt-1 text-sm text-(--sp-text-muted)">
          Hệ thống quản lý tồn kho và hỗ trợ ra quyết định giá.
        </p>
        <form className="mt-6 grid gap-4" onSubmit={(e) => e.preventDefault()}>
          <FormField label="Email">
            <Input type="email" placeholder="owner@store.com" />
          </FormField>
          <FormField label="Mật khẩu">
            <PasswordInput placeholder="Nhập mật khẩu" />
          </FormField>
          <Button type="submit" className="mt-2 w-full">
            Đăng nhập
          </Button>
        </form>
      </Card>
    </PublicAuthShell>
  );
}

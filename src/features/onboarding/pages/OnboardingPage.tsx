import { Stepper } from "../../../components/data-display/Stepper";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { PublicAuthShell } from "../../../layouts/PublicLayout";
import { ONBOARDING_STEPS } from "../constants";

export function OnboardingPage() {
  return (
    <PublicAuthShell>
      <Card className="w-full max-w-xl p-6">
        <h2 className="text-xl font-bold text-(--sp-text)">Đăng ký cửa hàng StockPilot</h2>
        <p className="mt-1 text-sm text-(--sp-text-muted)">
          Thiết lập tài khoản và định danh cửa hàng bán lẻ của bạn.
        </p>
        <div className="mt-5">
          <Stepper steps={[...ONBOARDING_STEPS]} current={0} />
        </div>
        <div className="mt-6 flex justify-end">
          <Button>Tiếp tục</Button>
        </div>
      </Card>
    </PublicAuthShell>
  );
}

import { Download } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { OwnerLayout } from "../../../layouts/OwnerLayout";
import { REPORT_TYPES } from "../constants";

export function ReportsPage() {
  return (
    <OwnerLayout title="Báo cáo & Xuất dữ liệu">
      <div className="grid gap-6">
        <div>
          <h1 className="text-2xl font-bold text-(--sp-text)">Báo cáo hoạt động bán hàng</h1>
          <p className="mt-1 text-sm text-(--sp-text-muted)">
            Tải xuất dữ liệu kế toán, xuất nhập tồn kho và lịch sử ra quyết định giá sang Excel.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {REPORT_TYPES.map((report) => (
            <Card key={report.id} className="flex flex-col justify-between p-5">
              <div>
                <h3 className="font-semibold text-(--sp-text)">{report.label}</h3>
                <p className="mt-1 text-xs text-(--sp-text-muted)">
                  Định dạng xuất chuẩn Excel (.xlsx) phục vụ đối soát và lưu trữ.
                </p>
              </div>
              <Button variant="secondary" className="mt-5 w-full">
                <Download className="size-4" />
                Tải xuống
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </OwnerLayout>
  );
}

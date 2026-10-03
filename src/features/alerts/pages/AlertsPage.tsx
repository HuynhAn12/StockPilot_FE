import { useState } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Eye, ShieldAlert, ShieldCheck } from "lucide-react";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Skeleton } from "../../../components/ui/Skeleton";
import { OwnerLayout } from "../../../layouts/OwnerLayout";
import { useAcknowledgeAlert, useAlerts, useResolveAlert } from "../hooks/useAlerts";

export function AlertsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>("OPEN");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const { data, isLoading, refetch } = useAlerts(
    selectedStatus ? { status: selectedStatus } : undefined
  );

  const acknowledgeMutation = useAcknowledgeAlert();
  const resolveMutation = useResolveAlert();

  const alerts = data?.items || [];

  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL").length;
  const warningCount = alerts.filter((a) => a.severity === "WARNING").length;

  const handleAcknowledge = (id: number) => {
    setActionMessage(null);
    acknowledgeMutation.mutate(id, {
      onSuccess: () => {
        setActionMessage("Đã xác nhận tiếp nhận cảnh báo.");
      },
      onError: (err: unknown) => {
        const apiErr = err as { response?: { data?: { message?: string } } };
        setActionMessage(apiErr?.response?.data?.message || "Không thể xác nhận cảnh báo");
      },
    });
  };

  const handleResolve = (id: number) => {
    setActionMessage(null);
    resolveMutation.mutate(id, {
      onSuccess: () => {
        setActionMessage("Đã đánh dấu xử lý xong cảnh báo tồn kho.");
      },
      onError: (err: unknown) => {
        const apiErr = err as { response?: { data?: { message?: string } } };
        setActionMessage(apiErr?.response?.data?.message || "Không thể đánh dấu xử lý");
      },
    });
  };

  return (
    <OwnerLayout title="Cảnh báo tồn kho" onRefresh={() => refetch()}>
      <div className="grid gap-6">
        {/* Header Title */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-(--sp-text)">Cảnh báo rủi ro tồn kho (Stock Alerts)</h1>
            <p className="mt-1 text-sm text-(--sp-text-muted)">
              Phát hiện sớm nguy cơ hết hàng, thừa hàng, ứ đọng và biến động bất thường từ hệ thống cảnh báo.
            </p>
          </div>
        </div>

        {/* Message Alert */}
        {actionMessage && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
            {actionMessage}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Card className="p-4 border-(--sp-border)">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-red-50 text-red-600">
                <AlertCircle className="size-5" />
              </div>
              <div>
                <p className="text-xs text-(--sp-text-muted)">Mức nghiêm trọng (Critical)</p>
                <p className="text-xl font-bold text-red-600">{criticalCount}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-(--sp-border)">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-amber-50 text-amber-600">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <p className="text-xs text-(--sp-text-muted)">Mức cảnh báo (Warning)</p>
                <p className="text-xl font-bold text-amber-700">{warningCount}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-(--sp-border)">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <p className="text-xs text-(--sp-text-muted)">Tổng số cảnh báo</p>
                <p className="text-xl font-bold text-(--sp-text)">{alerts.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-(--sp-border) pb-2">
          <button
            type="button"
            onClick={() => setSelectedStatus("OPEN")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedStatus === "OPEN"
                ? "bg-(--sp-primary) text-white shadow-xs"
                : "bg-(--sp-bg-subtle) text-(--sp-text-muted) hover:text-(--sp-text)"
            }`}
          >
            Chưa xử lý (Open)
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus("ACKNOWLEDGED")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedStatus === "ACKNOWLEDGED"
                ? "bg-(--sp-primary) text-white shadow-xs"
                : "bg-(--sp-bg-subtle) text-(--sp-text-muted) hover:text-(--sp-text)"
            }`}
          >
            Đã tiếp nhận (Acknowledged)
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatus(undefined)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              selectedStatus === undefined
                ? "bg-(--sp-primary) text-white shadow-xs"
                : "bg-(--sp-bg-subtle) text-(--sp-text-muted) hover:text-(--sp-text)"
            }`}
          >
            Tất cả lịch sử
          </button>
        </div>

        {/* Alerts Table */}
        <Card className="overflow-hidden border-(--sp-border)">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : alerts.length === 0 ? (
            <div className="py-12 text-center">
              <ShieldCheck className="mx-auto size-12 text-emerald-500" />
              <h3 className="mt-3 text-base font-semibold text-(--sp-text)">Kho hàng an toàn</h3>
              <p className="mt-1 text-sm text-(--sp-text-muted) max-w-md mx-auto">
                Hiện tại không phát hiện cảnh báo rủi ro hết hàng hay tồn kho chết nào cần xử lý.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-(--sp-border) bg-(--sp-bg-subtle) text-xs font-semibold text-(--sp-text-muted)">
                  <tr>
                    <th className="px-4 py-3">Mức độ</th>
                    <th className="px-4 py-3">Tiêu đề cảnh báo</th>
                    <th className="px-4 py-3">SKU / Mặt hàng</th>
                    <th className="px-4 py-3">Chi tiết nội dung</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--sp-border)">
                  {alerts.map((a) => (
                    <tr key={a.id} className="hover:bg-(--sp-bg-subtle)/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <Badge
                          tone={
                            a.severity === "CRITICAL"
                              ? "danger"
                              : a.severity === "WARNING"
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {a.severity}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-(--sp-text)">{a.title}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-(--sp-text-muted)">
                        {a.stockItem?.sku || (a.stockItemId ? `SKU-${a.stockItemId}` : "Toàn kho")}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-(--sp-text-muted) max-w-xs">
                        {a.message || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge tone={a.status === "OPEN" ? "warning" : a.status === "RESOLVED" ? "success" : "info"}>
                          {a.status === "OPEN" ? "Chưa xử lý" : a.status === "RESOLVED" ? "Đã giải quyết" : "Đã tiếp nhận"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {a.status === "OPEN" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleAcknowledge(a.id)}
                              disabled={acknowledgeMutation.isPending}
                            >
                              <Eye className="mr-1 size-3.5" />
                              Tiếp nhận
                            </Button>
                          )}
                          {(a.status === "OPEN" || a.status === "ACKNOWLEDGED") && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleResolve(a.id)}
                              disabled={resolveMutation.isPending}
                            >
                              <CheckCircle2 className="mr-1 size-3.5" />
                              Đã xử lý
                            </Button>
                          )}
                          {a.status === "RESOLVED" && (
                            <span className="text-xs text-emerald-600 font-medium">Hoàn tất</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </OwnerLayout>
  );
}

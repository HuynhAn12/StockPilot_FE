import { Badge } from "../ui/Badge";

export function StatusBadge({
  status,
}: {
  status: "active" | "pending" | "completed" | "failed" | "draft";
}) {
  const map = {
    active: ["success", "Đang hoạt động"],
    pending: ["warning", "Đang chờ"],
    completed: ["success", "Hoàn tất"],
    failed: ["danger", "Thất bại"],
    draft: ["neutral", "Bản nháp"],
  } as const;
  const [tone, label] = map[status];
  return (
    <Badge tone={tone}>
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}

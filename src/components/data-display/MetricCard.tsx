import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

export function MetricCard({
  label,
  value,
  delta,
  tone = "neutral",
}: {
  label: string;
  value: string;
  delta: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info" | "ai";
}) {
  return (
    <Card className="p-4">
      <p className="text-[13px] font-medium text-(--sp-text-muted)">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="sp-tabular text-2xl font-bold tracking-normal text-(--sp-text)">{value}</p>
        <Badge tone={tone === "neutral" ? "neutral" : tone}>{delta}</Badge>
      </div>
    </Card>
  );
}

import { CircleAlert } from "lucide-react";

import { Badge } from "../ui/Badge";

export function RiskBadge({
  risk,
}: {
  risk: "low" | "medium" | "high" | "critical";
}) {
  const map = {
    low: ["success", "Rủi ro thấp"],
    medium: ["warning", "Rủi ro vừa"],
    high: ["warning", "Rủi ro cao"],
    critical: ["danger", "Khẩn cấp"],
  } as const;
  const [tone, label] = map[risk];
  return (
    <Badge tone={tone}>
      <CircleAlert className="size-3" />
      {label}
    </Badge>
  );
}

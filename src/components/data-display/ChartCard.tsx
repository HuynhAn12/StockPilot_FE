import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

export function ChartCard() {
  const data = [
    { day: "T2", revenue: 18 },
    { day: "T3", revenue: 22 },
    { day: "T4", revenue: 19 },
    { day: "T5", revenue: 28 },
    { day: "T6", revenue: 31 },
    { day: "T7", revenue: 26 },
  ];

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Doanh thu mẫu</h3>
          <p className="text-sm text-(--sp-text-muted)">Dữ liệu demo cho đánh giá biểu đồ.</p>
        </div>
        <Badge tone="info">Demo</Badge>
      </div>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #dbe3ee",
                boxShadow: "var(--sp-shadow-sm)",
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Triệu VND"
              stroke="var(--sp-primary)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-sm text-(--sp-text-muted)">
        Tóm tắt: doanh thu demo tăng nhẹ vào cuối tuần, không dùng cho quyết định kinh doanh.
      </p>
    </Card>
  );
}

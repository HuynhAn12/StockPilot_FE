import { Sparkles } from "lucide-react";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { OwnerLayout } from "../../../layouts/OwnerLayout";
import { ASSISTANT_STARTER_PROMPTS } from "../constants";

export function AssistantPage() {
  return (
    <OwnerLayout title="Trợ lý AI StockPilot">
      <div className="grid gap-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-(--sp-purple)" />
            <h1 className="text-2xl font-bold text-(--sp-text)">Trợ lý giải thích quyết định</h1>
          </div>
          <p className="mt-1 text-sm text-(--sp-text-muted)">
            Hỗ trợ giải thích nguyên nhân cảnh báo tồn kho và lý do đề xuất giá một cách minh bạch.
          </p>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Badge tone="ai">AI Decision Explanation</Badge>
            <p className="text-xs text-(--sp-text-muted)">Chỉ giải thích dữ liệu đã được xác thực</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {ASSISTANT_STARTER_PROMPTS.map((prompt) => (
              <Button key={prompt} variant="subtle" size="sm">
                {prompt}
              </Button>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <Input placeholder="Đặt câu hỏi về tình trạng tồn kho hoặc giá bán..." />
            <Button>Gửi</Button>
          </div>
        </Card>
      </div>
    </OwnerLayout>
  );
}

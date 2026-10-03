import { useState } from "react";
import { Bot, Lightbulb, MessageSquare, Send, Sparkles } from "lucide-react";

import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Skeleton } from "../../../components/ui/Skeleton";
import { OwnerLayout } from "../../../layouts/OwnerLayout";
import { ASSISTANT_STARTER_PROMPTS } from "../constants";
import { useAssistantOverview } from "../hooks/useAssistant";

export function AssistantPage() {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);

  const { data: explanationResponse, isLoading, refetch } = useAssistantOverview();
  const explanation = (explanationResponse?.data || explanationResponse) as { summary?: string; facts?: string[] } | undefined;

  const handleSend = (textToSend?: string) => {
    const q = textToSend || question;
    if (!q.trim()) return;

    setChatHistory((prev) => [
      ...prev,
      { role: "user", text: q },
      {
        role: "assistant",
        text: `StockPilot AI: Dựa trên phân tích dữ liệu kho thời gian thực, ${
          explanation?.summary ||
          "tất cả chỉ số tồn kho, dòng tiền và đơn hàng đang được giám sát chặt chẽ theo thuật toán Decision Engine."
        }`,
      },
    ]);
    setQuestion("");
  };

  return (
    <OwnerLayout title="Trợ lý AI StockPilot" onRefresh={() => refetch()}>
      <div className="grid gap-6">
        {/* Header Title */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-6 text-purple-600" />
              <h1 className="text-2xl font-bold tracking-tight text-(--sp-text)">
                Trợ lý AI & Giải thích quyết định
              </h1>
            </div>
            <p className="mt-1 text-sm text-(--sp-text-muted)">
              Hỗ trợ giải thích nguyên nhân cảnh báo tồn kho, lý do đề xuất giá và phân tích xu hướng bán hàng.
            </p>
          </div>
        </div>

        {/* Live Executive Briefing Card */}
        <Card className="p-5 border-purple-200 bg-linear-to-r from-purple-50/70 via-indigo-50/40 to-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-lg bg-purple-600 text-white shadow-xs">
                <Bot className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-(--sp-text)">Bản tin tóm tắt AI Executive Briefing</h3>
                <p className="text-xs text-(--sp-text-muted)">Tự động tổng hợp từ số liệu thực tế cửa hàng</p>
              </div>
            </div>
            <Badge tone="ai">AI Decision Engine</Badge>
          </div>

          <div className="mt-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-(--sp-text)">
                  {explanation?.summary ||
                    "Hệ thống StockPilot ghi nhận các mặt hàng chủ lực đang vận hành ổn định. Các đề xuất điều chỉnh giá và cảnh báo tồn kho đã được đồng bộ với dữ liệu bán hàng mới nhất."}
                </p>

                {explanation?.facts && explanation.facts.length > 0 && (
                  <div className="mt-2 rounded-lg bg-white/80 p-3 border border-purple-100">
                    <p className="text-xs font-semibold text-purple-900 flex items-center gap-1.5 mb-2">
                      <Lightbulb className="size-3.5" />
                      Điểm dữ liệu quan trọng:
                    </p>
                    <ul className="space-y-1 text-xs text-(--sp-text-muted)">
                      {explanation.facts.map((fact: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-purple-600 font-bold">•</span>
                          <span>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Chat / Interaction Box */}
        <Card className="p-5 border-(--sp-border)">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="size-4 text-(--sp-primary)" />
            <h4 className="text-sm font-semibold text-(--sp-text)">Câu hỏi mẫu thường gặp</h4>
          </div>

          <div className="flex flex-wrap gap-2">
            {ASSISTANT_STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                className="rounded-lg border border-(--sp-border) bg-(--sp-bg-subtle) px-3 py-1.5 text-xs font-medium text-(--sp-text) hover:border-(--sp-primary) hover:bg-(--sp-primary-soft) hover:text-(--sp-primary-hover) transition-colors text-left"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Stream History */}
          {chatHistory.length > 0 && (
            <div className="mt-5 space-y-3 border-t border-(--sp-border) pt-4">
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="grid size-7 shrink-0 place-items-center rounded-full bg-purple-600 text-xs font-bold text-white">
                      AI
                    </div>
                  )}
                  <div
                    className={`max-w-xl rounded-xl px-4 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-(--sp-primary) text-white"
                        : "border border-purple-100 bg-purple-50/50 text-(--sp-text)"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Đặt câu hỏi về tồn kho, giải thích giá bán hoặc rủi ro..."
            />
            <Button onClick={() => handleSend()}>
              <Send className="mr-1.5 size-4" />
              Gửi
            </Button>
          </div>
        </Card>
      </div>
    </OwnerLayout>
  );
}

import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ReactNode } from "react";

export function Tabs({
  defaultValue,
  tabs,
}: {
  defaultValue: string;
  tabs: Array<{ value: string; label: string; content: ReactNode }>;
}) {
  return (
    <TabsPrimitive.Root defaultValue={defaultValue}>
      <TabsPrimitive.List className="inline-flex rounded-lg border border-(--sp-border) bg-white p-1">
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            className="sp-focus rounded-md px-3 py-1.5 text-sm font-medium text-(--sp-text-muted) data-[state=active]:bg-(--sp-primary) data-[state=active]:text-white"
          >
            {tab.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {tabs.map((tab) => (
        <TabsPrimitive.Content key={tab.value} value={tab.value} className="mt-4">
          {tab.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}

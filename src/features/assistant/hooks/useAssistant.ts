import { useQuery } from "@tanstack/react-query";

import { assistantApi } from "../api/assistantApi";

export function useAssistantOverview() {
  return useQuery({
    queryKey: ["assistant", "overview"],
    queryFn: () => assistantApi.getOverviewExplanation(),
  });
}

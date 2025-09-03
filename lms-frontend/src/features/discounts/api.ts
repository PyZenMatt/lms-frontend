import { api } from "@/lib/api";
import type { PendingListResponse, DecisionResponse } from "./types";

export const discountsApi = {
  listPending: async () : Promise<PendingListResponse> => {
    const res = await api.get<PendingListResponse>('/discounts/pending/');
    if (!res.ok) throw res.error || new Error('Failed to fetch');
    return res.data as PendingListResponse;
  },
  acceptDecision: async (decisionId: number) : Promise<DecisionResponse> => {
    const res = await api.post<DecisionResponse>(`/discounts/${decisionId}/accept/`, null);
    if (!res.ok) throw res.error || new Error('Failed to accept');
    return res.data as DecisionResponse;
  },
  declineDecision: async (decisionId: number) : Promise<DecisionResponse> => {
    const res = await api.post<DecisionResponse>(`/discounts/${decisionId}/decline/`, null);
    if (!res.ok) throw res.error || new Error('Failed to decline');
    return res.data as DecisionResponse;
  },
};

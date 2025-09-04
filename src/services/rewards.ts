import { api } from "@/lib/api";
import type { ApiResult } from "@/lib/api";

export async function getPendingDiscountSnapshots() {
  // returns ApiResult<any>
  try {
    const res = await api.get('/v1/rewards/discounts/pending/');
    return res;
  } catch {
  return { ok: false, status: 0, data: null } as ApiResult<null>;
  }
}

export async function backfillSnapshotsToDecisions(snapshotIds: number[]) {
  try {
    // Backend exposes this under /api/v1/rewards/discounts/backfill/
    const res = await api.post('/v1/rewards/discounts/backfill/', { snapshot_ids: snapshotIds });
    return res;
  } catch {
    return { ok: false, status: 0, data: null } as ApiResult<null>;
  }
}

export default {
  getPendingDiscountSnapshots,
};

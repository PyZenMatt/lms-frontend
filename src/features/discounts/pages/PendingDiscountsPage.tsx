import React from "react";
import { usePendingDiscounts, useAcceptDecline } from "../hooks";
import PendingDiscountsList from "../components/PendingDiscountsList";

export default function PendingDiscountsPage() {
  const { items, loading, error, refetch } = usePendingDiscounts();
  // After an accept/decline we want to refetch the pending list and also
  // notify other UI areas (wallet, notifications) to refresh. We await the
  // refetch in the hook via onAfterChange so the list is updated before
  // clearing busy state.
  const { accept, decline, busyId, error: actionError } = useAcceptDecline({
    onAfterChange: async () => {
      await refetch();
  try { window.dispatchEvent(new CustomEvent("wallet:updated")); } catch (e) { console.debug("wallet dispatch failed", e); }
  try { window.dispatchEvent(new CustomEvent("notifications:updated")); } catch (e) { console.debug("notifications dispatch failed", e); }
    },
  });

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Pending Discounts</h1>
      {error && <div className="mb-4 text-sm text-red-600">Error loading: {String(error)}</div>}
      <PendingDiscountsList items={items} onAccept={accept} onDecline={decline} busyId={busyId} />
      {actionError && <div className="mt-4 text-sm text-red-600">Action error: {String(actionError)}</div>}
      {loading && <div className="mt-4 text-sm text-slate-500">Loading…</div>}
    </div>
  );
}

import React from "react";
import PendingDiscountCard from "./PendingDiscountCard";
import type { DiscountSnapshot } from "../types";

type Item = { snapshot: DiscountSnapshot; decision_id: number };

type Props = {
  items: Item[];
  onAccept: (decisionId: number) => Promise<void> | void;
  onDecline: (decisionId: number) => Promise<void> | void;
  busyId?: number | null;
};

export default function PendingDiscountsList({ items, onAccept, onDecline, busyId }: Props) {
  if (!items.length) return <div className="p-6 text-center text-slate-500">No pending discounts</div>;

  return (
    <div className="grid gap-4">
      {items.map((it) => (
        <PendingDiscountCard
          key={it.decision_id}
          snap={it.snapshot}
          decisionId={it.decision_id}
          onAccept={onAccept}
          onDecline={onDecline}
          disabled={busyId === it.decision_id}
        />
      ))}
    </div>
  );
}

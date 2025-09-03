import React from "react";
import type { DiscountSnapshot } from "../types";

type Props = {
  snap: DiscountSnapshot;
  decisionId: number;
  onAccept: (decisionId: number) => Promise<void> | void;
  onDecline: (decisionId: number) => Promise<void> | void;
  disabled?: boolean;
};

export default function PendingDiscountCard({
  snap, decisionId, onAccept, onDecline, disabled,
}: Props) {
  return (
  <div className="rounded-lg shadow-card p-4 bg-card border border-border">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold">{snap.course_title ?? "Course"}</h3>
          <p className="text-sm text-slate-500">Sconto {snap.discount_percent}% • Prezzo €{snap.price_eur}</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">
          {snap.status}
        </span>
      </div>

      {/** show offered / final TEO and timestamp if available */}
      <div className="mb-3 text-sm text-muted-foreground">
        {snap.teacher_accepted_teo && (
          <div>TEO offerti: <span className="font-mono">{snap.teacher_accepted_teo} TEO</span></div>
        )}
        {snap.final_teacher_teo && (
          <div>TEO finale: <span className="font-mono">{snap.final_teacher_teo} TEO</span></div>
        )}
        {snap.created_at && (
          <div className="text-xs text-muted-foreground">Creato: {new Date(snap.created_at).toLocaleString()}</div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2">
          <div className="text-slate-500">Studente paga</div>
          <div className="font-medium">€{snap.student_pay_eur}</div>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2">
          <div className="text-slate-500">Teacher</div>
          <div className="font-medium">€{snap.teacher_eur}</div>
        </div>
        <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2">
          <div className="text-slate-500">Piattaforma</div>
          <div className="font-medium">€{snap.platform_eur}</div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onDecline(decisionId)}
          className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
          disabled={disabled}
        >
          Decline
        </button>
        <button
          onClick={() => onAccept(decisionId)}
          className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          disabled={disabled}
        >
          Accept
        </button>
      </div>
    </div>
  );
}

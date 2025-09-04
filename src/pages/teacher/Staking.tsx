import React from "react";
import { useAuth } from "../../context/AuthContext";
import { getStakingOverview, stakeTeo, unstakeTeo } from "../../services/payments";
import type { StakingOverview } from "../../services/payments";
import { showToast } from "@/lib/toast";

export default function StakingPage() {
  const { isAuthenticated, isTeacher } = useAuth();
  const [overview, setOverview] = React.useState<StakingOverview | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [amount, setAmount] = React.useState<string>("");
  const [actionLoading, setActionLoading] = React.useState(false);

  const fetchOverview = React.useCallback(async () => {
    setLoading(true);
    const res = await getStakingOverview();
    setLoading(false);
    if (!res.ok) return;
  console.debug("fetchOverview: response", res);
  setOverview(res.data ?? null);
  }, []);

  React.useEffect(() => {
    if (isAuthenticated && isTeacher) fetchOverview();
  }, [fetchOverview, isAuthenticated, isTeacher]);

  function fmtTeo(v?: number) {
    if (v === undefined) return "-";
    return v.toFixed(8);
  }

  // try to coerce numbers coming as { source, parsedValue } or plain strings/numbers
  function extractNumber(v: any): number | undefined {
    if (v === null || v === undefined) return undefined;
    if (typeof v === "object") {
      if (typeof v.parsedValue === "number" && Number.isFinite(v.parsedValue)) return v.parsedValue;
      if (typeof v.source === "string") {
        const n = Number(v.source);
        if (Number.isFinite(n)) return n;
      }
      if (typeof v.value === "number" && Number.isFinite(v.value)) return v.value;
      if (typeof v.value === "string") {
        const n = Number(v.value);
        if (Number.isFinite(n)) return n;
      }
      return undefined;
    }
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }

  async function doStake() {
    if (!amount) return showToast({ variant: "info", message: "Inserisci un importo" });
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return showToast({ variant: "error", message: "Importo non valido" });
  // validate against available balance (not total)
  if (overview?.available_teo !== undefined && n > overview.available_teo) return showToast({ variant: "error", message: "Importo maggiore del saldo disponibile" });
  console.log("doStake called", { amount: n });
  setActionLoading(true);
  const res = await stakeTeo(amount);
  setActionLoading(false);
  console.debug("doStake: api response", res);
  if (!res.ok) return showToast({ variant: "error", message: `Errore durante lo stake (status ${res.status})` });
  // prefer backend message when present in raw payload
  showToast({ variant: "success", message: res.data?.raw?.message ?? "Stake completato" });
  // optimistic update: prefer explicit new balances from backend if present
  try {
    const raw = res.data?.raw ?? res.data ?? {};
    const newStaked = extractNumber(raw.new_staked_balance ?? raw.newStakedBalance ?? raw.new_staked ?? raw.staked_teo ?? res.data?.staked_teo);
    const newAvailable = extractNumber(raw.new_available_balance ?? raw.newAvailableBalance ?? raw.new_available ?? raw.available_teo ?? res.data?.available_teo);
    if (newStaked !== undefined || newAvailable !== undefined) {
      setOverview((prev) => ({ ...(prev ?? {}), staked_teo: newStaked ?? prev?.staked_teo, available_teo: newAvailable ?? prev?.available_teo }));
      return;
    }
  } finally {
    // fallback to full refresh
    fetchOverview();
  }
  }

  async function doUnstake() {
    if (!amount) return showToast({ variant: "info", message: "Inserisci un importo" });
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return showToast({ variant: "error", message: "Importo non valido" });
    if (overview?.staked_teo !== undefined && n > overview.staked_teo) return showToast({ variant: "error", message: "Importo maggiore dello staked" });
  console.log("doUnstake called", { amount: n });
  setActionLoading(true);
  const res = await unstakeTeo(amount);
  setActionLoading(false);
  console.debug("doUnstake: api response", res);
  if (!res.ok) return showToast({ variant: "error", message: `Errore durante l'unstake (status ${res.status})` });
  showToast({ variant: "success", message: res.data?.raw?.message ?? "Unstake completato" });
  try {
    const raw = res.data?.raw ?? res.data ?? {};
    const newStaked = extractNumber(raw.new_staked_balance ?? raw.newStakedBalance ?? raw.new_staked ?? raw.staked_teo ?? res.data?.staked_teo);
    const newAvailable = extractNumber(raw.new_available_balance ?? raw.newAvailableBalance ?? raw.new_available ?? raw.available_teo ?? res.data?.available_teo);
    if (newStaked !== undefined || newAvailable !== undefined) {
      setOverview((prev) => ({ ...(prev ?? {}), staked_teo: newStaked ?? prev?.staked_teo, available_teo: newAvailable ?? prev?.available_teo }));
      return;
    }
  } finally {
    fetchOverview();
  }
  }

  const progressPct = (() => {
    // prefer explicit staked_teo, otherwise derive from total - available
    const cur = overview?.staked_teo ?? ((overview?.balance_teo !== undefined && overview?.available_teo !== undefined) ? (overview.balance_teo - overview.available_teo) : 0);
    const next = overview?.next_tier_threshold_teo ?? 0;
    if (!next || next <= 0) return 100;
    return Math.min(100, Math.round((cur / next) * 100));
  })();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Staking TEO</h1>
      {loading && <div>Caricamento...</div>}
      {!loading && overview && (
        <div className="space-y-4">
          <div className="p-4 border rounded-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted">Tier corrente</div>
                <div className="text-lg font-semibold">{overview.tier_name ?? "-"} ({overview.bonus_multiplier ? `+${(overview.bonus_multiplier * 100).toFixed(0)}%` : "-"})</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted">Saldo disponibile (TEO)</div>
                <div className="text-lg font-semibold">{fmtTeo(overview.available_teo)}</div>
              </div>
            </div>

            <div className="mt-3">
              <div className="text-sm text-muted">Staked (TEO)</div>
              <div className="text-lg font-semibold">
                {(() => {
                  const staked = overview.staked_teo ?? ((overview.balance_teo !== undefined && overview.available_teo !== undefined) ? (overview.balance_teo - overview.available_teo) : 0);
                  return fmtTeo(staked);
                })()}
              </div>
            </div>

            <div className="mt-4">
              <div className="w-full bg-gray-200 h-3 rounded overflow-hidden">
                <div style={{ width: `${progressPct}%` }} className="h-3 bg-emerald-600" />
              </div>
              <div className="text-sm mt-1">Progresso verso {overview.next_tier ?? "-"}: {progressPct}%</div>
            </div>
          </div>

          <div className="p-4 border rounded-md">
            <div className="mb-2">Stake / Unstake</div>
            <input
              type="number"
              step="0.00000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border px-2 py-1 rounded mr-2"
              placeholder="0.00000000"
            />
            <button onClick={doStake} disabled={actionLoading} className="px-3 py-1 rounded bg-emerald-600 text-white mr-2">Aggiungi allo stake (STAKE)</button>
            <button onClick={doUnstake} disabled={actionLoading} className="px-3 py-1 rounded bg-red-600 text-white">Rimuovi dallo stake (UNSTAKE)</button>
          </div>

          <div className="text-xs text-muted">1 TEO = 1 EUR (contabile). I bonus dipendono dal tier.</div>
        </div>
      )}
      {!loading && !overview && <div>Staking non disponibile.</div>}
    </div>
  );
}

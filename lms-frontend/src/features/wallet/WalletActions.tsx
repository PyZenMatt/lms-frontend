/*** src/components/WalletActions.tsx ***/
import React, { useState } from "react"
import { onchainMint } from "./walletApi"
import { useWeb3 } from "@/web3/context"
import { burnTokens } from "onchain/ethersWeb3"
import { verifyDeposit } from "@/services/wallet"
import { showToast } from "@/lib/api"
import useTxStatus from "./hooks/useTxStatus"
import TxStatusPanel from "./components/TxStatusPanel"

// Primitives
import { Card, CardContent } from "@/components/ui/card"
import Input from "@/components/ui/input"
import Button from "@/components/ui/button"

// TxStatus centralized in useTxStatus

export default function WalletActions() {
  // Stato TX
  const [txHash, setTxHash] = useState<string | null>(null)

  // Loading separati
  const [minting, setMinting] = useState(false)
  const [burning, setBurning] = useState(false)

  // Form
  const [mintAmount, setMintAmount] = useState("")
  const [burnAmount, setBurnAmount] = useState("")

  const { start: startTxPolling } = useTxStatus()

  // Use Web3 context address (connected wallet) as authoritative
  const { address: connectedAddress, isConnected } = useWeb3();
  const ensureConnectedAddress = (): string | null => {
    if (!isConnected || !connectedAddress) {
      showToast({ variant: "error", message: "Wallet non collegato" })
      return null
    }
    return connectedAddress
  }

  const ensurePositiveAmount = (value: string, label: string): boolean => {
    const n = Number(value)
    if (!Number.isFinite(n) || n <= 0) {
      showToast({ variant: "error", message: `${label}: inserisci un importo > 0` })
      return false
    }
    return true
  }

  // Actions
  // NOTE: Withdraw (DB) removed in on-chain-only MVP

  const handleMint = async () => {
    const addr = ensureConnectedAddress()
    if (!addr) return
    if (!ensurePositiveAmount(mintAmount, "Mint amount")) return

    setMinting(true)
    try {
      const to = addr.trim()
      // Use server-side onchain mint endpoint (server pays gas)
      const res = await onchainMint(mintAmount, to)
  if (res.ok) {
  const data = res.data as { tx_hash?: string; tx_id?: number } | undefined
  const hash = data?.tx_hash ?? null
  const id = data?.tx_id != null ? String(data.tx_id) : null
  const identifier = hash || id
  setTxHash(hash || id)
  showToast({ variant: "info", message: `Mint submitted: ${identifier}` })
  if (identifier) startTxPolling(identifier)
      } else {
        showToast({ variant: "error", message: `Mint failed: ${String(res.error)}` })
      }
    } catch (e) {
      showToast({ variant: "error", message: `Mint error: ${String(e)}` })
    } finally {
      setMinting(false)
    }
  }

  const handleBurn = async () => {
  const addr = ensureConnectedAddress()
  if (!addr) return
    if (!ensurePositiveAmount(burnAmount, "Burn amount")) return

    setBurning(true)
    try {
      const res = await burnTokens(burnAmount)
  if (res.ok) {
  const hash = (res as unknown as { hash?: string }).hash ?? null
  setTxHash(hash)
  showToast({ variant: "info", message: `Burn tx sent: ${hash}` })
  if (hash) {
    // Inform backend about the burn so it can verify & credit DB (deposit-from-burn)
    try {
      const verifyRes = await verifyDeposit(hash);
      if (verifyRes.ok) {
        const data = verifyRes.data as Record<string, unknown> | undefined;
        const identifier = (data && (data.tx_hash ?? data.tx_id)) ?? hash;
        // start centralized polling on canonical identifier
        startTxPolling(String(identifier));
      } else {
        // Backend did not accept immediately; still start polling by hash
        startTxPolling(hash);
      }
    } catch (e) {
      // network error while notifying backend — still poll by hash
      startTxPolling(hash);
    }
  }
      } else {
        showToast({ variant: "error", message: `Burn failed: ${String(res.error)}` })
      }
    } catch (e) {
      showToast({ variant: "error", message: `Burn error: ${String(e)}` })
    } finally {
      setBurning(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Mint (server-side) */}
      <Card className="h-full">
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="text-sm font-semibold">Mint (server-side)</div>
          <p className="text-xs text-muted-foreground">Mint (gas pagato dalla piattaforma)</p>
          <div className="grid grid-cols-1 gap-2">
            {/* Mint uses the currently connected wallet address */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium">Amount</label>
              <Input
                inputMode="decimal"
                placeholder="es. 5"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleMint}
            disabled={minting || !isConnected}
            aria-busy={minting}
            className="w-full"
          >
            {minting ? "Minting…" : "Mint (gas pagato dalla piattaforma)"}
          </Button>
        </CardContent>
      </Card>

      {/* Burn (on-chain) */}
      <Card className="h-full">
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="text-sm font-semibold">Burn (on-chain)</div>
          <p className="text-xs text-muted-foreground">Burn (gas pagato da te)</p>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Amount to burn</label>
            <Input
              inputMode="decimal"
              placeholder="es. 5"
              value={burnAmount}
              onChange={(e) => setBurnAmount(e.target.value)}
            />
          </div>
          <Button
            variant="destructive"
            size="md"
            onClick={handleBurn}
            disabled={burning}
            aria-busy={burning}
            className="w-full"
          >
            {burning ? "Burning…" : "Burn (gas pagato da te)"}
          </Button>
        </CardContent>
      </Card>

      {/* Transaction status full-width */}
      <Card className="md:col-span-2">
        <CardContent className="p-4 text-sm space-y-1">
              {txHash && <TxStatusPanel identifier={txHash} />}
        </CardContent>
      </Card>
    </div>
  )
}

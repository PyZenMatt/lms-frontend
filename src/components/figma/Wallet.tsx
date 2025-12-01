import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { 
  Wallet as WalletIcon, 
  Sparkles, 
  Copy, 
  TrendingUp,
  Target,
  ArrowDownToLine,
  ArrowUpFromLine,
  ExternalLink,
  AlertCircle,
  Loader2
} from "lucide-react"
import { useAuth } from "./AuthContext"
import { toast } from "sonner"
import { getTransactions, getDbWallet, submitBurnDeposit, requestWithdraw, getWallet } from "../../services/wallet"
import { getTxStatus } from "../../features/wallet/walletApi"
import type { WalletTransaction } from "../../services/wallet"
import { useWeb3 } from "@/web3/context"
import { burnTokens } from "onchain/ethersWeb3"
import Input from "@/components/ui/input"

// Polygonscan base URL for Amoy testnet
const POLYGONSCAN_BASE = "https://amoy.polygonscan.com/tx/"

export function Wallet() {
  const { user, connectWallet, isTeacher } = useAuth()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnectWallet = async () => {
    console.log("[Wallet] handleConnectWallet CLICKED")
    setIsConnecting(true)
    try {
      const success = await connectWallet()
      console.log("[Wallet] connectWallet returned:", success)
      if (success) {
        toast("Wallet connected successfully!", {
          description: "You can now receive tokens directly to your MetaMask wallet"
        })
      } else {
        toast("Failed to connect wallet", {
          description: "Please make sure MetaMask is installed and try again"
        })
      }
    } catch (err) {
      console.error("[Wallet] connectWallet threw:", err)
      toast("Error connecting wallet", {
        description: String(err)
      })
    }
    setIsConnecting(false)
  }

  const copyWalletAddress = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress)
      toast("Address copied to clipboard")
    }
  }

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Web3 context for connected wallet
  const { address: connectedAddress, isConnected, getContract } = useWeb3()

  // DB balance state
  const [dbBalance, setDbBalance] = useState<number>(0)
  const [onChainBalance, setOnChainBalance] = useState<number | null>(null)
  const [loadingBalances, setLoadingBalances] = useState(true)

  // Deposit state
  const [depositAmount, setDepositAmount] = useState("")
  const [isDepositing, setIsDepositing] = useState(false)
  const [depositTxHash, setDepositTxHash] = useState<string | null>(null)

  // Withdraw state
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [withdrawTxHash, setWithdrawTxHash] = useState<string | null>(null)

  // Linked wallet address (from user profile)
  const linkedWalletAddress = user?.walletAddress || null

  // Wallet mismatch check
  const walletMismatch = isConnected && linkedWalletAddress && 
    connectedAddress?.toLowerCase() !== linkedWalletAddress.toLowerCase()

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    setLoadingBalances(true)
    try {
      // Fetch DB balance
      const walletRes = await getWallet()
      if (walletRes.ok && walletRes.data) {
        setDbBalance(walletRes.data.balance_teo || 0)
      }

      // Fetch on-chain balance if connected
      if (isConnected && connectedAddress) {
        try {
          const contract = await getContract()
          if (contract) {
            const balanceWei = await contract.balanceOf(connectedAddress)
            const decimals = await contract.decimals()
            const balanceNum = Number(balanceWei) / Math.pow(10, Number(decimals))
            setOnChainBalance(balanceNum)
          }
        } catch (e) {
          console.debug("[Wallet] Failed to fetch on-chain balance", e)
          setOnChainBalance(null)
        }
      }
    } catch (e) {
      console.debug("[Wallet] Failed to fetch balances", e)
    } finally {
      setLoadingBalances(false)
    }
  }, [isConnected, connectedAddress, getContract])

  // Fetch balances on mount and when connection changes
  useEffect(() => {
    fetchBalances()
  }, [fetchBalances])

  // Handle Deposit (Burn → Backend verify → DB credit)
  const handleDeposit = async () => {
    // Validation
    if (!linkedWalletAddress) {
      toast.error("Nessun wallet collegato al tuo account. Collega prima il wallet.")
      return
    }

    if (!isConnected || !connectedAddress) {
      toast.error("Connetti prima il wallet MetaMask")
      return
    }

    if (walletMismatch) {
      toast.error(`Il wallet connesso (${formatWalletAddress(connectedAddress)}) non corrisponde al wallet collegato (${formatWalletAddress(linkedWalletAddress)}). Connetti il wallet corretto.`)
      return
    }

    const amount = Number(depositAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Inserisci un importo valido maggiore di 0")
      return
    }

    if (onChainBalance !== null && amount > onChainBalance) {
      toast.error(`Saldo on-chain insufficiente. Disponibile: ${onChainBalance.toFixed(4)} TEO`)
      return
    }

    setIsDepositing(true)
    setDepositTxHash(null)

    try {
      // Step 1: Burn tokens on-chain (user pays gas)
      toast.info("Conferma la transazione burn nel wallet...")
      console.log("[Wallet] handleDeposit: calling burnTokens with amount:", depositAmount)
      const burnRes = await burnTokens(depositAmount)
      console.log("[Wallet] handleDeposit: burnTokens result:", burnRes)
      
      if (!burnRes.ok) {
        if (burnRes.error === 'user_rejected') {
          toast.error("Transazione annullata dall'utente")
        } else {
          toast.error(`Burn fallito: ${burnRes.error}`)
        }
        setIsDepositing(false)
        return
      }

      const txHash = burnRes.hash
      console.log("[Wallet] handleDeposit: burn successful, txHash:", txHash)
      setDepositTxHash(txHash)
      toast.success("Burn completato! Verifica in corso...", {
        description: `TX: ${txHash.slice(0, 10)}...`,
        action: {
          label: "Vedi su Polygonscan",
          onClick: () => window.open(`${POLYGONSCAN_BASE}${txHash}`, "_blank")
        }
      })

      // Step 2: Submit to backend for verification
      console.log("[Wallet] handleDeposit: calling submitBurnDeposit with txHash:", txHash, "amount:", depositAmount)
      const verifyRes = await submitBurnDeposit(txHash, depositAmount)
      console.log("[Wallet] handleDeposit: submitBurnDeposit result:", verifyRes)
      
      if (verifyRes.ok && verifyRes.data?.success) {
        toast.success("Deposito completato!", {
          description: `${depositAmount} TEO accreditati al tuo saldo DB`
        })
        setDepositAmount("")
        // Refresh balances
        await fetchBalances()
      } else {
        const errorMsg = verifyRes.data?.error || verifyRes.error || "Verifica fallita"
        toast.error(`Verifica deposito fallita: ${errorMsg}`)
      }
    } catch (e) {
      toast.error(`Errore deposito: ${String(e)}`)
    } finally {
      setIsDepositing(false)
    }
  }

  // Handle Withdraw (DB debit → Server mint → User wallet)
  const handleWithdraw = async () => {
    // Validation
    if (!linkedWalletAddress) {
      toast.error("Nessun wallet collegato al tuo account. Collega prima il wallet.")
      return
    }

    const amount = Number(withdrawAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Inserisci un importo valido maggiore di 0")
      return
    }

    if (amount > dbBalance) {
      toast.error(`Saldo DB insufficiente. Disponibile: ${dbBalance.toFixed(4)} TEO`)
      return
    }

    setIsWithdrawing(true)
    setWithdrawTxHash(null)

    try {
      toast.info("Richiesta prelievo in corso...")
      const res = await requestWithdraw(withdrawAmount, linkedWalletAddress)
      
      if (res.ok && res.data?.success) {
        const txHash = res.data.transaction_hash
        setWithdrawTxHash(txHash || null)
        
        toast.success("Prelievo completato!", {
          description: `${withdrawAmount} TEO inviati al tuo wallet`,
          action: txHash ? {
            label: "Vedi su Polygonscan",
            onClick: () => window.open(`${POLYGONSCAN_BASE}${txHash}`, "_blank")
          } : undefined
        })
        setWithdrawAmount("")
        // Refresh balances
        await fetchBalances()
      } else {
        const errorMsg = res.data?.error || res.error || "Prelievo fallito"
        toast.error(`Prelievo fallito: ${errorMsg}`)
      }
    } catch (e) {
      toast.error(`Errore prelievo: ${String(e)}`)
    } finally {
      setIsWithdrawing(false)
    }
  }

  // Real transaction history (fetched)
  const [recentTransactions, setRecentTransactions] = useState<WalletTransaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true)
  const [txPage, setTxPage] = useState<number>(1)
  const [txCount, setTxCount] = useState<number | null>(null)
  const [txHasMore, setTxHasMore] = useState<boolean>(false)
  const [txNext, setTxNext] = useState<string | null>(null)
  const [txPrevious, setTxPrevious] = useState<string | null>(null)

  // staking info (teacher-only)
  const [stakingInfo, setStakingInfo] = useState<{ staked?: number; available?: number; total?: number } | null>(null)

  const nextMilestones = [
    { name: 'Art Enthusiast', requirement: 300, reward: 50, current: user?.tokens || 0 },
    { name: 'Community Helper', requirement: 500, reward: 100, current: user?.tokens || 0 },
    { name: 'Master Critic', requirement: 1000, reward: 200, current: user?.tokens || 0 },
  ]

  // helper to load a page; if append=true, append to existing list (for retro history)
  // silent=true will avoid setting the global loading spinner (used by polling)
  // stable key generator for transactions (fall back to composite fields when id missing)
  const getTxKey = useCallback((tx: WalletTransaction) => {
    const asRec = tx as unknown as Record<string, unknown>
    const id = asRec.id ?? asRec.reference ?? asRec.tx_hash ?? asRec.hash
    if (id !== undefined && id !== null) return String(id)
    // fallback composite key
    const t = String(asRec.type ?? '')
    const d = String(asRec.created_at ?? '')
    const a = String(asRec.amount_teo ?? asRec.amount ?? asRec.value ?? '')
    return `${t}:${d}:${a}`
  }, [])

  // Merge and deduplicate transactions by stable key (preserves order: prev then next)
  const mergeUniqueByKey = useCallback((prev: WalletTransaction[], next: WalletTransaction[]) => {
    const seen = new Set<string>()
    const out: WalletTransaction[] = []
    for (const p of prev) {
      const k = getTxKey(p)
      if (!seen.has(k)) {
        seen.add(k)
        out.push(p)
      }
    }
    for (const n of next) {
      const k = getTxKey(n)
      if (!seen.has(k)) {
        seen.add(k)
        out.push(n)
      }
    }
    return out
  }, [getTxKey])

  const loadPage = useCallback(async (pageOrUrl: number | string, append = false, silent = false) => {
    if (!silent) setLoadingTransactions(true)
    try {
      let res
      if (typeof pageOrUrl === 'string') {
        res = await getTransactions(1, 10, pageOrUrl)
      } else {
        res = await getTransactions(pageOrUrl, 10)
      }
  if (res.ok) {
        const pageData = res.data
        const results = pageData.results || []
        // If server returns an empty page, avoid advancing pagination pointers
        if (append && results.length === 0) {
          // Nothing to append; keep current state
          setLoadingTransactions(false)
          return
        }
  setRecentTransactions((prev) => (append ? mergeUniqueByKey(prev, results) : results))
        setTxCount(pageData.count ?? null)
        setTxHasMore(Boolean(pageData.next))
        setTxNext(typeof pageData.next === 'string' ? pageData.next : null)
        setTxPrevious(typeof pageData.previous === 'string' ? pageData.previous : null)
      } else {
        if (!silent) toast("Failed to load transactions", { description: `Status ${res.status}` })
      }
    } catch (err) {
      if (!silent) toast("Failed to load transactions", { description: String(err) })
    } finally {
      if (!silent) setLoadingTransactions(false)
    }
  }, [mergeUniqueByKey])

  // Helper to read status from various shapes
  const extractStatus = (obj: Record<string, unknown> | undefined): string => {
    if (!obj) return ''
    const candidates = [
      'status', 'state', 'transaction_status', 'status_display', 'tx_status', 'processing_status',
    ]
    for (const k of candidates) {
      const v = obj[k]
      if (v && typeof v === 'string') return v
    }
    // nested shapes
    const nested = (obj['data'] as Record<string, unknown> | undefined) ?? (obj['result'] as Record<string, unknown> | undefined) ?? (obj['payload'] as Record<string, unknown> | undefined)
    if (nested) {
      for (const k of ['status', 'state', 'status_display']) {
        const v = nested[k]
        if (v && typeof v === 'string') return v
      }
    }
    return ''
  }

  useEffect(() => {
    let mounted = true
  // initial load replaces existing list
  if (mounted) loadPage(txPage, false)
    return () => { mounted = false }
  }, [txPage, loadPage])

  // Fetch staking/balance info for teachers (reads DB wallet raw payload for staked/available)
  useEffect(() => {
    let mounted = true
    if (!isTeacher) return
    ;(async () => {
      try {
        const res = await getDbWallet()
        if (!mounted) return
        if (!res.ok) return
        const raw = res.data as unknown
        // Try common shapes: { raw: { balance: { ... } } } or { balance: { ... } } or direct balance object
        let b: Record<string, unknown> | undefined
        if (raw && typeof raw === 'object') {
          const top = raw as Record<string, unknown>
          if (top.balance && typeof top.balance === 'object') b = top.balance as Record<string, unknown>
          else if (top.raw && typeof top.raw === 'object' && (top.raw as Record<string, unknown>).balance && typeof (top.raw as Record<string, unknown>).balance === 'object') b = (top.raw as Record<string, unknown>).balance as Record<string, unknown>
          else if (top.raw && typeof top.raw === 'object' && typeof (top.raw as Record<string, unknown>)?.staked_balance !== 'undefined') b = top.raw as Record<string, unknown>
          else if (typeof top.staked_balance !== 'undefined' || typeof top.available_balance !== 'undefined' || typeof top.total_balance !== 'undefined') b = top
        }
        if (!b) return
        const st = Number(b.staked_balance ?? b.staked ?? b.staked_teo)
        const av = Number(b.available_balance ?? b.available ?? b.available_teo)
        const tot = Number(b.total_balance ?? b.total ?? b.balance_teo)
        setStakingInfo({ staked: Number.isFinite(st) ? st : undefined, available: Number.isFinite(av) ? av : undefined, total: Number.isFinite(tot) ? tot : undefined })
      } catch (e) {
        console.debug('[Wallet] fetch staking info failed', e)
      }
    })()
    return () => { mounted = false }
  }, [isTeacher])

  // Polling: query per-transaction status for any non-final transactions and update them individually.
  useEffect(() => {
    const FINAL = new Set(["completed", "failed", "succeeded", "ok"])
    let timer: number | null = null

    const nonFinal = recentTransactions.filter((t) => {
      const s = String(extractStatus(t as Record<string, unknown>) ?? "").toLowerCase()
      return s && !FINAL.has(s)
    })

    if (nonFinal.length === 0) return

    // poll every 5s and check each non-final tx via getTxStatus
  timer = window.setInterval(async () => {
        for (const tx of nonFinal) {
        const identifier = String((tx as Record<string, unknown>).reference ?? tx.id)
        try {
          const res = await getTxStatus(identifier)
          if (res.ok && res.data) {
            const remoteStatus = String(extractStatus(res.data as Record<string, unknown>) ?? '')
            const localStatus = String(extractStatus(tx as Record<string, unknown>) ?? '')
            if (remoteStatus && remoteStatus !== localStatus) {
        setRecentTransactions((prev) => prev.map((p) => getTxKey(p as WalletTransaction) === getTxKey(tx as WalletTransaction) ? { ...p, status: remoteStatus } : p))
            }
          }
        } catch (e) {
          console.debug('[Wallet] getTxStatus failed', e)
        }
      }
    }, 5000)

    return () => { if (timer) window.clearInterval(timer) }
  }, [recentTransactions, getTxKey])

  // Periodic silent page refresh to pick up any backend-driven status changes
  useEffect(() => {
    const interval = window.setInterval(() => {
      // silent refresh to avoid spinner
      loadPage(txPage, false, true).catch(() => {})
    }, 30000) // every 30s
    return () => window.clearInterval(interval)
  }, [txPage, loadPage])

  // simple pagination handlers
  // Prefer using server-provided next/previous links when available.
  const handleNextPage = async () => {
    if (txNext) {
      // If backend provides a `next` URL, follow it instead of blindly incrementing the numeric page.
      await loadPage(txNext, false)
      return
    }
    if (txHasMore) {
      setTxPage((p) => p + 1)
      return
    }
    toast("No next page")
  }

  const handlePrevPage = async () => {
    if (txPrevious) {
      await loadPage(txPrevious, false)
      return
    }
    setTxPage((p) => Math.max(1, p - 1))
  }

  const handleLoadPrevious = async () => {
    if (!txPrevious) {
      // fallback to numeric prev
      handlePrevPage()
      return
    }
    await loadPage(txPrevious, false)
  }

  const handleLoadMore = async () => {
    if (!txHasMore) {
      toast("No older transactions available")
      return
    }
    // prefer using next link if available
    if (txNext) {
      await loadPage(txNext, true)
      // we don't attempt to derive numeric page from the URL; leave txPage as-is
      return
    }
    const nextPage = txPage + 1
    await loadPage(nextPage, true)
    setTxPage(nextPage)
  }

  const handleLoadAllHistory = async () => {
    // fetch pages until no more next. Cap pages to avoid accidental huge downloads.
    const MAX_PAGES = 50
    let page = txPage
    let pagesFetched = 0
    while (pagesFetched < MAX_PAGES) {
      if (!txHasMore && page !== txPage) break
      const res = await getTransactions(page + 1, 50)
      pagesFetched += 1
      if (!res.ok) break
      const results = res.data.results || []
      // merge and deduplicate using the stable key generator
      setRecentTransactions((prev) => mergeUniqueByKey(prev, results))
      setTxCount(res.data.count ?? null)
      const hasNext = Boolean(res.data.next)
      setTxHasMore(hasNext)
      page = page + 1
      if (!hasNext) break
    }
    if (pagesFetched >= MAX_PAGES) toast("Reached maximum pages while loading history")
  }

  // derive filtered lists for UI: DB-backed vs on-chain/request-like
  const dbTransactions = recentTransactions.filter((tx) => {
    const obj = tx as Record<string, unknown>
    // consider a tx 'DB' if it doesn't expose on-chain markers like status/tx_hash/explorer_url
    if (obj['status'] || obj['tx_hash'] || obj['explorer_url']) return false
    return true
  })

  const onchainTransactions = recentTransactions.filter((tx) => {
    const obj = tx as Record<string, unknown>
    const desc = String(obj.description ?? '').toLowerCase()
    return Boolean(obj['status'] || obj['tx_hash'] || obj['explorer_url'] || desc.includes('burn requested') || desc.includes('mint requested'))
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Your Wallet</h1>
          <p className="text-muted-foreground">Manage your Creator Tokens and rewards</p>
        </div>
      </div>

      {/* Token Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 text-gray-900">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="size-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Sparkles className="size-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-gray-900">Creator Token Balance</CardTitle>
                <CardDescription className="text-gray-600">Your learning and community contributions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-medium text-gray-900">{user?.tokens || 0}</span>
              <span className="text-xl text-gray-500">✨</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="size-4" />
                <span>+23 this week</span>
              </div>
              <div className="text-gray-600">
                Rank #{42} in community
              </div>
            </div>
          </CardContent>
        </Card>

  <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">MetaMask Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user?.walletAddress ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Connected</span>
                  <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800">
                    Active
                  </Badge>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono">
                      {formatWalletAddress(user.walletAddress)}
                    </span>
                    <Button variant="ghost" size="sm" onClick={copyWalletAddress}>
                      <Copy className="size-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Tokens can be transferred to this wallet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Connect MetaMask to receive tokens directly in your wallet
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="w-full"
                >
                  <WalletIcon className="size-4 mr-2" />
                  Connect Wallet
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teacher-only staking summary */}
        {isTeacher ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Staking</CardTitle>
              <CardDescription>Staking overview (teacher only)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stakingInfo ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Staked</div>
                    <div className="text-sm font-medium">{typeof stakingInfo.staked === 'number' ? stakingInfo.staked.toFixed(8) : '-'}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Available</div>
                    <div className="text-sm font-medium">{typeof stakingInfo.available === 'number' ? stakingInfo.available.toFixed(8) : '-'}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-sm font-medium">{typeof stakingInfo.total === 'number' ? stakingInfo.total.toFixed(8) : '-'}</div>
                  </div>
                  <div className="pt-2">
                    <Button variant="outline" size="sm" onClick={() => { window.location.href = '/teacher/staking' }}>Manage staking</Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Staking data unavailable</div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>

      {/* Deposit & Withdraw Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Deposit Card */}
        <Card className="border-green-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-green-100 rounded-full flex items-center justify-center">
                <ArrowDownToLine className="size-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base">Deposita TeoCoin</CardTitle>
                <CardDescription>Trasferisci TEO dal wallet alla piattaforma</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Balance display */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Saldo On-Chain:</span>
                <span className="font-medium">
                  {loadingBalances ? (
                    <Loader2 className="size-4 animate-spin inline" />
                  ) : onChainBalance !== null ? (
                    `${onChainBalance.toFixed(4)} TEO`
                  ) : (
                    "—"
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Saldo DB:</span>
                <span className="font-medium">{dbBalance.toFixed(4)} TEO</span>
              </div>
            </div>

            {/* Wallet mismatch warning */}
            {walletMismatch && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Wallet non corrispondente</p>
                  <p className="text-xs mt-1">
                    Connesso: {connectedAddress ? formatWalletAddress(connectedAddress) : "—"}
                    <br />
                    Collegato: {linkedWalletAddress ? formatWalletAddress(linkedWalletAddress) : "—"}
                  </p>
                </div>
              </div>
            )}

            {/* Deposit form */}
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Importo da depositare</label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="es. 10.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  disabled={isDepositing}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleDeposit}
                disabled={isDepositing || !isConnected || !linkedWalletAddress || walletMismatch}
              >
                {isDepositing ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Deposito in corso...
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="size-4 mr-2" />
                    Deposita
                  </>
                )}
              </Button>
            </div>

            {/* Last deposit tx */}
            {depositTxHash && (
              <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-700">Ultimo deposito:</span>
                  <a
                    href={`${POLYGONSCAN_BASE}${depositTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline flex items-center gap-1"
                  >
                    {depositTxHash.slice(0, 10)}...
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Help text */}
            <p className="text-xs text-muted-foreground">
              Trasferisci TEO dal tuo wallet MetaMask al saldo della piattaforma.
              La fee di rete è a tuo carico.
            </p>
          </CardContent>
        </Card>

        {/* Withdraw Card */}
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-blue-100 rounded-full flex items-center justify-center">
                <ArrowUpFromLine className="size-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Preleva TeoCoin</CardTitle>
                <CardDescription>Trasferisci TEO dalla piattaforma al wallet</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Balance display */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Saldo DB disponibile:</span>
                <span className="font-medium">{dbBalance.toFixed(4)} TEO</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Wallet destinazione:</span>
                <span className="font-mono text-xs">
                  {linkedWalletAddress ? formatWalletAddress(linkedWalletAddress) : "Non collegato"}
                </span>
              </div>
            </div>

            {/* No wallet warning */}
            {!linkedWalletAddress && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  Collega prima un wallet MetaMask per prelevare i tuoi TEO.
                </div>
              </div>
            )}

            {/* Withdraw form */}
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Importo da prelevare</label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  max={dbBalance}
                  placeholder="es. 10.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  disabled={isWithdrawing}
                />
              </div>
              <Button
                className="w-full"
                variant="outline"
                onClick={handleWithdraw}
                disabled={isWithdrawing || !linkedWalletAddress || dbBalance <= 0}
              >
                {isWithdrawing ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Prelievo in corso...
                  </>
                ) : (
                  <>
                    <ArrowUpFromLine className="size-4 mr-2" />
                    Preleva
                  </>
                )}
              </Button>
            </div>

            {/* Last withdraw tx */}
            {withdrawTxHash && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-700">Ultimo prelievo:</span>
                  <a
                    href={`${POLYGONSCAN_BASE}${withdrawTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {withdrawTxHash.slice(0, 10)}...
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Help text */}
            <p className="text-xs text-muted-foreground">
              Preleva TEO dal saldo interno e ricevili direttamente nel tuo wallet MetaMask.
              Il gas è a carico della piattaforma.
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Attività</TabsTrigger>
          <TabsTrigger value="requests">Prelievi</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="rewards">Premi</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attività Recenti</CardTitle>
              <CardDescription>Storico delle transazioni sulla piattaforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {loadingTransactions ? (
                  <div className="space-y-2">
                    {[1,2,3].map((s) => (
                      <div key={s} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="size-8 bg-green-100 rounded-full" />
                          <div className="w-40 h-4 bg-muted/50 rounded" />
                        </div>
                        <div className="w-12 h-4 bg-muted/50 rounded" />
                      </div>
                    ))}
                  </div>
                ) : recentTransactions.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">Nessuna transazione.</div>
                ) : (
                  // show only DB-backed transactions in this tab
                  dbTransactions.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">Nessuna transazione trovata.</div>
                  ) : (
                    dbTransactions.map((tx) => {
                      const txRec = tx as unknown as Record<string, unknown>
                      const dateLabel = tx.created_at ? new Date(tx.created_at).toLocaleString() : ''
                      const amountVal = Number(tx.amount_teo ?? tx.amount ?? tx.value)

                      const rawDesc = String(tx.description ?? tx.type ?? '')
                      const rawDescLower = rawDesc.toLowerCase()
                      const rawType = String(txRec.transaction_type ?? txRec.type ?? '').toLowerCase()
                      const amountDisplay = Number.isFinite(amountVal) ? Math.abs(amountVal).toFixed(2) : '?'
                      
                      // Determine transaction type and icon
                      let mainLabel = rawDesc
                      let iconBg = 'bg-gray-100'
                      let iconColor = 'text-gray-600'
                      let Icon = TrendingUp
                      
                      if (rawDescLower.includes('deposit') || rawDescLower.includes('burn') || rawType === 'deposit') {
                        mainLabel = `Deposito`
                        iconBg = 'bg-green-100'
                        iconColor = 'text-green-600'
                        Icon = ArrowDownToLine
                      } else if (rawDescLower.includes('withdraw') || rawDescLower.includes('mint') || rawType === 'withdrawal') {
                        mainLabel = `Prelievo`
                        iconBg = 'bg-blue-100'
                        iconColor = 'text-blue-600'
                        Icon = ArrowUpFromLine
                      } else if (rawDescLower.includes('purchase') || rawDescLower.includes('corso')) {
                        mainLabel = `Acquisto corso`
                        iconBg = 'bg-purple-100'
                        iconColor = 'text-purple-600'
                      } else if (rawDescLower.includes('reward') || rawDescLower.includes('earned')) {
                        mainLabel = `Ricompensa`
                        iconBg = 'bg-amber-100'
                        iconColor = 'text-amber-600'
                        Icon = Sparkles
                      }

                      // Get blockchain tx hash if available
                      const blockchainTxHash = String(txRec.blockchain_tx_hash ?? txRec.tx_hash ?? txRec.transaction_hash ?? '')

                      const amt = Number(amountVal)
                      const amountKnown = Number.isFinite(amt)
                      let cls = 'bg-gray-50 text-gray-800'
                      if (amountKnown) {
                        if (amt > 0) cls = 'bg-green-50 text-green-800'
                        else if (amt < 0) cls = 'bg-red-50 text-red-800'
                      }
                      const label = amountKnown ? `${amt >= 0 ? '+' : ''}${amt.toFixed(2)} TEO` : amountDisplay

                      return (
                        <div key={getTxKey(tx)} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`size-8 ${iconBg} rounded-full flex items-center justify-center`}>
                              <Icon className={`size-4 ${iconColor}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{mainLabel}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-muted-foreground">{dateLabel}</p>
                                {blockchainTxHash && blockchainTxHash.startsWith('0x') && (
                                  <a
                                    href={`${POLYGONSCAN_BASE}${blockchainTxHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                                  >
                                    {blockchainTxHash.slice(0, 8)}...
                                    <ExternalLink className="size-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={cls}>{label}</Badge>
                          </div>
                        </div>
                      )
          })
        ))}
                {/* Pagination */}
                <div className="flex items-center justify-end gap-2 mt-3">
                  <Button variant="ghost" size="sm" onClick={handleLoadPrevious} disabled={txPage <= 1 && !txPrevious}>Prec</Button>
                  <div className="text-sm text-muted-foreground">Pagina {txPage}{txCount ? ` • ${txCount} totali` : ''}</div>
                  <Button variant="ghost" size="sm" onClick={handleNextPage} disabled={!txHasMore && !txNext}>Succ</Button>
                </div>
                <div className="flex items-center justify-end gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={!txHasMore || loadingTransactions}>Carica precedenti</Button>
                  <Button variant="outline" size="sm" onClick={handleLoadAllHistory} disabled={loadingTransactions}>Carica tutta la storia</Button>
                </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Richieste Prelievo</CardTitle>
              <CardDescription>Storico dei prelievi verso il tuo wallet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingTransactions ? (
                <div className="p-4 text-sm text-muted-foreground">Caricamento...</div>
              ) : (
                onchainTransactions.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">Nessun prelievo effettuato.</div>
                ) : (
                  onchainTransactions.map((tx) => {
                    const txRec = tx as unknown as Record<string, unknown>
                    const dateLabel = tx.created_at ? new Date(tx.created_at).toLocaleString() : ''
                    const amountVal = Number(tx.amount_teo ?? tx.amount ?? tx.value)
                    const rawDesc = String(tx.description ?? tx.type ?? '')
                    const rawDescLower = rawDesc.toLowerCase()
                    const rawType = String(txRec.transaction_type ?? txRec.type ?? '').toLowerCase()
                    const amountDisplay = Number.isFinite(amountVal) ? Math.abs(amountVal).toFixed(2) : '?'
                    
                    // Determine transaction type
                    let mainLabel = rawDesc
                    let iconBg = 'bg-gray-100'
                    let iconColor = 'text-gray-600'
                    let Icon = TrendingUp
                    
                    if (rawDescLower.includes('deposit') || rawDescLower.includes('burn') || rawType === 'deposit') {
                      mainLabel = `Deposito`
                      iconBg = 'bg-green-100'
                      iconColor = 'text-green-600'
                      Icon = ArrowDownToLine
                    } else if (rawDescLower.includes('withdraw') || rawDescLower.includes('mint') || rawType === 'withdrawal') {
                      mainLabel = `Prelievo`
                      iconBg = 'bg-blue-100'
                      iconColor = 'text-blue-600'
                      Icon = ArrowUpFromLine
                    }

                    // Get blockchain tx hash
                    const blockchainTxHash = String(txRec.blockchain_tx_hash ?? txRec.tx_hash ?? txRec.transaction_hash ?? '')

                    const amt = Number(amountVal)
                    const amountKnown = Number.isFinite(amt)
                    const label = amountKnown ? `${Math.abs(amt).toFixed(2)} TEO` : amountDisplay

                    const rawStatus = String(extractStatus(tx as Record<string, unknown>) ?? '')
                    const s = rawStatus.toLowerCase()
                    let statusLabel = ''
                    let statusCls = 'bg-gray-100 text-gray-800'
                    
                    if (['completed', 'succeeded', 'ok', 'approved'].includes(s)) {
                      statusLabel = 'Completato'
                      statusCls = 'bg-green-50 text-green-800'
                    } else if (['pending', 'processing', 'queued', 'waiting'].includes(s)) {
                      statusLabel = 'In elaborazione'
                      statusCls = 'bg-amber-50 text-amber-800'
                    } else if (['failed', 'error', 'rejected'].includes(s)) {
                      statusLabel = 'Fallito'
                      statusCls = 'bg-red-50 text-red-800'
                    } else if (s) {
                      statusLabel = s.charAt(0).toUpperCase() + s.slice(1)
                    }

                    return (
                      <div key={getTxKey(tx)} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`size-8 ${iconBg} rounded-full flex items-center justify-center`}>
                            <Icon className={`size-4 ${iconColor}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{mainLabel}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-muted-foreground">{dateLabel}</p>
                              {blockchainTxHash && blockchainTxHash.startsWith('0x') && (
                                <a
                                  href={`${POLYGONSCAN_BASE}${blockchainTxHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
                                  title="Vedi su Polygonscan"
                                >
                                  TX: {blockchainTxHash.slice(0, 8)}...
                                  <ExternalLink className="size-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-blue-50 text-blue-800">{label}</Badge>
                          {statusLabel && (
                            <Badge variant="outline" className={`${statusCls} text-xs px-2 py-0.5`}>{statusLabel}</Badge>
                          )}
                        </div>
                      </div>
                    )
                  })
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <div className="space-y-4">
            {nextMilestones.map((milestone, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <Target className="size-5 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{milestone.name}</CardTitle>
                        <CardDescription>
                          {milestone.current}/{milestone.requirement} tokens
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">+{milestone.reward} ✨</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress 
                    value={(milestone.current / milestone.requirement) * 100} 
                    className="h-2"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    {milestone.requirement - milestone.current} more tokens to unlock
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>How to Earn Creator Tokens</CardTitle>
              <CardDescription>Ways to contribute and grow in the community</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4>Learning Activities</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Complete a lesson</span>
                      <Badge variant="secondary">+5 ✨</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Submit an exercise</span>
                      <Badge variant="secondary">+10 ✨</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Finish a course</span>
                      <Badge variant="secondary">+50 ✨</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Weekly learning streak</span>
                      <Badge variant="secondary">+15 ✨</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4>Community Contributions</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Peer review feedback</span>
                      <Badge variant="secondary">+5 ✨</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Helpful forum post</span>
                      <Badge variant="secondary">+3 ✨</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Mentor a student</span>
                      <Badge variant="secondary">+20 ✨</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Create a tutorial</span>
                      <Badge variant="secondary">+100 ✨</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
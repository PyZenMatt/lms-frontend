# Mint & Burn bridge (FE summary)


This document describes the frontend responsibilities and the canonical flows for minting and burning TEO.

Principles

- The DB (backend ledger) is the canonical source of truth for balances.
- Minting must be performed by the server/deployer (server pays gas). The FE must never mint on-chain directly.
- Burning is performed by the user via MetaMask (user pays gas). After burn, the FE notifies the backend to credit the user's DB balance.

Flows

1. Mint (server-side)

- FE: user requests mint (e.g. `WalletActions` -> server endpoint `walletApi.onchainMint` or `walletApi.withdraw`).
- BE: creates on-chain mint transaction signed by deployer/minter, returns `{ tx_hash?, tx_id? }`.
- FE: uses centralized `startTxPolling` (service `src/services/txStatus.ts`) over the canonical `walletApi.getTxStatus` endpoint to follow progress until `confirmed/completed/failed`.
- BE: on confirmation, updates DB balance (moves `pending` -> `completed`) or rolls back on fail.

2. Burn (client-side)

- FE: user invokes burn via MetaMask using the on-chain adapter (`@onchain/ethersWeb3.burnTokens`).
- FE: receives `tx_hash` from user-signed tx and immediately POSTs it to the backend verify endpoint `wallet.verifyDeposit(tx_hash)` to register the burn.
- FE: starts `startTxPolling` on the canonical backend `walletApi.getTxStatus` for that `tx_hash` or returned identifier.
- BE: verifies receipt and credits the user's DB balance idempotently.

Key API endpoints

- `POST /api/v1/users/me/wallet/challenge/` — get sig challenge (SIWE-like)
- `POST /api/v1/users/me/wallet/link/` — link wallet
- `DELETE /api/v1/users/me/wallet/` — unlink wallet
- `POST /api/onchain/mint/` (or `POST /api/v1/blockchain/wallet/withdraw/`) — server-side mint/withdraw
- `GET /v1/blockchain/wallet/tx-status/{id}/` — canonical tx-status
- `POST /api/v1/blockchain/deposit/verify/` (or `POST /v1/teocoin/burn-deposit/`) — verify burn and credit DB

FE guard-rails

- No on-chain balance reads in FE: use `services/wallet.getWallet()` for any balance displayed.
- On-chain helpers are under `src/web3/*` and importable via `@onchain/*`.
- ESLint rules prevent importing `ethers` outside on-chain modules and prevent HTTP inside `@onchain/*`.

UX notes

- Mint: show message "Mint submitted (gas platform)" + progress panel; do not prompt MetaMask.
- Burn: show message "Burn submitted (fee paid by you)"; if user rejects tx, show "User rejected"; on success, show TxStatusPanel.

If you need to change endpoints, update `src/features/wallet/walletApi.ts` which centralizes REST variants and fallbacks.

// Types for wallet SIWE-lite flow
export type WalletChallenge = {
  nonce: string;
  message?: string;
};

export type WalletLinkResponse = {
  status: "ok" | "error";
  wallet_address?: string;
  message?: string;
  error_code?: string;
};

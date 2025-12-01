// Re-export the application's central AuthProvider and hook so figma/demo
// components use the real provider instead of a local duplicate. This
// avoids duplicate contexts, runtime errors and TypeScript issues.
import React from "react";
import { AuthProvider as AppAuthProvider, useAuth as useAppAuth } from "@/context/AuthContext";
import { API } from "@/lib/config";
import { api } from "@/lib/api";
import { getProfile } from "@/services/profile";
import { getDbWallet } from "@/services/wallet";
import { getChallenge, linkWallet } from "@/features/wallet/walletApi";

type FigmaUser = {
	id: string;
	name: string;
	email: string;
	role: "student" | "teacher";
	walletAddress?: string;
	tokens: number;
	avatar?: string;
};

type FigmaAuthCtx = {
	user: FigmaUser | null;
	login: (email: string, password: string) => Promise<boolean>;
	logout: () => void;
	signup: (name: string, email: string, password: string, role: "student" | "teacher") => Promise<boolean>;
	connectWallet: () => Promise<boolean>;
	updateTokens: (amount: number) => void;
	isAuthenticated: boolean;
	isTeacher: boolean;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
	return <AppAuthProvider>{children}</AppAuthProvider>;
}

export function useAuth(): FigmaAuthCtx {
	const app = useAppAuth();

	const [user, setUser] = React.useState<FigmaUser | null>(() => {
		try {
			const s = localStorage.getItem("artlearn_user");
			return s ? (JSON.parse(s) as FigmaUser) : null;
		} catch {
			return null;
		}
	});

	React.useEffect(() => {
		let mounted = true;

		const syncLocalUser = async () => {
			try {
				const s = localStorage.getItem("artlearn_user");
				if (s) {
					if (mounted) setUser(JSON.parse(s) as FigmaUser);
					return;
				}
			} catch (e) {
				// fallthrough
			}

			// If central auth reports authenticated, try to fetch profile+wallet
			if (app.isAuthenticated) {
				try {
					const profile = await getProfile();
					if (profile) {
						const walletRes = await getDbWallet();
						const tokensCount = (walletRes && (walletRes as any).ok) ? ((walletRes as any).data.balance_teo ?? 0) : 0;
						const profileRec = profile as Record<string, unknown>;
						const artUser: FigmaUser = {
							id: profileRec?.id ? String(profileRec.id) : (profile.username ?? profile.email ?? "") as string,
							name: (profile.username ?? ((`${profile.first_name ?? ""} ${profile.last_name ?? ""}`).trim() || profile.email || "User")) as string,
							email: profile.email ?? "",
							role: (profile.role ?? "student") as "student" | "teacher",
							tokens: Number.isFinite(Number(tokensCount)) ? Number(tokensCount) : 0,
							avatar: profile.avatar ?? undefined,
						};
						try { localStorage.setItem("artlearn_user", JSON.stringify(artUser)); } catch (err) { console.debug('[FigmaShim] save backend user failed', err); }
						if (mounted) setUser(artUser);
						return;
					}
				} catch (err) { console.debug('[FigmaShim] sync profile failed', err); }
			} else {
				// If central auth is not authenticated, but tokens exist in localStorage
				// (maybe stored by other parts of the app), try to bootstrap the central
				// auth by calling app.setSession so the provider becomes authenticated
				// and the normal profile-sync path runs.
				try {
					// Try several storage keys: auth_tokens (JSON), legacy access/refresh, simple access
					const raw = localStorage.getItem("auth_tokens");
					let tokens: any = null;
					if (raw) {
						try { tokens = JSON.parse(raw); } catch {}
					}
					if (!tokens) {
						const access = localStorage.getItem("access_token") || localStorage.getItem("access");
						const refresh = localStorage.getItem("refresh_token");
						if (access || refresh) tokens = { access: access ?? null, refresh: refresh ?? null };
					}
					if (tokens && (tokens.access || tokens.refresh)) {
						if (typeof app.setSession === "function") {
							try { app.setSession({ access: tokens.access ?? null, refresh: tokens.refresh ?? null }, undefined); } catch (err) { console.debug('[FigmaShim] app.setSession failed', err); }
						}
						// give provider a moment to update then re-run sync
						await new Promise((r) => setTimeout(r, 50));
						if (mounted) {
							// re-run sync logic once central auth updated
							try {
								const profile = await getProfile();
								if (profile) {
									const walletRes = await getDbWallet();
									const tokensCount = (walletRes && (walletRes as any).ok) ? ((walletRes as any).data.balance_teo ?? 0) : 0;
									const profileRec = profile as Record<string, unknown>;
									const artUser: FigmaUser = {
										id: profileRec?.id ? String(profileRec.id) : (profile.username ?? profile.email ?? "") as string,
										name: (profile.username ?? ((`${profile.first_name ?? ""} ${profile.last_name ?? ""}`).trim() || profile.email || "User")) as string,
										email: profile.email ?? "",
										role: (profile.role ?? "student") as "student" | "teacher",
										tokens: Number.isFinite(Number(tokensCount)) ? Number(tokensCount) : 0,
										avatar: profile.avatar ?? undefined,
									};
									try { localStorage.setItem("artlearn_user", JSON.stringify(artUser)); } catch (err) { console.debug('[FigmaShim] save backend user failed', err); }
									if (mounted) setUser(artUser);
									return;
								}
							} catch (err) { console.debug('[FigmaShim] sync profile after setSession failed', err); }
						}
					}
				} catch (err) { console.debug('[FigmaShim] token bootstrap failed', err); }
			}

			if (mounted) setUser(null);
		};

		syncLocalUser();
		return () => { mounted = false; };
	}, [app.isAuthenticated]);

	const login = async (email: string, password: string) => {
		const ok = await app.login(email, password);
		try {
			const s = localStorage.getItem("artlearn_user");
			if (s) setUser(JSON.parse(s));
		} catch (err) { console.debug('[FigmaShim] login read local user failed', err); }
		return ok;
	};

	const logout = () => {
		app.logout();
		setUser(null);
		try {
			localStorage.removeItem("artlearn_user");
		} catch (err) { console.debug('[FigmaShim] logout remove user failed', err); }
	};

	const signup = async (name: string, email: string, password: string, role: "student" | "teacher") => {
			// Try the real backend register endpoint first using centralized API client
			try {
				// Ensure we do not attach Authorization for public endpoints (avoid sending expired tokens)
				const resp = await api.post('/v1/register/', { username: name, email, password, role }, { noAuth: true });
				console.debug('[FigmaShim] register response', resp.status, resp.data ?? resp.error);
				if (resp.ok) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- runtime response from API, kept permissive
					const data: any = resp.data;
					// backend created user: try to login to obtain tokens
					const loginOk = await app.login(email, password);
					if (loginOk) {
						try {
							localStorage.setItem('artlearn_user', JSON.stringify({ id: data.user.id, name: data.user.username, email: data.user.email, role: data.user.role, tokens: role === 'teacher' ? 500 : 50 }));
						} catch (err) { console.debug('[FigmaShim] save backend user failed', err); }
						return true;
					}
					// login failed: possibly unverified email; redirect to verify-email/sent
					if (typeof app.postAuth === 'function') {
						try {
							await app.postAuth({ role: data.user.role, unverified: true });
							return true;
						} catch (err) { console.debug('[FigmaShim] postAuth(unverified) failed', err); }
					}
					return false;
				}
			} catch (err) {
				console.debug('[FigmaShim] register call failed via api client, falling back to demo shim', err);
			}

		// Fallback: Lightweight demo signup (offline/demo mode)
		const newUser: FigmaUser = {
			id: String(Date.now()),
			name,
			email,
			role,
			tokens: role === "teacher" ? 500 : 50,
		};
		try { localStorage.setItem("artlearn_user", JSON.stringify(newUser)); } catch (err) { console.debug('[FigmaShim] signup save local user failed', err); }
		setUser(newUser);
		// emulate tokens so app can bootstrap
		try {
			const header = btoa(JSON.stringify({ alg: "none" }));
			const payload = btoa(JSON.stringify({ role: newUser.role }));
			const access = `${header}.${payload}.sig`;
			const fakeTokens = { access, refresh: String(Date.now()) };
			if (typeof app.postAuth === "function") {
				try { console.debug("[FigmaShim] signup: calling postAuth (fallback)", newUser.role); await app.postAuth({ tokens: fakeTokens, role: newUser.role, unverified: false }); console.debug("[FigmaShim] signup: postAuth returned (fallback)"); } catch (err) { console.debug('[FigmaShim] postAuth failed (fallback)', err); }
			} else {
				if (typeof app.setSession === "function") app.setSession(fakeTokens, newUser.role);
				if (typeof app.redirectAfterAuth === "function") app.redirectAfterAuth(newUser.role);
			}
		} catch (err) { console.debug('[FigmaShim] signup fallback tokens failed', err); }
		return true;
	};

	const connectWallet = async () => {
		console.log("[FigmaShim] connectWallet: CALLED");
		
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		if (typeof window === "undefined") {
			console.error("[FigmaShim] connectWallet: window undefined");
			return false;
		}
		
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const eth = (window as any).ethereum as { request: (opts: { method: string; params?: unknown[] }) => Promise<unknown> } | undefined;
		if (!eth) {
			console.error("[FigmaShim] connectWallet: MetaMask not detected (window.ethereum is undefined)");
			alert("MetaMask non rilevato! Installa MetaMask per connettere il wallet.");
			return false;
		}
		
		console.log("[FigmaShim] connectWallet: MetaMask detected");
		
		try {
			// Step 1: Connect to MetaMask and get address
			console.log("[FigmaShim] connectWallet: requesting accounts...");
			const accounts = await eth.request({ method: "eth_requestAccounts" }) as string[];
			console.log("[FigmaShim] connectWallet: accounts received", accounts);
			if (!accounts || accounts.length === 0) {
				console.error("[FigmaShim] connectWallet: no accounts returned");
				return false;
			}
			const address = accounts[0];
			console.log("[FigmaShim] connectWallet: address =", address);
			
			// Step 2: Request challenge from backend
			console.log("[FigmaShim] connectWallet: requesting challenge...");
			const challengeRes = await getChallenge();
			console.log("[FigmaShim] connectWallet: challenge response", challengeRes);
			if (!challengeRes.ok || !challengeRes.data) {
				console.error("[FigmaShim] connectWallet: challenge failed", challengeRes);
				alert("Errore nel richiedere la challenge dal server. Sei loggato?");
				return false;
			}
			
			const message = challengeRes.data.message || `Sign to link wallet. Nonce: ${challengeRes.data.nonce}`;
			console.log("[FigmaShim] connectWallet: message to sign =", message);
			
			// Step 3: Sign message with MetaMask
			console.log("[FigmaShim] connectWallet: requesting signature...");
			const signature = await eth.request({
				method: "personal_sign",
				params: [message, address],
			}) as string;
			console.log("[FigmaShim] connectWallet: signature received", signature?.substring(0, 20) + "...");
			
			if (!signature) {
				console.error("[FigmaShim] connectWallet: signature rejected");
				return false;
			}
			
			// Step 4: Link wallet via backend API
			console.log("[FigmaShim] connectWallet: linking wallet...");
			const linkRes = await linkWallet(address, signature);
			console.log("[FigmaShim] connectWallet: link response", linkRes);
			if (!linkRes.ok) {
				console.error("[FigmaShim] connectWallet: link failed", linkRes);
				alert("Errore nel collegare il wallet al server.");
				return false;
			}
			
			// Step 5: Update local user state
			if (user) {
				const updated = { ...user, walletAddress: address } as FigmaUser;
				setUser(updated);
				try {
					localStorage.setItem("artlearn_user", JSON.stringify(updated));
				} catch (err) { console.debug("[FigmaShim] connectWallet: save user failed", err); }
			}
			
			console.info("[FigmaShim] connectWallet: wallet linked successfully", address);
			return true;
		} catch (err) { 
			console.error("[FigmaShim] connectWallet failed", err);
			alert("Errore: " + (err instanceof Error ? err.message : String(err)));
		}
		return false;
	};

	const updateTokens = (amount: number) => {
		if (user) {
			const updated = { ...user, tokens: user.tokens + amount } as FigmaUser;
			setUser(updated);
			try {
				localStorage.setItem("artlearn_user", JSON.stringify(updated));
			} catch (err) { console.debug('[FigmaShim] updateTokens save failed', err); }
		}
	};

	return {
		user,
		login,
		logout,
		signup,
		connectWallet,
		updateTokens,
		isAuthenticated: app.isAuthenticated,
		isTeacher: app.isTeacher,
	};
}
// Re-export the application's central AuthProvider and hook so figma/demo
// components use the real provider instead of a local duplicate. This
// avoids duplicate contexts, runtime errors and TypeScript issues.
import React from "react";
import { AuthProvider as AppAuthProvider, useAuth as useAppAuth } from "@/context/AuthContext";
import { API } from "@/lib/config";

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
		try {
			const s = localStorage.getItem("artlearn_user");
			setUser(s ? (JSON.parse(s) as FigmaUser) : null);
		} catch {
			setUser(null);
		}
		// keep in sync when central auth changes
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
		// Try the real backend register endpoint first
		const registerUrl = `${API.base.replace(/\/+$/, "")}/token/register/`;
		try {
			const res = await fetch(registerUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: name, email, password, role }),
			});
			const text = await res.text();
			let data: any = undefined;
			try { data = text ? JSON.parse(text) : undefined; } catch (e) { data = text; }
			console.debug('[FigmaShim] register response', res.status, data);
			if (res.ok) {
				
				// backend created user: try to login to obtain tokens
				const loginOk = await app.login(email, password);
				if (loginOk) {
					// app.login -> postAuth will handle redirect
					try { localStorage.setItem('artlearn_user', JSON.stringify({ id: data.user.id, name: data.user.username, email: data.user.email, role: data.user.role, tokens: role === 'teacher' ? 500 : 50 })); } catch (err) { console.debug('[FigmaShim] save backend user failed', err); }
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
			console.debug('[FigmaShim] register call failed, falling back to demo shim', err);
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
		if (typeof window !== "undefined" && (window as any).ethereum) {
			try {
				const eth = (window as any).ethereum as { request: (opts: { method: string }) => Promise<string[]> } | undefined;
				if (!eth) return false;
				const accounts = await eth.request({ method: "eth_requestAccounts" });
				if (accounts && accounts.length > 0 && user) {
					const updated = { ...user, walletAddress: accounts[0] } as FigmaUser;
					setUser(updated);
					try {
						localStorage.setItem("artlearn_user", JSON.stringify(updated));
					} catch (err) { console.debug("[FigmaShim] connectWallet: save user failed", err); }
					return true;
				}
			} catch (err) { console.debug("[FigmaShim] connectWallet failed", err); }
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
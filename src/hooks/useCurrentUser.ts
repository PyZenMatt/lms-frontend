import { useState, useEffect } from "react";

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  tokens: number;
  avatar?: string | null;
  walletAddress?: string | null;
} | null;

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser>(null);

  useEffect(() => {
    const getUserFromStorage = () => {
      try {
        const stored = localStorage.getItem("openpython_user");
        if (stored) {
          return JSON.parse(stored) as CurrentUser;
        }
      } catch (error) {
        console.debug("Error parsing user from localStorage:", error);
      }
      return null;
    };

    // Get initial user data
    setUser(getUserFromStorage());

    // Listen for storage changes (when user data is updated)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "openpython_user") {
        setUser(getUserFromStorage());
      }
    };

    // Listen for custom auth events
    const handleAuthEvent = () => {
      setUser(getUserFromStorage());
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth:logout", handleAuthEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth:logout", handleAuthEvent);
    };
  }, []);

  return user;
}
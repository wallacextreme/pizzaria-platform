import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserRoleType, UUID } from "@/types/domain";

export interface AdminUser {
  id: UUID;
  email: string;
  name: string;
  role: UserRoleType;
}

interface AdminAuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  login: (email: string, role?: UserRoleType, name?: string) => void;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (_hasHydrated: boolean) => set({ _hasHydrated }),

      login: (email: string, role: UserRoleType = "admin", name?: string) => {
        const defaultName = role === "admin" ? "Gerente Geral" : "Pizzaiolo Chefe";
        const user: AdminUser = {
          id: `user-${role}-${Date.now()}`,
          email,
          name: name || defaultName,
          role,
        };

        set({
          user,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "pizzaria_admin_session",
      storage: createJSONStorage(() => (typeof window !== "undefined" ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

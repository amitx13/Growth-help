import { create } from "zustand";
import api from "../lib/axios";
import type { Admin } from "@repo/types";

type AuthStore = {
  user: Admin | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAdminAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,

  fetchUser: async () => {
    try {
      const res = await api.get("/fetchAdminDetails");
      set({ user: res.data.data.user, loading: false });
    } catch (err) {
      set({ user: null, loading: false });
    }
  },

  logout: async () => {
    try {
      await api.post("/logout", {}, { withCredentials: true });
    } catch (err) {
    }
    set({ user: null });
  },

}));

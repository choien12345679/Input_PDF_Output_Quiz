import { create } from "zustand";

const KEYS = {
  accessToken: "quiz_access_token",
  idToken: "quiz_id_token",
  refreshToken: "quiz_refresh_token",
};

const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  idToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,

  setTokens: (accessToken, idToken, refreshToken) => {
    localStorage.setItem(KEYS.accessToken, accessToken);
    localStorage.setItem(KEYS.idToken, idToken);
    localStorage.setItem(KEYS.refreshToken, refreshToken);
    set({ accessToken, idToken, refreshToken, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  logout: () => {
    localStorage.removeItem(KEYS.accessToken);
    localStorage.removeItem(KEYS.idToken);
    localStorage.removeItem(KEYS.refreshToken);
    set({
      user: null,
      accessToken: null,
      idToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  initializeAuth: () => {
    set({ isLoading: true });
    const accessToken = localStorage.getItem(KEYS.accessToken);
    const idToken = localStorage.getItem(KEYS.idToken);
    const refreshToken = localStorage.getItem(KEYS.refreshToken);

    if (accessToken && idToken && refreshToken) {
      set({
        accessToken,
        idToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },
}));

export default useAuthStore;

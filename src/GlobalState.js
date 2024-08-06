import { create } from "zustand";

export default create((set) => ({
  isTriangle: false,
  setIsTriangle: (value) => set({ isTriangle: value }),

  loaded: false, 
  setLoaded: (value) => set({ loaded: value }),
}))
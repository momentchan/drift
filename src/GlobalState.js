import { create } from "zustand";

export default create((set) => ({
  isTriangle: false,
  setIsTriangle: (value) => set({ isTriangle: value }),

  loaded: false,
  setLoaded: (value) => set({ loaded: value }),

  noted: false,
  setNoted: (value) => set({ noted: value }),

  soundOn: true,
  setSoundOn: (value) => set({ soundOn: value }),

  resetPos: false,
  setResetPos: (value) => set({ resetPos: value })
}))
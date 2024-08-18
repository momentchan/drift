import { create } from "zustand";

export default create((set) => ({
  isMobile: false, // Initial value of the global variable
  setIsMobile: (value) => set({ isMobile: value }),
  
  isTriangle: false,
  setIsTriangle: (value) => set({ isTriangle: value }),

  played: false,
  setPlayed: (value) => set({ played: value }),

  noted: false,
  setNoted: (value) => set({ noted: value }),

  soundOn: true,
  setSoundOn: (value) => set({ soundOn: value }),

  resetPos: false,
  setResetPos: (value) => set({ resetPos: value }),
  
  audioUrl: null,
  setAudioUrl: (url) => set({ audioUrl: url }),
}))
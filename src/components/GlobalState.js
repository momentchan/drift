import { create } from "zustand";

export default create((set) => ({
  isMobile: false, // Initial value of the global variable
  setIsMobile: (value) => set({ isMobile: value }),
  
  isTriangle: false,
  setIsTriangle: (value) => set({ isTriangle: value }),

  started: false,
  setStarted: (value) => set({ started: value }),

  noted: false,
  setNoted: (value) => set({ noted: value }),

  soundOn: true,
  setSoundOn: (value) => set({ soundOn: value }),

  resetPos: false,
  setResetPos: (value) => set({ resetPos: value }),
  
  displayedText: null,
  setDisplayedText: (value) => set({ displayedText: value }),
}))
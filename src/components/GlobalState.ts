import { create } from "zustand";

interface GlobalState {
  isMobile: boolean;
  setIsMobile: (value: boolean) => void;
  
  isTriangle: boolean;
  setIsTriangle: (value: boolean) => void;

  started: boolean;
  setStarted: (value: boolean) => void;

  noted: boolean;
  setNoted: (value: boolean) => void;

  soundOn: boolean;
  setSoundOn: (value: boolean) => void;

  resetPos: boolean;
  setResetPos: (value: boolean) => void;
  
  displayedText: string | null;
  setDisplayedText: (value: string | null) => void;
}

export default create<GlobalState>((set) => ({
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
}));

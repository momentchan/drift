import { create } from "zustand";

export default create((set) => ({
  isTriangle: false, // Initial value of the global variable
  setIsTriangle: (value) => set({ isTriangle: value }),
}))
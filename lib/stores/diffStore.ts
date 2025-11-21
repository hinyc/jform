import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DiffState {
  leftValue: string;
  rightValue: string;
  mode: "view" | "edit";
  setLeftValue: (value: string) => void;
  setRightValue: (value: string) => void;
  setMode: (mode: "view" | "edit") => void;
}

export const useDiffStore = create<DiffState>()(
  persist(
    (set) => ({
      leftValue: "",
      rightValue: "",
      mode: "edit", // Default to edit mode
      setLeftValue: (value) => set({ leftValue: value }),
      setRightValue: (value) => set({ rightValue: value }),
      setMode: (mode) => set({ mode }),
    }),
    {
      name: "diff-storage",
    }
  )
);

import { StateCreator } from "zustand";
import type {
  AppState,
  UIStateSlice as UIStateSliceInterface,
} from "@/types/storeTypes";

export const createUIStateSlice: StateCreator<
  AppState,
  [],
  [],
  UIStateSliceInterface
> = (set) => ({
  selectedPersonaId: null, // 초기에는 아무것도 선택되지 않음
  isLoading: false, // UI 관련 로딩 상태 (예: 페르소나 변경 시 등)

  setSelectedPersonaId: (personaId) => {
    console.log("[UIStateSlice] Selected Persona ID set to:", personaId);
    set({ selectedPersonaId: personaId });
  },

  setGlobalLoading: (isLoading) => {
    set({ isLoading });
  },
});

// store/slices/uiStateSlice.ts

import type {
  AppState,
  UIStateSlice as UIStateSliceInterface,
} from "@/types/storeTypes";
import { StateCreator } from "zustand";

export const createUIStateSlice: StateCreator<
  AppState,
  [],
  [],
  UIStateSliceInterface
> = (set, get) => ({
  // ✅ [변경] selectedPersonaId -> selectedObjectiveId
  selectedObjectiveId: null,
  isLoading: false,
  activeSession: null,

  // ✅ [변경] setSelectedPersonaId -> setSelectedObjectiveId
  setSelectedObjectiveId: (objectiveId) => {
    console.log("[UIStateSlice] Selected Objective ID set to:", objectiveId);
    set({ selectedObjectiveId: objectiveId });
  },

  setGlobalLoading: (isLoading) => {
    set({ isLoading });
  },

  startSession: (threadId) => {
    if (get().activeSession) {
      alert("이미 다른 세션이 진행 중입니다.");
      return;
    }
    set({
      activeSession: {
        threadId,
        startTime: Date.now(),
        isPaused: false,
        pausedTime: 0,
      },
    });
  },

  pauseSession: () => {
    const session = get().activeSession;
    if (!session || session.isPaused) return;

    const elapsed = Date.now() - session.startTime;
    set({
      activeSession: {
        ...session,
        isPaused: true,
        pausedTime: session.pausedTime + elapsed,
      },
    });
  },

  resumeSession: () => {
    const session = get().activeSession;
    if (!session || !session.isPaused) return;

    set({
      activeSession: {
        ...session,
        isPaused: false,
        startTime: Date.now(),
      },
    });
  },

  stopSession: () => set({ activeSession: null }),
});

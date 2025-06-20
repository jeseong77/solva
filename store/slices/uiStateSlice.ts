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
  selectedObjectiveId: null,
  isLoading: false,
  activeSession: null,

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
        // FIX: Use new Date() instead of the number from Date.now()
        startTime: new Date(),
        isPaused: false,
        // FIX: Use a "zero" Date object for the initial paused time
        pausedTime: new Date(0),
      },
    });
  },

  pauseSession: () => {
    const session = get().activeSession;
    if (!session || session.isPaused) return;

    // FIX: Get numeric values from dates to do arithmetic
    const elapsed = new Date().getTime() - session.startTime.getTime();

    set({
      activeSession: {
        ...session,
        isPaused: true,
        // FIX: Get numeric values, add them, and create a new Date object
        pausedTime: new Date(session.pausedTime.getTime() + elapsed),
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
        // FIX: Use new Date() to reset the start time for the new active period
        startTime: new Date(),
      },
    });
  },

  stopSession: () => set({ activeSession: null }),
});

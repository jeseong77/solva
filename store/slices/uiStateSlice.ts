// store/slices/uiStateSlice.ts

import { ActiveSession } from "@/types"; // Make sure ActiveSession is imported
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

  // ADD: New state to hold the scroll position of the main screen
  solvaScrollPosition: 0,

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
        startTime: new Date(),
        isPaused: false,
        pausedTime: new Date(0),
      },
    });
  },

  pauseSession: () => {
    const session = get().activeSession;
    if (!session || session.isPaused) return;
    const elapsed = new Date().getTime() - session.startTime.getTime();
    set({
      activeSession: {
        ...session,
        isPaused: true,
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
        startTime: new Date(),
      },
    });
  },

  stopSession: () => set({ activeSession: null }),

  // ADD: New action to save the scroll position to the store
  setSolvaScrollPosition: (position: number) => {
    set({ solvaScrollPosition: position });
  },
});

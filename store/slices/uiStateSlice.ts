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
  selectedPersonaId: null, // 초기에는 아무것도 선택되지 않음
  isLoading: false, // UI 관련 로딩 상태 (예: 페르소나 변경 시 등)
  activeSession: null,

  setSelectedPersonaId: (personaId) => {
    console.log("[UIStateSlice] Selected Persona ID set to:", personaId);
    set({ selectedPersonaId: personaId });
  },

  setGlobalLoading: (isLoading) => {
    set({ isLoading });
  },

  startSession: (threadId) => {
    // 이미 다른 세션이 진행중이면 경고 (혹은 자동으로 중지)
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
        startTime: Date.now(), // 타이머 기준 시간을 현재로 재설정
      },
    });
  },

  stopSession: () => set({ activeSession: null }),
});

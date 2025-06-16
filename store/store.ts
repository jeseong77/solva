import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AppState } from "@/types/storeTypes";
import { createPersonaSlice } from "./slices/personaSlice";
import { createProblemSlice } from "./slices/problemSlice";
import { createWeeklyProblemSlice } from "./slices/weeklyProblemSlice";
import { createThreadSlice } from "./slices/threadSlice";
import { createResultSlice } from "./slices/resultSlice";
import { createTagSlice } from "./slices/tagSlice";
import { createStarReportSlice } from "./slices/starReportSlice";
import { createUIStateSlice } from "./slices/uiStateSlice";
import { createTodoSlice } from "./slices/todoSlice";
import { createUserSlice } from "./slices/userSlice";

export const useAppStore = create<AppState>()(
  // ✅ [수정] 전체 스토어 생성자 함수를 persist 미들웨어로 감쌉니다.
  persist(
    (...a) => ({
      ...createPersonaSlice(...a),
      ...createProblemSlice(...a),
      ...createWeeklyProblemSlice(...a),
      ...createThreadSlice(...a),
      ...createResultSlice(...a),
      ...createTagSlice(...a),
      ...createStarReportSlice(...a),
      ...createUIStateSlice(...a),
      ...createTodoSlice(...a),
      ...createUserSlice(...a),
    }),
    {
      name: "solva-app-storage", // 디바이스에 저장될 데이터의 고유한 이름
      storage: createJSONStorage(() => AsyncStorage), // 사용할 스토리지 엔진 지정
      // ✅ [중요] 전체 상태(AppState) 중, 디바이스에 저장할 상태만 선택합니다.
      partialize: (state) => ({
        // 여기서는 uiSlice의 selectedPersonaId만 저장하도록 설정합니다.
        selectedPersonaId: state.selectedPersonaId,
      }),
    }
  )
);

// store/store.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AppState } from "@/types/storeTypes";
import { createObjectiveSlice } from "./slices/objectiveSlice"; // ✅ [변경] createPersonaSlice -> createObjectiveSlice
import { createGapSlice } from "./slices/gapSlice"; // ✅ [추가] createGapSlice
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
  persist(
    (...a) => ({
      ...createUserSlice(...a),
      ...createObjectiveSlice(...a), // ✅ [변경] createPersonaSlice -> createObjectiveSlice
      ...createGapSlice(...a), // ✅ [추가] createGapSlice
      ...createProblemSlice(...a),
      ...createWeeklyProblemSlice(...a),
      ...createThreadSlice(...a),
      ...createResultSlice(...a),
      ...createTagSlice(...a),
      ...createStarReportSlice(...a),
      ...createUIStateSlice(...a),
      ...createTodoSlice(...a),
    }),
    {
      name: "solva-app-storage",
      storage: createJSONStorage(() => AsyncStorage),
      // ✅ [중요] 저장할 상태의 이름을 새로운 이름으로 변경
      partialize: (state) => ({
        // 디바이스에 저장할 상태만 선택합니다.
        selectedObjectiveId: state.selectedObjectiveId,
      }),
    }
  )
);

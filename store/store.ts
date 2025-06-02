import type { AppState } from "@/types/storeTypes";
import { create } from "zustand";

import { createRuleSlice } from "./slices/ruleSlice";
import { createObjectiveSlice } from "./slices/objectiveSlice";
import { createStarReportSlice } from "./slices/starReportSlice";
import { createProjectSlice } from "./slices/projectSlice";
import { createTaskSlice } from "./slices/taskSlice";

// 모든 Slice 생성자들을 결합하여 useAppStore를 만듭니다.
// create<AppState>()의 콜백은 set, get, api 인자를 받으며,
// 이를 '...a' (또는 ...args)로 받아 각 슬라이스 생성 함수에 그대로 전달합니다.
export const useAppStore = create<AppState>()((...a) => ({
  ...createObjectiveSlice(...a),
  ...createProjectSlice(...a),
  ...createTaskSlice(...a),
  ...createRuleSlice(...a),
  ...createStarReportSlice(...a),
}));

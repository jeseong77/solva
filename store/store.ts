import type { AppState } from "@/types/storeTypes";
import { create } from "zustand";

import { createPersonaSlice } from "./slices/personaSlice";
import { createProblemSlice } from "./slices/problemSlice";
import { createWeeklyProblemSlice } from "./slices/weeklyProblemSlice";
import { createThreadSlice } from "./slices/threadSlice";
import { createResultSlice } from "./slices/resultSlice";
import { createTagSlice } from "./slices/tagSlice";
import { createStarReportSlice } from "./slices/starReportSlice";
import { createUIStateSlice } from "./slices/uiStateSlice";
import { createTodoSlice } from "./slices/todoSlice";

export const useAppStore = create<AppState>()((...a) => ({
  ...createPersonaSlice(...a),
  ...createProblemSlice(...a),
  ...createWeeklyProblemSlice(...a),
  ...createThreadSlice(...a),
  ...createResultSlice(...a),
  ...createTagSlice(...a),
  ...createStarReportSlice(...a),
  ...createUIStateSlice(...a),
  ...createTodoSlice(...a),
}));

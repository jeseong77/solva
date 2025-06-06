import type { AppState } from "@/types/storeTypes";
import { create } from "zustand";

import { createProblemSlice } from "./slices/problemSlice";
import { createObjectiveSlice } from "./slices/objectiveSlice";
import { createRuleSlice } from "./slices/ruleSlice";
import { createStarReportSlice } from "./slices/starReportSlice";
import { createTagSlice } from "./slices/tagSlice";
import { createPersonaSlice } from "./slices/personaSlice";

export const useAppStore = create<AppState>()((...a) => ({
  ...createProblemSlice(...a),
  ...createObjectiveSlice(...a),
  ...createRuleSlice(...a),
  ...createStarReportSlice(...a),
  ...createTagSlice(...a),
  ...createPersonaSlice(...a),
}));

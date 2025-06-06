import type { AppState } from "@/types/storeTypes";
import { create } from "zustand";

import { createPersonaSlice } from "./slices/personaSlice";
import { createProblemSlice } from "./slices/problemSlice";
import { createObjectiveSlice } from "./slices/objectiveSlice";
import { createRuleSlice } from "./slices/ruleSlice";
import { createTagSlice } from "./slices/tagSlice";
import { createStarReportSlice } from "./slices/starReportSlice";
import { createUIStateSlice } from "./slices/uiStateSlice";

export const useAppStore = create<AppState>()((...a) => ({
  ...createPersonaSlice(...a),
  ...createProblemSlice(...a),
  ...createObjectiveSlice(...a),
  ...createRuleSlice(...a),
  ...createTagSlice(...a),
  ...createStarReportSlice(...a),
  ...createUIStateSlice(...a),
}));

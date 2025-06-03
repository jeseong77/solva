// src/types/storeTypes.ts

import {
  Objective,
  ObjectiveStatus,
  Problem, // Added
  ProblemStatus, // Added
  Priority, // Added
  Rule,
  StarReport,
  Tag, // Added
} from "@/types";

// --- 각 Slice 가 가질 상태와 액션들에 대한 인터페이스 정의 ---

export interface ProblemSlice {
  problems: Problem[];
  isLoadingProblems: boolean;
  fetchProblems: () => Promise<void>;
  addProblem: (
    // problemData should contain all user-providable fields for a new Problem.
    // Omitting fields that are auto-generated or have clear initial defaults.
    problemData: Omit<
      Problem,
      | "id"
      | "createdAt"
      | "objectiveIds" // Typically starts empty
      | "ruleIds" // Typically starts empty
      | "timeSpent" // Typically starts at 0
      | "resolvedAt" // Set upon resolution
      | "archivedAt" // Set upon archival
      | "starReportId" // Typically set later or null initially
      | "currentNumericalProgress" // Typically starts at 0 or explicitly set
    > & { currentNumericalProgress?: number } // Allow overriding default 0 for currentNumericalProgress if needed during creation
  ) => Promise<Problem | null>;
  updateProblem: (problemToUpdate: Problem) => Promise<Problem | null>;
  deleteProblem: (problemId: string) => Promise<boolean>;
  getProblemById: (id: string) => Problem | undefined;
}

export interface ObjectiveSlice {
  objectives: Objective[];
  isLoadingObjectives: boolean;
  fetchObjectives: (parentId?: string | null) => Promise<void>;
  addObjective: (
    objectiveData: Omit<
      Objective,
      | "id"
      | "createdAt"
      | "childObjectiveIds" // Usually starts empty or managed by backend
      | "status" // Handled in the & part below or by backend
      | "timeSpent" // Usually starts at 0 or managed by backend
      | "completedAt" // Set upon completion
    > & {
      status?: ObjectiveStatus;
    }
  ) => Promise<Objective | null>;
  updateObjective: (objectiveToUpdate: Objective) => Promise<Objective | null>;
  deleteObjective: (objectiveId: string) => Promise<boolean>;
  getObjectiveById: (id: string) => Objective | undefined;
}

export interface RuleSlice {
  rules: Rule[];
  isLoadingRules: boolean;
  fetchRules: (problemId: string) => Promise<void>;
  addRule: (
    ruleData: Omit<Rule, "id" | "createdAt"> // problemId is now a direct field of Rule.
  ) => Promise<Rule | null>; // ruleData will need to contain problemId and title
  updateRule: (ruleToUpdate: Rule) => Promise<Rule | null>;
  deleteRule: (ruleId: string) => Promise<boolean>;
  getRuleById: (id: string) => Rule | undefined;
}

export interface StarReportSlice {
  starReports: StarReport[];
  isLoadingStarReports: boolean;
  fetchStarReports: (problemId?: string) => Promise<void>;
  addStarReport: (
    reportData: Omit<StarReport, "id" | "createdAt"> // reportData will include new fields like problemId, situation, task, action, result
  ) => Promise<StarReport | null>;
  updateStarReport: (reportToUpdate: StarReport) => Promise<StarReport | null>;
  deleteStarReport: (reportId: string) => Promise<boolean>;
  getStarReportById: (id: string) => StarReport | undefined;
  getStarReportByProblemId: (problemId: string) => StarReport | undefined;
}

export interface TagSlice {
  tags: Tag[];
  isLoadingTags: boolean;
  fetchTags: () => Promise<void>;
  addTag: (
    // tagData should contain all user-providable fields for a new Tag.
    // Omitting fields that are auto-generated.
    tagData: Omit<Tag, "id" | "createdAt">
  ) => Promise<Tag | null>;
  updateTag: (tagToUpdate: Tag) => Promise<Tag | null>;
  deleteTag: (tagId: string) => Promise<boolean>;
  getTagById: (id: string) => Tag | undefined;
}

// --- 모든 Slice 인터페이스를 통합하는 전체 AppState 정의 ---
export interface AppState
  extends ProblemSlice, // Added
    ObjectiveSlice,
    RuleSlice,
    StarReportSlice,
    TagSlice {
  // Added
  // ProjectSlice, // Removed
  // TaskSlice, // Removed
  // 전역 상태는 여기에 추가
}

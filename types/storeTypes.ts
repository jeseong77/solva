// src/types/storeTypes.ts

import {
  Objective,
  ObjectiveStatus,
  Project,
  ProjectStatus,
  Rule,
  StarReport,
  Task,
  TaskStatus,
} from "@/types";

// --- 각 Slice 가 가질 상태와 액션들에 대한 인터페이스 정의 ---

export interface ObjectiveSlice {
  objectives: Objective[];
  isLoadingObjectives: boolean;
  fetchObjectives: (parentId?: string | null) => Promise<void>;
  addObjective: (
    objectiveData: Omit<
      Objective,
      | "id"
      | "createdAt"
      | "childObjectiveIds"
      | "status"
      | "isBottleneck"
      | "timeSpent"
      | "fulfillingProjectId"
      | "isFeatured"
      | "completedAt"
    > & {
      status?: ObjectiveStatus;
      parentId?: string | null;
      isBottleneck?: boolean;
      isFeatured?: boolean;
    }
  ) => Promise<Objective | null>;
  updateObjective: (objectiveToUpdate: Objective) => Promise<Objective | null>;
  deleteObjective: (objectiveId: string) => Promise<boolean>;
  getObjectiveById: (id: string) => Objective | undefined;
}

export interface ProjectSlice {
  projects: Project[];
  isLoadingProjects: boolean;
  fetchProjects: (objectiveId?: string) => Promise<void>;
  addProject: (
    projectData: Omit<
      Project,
      | "id"
      | "createdAt"
      | "ruleIds"
      | "taskIds"
      | "currentNumericalProgress"
      | "performanceScore"
      | "status"
      | "isLocked"
      | "timeSpent"
      | "completedAt"
      | "focused"
    > & { objectiveId: string; status?: ProjectStatus; isLocked?: boolean } // focused 제거됨
  ) => Promise<Project | null>;
  updateProject: (projectToUpdate: Project) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<boolean>;
  getProjectById: (id: string) => Project | undefined;
}

export interface RuleSlice {
  rules: Rule[];
  isLoadingRules: boolean;
  fetchRules: (projectId: string) => Promise<void>;
  addRule: (
    ruleData: Omit<Rule, "id" | "createdAt" | "isLocked"> & {
      projectId: string;
      isLocked?: boolean;
    }
  ) => Promise<Rule | null>;
  updateRule: (ruleToUpdate: Rule) => Promise<Rule | null>;
  deleteRule: (ruleId: string) => Promise<boolean>;
  getRuleById: (id: string) => Rule | undefined;
}

export interface TaskSlice {
  tasks: Task[];
  isLoadingTasks: boolean;
  fetchTasks: (projectId?: string) => Promise<void>;
  addTask: (
    taskData: Omit<
      Task,
      "id" | "createdAt" | "status" | "isLocked" | "timeSpent" | "completedAt"
    > & {
      projectId: string;
      status?: TaskStatus;
      isLocked?: boolean;
      timeSpent?: number;
    }
  ) => Promise<Task | null>;
  updateTask: (taskToUpdate: Task) => Promise<Task | null>; // Partial 대신 전체 객체로 통일 (선택)
  deleteTask: (taskId: string) => Promise<boolean>;
  getTaskById: (id: string) => Task | undefined;
}

export interface StarReportSlice {
  starReports: StarReport[];
  isLoadingStarReports: boolean;
  fetchStarReports: (objectiveId?: string) => Promise<void>;
  addStarReport: (
    reportData: Omit<StarReport, "id" | "createdAt">
  ) => Promise<StarReport | null>;
  updateStarReport: (reportToUpdate: StarReport) => Promise<StarReport | null>;
  deleteStarReport: (reportId: string) => Promise<boolean>;
  getStarReportById: (id: string) => StarReport | undefined;
  getStarReportByObjectiveId: (objectiveId: string) => StarReport | undefined; // 이건 유용하므로 유지
}

// --- 모든 Slice 인터페이스를 통합하는 전체 AppState 정의 ---
export interface AppState
  extends ObjectiveSlice,
    ProjectSlice,
    RuleSlice,
    TaskSlice,
    StarReportSlice {
  // 전역 상태는 여기에 추가
}

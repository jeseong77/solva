// src/types/storeTypes.ts

// 기존 @/types/index.ts에서 엔티티 및 기본 상태 타입들을 가져옵니다.
import {
  Problem,
  ProblemStatus,
  Project,
  ProjectStatus,
  ProjectFocusStatus,
  Task,
  TaskStatus,
  DoItem,
  DontItem,
  RetrospectiveReport,
} from "@/types"; // 현재 모든 타입이 정의된 index.ts 경로를 가리킵니다.

// --- 각 Slice 가 가질 상태와 액션들에 대한 인터페이스 정의 ---

export interface ProblemSlice {
  problems: Problem[];
  isLoadingProblems: boolean;
  fetchProblems: () => Promise<void>;
  addProblem: (
    problemData: Omit<
      Problem,
      "id" | "createdAt" | "childProblemIds" | "status" | "projectId"
    > & { status?: ProblemStatus; projectId?: string }
  ) => Promise<Problem | null>;
  updateProblem: (problemToUpdate: Problem) => Promise<Problem | null>;
  deleteProblem: (problemId: string) => Promise<boolean>;
  getProblemById: (id: string) => Problem | undefined;
}

export interface ProjectSlice {
  projects: Project[];
  isLoadingProjects: boolean;
  fetchProjects: (problemId?: string) => Promise<void>;
  addProject: (
    projectData: Omit<
      Project,
      | "id"
      | "createdAt"
      | "doItemIds"
      | "dontItemIds"
      | "taskIds"
      | "currentNumericalProgress"
      | "performanceScore"
      | "status"
      | "focused"
      | "isLocked"
    > & {
      problemId: string;
      status?: ProjectStatus;
      focused?: ProjectFocusStatus;
      isLocked?: boolean;
    }
  ) => Promise<Project | null>;
  updateProject: (projectToUpdate: Project) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<boolean>;
  getProjectById: (id: string) => Project | undefined;
  // Project의 focused 상태 변경 액션 등 추가 가능
  // setProjectFocus: (projectId: string, focusStatus: ProjectFocusStatus) => Promise<void>;
}

export interface TaskSlice {
  tasks: Task[];
  isLoadingTasks: boolean;
  fetchTasks: (projectId?: string) => Promise<void>;
  addTask: (
    taskData: Omit<Task, "id" | "createdAt" | "status" | "isLocked"> & {
      status?: TaskStatus;
      isLocked?: boolean;
    }
  ) => Promise<Task | null>;
  updateTask: (
    updatedTaskData: Partial<Task> & { id: string }
  ) => Promise<Task | null>;
  deleteTask: (taskId: string) => Promise<boolean>;
  getTaskById: (id: string) => Task | undefined;
  // Task의 isLocked 상태 변경 액션 등 추가 가능
  // setTaskLockStatus: (taskId: string, isLocked: boolean) => Promise<void>;
}

export interface DoItemSlice {
  doItems: DoItem[];
  isLoadingDoItems: boolean;
  fetchDoItems: (projectId: string) => Promise<void>;
  addDoItem: (
    doItemData: Omit<
      DoItem,
      "id" | "createdAt" | "successCount" | "failureCount" | "isLocked"
    > & { projectId: string; isLocked?: boolean }
  ) => Promise<DoItem | null>;
  updateDoItem: (doItemToUpdate: DoItem) => Promise<DoItem | null>; // DoItem 업데이트 시 전체 객체 또는 Partial
  deleteDoItem: (doItemId: string) => Promise<boolean>;
  getDoItemById: (id: string) => DoItem | undefined;
  // DoItem 완료/실패 처리 및 successCount/failureCount 업데이트 액션 추가
  // recordDoItemAttempt: (doItemId: string, wasSuccessful: boolean) => Promise<void>;
}

export interface DontItemSlice {
  dontItems: DontItem[];
  isLoadingDontItems: boolean;
  fetchDontItems: (projectId: string) => Promise<void>;
  addDontItem: (
    dontItemData: Omit<
      DontItem,
      "id" | "createdAt" | "successCount" | "failureCount" | "isLocked"
    > & { projectId: string; isLocked?: boolean }
  ) => Promise<DontItem | null>;
  updateDontItem: (dontItemToUpdate: DontItem) => Promise<DontItem | null>;
  deleteDontItem: (dontItemId: string) => Promise<boolean>;
  getDontItemById: (id: string) => DontItem | undefined;
  // DontItem 준수/위반 처리 및 successCount/failureCount 업데이트 액션 추가
  // recordDontItemObservance: (dontItemId: string, wasObserved: boolean) => Promise<void>;
}

export interface RetrospectiveReportSlice {
  retrospectiveReports: RetrospectiveReport[];
  isLoadingRetrospectives: boolean;
  fetchRetrospectives: (problemId?: string) => Promise<void>;
  addRetrospective: (
    retroData: Omit<RetrospectiveReport, "id" | "createdAt">
  ) => Promise<RetrospectiveReport | null>;
  // updateRetrospective, deleteRetrospective, getRetrospectiveById 등 추가 가능
}

// --- 모든 Slice 인터페이스를 통합하는 전체 AppState 정의 ---
export interface AppState
  extends ProblemSlice,
    ProjectSlice,
    TaskSlice,
    DoItemSlice,
    DontItemSlice,
    RetrospectiveReportSlice {
  // Slice에 포함되지 않는, 앱 전역적으로 필요한 상태나 액션이 있다면 여기에 직접 추가할 수 있습니다.
  // (예: globalSettings, userProfile 등. 하지만 대부분 Slice로 관리하는 것이 좋습니다.)
}

import { StateCreator } from 'zustand';
import { Rule, Project } from '@/types';
import type { AppState } from '@/types/storeTypes'; // 통합 AppState 타입
import { getDatabase } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

// Rule 관련 파서 함수
const parseRuleFromDB = (dbItem: any): Rule => ({
  id: dbItem.id,
  projectId: dbItem.projectId,
  title: dbItem.title,
  isLocked: !!dbItem.isLocked, // INTEGER (0 or 1) to boolean
  createdAt: new Date(dbItem.createdAt),
  // description 필드는 현재 Rule 타입에 없으므로 파싱에서 제외
});

export interface RuleSlice {
  rules: Rule[];
  isLoadingRules: boolean;
  fetchRules: (projectId: string) => Promise<void>;
  addRule: (
    ruleData: Omit<Rule, "id" | "createdAt" | "isLocked"> & // projectId와 title이 Omit에 의해 포함됨
              { projectId: string; isLocked?: boolean; }
  ) => Promise<Rule | null>;
  updateRule: (ruleToUpdate: Rule) => Promise<Rule | null>; // Rule이 단순하므로 전체 객체 전달
  deleteRule: (ruleId: string) => Promise<boolean>;
  getRuleById: (id: string) => Rule | undefined;
  // 추후 Rule 달성/준수 여부 기록 액션 추가 가능
}

export const createRuleSlice: StateCreator<AppState, [], [], RuleSlice> = (set, get) => ({
  rules: [],
  isLoadingRules: false,

  fetchRules: async (projectId: string) => {
    set({ isLoadingRules: true });
    try {
      const db = await getDatabase();
      const results = await db.getAllAsync<any>(
        "SELECT * FROM Rules WHERE projectId = ? ORDER BY createdAt ASC;",
        [projectId]
      );
      const fetchedRules = results.map(parseRuleFromDB);
      // 특정 projectId의 Rule들만 교체하고, 나머지는 유지 후 정렬
      set(state => ({
        rules: [
          ...state.rules.filter(r => r.projectId !== projectId),
          ...fetchedRules
        ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
        isLoadingRules: false
      }));
      console.log(`[RuleSlice] Rules fetched for project ${projectId}:`, fetchedRules.length);
    } catch (error) {
      console.error("[RuleSlice] Error fetching Rules:", error);
      set({ isLoadingRules: false });
    }
  },

  addRule: async (ruleData) => {
    const newRule: Rule = {
      id: uuidv4(),
      projectId: ruleData.projectId,
      title: ruleData.title,
      isLocked: ruleData.isLocked || false, // 기본값 false
      createdAt: new Date(),
    };

    const db = await getDatabase();
    try {
      await db.runAsync(
        `INSERT INTO Rules (id, projectId, title, isLocked, createdAt)
         VALUES (?, ?, ?, ?, ?);`,
        [
          newRule.id,
          newRule.projectId,
          newRule.title,
          newRule.isLocked ? 1 : 0,
          newRule.createdAt.toISOString(),
        ]
      );
      console.log("[RuleSlice] New Rule inserted into DB:", newRule.title);

      // 연결된 Project의 ruleIds 업데이트
      const parentProject = get().projects.find(p => p.id === newRule.projectId);
      if (parentProject) {
        const updatedParentProject: Project = {
          ...parentProject,
          ruleIds: [...parentProject.ruleIds, newRule.id],
        };
        await get().updateProject(updatedParentProject); // ProjectSlice의 액션 호출
        console.log(`[RuleSlice] Parent project ${parentProject.id} ruleIds updated for new rule.`);
      } else {
        console.warn(`[RuleSlice] Parent project with ID ${newRule.projectId} not found for Rule linkage.`);
      }
      
      const currentRules = get().rules;
      const newRuleList = [...currentRules, newRule].sort((a,b) => a.createdAt.getTime() - b.createdAt.getTime());
      set({ rules: newRuleList });
      console.log("[RuleSlice] Rule added to store:", newRule.title);
      return newRule;
    } catch (error) {
      console.error("[RuleSlice] Error adding Rule:", error);
      return null;
    }
  },

  updateRule: async (ruleToUpdate) => {
    const currentRules = get().rules;
    const itemIndex = currentRules.findIndex(r => r.id === ruleToUpdate.id);
    if (itemIndex === -1) {
      console.error("[RuleSlice] Rule not found for update:", ruleToUpdate.id);
      return null;
    }
    // DB에 저장하기 전, 타입에 맞게 변환 (전달된 ruleToUpdate가 이미 완전한 객체라고 가정)
    const finalRuleToUpdate = { ...currentRules[itemIndex], ...ruleToUpdate };

    try {
      const db = await getDatabase();
      await db.runAsync(
        `UPDATE Rules SET title = ?, isLocked = ?
         WHERE id = ?;`, // projectId, createdAt은 보통 업데이트하지 않음
        [
          finalRuleToUpdate.title,
          finalRuleToUpdate.isLocked ? 1 : 0,
          finalRuleToUpdate.id,
        ]
      );

      const updatedRules = currentRules.map(r => r.id === finalRuleToUpdate.id ? finalRuleToUpdate : r);
      updatedRules.sort((a,b) => a.createdAt.getTime() - b.createdAt.getTime());
      set({ rules: updatedRules });
      console.log("[RuleSlice] Rule updated:", finalRuleToUpdate.title);
      return finalRuleToUpdate;
    } catch (error) {
      console.error("[RuleSlice] Error updating Rule:", error);
      return null;
    }
  },

  deleteRule: async (ruleId) => {
    const ruleToDelete = get().rules.find(r => r.id === ruleId);
    
    const db = await getDatabase();
    try {
      await db.runAsync(`DELETE FROM Rules WHERE id = ?;`, [ruleId]);
      console.log("[RuleSlice] Rule deleted from DB:", ruleId);

      if (ruleToDelete) {
        const parentProject = get().projects.find(p => p.id === ruleToDelete.projectId);
        if (parentProject) {
          const updatedParentProject: Project = {
            ...parentProject,
            ruleIds: parentProject.ruleIds.filter(id => id !== ruleId),
          };
          await get().updateProject(updatedParentProject);
          console.log(`[RuleSlice] Parent project ${parentProject.id} ruleIds updated after Rule deletion.`);
        }
      }
      
      set(state => ({
        rules: state.rules.filter(r => r.id !== ruleId)
            .sort((a,b) => a.createdAt.getTime() - b.createdAt.getTime())
      }));
      console.log("[RuleSlice] Rule removed from store:", ruleId);
      return true;
    } catch (error) {
      console.error("[RuleSlice] Error deleting Rule:", error);
      return false;
    }
  },

  getRuleById: (id: string) => {
    return get().rules.find(r => r.id === id);
  },
});
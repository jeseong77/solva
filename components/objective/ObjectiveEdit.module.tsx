// components/objective/ObjectiveEdit.module.tsx

import { pickAndSaveImage } from "@/lib/imageUtils";
import { useAppStore } from "@/store/store";
import { Objective, ObjectiveType, Problem, Gap } from "@/types";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useShallow } from "zustand/react/shallow";
import { LocalGap, LocalProblem } from "./GapItem";

export const useObjectiveEdit = () => {
  const router = useRouter();
  const { objectiveId } = useLocalSearchParams<{ objectiveId?: string }>();
  const isEditMode = !!objectiveId;

  // ✅ [수정] get 함수를 더 이상 여기서 가져오지 않습니다.
  const {
    getObjectiveById,
    addObjective,
    updateObjective,
    fetchGaps,
    addGap,
    updateGap,
    deleteGap,
    fetchProblems,
    addProblem,
    updateProblem,
    deleteProblem,
  } = useAppStore(
    useShallow((state) => ({
      getObjectiveById: state.getObjectiveById,
      addObjective: state.addObjective,
      updateObjective: state.updateObjective,
      fetchGaps: state.fetchGaps,
      addGap: state.addGap,
      updateGap: state.updateGap,
      deleteGap: state.deleteGap,
      fetchProblems: state.fetchProblems,
      addProblem: state.addProblem,
      updateProblem: state.updateProblem,
      deleteProblem: state.deleteProblem,
    }))
  );

  // --- 상태 관리 ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ObjectiveType>("persona");
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [coverImageUri, setCoverImageUri] = useState<string | undefined>();
  const [avatarImageUri, setAvatarImageUri] = useState<string | undefined>();
  const [isCoverViewerVisible, setCoverViewerVisible] = useState(false);
  const [localData, setLocalData] = useState<LocalGap[]>([]);
  const [initialData, setInitialData] = useState<LocalGap[]>([]);

  // Gap 모달 상태
  const [isGapModalVisible, setGapModalVisible] = useState(false);
  const [editingGapId, setEditingGapId] = useState<string | null>(null);
  const [gapTitle, setGapTitle] = useState("");
  const [idealState, setIdealState] = useState("");
  const [currentState, setCurrentState] = useState("");

  // Problem 모달 상태
  const [isProblemModalVisible, setProblemModalVisible] = useState(false);
  const [problemTitle, setProblemTitle] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [currentGapTempId, setCurrentGapTempId] = useState<string | null>(null);

  // --- 데이터 로딩 (수정 모드 로직 추가) ---
  useFocusEffect(
    useCallback(() => {
      if (isEditMode && objectiveId) {
        const objectiveData = getObjectiveById(objectiveId);
        if (objectiveData) {
          setTitle(objectiveData.title);
          setDescription(objectiveData.description || "");
          setType(objectiveData.type);
          setCoverImageUri(objectiveData.coverImageUri);
          setAvatarImageUri(objectiveData.avatarImageUri);

          const loadAndStructureData = async () => {
            await fetchGaps(objectiveId);
            await fetchProblems(objectiveId);

            // ✅ [수정] get() 대신 useAppStore.getState()를 사용합니다.
            // ✅ [수정] g, p 파라미터에 명시적으로 타입을 지정해줍니다.
            const storeState = useAppStore.getState();
            const relevantGaps = storeState.gaps.filter(
              (g: Gap) => g.objectiveId === objectiveId
            );
            const relevantProblems = storeState.problems.filter(
              (p: Problem) => p.objectiveId === objectiveId
            );

            const problemsByGapId = new Map<string, LocalProblem[]>();
            relevantProblems.forEach((p: Problem) => {
              const key = p.gapId || "ungrouped";
              if (!problemsByGapId.has(key)) problemsByGapId.set(key, []);
              problemsByGapId.get(key)!.push({ ...p, tempId: p.id });
            });

            const structuredData: LocalGap[] = relevantGaps.map((g: Gap) => ({
              ...g,
              tempId: g.id,
              problems: problemsByGapId.get(g.id) || [],
            }));

            setLocalData(structuredData);
            setInitialData(structuredData);
          };
          loadAndStructureData();
        }
      } else {
        setTitle("");
        setDescription("");
        setType("persona");
        setCoverImageUri(undefined);
        setAvatarImageUri(undefined);
        setLocalData([]);
        setInitialData([]);
      }
      setIsLoading(false);
    }, [objectiveId, isEditMode])
  );

  // --- 핸들러들 ---
  // (이하 핸들러 함수들은 변경 사항이 없으므로 생략하고, 이전 답변과 동일하게 유지)

  const handleCoverImageChange = async () => {
    const newImageUri = await pickAndSaveImage();
    if (newImageUri) setCoverImageUri(newImageUri);
  };
  const handleAvatarPress = async () => {
    const newImageUri = await pickAndSaveImage();
    if (newImageUri) setAvatarImageUri(newImageUri);
  };

  const handleOpenAddGapModal = () => {
    setEditingGapId(null);
    setGapTitle("");
    setIdealState("");
    setCurrentState("");
    setGapModalVisible(true);
  };

  const handleOpenEditGapModal = (gapTempId: string) => {
    const gapToEdit = localData.find((g) => g.tempId === gapTempId);
    if (gapToEdit) {
      setEditingGapId(gapTempId);
      setGapTitle(gapToEdit.title || "");
      setIdealState(gapToEdit.idealState || "");
      setCurrentState(gapToEdit.currentState || "");
      setGapModalVisible(true);
    }
  };

  const handleSaveGap = () => {
    if (!gapTitle.trim()) {
      Alert.alert("입력 필요", "Gap 이름을 입력해주세요.");
      return;
    }
    const gapData = { title: gapTitle, idealState, currentState };

    if (editingGapId) {
      setLocalData((prev) =>
        prev.map((g) => (g.tempId === editingGapId ? { ...g, ...gapData } : g))
      );
    } else {
      const newGap: LocalGap = {
        tempId: `temp_gap_${Date.now()}`,
        title: gapTitle,
        idealState,
        currentState,
        problems: [],
      };
      setLocalData((prev) => [...prev, newGap]);
    }
    setGapModalVisible(false);
  };

  const handleOpenProblemModal = (gapTempId: string) => {
    setCurrentGapTempId(gapTempId);
    setProblemTitle("");
    setProblemDescription("");
    setProblemModalVisible(true);
  };

  const handleSaveProblem = () => {
    if (!problemTitle.trim() || !currentGapTempId) return;
    const newProblem: LocalProblem = {
      tempId: `temp_problem_${Date.now()}`,
      title: problemTitle,
      description: problemDescription,
    };
    setLocalData((prev) =>
      prev.map((gap) => {
        if (gap.tempId === currentGapTempId) {
          return { ...gap, problems: [...gap.problems, newProblem] };
        }
        return gap;
      })
    );
    setProblemModalVisible(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("이름 필요", "목표의 이름은 필수 항목입니다.");
      return;
    }
    setIsSaving(true);
    const commonData = {
      type,
      title,
      description,
      coverImageUri,
      avatarImageUri,
    };

    if (isEditMode && objectiveId) {
      await updateObjective({
        ...getObjectiveById(objectiveId)!,
        ...commonData,
      });

      const initialGapIds = new Set(initialData.map((g) => g.id));
      const currentGapIds = new Set(
        localData.map((g) => g.id).filter((id) => id && !id.startsWith("temp_"))
      );

      for (const initialGap of initialData) {
        if (initialGap.id && !currentGapIds.has(initialGap.id)) {
          await deleteGap(initialGap.id);
        }
      }

      for (const localGap of localData) {
        if (localGap.tempId.startsWith("temp_")) {
          const savedGap = await addGap({
            objectiveId,
            title: localGap.title || "",
            idealState: localGap.idealState || "",
            currentState: localGap.currentState || "",
          });
          if (savedGap) {
            for (const localProblem of localGap.problems) {
              await addProblem({
                objectiveId,
                gapId: savedGap.id,
                title: localProblem.title || "",
              });
            }
          }
        } else {
          const initialGap = initialData.find((g) => g.id === localGap.id);
          if (initialGap) {
            if (
              initialGap.title !== localGap.title ||
              initialGap.idealState !== localGap.idealState ||
              initialGap.currentState !== localGap.currentState
            ) {
              await updateGap(localGap as Gap);
            }

            const initialProblemIds = new Set(
              initialGap.problems.map((p) => p.id)
            );
            const currentProblemIds = new Set(
              localGap.problems
                .map((p) => p.id)
                .filter((id) => id && !id.startsWith("temp_"))
            );

            for (const initialProblem of initialGap.problems) {
              if (
                initialProblem.id &&
                !currentProblemIds.has(initialProblem.id)
              ) {
                await deleteProblem(initialProblem.id);
              }
            }
            for (const localProblem of localGap.problems) {
              if (localProblem.tempId.startsWith("temp_")) {
                await addProblem({
                  objectiveId,
                  gapId: localGap.id,
                  title: localProblem.title || "",
                });
              } else {
                // TODO: Problem 내용 변경 감지 및 updateProblem 호출 로직
              }
            }
          }
        }
      }
    } else {
      const objectiveResult = await addObjective(commonData);
      if (objectiveResult) {
        for (const localGap of localData) {
          const savedGap = await addGap({
            objectiveId: objectiveResult.id,
            title: localGap.title || "",
            idealState: localGap.idealState || "",
            currentState: localGap.currentState || "",
          });
          if (savedGap && localGap.problems.length > 0) {
            for (const localProblem of localGap.problems) {
              await addProblem({
                objectiveId: objectiveResult.id,
                gapId: savedGap.id,
                title: localProblem.title || "",
                description: localProblem.description,
              });
            }
          }
        }
      }
    }

    setIsSaving(false);
    Alert.alert("성공", `"${commonData.title}" 목표가 저장되었습니다.`);
    if (router.canGoBack()) router.back();
  };

  return {
    isLoading,
    isSaving,
    isEditMode,
    title,
    description,
    type,
    coverImageUri,
    avatarImageUri,
    isCoverViewerVisible,
    localData,
    isGapModalVisible,
    editingGapId,
    gapTitle,
    idealState,
    currentState,
    isProblemModalVisible,
    problemTitle,
    problemDescription,
    setTitle,
    setDescription,
    setType,
    setCoverViewerVisible,
    setGapModalVisible,
    setGapTitle,
    setIdealState,
    setCurrentState,
    setProblemModalVisible,
    setProblemTitle,
    setProblemDescription,
    handleSave,
    handleCoverImageChange,
    handleAvatarPress,
    handleOpenAddGapModal,
    handleOpenEditGapModal,
    handleSaveGap,
    handleOpenProblemModal,
    handleSaveProblem,
    router,
  };
};

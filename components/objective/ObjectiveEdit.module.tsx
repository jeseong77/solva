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

  // --- State Management ---
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

  // ... (Modal state remains the same)
  const [isGapModalVisible, setGapModalVisible] = useState(false);
  const [editingGapId, setEditingGapId] = useState<string | null>(null);
  const [gapTitle, setGapTitle] = useState("");
  const [idealState, setIdealState] = useState("");
  const [currentState, setCurrentState] = useState("");
  const [isProblemModalVisible, setProblemModalVisible] = useState(false);
  const [problemTitle, setProblemTitle] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [currentGapTempId, setCurrentGapTempId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (isEditMode && objectiveId) {
        const objectiveData = getObjectiveById(objectiveId);
        if (objectiveData) {
          setTitle(objectiveData.title);
          setDescription(objectiveData.description || "");
          setType(objectiveData.type);
          // FIX: Convert `null` from the data model to `undefined` for the local state.
          setCoverImageUri(objectiveData.coverImageUri || undefined);
          setAvatarImageUri(objectiveData.avatarImageUri || undefined);

          const loadAndStructureData = async () => {
            await fetchGaps(objectiveId);
            await fetchProblems(objectiveId);

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

    // This object holds the data from the component's local state
    const commonData = {
      type,
      title,
      description,
      coverImageUri, // This is `string | undefined`
      avatarImageUri, // This is `string | undefined`
    };

    if (isEditMode && objectiveId) {
      // FIX: Convert `undefined` from state back to `null` for the `updateObjective` function.
      await updateObjective({
        ...getObjectiveById(objectiveId)!,
        ...commonData,
        coverImageUri: commonData.coverImageUri ?? null,
        avatarImageUri: commonData.avatarImageUri ?? null,
      });

      // ... (rest of the update logic remains the same)
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
              }
            }
          }
        }
      }
    } else {
      // FIX: Add missing properties required by `addObjective`.
      // Also convert `undefined` from state to `null` for the image URIs.
      const objectiveResult = await addObjective({
        ...commonData,
        coverImageUri: commonData.coverImageUri ?? null,
        avatarImageUri: commonData.avatarImageUri ?? null,
        objectiveGoals: null,
        icon: null,
        color: null,
        order: null,
      });
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
                // FIX: Convert potential `null` or `undefined` to just `undefined`.
                description: localProblem.description || undefined,
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

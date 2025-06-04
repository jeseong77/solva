// Example: src/components/ProblemFormScreen.tsx
import { useAppStore } from "@/store/store";
import { Priority, Problem, ProblemStatus } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import {
  Alert,
  Button,
  Platform, // Corrected import from react-native
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import PriorityPickerModal from "./PriorityPickerModal"; // Assuming this path is correct
import RequirementInputModal from "./RequirementInputModal";

export default function ProblemFormScreen() {
  const navigation = useNavigation();
  const { problemId } = useLocalSearchParams<{ problemId?: string }>();
  const isEditing = Boolean(problemId);

  const getProblemById = useAppStore((state) => state.getProblemById);
  const addProblemToStore = useAppStore((state) => state.addProblem);
  const updateProblemInStore = useAppStore((state) => state.updateProblem);
  const deleteProblemFromStore = useAppStore((state) => state.deleteProblem);

  // State for all editable Problem fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<ProblemStatus>("active");
  const [priority, setPriority] = useState<Priority>("none");
  const [resolutionCriteriaText, setResolutionCriteriaText] = useState<
    string | undefined
  >(undefined);
  const [resolutionNumericalTarget, setResolutionNumericalTarget] = useState<
    number | undefined
  >(undefined);
  const [currentNumericalProgress, setCurrentNumericalProgress] = useState<
    number | undefined
  >(undefined);
  const [tagIds, setTagIds] = useState<string[]>([]);

  // State for PriorityPickerModal visibility
  const [isPriorityModalVisible, setIsPriorityModalVisible] = useState(false);
  const [isRequirementModalVisible, setIsRequirementModalVisible] =
    useState(false);
  const [requirements, setRequirements] = useState<string[]>([]); // Or initialize from existingProblem.requirements if available

  useEffect(() => {
    if (isEditing && problemId) {
      const existingProblem = getProblemById(problemId);
      if (existingProblem) {
        setTitle(existingProblem.title);
        setDescription(existingProblem.description);
        setStatus(existingProblem.status);
        setPriority(existingProblem.priority); // Use the main priority state
        setResolutionCriteriaText(existingProblem.resolutionCriteriaText);
        setResolutionNumericalTarget(existingProblem.resolutionNumericalTarget);
        setCurrentNumericalProgress(existingProblem.currentNumericalProgress);
        setTagIds(existingProblem.tagIds || []);
      } else {
        console.warn(`Problem with ID ${problemId} not found.`);
        if (router.canGoBack()) router.back();
      }
    } else {
      // Defaults for a new problem
      setTitle("");
      setDescription(undefined);
      setStatus("active");
      setPriority("none");
      setResolutionCriteriaText(undefined);
      setResolutionNumericalTarget(undefined);
      setCurrentNumericalProgress(undefined);
      setTagIds([]);
    }
  }, [problemId, isEditing, getProblemById]);

  const handleDeleteProblem = useCallback(async () => {
    // ... (keep your existing handleDeleteProblem logic)
    if (!problemId) return;
    Alert.alert(
      "Delete Problem",
      "Are you sure you want to delete this problem?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await deleteProblemFromStore(problemId);
            if (success) {
              if (router.canGoBack()) router.back();
            } else {
              Alert.alert("Error", "Failed to delete problem.");
            }
          },
        },
      ]
    );
  }, [problemId, deleteProblemFromStore]);

  const handleSaveProblem = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert("Validation Error", "Title cannot be empty.");
      return;
    }
    if (isEditing && problemId) {
      const existingProblem = getProblemById(problemId);
      if (existingProblem) {
        const problemToUpdate: Problem = {
          ...existingProblem,
          title: title.trim(),
          description: description?.trim() || undefined,
          status,
          priority,
          resolutionCriteriaText: resolutionCriteriaText?.trim() || undefined,
          resolutionNumericalTarget,
          currentNumericalProgress,
          tagIds,
        };
        await updateProblemInStore(problemToUpdate);
        if (router.canGoBack()) router.back();
      }
    } else {
      const problemDataForStore: Omit<
        Problem,
        | "id"
        | "createdAt"
        | "objectiveIds"
        | "ruleIds"
        | "timeSpent"
        | "resolvedAt"
        | "archivedAt"
        | "starReportId"
        | "currentNumericalProgress"
      > & { currentNumericalProgress?: number } = {
        title: title.trim(),
        description: description?.trim() || undefined,
        status,
        priority, // Use the main priority state here
        resolutionCriteriaText: resolutionCriteriaText?.trim() || undefined,
        resolutionNumericalTarget,
        tagIds,
        ...(currentNumericalProgress !== undefined && {
          currentNumericalProgress,
        }),
      };
      const addedProblem = await addProblemToStore(problemDataForStore);
      if (addedProblem) {
        if (router.canGoBack()) router.back();
      }
    }
  }, [
    isEditing,
    problemId,
    title,
    description,
    status,
    priority,
    resolutionCriteriaText,
    resolutionNumericalTarget,
    currentNumericalProgress,
    tagIds,
    getProblemById,
    updateProblemInStore,
    addProblemToStore,
  ]);

  // Function to handle priority selection from the modal
  const handlePrioritySelected = (newSelectedPriority: Priority) => {
    setPriority(newSelectedPriority); // Update the main priority state
  };

  // Function to open the priority modal
  const openPriorityModal = () => {
    setIsPriorityModalVisible(true);
  };

  const handleAddNewRequirement = (requirementText: string) => {
    setRequirements((prev) => [...prev, requirementText]);
    // This `requirements` state would then be saved as part of your Problem object
    // (e.g., by adding a 'requirements: string[]' field to your Problem type and DB schema)
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? `Edit: ${title || "Problem"}` : "Add New Problem",
      headerRight: () =>
        isEditing ? (
          <Button onPress={handleDeleteProblem} title="Delete" color="red" />
        ) : null,
      headerLeft: (props: { tintColor?: string }) => (
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
          }}
          style={styles.customHeaderLeftContainer}
        >
          <Ionicons
            name={
              Platform.OS === "ios"
                ? "chevron-back-outline"
                : "arrow-back-outline"
            }
            size={28}
            color={props.tintColor || "#007AFF"}
          />
        </TouchableOpacity>
      ),
      headerBackTitleVisible: false,
    });
  }, [navigation, isEditing, title, problemId, handleDeleteProblem]);

  const displayPriorityText =
    priority.charAt(0).toUpperCase() + priority.slice(1);

  return (
    <ScrollView
      style={styles.scrollViewContainer}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.fieldGroup}>
        <TextInput
          style={styles.titleInput}
          placeholder="Problem Title"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor="#999"
        />
      </View>

      <Text style={styles.questionText}>Why is this a problem?</Text>
      <TextInput
        style={styles.descriptionInput}
        placeholder="+ add explanationn"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={200}
        textAlignVertical="top"
        placeholderTextColor="#999"
      />
      <View
        style={{
          backgroundColor: "#f0f0f0",
          borderRadius: 8,
          padding: 16,
          gap: 16,
        }}
      >
        <View style={{ flexDirection: "row" }}>
          <Text style={{ flex: 1, fontSize: 12 }}>소요 시간: </Text>
          <Text style={{ flex: 1, fontSize: 12 }}>4시간 21분</Text>
        </View>
        <View style={{ flexDirection: "row" }}>
          <Text style={{ flex: 1, fontSize: 12 }}>중요도: </Text>
          <TouchableOpacity
            onPress={openPriorityModal}
            style={[styles.priorityTouchable, { flex: 1 }]}
          >
            <Text style={styles.priorityValue}>{displayPriorityText}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.titleInput}>Requirements</Text>
      {requirements.map((req, index) => (
        <View key={index} style={styles.requirementListItem}>
          <Text>• {req}</Text>
          <TouchableOpacity
            onPress={() => {
              setRequirements((prev) => prev.filter((_, i) => i !== index));
            }}
          >
            <Text style={{ color: "red", marginLeft: 10 }}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Button
        title="Add Requirement"
        onPress={() => setIsRequirementModalVisible(true)}
      />

      <RequirementInputModal
        visible={isRequirementModalVisible}
        onClose={() => setIsRequirementModalVisible(false)}
        onAddRequirement={handleAddNewRequirement}
      />

      <Button
        title={isEditing ? "Save Changes" : "Create Problem"}
        onPress={handleSaveProblem}
      />

      <PriorityPickerModal
        visible={isPriorityModalVisible}
        onClose={() => setIsPriorityModalVisible(false)}
        onPrioritySelect={handlePrioritySelected}
        currentPriority={priority}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewContainer: {
    // Changed from container to allow full scroll
    flex: 1,
    backgroundColor: "#fff", // Background for the whole screen
  },
  contentContainer: {
    // Padding for the content inside ScrollView
    padding: 16,
  },
  fieldGroup: {
    // To group title and priority if needed, or just have them sequential
    marginBottom: 12,
  },
  titleInput: {
    paddingTop: 16,
    backgroundColor: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  priorityTouchable: {
    borderRadius: 8,
    borderColor: "#e0e0e0",
  },
  priorityLabel: {
    fontSize: 12,
    color: "#555",
  },
  priorityValue: {
    fontSize: 12,
    color: "#007AFF",
  },
  questionText: {
    fontSize: 14,
    marginBottom: 4,
    color: "#898989",
  },
  descriptionInput: {
    fontSize: 16,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  customHeaderLeftContainer: {
    marginLeft: Platform.OS === "ios" ? -10 : 0,
    paddingRight: 10,
    paddingVertical: 5,
  },
  requirementListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginBottom: 4,
    backgroundColor: "#f9f9f9",
    borderRadius: 6,
  },
});

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
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import PriorityPickerModal from "./PriorityPickerModal";
import RequirementInputModal from "./RequirementInputModal"; // Assuming you have this too

// Helper function to format timeSpent (assuming timeSpent is in total minutes)
const formatTimeSpent = (totalMinutes: number): string => {
  if (isNaN(totalMinutes) || totalMinutes === 0) return "0분"; // Or "N/A", "Not set"
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  let result = "";
  if (hours > 0) {
    result += `${hours}시간 `;
  }
  if (minutes > 0 || hours === 0) {
    // Show minutes if they exist or if hours is 0
    result += `${minutes}분`;
  }
  return result.trim();
};

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
  const [priority, setPriority] = useState<Priority>("none"); // Changed from 'medium' to reflect a "not set yet" or allow explicit "none"
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
  const [timeSpent, setTimeSpent] = useState<number>(0); // Added state for timeSpent (as number)

  // State for Modals visibility
  const [isPriorityModalVisible, setIsPriorityModalVisible] = useState(false);
  const [isRequirementModalVisible, setIsRequirementModalVisible] =
    useState(false);
  const [requirements, setRequirements] = useState<string[]>([]);

  useEffect(() => {
    if (isEditing && problemId) {
      const existingProblem = getProblemById(problemId);
      if (existingProblem) {
        setTitle(existingProblem.title);
        setDescription(existingProblem.description);
        setStatus(existingProblem.status);
        setPriority(existingProblem.priority);
        setResolutionCriteriaText(existingProblem.resolutionCriteriaText);
        setResolutionNumericalTarget(existingProblem.resolutionNumericalTarget);
        setCurrentNumericalProgress(existingProblem.currentNumericalProgress);
        setTagIds(existingProblem.tagIds || []);
        setTimeSpent(existingProblem.timeSpent); // Load timeSpent
        // If you add requirements to Problem type, load them here:
        // setRequirements(existingProblem.requirements || []);
      } else {
        console.warn(`Problem with ID ${problemId} not found.`);
        if (router.canGoBack()) router.back();
      }
    } else {
      // Defaults for a new problem
      setTitle("");
      setDescription(undefined);
      setStatus("active");
      setPriority("none"); // Default priority
      setResolutionCriteriaText(undefined);
      setResolutionNumericalTarget(undefined);
      setCurrentNumericalProgress(undefined);
      setTagIds([]);
      setTimeSpent(0); // Default timeSpent for new problem display
      setRequirements([]);
    }
  }, [problemId, isEditing, getProblemById]);

  const handleDeleteProblem = useCallback(async () => {
    // ... (your existing handleDeleteProblem logic)
    if (!problemId) return;
    Alert.alert("Delete Problem", "Are you sure?", [
      { text: "Cancel" },
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
    ]);
  }, [problemId, deleteProblemFromStore]);

  const handleSaveProblem = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert("Validation Error", "Title cannot be empty.");
      return;
    }
    if (priority === "none") {
      // Example: require priority to be set
      Alert.alert("Validation Error", "Please select a priority.");
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
          timeSpent, // Include timeSpent if it's managed and updated here
          // requirements: requirements, // If you add requirements to Problem type
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
        | "timeSpent" // timeSpent is omitted for add, store will default it to 0
        | "resolvedAt"
        | "archivedAt"
        | "starReportId"
        | "currentNumericalProgress"
      > & { currentNumericalProgress?: number } = {
        title: title.trim(),
        description: description?.trim() || undefined,
        status,
        priority,
        resolutionCriteriaText: resolutionCriteriaText?.trim() || undefined,
        resolutionNumericalTarget,
        tagIds,
        // requirements: requirements, // If you add requirements to Problem type (adjust Omit type too)
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
    timeSpent, // requirements,
    getProblemById,
    updateProblemInStore,
    addProblemToStore,
  ]);

  const handlePrioritySelected = (newSelectedPriority: Priority) => {
    setPriority(newSelectedPriority);
  };

  const openPriorityModal = () => {
    setIsPriorityModalVisible(true);
  };

  const handleAddNewRequirement = (requirementText: string) => {
    setRequirements((prev) => [...prev, requirementText]);
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
    priority === "none"
      ? "Select"
      : priority.charAt(0).toUpperCase() + priority.slice(1);

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
        placeholder="+ add explanation" // Corrected placeholder typo
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
          marginBottom: 20, // Added margin for spacing
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ flex: 1, fontSize: 12, color: "#555" }}>
            소요 시간:
          </Text>
          <Text style={{ flex: 1, fontSize: 12, fontWeight: "500" }}>
            {formatTimeSpent(timeSpent)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ flex: 1, fontSize: 12, color: "#555" }}>중요도: </Text>
          <TouchableOpacity
            onPress={openPriorityModal}
            style={[styles.priorityTouchableDisplay, { flex: 1 }]} // Changed style name for clarity
          >
            <Text style={styles.priorityValue}>{displayPriorityText}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Requirements</Text>
      {requirements.map((req, index) => (
        <View key={index} style={styles.requirementListItem}>
          <Text style={styles.requirementText}>• {req}</Text>
          <TouchableOpacity
            onPress={() => {
              setRequirements((prev) => prev.filter((_, i) => i !== index));
            }}
            style={styles.removeButton}
          >
            <Ionicons name="trash-outline" size={20} color="#ff3b30" />
          </TouchableOpacity>
        </View>
      ))}
      <Button
        title="+ Add Requirement"
        onPress={() => setIsRequirementModalVisible(true)}
      />
      <View style={{ marginTop: 24 }}>
        <Button
          title={isEditing ? "Save Changes" : "Create Problem"}
          onPress={handleSaveProblem}
        />
      </View>
      <PriorityPickerModal
        visible={isPriorityModalVisible}
        onClose={() => setIsPriorityModalVisible(false)}
        onPrioritySelect={handlePrioritySelected}
        currentPriority={priority}
      />
      <RequirementInputModal
        visible={isRequirementModalVisible}
        onClose={() => setIsRequirementModalVisible(false)}
        onAddRequirement={handleAddNewRequirement}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40, // Ensure space for final button
  },
  fieldGroup: {
    marginBottom: 12,
  },
  titleInput: {
    paddingVertical: 12, // Adjusted padding
    paddingHorizontal: 0, // No horizontal padding if it's just a title line
    backgroundColor: "#ffffff",
    fontSize: 22, // Larger for title
    fontWeight: "bold",
    borderBottomWidth: 1, // Underline for title
    borderBottomColor: "#eee",
    marginBottom: 12, // Original marginBottom
  },
  priorityTouchableDisplay: {
    // Renamed for clarity
    // Keeping original style for now, can be adjusted
    // No specific background needed if it's just text on the gray box
    paddingVertical: 2, // Minimal padding if it's just text
  },
  priorityLabel: {
    // This style was not used in your provided snippet for the inner display, but kept for consistency
    fontSize: 12,
    color: "#555",
  },
  priorityValue: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
  questionText: {
    fontSize: 14,
    marginBottom: 4,
    color: "#898989",
    marginTop: 12, // Added margin
  },
  descriptionInput: {
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    minHeight: 100,
    fontSize: 16,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  sectionTitle: {
    // New style for "Requirements" title
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 6,
  },
  requirementListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
    backgroundColor: "#f9f9f9",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#eef0f3",
  },
  requirementText: {
    fontSize: 15,
    flex: 1,
    color: "#444",
  },
  removeButton: {
    padding: 5,
  },
  customHeaderLeftContainer: {
    marginLeft: Platform.OS === "ios" ? 10 : 0, // Adjusted from -10 to 10 for iOS
    paddingRight: 10,
    paddingVertical: 5,
  },
});

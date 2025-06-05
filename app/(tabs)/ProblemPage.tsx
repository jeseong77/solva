import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  // TextInput, // TextInput for objective title will be removed from item
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  FlatList,
  TextInput,
} from "react-native";

// Assuming your project resolves @/types to your types/index.ts file
import {
  Problem,
  Objective,
  ProblemStatus,
  Priority,
  ObjectiveStatus,
} from "@/types";

// --- Color Palette (remains the same) ---
const COLORS = {
  background: "#FFFFFF",
  inputBackground: "#F5F5F5",
  cardBackground: "#EEEEEE", // Used for Objective items now
  infoBoxBackground: "#F0F0F0",
  statusChipBackground: "#E0E0E0",
  statusChipActiveText: "#1C1C1E",
  buttonPrimaryBackground: "#000000",
  buttonSecondaryBackground: "#E0E0E0", // Used for Add Objective button
  textPrimary: "#000000",
  textSecondary: "#555555",
  textLight: "#898989",
  textOnPrimaryButton: "#FFFFFF",
  textOnSecondaryButton: "#000000",
  disabledInputBackground: "#FAFAFA",
  deleteButtonBackground: "#D32F2F",
  textOnDeleteButton: "#FFFFFF",
  priorityValueText: "#007AFF",
  headerIconColor: "#000000", // Color for header icons
};

// --- Helper Function for Time Formatting (remains the same) ---
const formatTimeSpent = (totalMinutes: number): string => {
  if (isNaN(totalMinutes) || totalMinutes === 0) return "0분";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  let result = "";
  if (hours > 0) {
    result += `${hours}시간 `;
  }
  if (minutes > 0 || hours === 0) {
    result += `${minutes}분`;
  }
  return result.trim();
};

// --- Initial State (remains the same) ---
const getInitialProblem = (): Problem => ({
  id: `problem-${Date.now()}`,
  title: "",
  description: "",
  status: "active",
  priority: "medium",
  objectiveIds: [],
  ruleIds: [],
  timeSpent: 0,
  createdAt: new Date(),
});

const MOCK_EXISTING_OBJECTIVES: Objective[] = [
  {
    id: "obj-101",
    problemId: "problem-1",
    title: "Identify key factors for user churn",
    status: "inProgress",
    parentId: null,
    childObjectiveIds: [],
    blockingProblemIds: [],
    timeSpent: 120,
    createdAt: new Date(),
  },
  {
    id: "obj-102",
    problemId: "problem-1",
    title: "Draft survey questions for ex-users",
    status: "todo",
    parentId: "obj-101",
    childObjectiveIds: [],
    blockingProblemIds: [],
    timeSpent: 30,
    createdAt: new Date(),
  },
  {
    id: "obj-103",
    problemId: "problem-1",
    title:
      "Analyze initial feedback and define next steps for retention improvement strategies",
    status: "todo",
    parentId: null,
    childObjectiveIds: [],
    blockingProblemIds: [],
    timeSpent: 0,
    createdAt: new Date(),
  },
];

// --- Helper Components (CustomTextInput remains the same) ---
interface CustomTextInputProps {
  label?: string;
  value: string | undefined;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: "default" | "numeric";
  editable?: boolean;
  style?: object;
  labelStyle?: object;
  inputStyle?: object;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  numberOfLines,
  keyboardType = "default",
  editable = true,
  style,
  labelStyle,
  inputStyle,
}) => (
  <View style={[styles.inputGroup, style]}>
    {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
    <TextInput // Keep TextInput for Problem fields, but Objective titles become Text
      style={[
        styles.textInput,
        !editable && styles.disabledTextInput,
        inputStyle,
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textSecondary}
      multiline={multiline}
      numberOfLines={multiline ? numberOfLines : 1}
      keyboardType={keyboardType}
      editable={editable}
      selectionColor={COLORS.textPrimary}
    />
  </View>
);

// --- Problem Page ---
interface ProblemPageProps {
  problemId?: string;
  // navigation: any; // Placeholder for actual navigation prop
}

const ProblemPage: React.FC<ProblemPageProps> = ({
  problemId /*, navigation */,
}) => {
  const [problem, setProblem] = useState<Problem>(getInitialProblem());
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const isEditing = !!problemId;

  const problemStatusOptions: { label: string; value: ProblemStatus }[] = [
    { label: "Active", value: "active" },
    { label: "On Hold", value: "onHold" },
    { label: "Resolved", value: "resolved" },
    { label: "Archived", value: "archived" },
  ];
  const priorityOptions: { label: string; value: Priority }[] = [
    { label: "Select", value: "none" },
    { label: "Low", value: "low" },
    { label: "Medium", value: "medium" },
    { label: "High", value: "high" },
  ];

  useEffect(() => {
    if (isEditing && problemId) {
      const existingObjectives = MOCK_EXISTING_OBJECTIVES.filter((obj) =>
        ["obj-101", "obj-102", "obj-103"].includes(obj.id)
      );
      const totalProblemTimeSpent = existingObjectives.reduce(
        (sum, obj) => sum + obj.timeSpent,
        0
      );
      const fetchedProblem: Problem = {
        ...getInitialProblem(),
        id: problemId,
        title: "App Performance Degradation",
        description:
          "Users are reporting significant slowdowns during peak hours...",
        status: "active",
        priority: "high",
        objectiveIds: existingObjectives.map((obj) => obj.id),
        ruleIds: [],
        timeSpent: totalProblemTimeSpent,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      };
      setProblem(fetchedProblem);
      setObjectives(existingObjectives);
    } else {
      setProblem(getInitialProblem());
      setObjectives([]);
    }
  }, [problemId, isEditing]);

  useEffect(() => {
    const totalObjectiveTime = objectives.reduce(
      (sum, obj) => sum + (obj.timeSpent || 0),
      0
    );
    if (problem.timeSpent !== totalObjectiveTime) {
      handleInputChange("timeSpent", totalObjectiveTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectives]);

  const handleInputChange = (field: keyof Problem, value: any) => {
    setProblem((prev) => ({ ...prev, [field]: value }));
  };

  // Objective title and timeSpent are no longer editable inline here
  // const handleObjectiveChange = (objId: string, field: keyof Objective, value: any) => { ... }

  const handleAddObjective = () => {
    // This would navigate to a new Objective creation page
    Alert.alert(
      "Navigate",
      "Go to New Objective Page (for Problem ID: " + problem.id + ")"
    );
    // Example: navigation.navigate('NewObjectiveScreen', { problemId: problem.id });
  };

  // Objective deletion is managed on the (future) Objective Page
  // const deleteObjective = (objectiveId: string) => { ... }

  const handleSaveProblem = () => {
    if (!problem.title.trim()) {
      Alert.alert("Validation Error", "Problem title cannot be empty.");
      return;
    }
    if (problem.priority === "none") {
      Alert.alert("Validation Error", "Please select a priority.");
      return;
    }
    console.log("Saving problem:", JSON.stringify(problem, null, 2));
    Alert.alert(
      isEditing ? "Problem Updated" : "Problem Created",
      "Changes saved (simulated)."
    );
  };

  const handleDeleteProblem = () => {
    Alert.alert(
      "Delete Problem",
      "Are you sure you want to delete this problem?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: () => {
            console.log("Deleting problem:", problem.id);
            Alert.alert("Problem Deleted", "Problem deleted (simulated).");
            // navigation.goBack();
          },
        },
      ]
    );
  };

  const handleWriteStarReport = () => {
    Alert.alert(
      "Navigate",
      "Go to StarReport Page for Problem ID: " + problem.id
    );
    // Example: navigation.navigate('StarReportScreen', { problemId: problem.id });
  };

  const handleHeaderMenuPress = () => {
    Alert.alert("Problem Options", undefined, [
      { text: "Write StarReport", onPress: handleWriteStarReport },
      {
        text: "Delete Problem",
        onPress: handleDeleteProblem,
        style: "destructive",
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleNavigateToObjective = (objectiveId: string) => {
    Alert.alert("Navigate", `Go to Objective Page (ID: ${objectiveId})`);
    // Example: navigation.navigate('ObjectiveScreen', { objectiveId });
  };

  const renderObjectiveItem = ({ item }: { item: Objective }) => (
    <TouchableOpacity onPress={() => handleNavigateToObjective(item.id)}>
      <View style={styles.objectiveItemContainer}>
        <View style={styles.objectiveContentWrapper}>
          <Text style={styles.objectiveTitleText}>
            {item.title || "Untitled Objective"}
          </Text>
          <Text style={styles.objectiveTimeSpentText}>
            Time: {formatTimeSpent(item.timeSpent || 0)}
          </Text>
        </View>
        {/* Removed delete button from item */}
        <Text style={styles.objectiveChevron}>›</Text>
      </View>
    </TouchableOpacity>
  );

  const displayPriorityText =
    priorityOptions.find((p) => p.value === problem.priority)?.label ||
    "Select";
  const statusLabel =
    problemStatusOptions.find((s) => s.value === problem.status)?.label ||
    "Unknown";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.customHeader}>
        <TouchableOpacity
          onPress={
            () =>
              Alert.alert(
                "Navigate Back",
                "Go back action here."
              )
          }
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer} />
        <TouchableOpacity
          onPress={handleHeaderMenuPress}
          style={styles.headerButton}
        >
          <Text style={styles.headerButtonText}>…</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
      >

        <View style={styles.titleStatusContainer}>
          <CustomTextInput
            value={problem.title}
            onChangeText={(text) => handleInputChange("title", text)}
            placeholder="Problem Title*"
            style={styles.titleInputContainer}
            inputStyle={styles.titleTextInput}
          />
          <TouchableOpacity
            style={[
              styles.statusChip,
              problem.status === "active" && styles.statusChipActive,
              problem.status === "resolved" && styles.statusChipResolved,
            ]}
            onPress={() =>
              Alert.alert(
                `Select Status`,
                undefined,
                problemStatusOptions.map((opt) => ({
                  text: opt.label,
                  onPress: () => handleInputChange("status", opt.value),
                }))
              )
            }
          >
            <Text
              style={[
                styles.statusChipText,
                problem.status === "active" && styles.statusChipActiveText,
              ]}
            >
              {statusLabel}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.fieldLabelHelper}>Why is this a problem?</Text>
        <CustomTextInput
          value={problem.description}
          onChangeText={(text) => handleInputChange("description", text)}
          placeholder="+ add explanation"
          multiline
          numberOfLines={4}
          inputStyle={styles.descriptionInput}
        />

        <View style={styles.infoBox}>
          <View style={styles.infoBoxRow}>
            <Text style={styles.infoBoxLabel}>소요 시간 (Total):</Text>
            <Text style={styles.infoBoxValue}>
              {formatTimeSpent(problem.timeSpent || 0)}
            </Text>
          </View>
          <View style={styles.infoBoxRow}>
            <Text style={styles.infoBoxLabel}>중요도:</Text>
            <TouchableOpacity
              style={styles.infoBoxTouchableValue}
              onPress={() =>
                Alert.alert(
                  `Select Priority`,
                  undefined,
                  priorityOptions.map((opt) => ({
                    text: opt.label,
                    onPress: () => handleInputChange("priority", opt.value),
                  }))
                )
              }
            >
              <Text style={styles.priorityValueText}>
                {displayPriorityText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objectives</Text>
          {objectives.length > 0 ? (
            <FlatList
              data={objectives}
              renderItem={renderObjectiveItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyStateText}>
              No objectives defined yet.
            </Text>
          )}
          <TouchableOpacity
            style={styles.addObjectiveButtonBottom}
            onPress={handleAddObjective}
          >
            <Text style={styles.addObjectiveButtonBottomText}>
              + Add New Objective
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveProblem}
          >
            <Text style={styles.saveButtonText}>
              {isEditing ? "Update Problem" : "Create Problem"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  scrollContentContainer: { paddingBottom: 40 },
  customHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12, // Adjusted for icon touch area
    paddingVertical: 10, // Standard header height
    backgroundColor: COLORS.background, // Match page background
    // borderBottomWidth: 1, // Optional: if you want a separator
    // borderBottomColor: COLORS.inputBackground,
  },
  headerButton: {
    padding: 8, // Makes tap area larger
  },
  headerButtonText: {
    fontSize: 24, // Larger for icons
    color: COLORS.headerIconColor,
    fontWeight: "bold", // Ellipsis can be bold
  },
  headerTitleContainer: {
    // Empty center, takes up space
    flex: 1,
  },
  pageTitleSection: {
    // Section for the main page title in ScrollView
    paddingHorizontal: 16,
    paddingTop: 8, // Space from custom header
    paddingBottom: 8,
  },
  pageTitle: {
    // Actual page title text style
    fontSize: 28, // Prominent page title
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  titleStatusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  titleInputContainer: { flex: 1, marginRight: 12, marginBottom: 0 },
  titleTextInput: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
    fontSize: 22,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBackground,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.statusChipBackground,
    alignSelf: "center",
  },
  statusChipActive: { backgroundColor: "#C8E6C9" },
  statusChipResolved: { backgroundColor: "#B0BEC5" },
  statusChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  statusChipActiveText: { color: "#2E7D32" },
  fieldLabelHelper: {
    fontSize: 14,
    marginBottom: 4,
    color: COLORS.textLight,
    marginHorizontal: 16,
  },
  descriptionInput: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 0,
    borderRadius: 8,
    minHeight: 100,
    padding: 12,
    textAlignVertical: "top",
    marginHorizontal: 16,
  },
  infoBox: {
    backgroundColor: COLORS.infoBoxBackground,
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  infoBoxRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoBoxLabel: {
    flexShrink: 1,
    marginRight: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoBoxValue: {
    flexGrow: 1,
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textPrimary,
    textAlign: "right",
  },
  infoBoxTouchableValue: { flexGrow: 1, alignItems: "flex-end" },
  priorityValueText: {
    fontSize: 14,
    color: COLORS.priorityValueText,
    fontWeight: "500",
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    marginBottom: 8,
    backgroundColor: COLORS.background,
  }, // Increased paddingTop
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 16,
  }, // Increased marginBottom
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 6 },
  textInput: {
    backgroundColor: COLORS.inputBackground,
    color: COLORS.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    fontSize: 16,
    minHeight: 44,
  },
  disabledTextInput: {
    backgroundColor: COLORS.disabledInputBackground,
    color: COLORS.textSecondary,
  },
  // objectivesHeader removed as button moved
  objectiveItemContainer: {
    // Now a card-like item
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8, // More pronounced radius for card
    marginBottom: 10, // Increased space between objective cards
  },
  objectiveContentWrapper: {
    flex: 1,
    marginRight: 8,
  },
  objectiveTitleText: {
    // Changed from objectiveTitleInput
    fontSize: 16, // Slightly larger for better readability
    fontWeight: "500", // Make title stand out a bit
    color: COLORS.textPrimary,
    marginBottom: 4, // Space between title and time spent
  },
  objectiveTimeSpentText: {
    // No longer inside objectiveDetailsRow
    fontSize: 13, // Slightly larger
    color: COLORS.textSecondary,
  },
  // objectiveDetailsRow and objectiveTimeInput removed
  objectiveChevron: {
    // For the '>' icon
    fontSize: 20,
    color: COLORS.textSecondary,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingVertical: 16,
    fontStyle: "italic",
  },
  addObjectiveButtonBottom: {
    // New style for button below list
    backgroundColor: COLORS.buttonSecondaryBackground,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16, // Space above the button
    marginHorizontal: 0, // Takes full width of section padding
  },
  addObjectiveButtonBottomText: {
    color: COLORS.textOnSecondaryButton,
    fontSize: 15, // Slightly larger
    fontWeight: "500",
  },
  actionButtonsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: COLORS.buttonPrimaryBackground,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  saveButtonText: {
    color: COLORS.textOnPrimaryButton,
    fontSize: 16,
    fontWeight: "bold",
  },
  // Delete button removed from bottom, now in header menu
});

export default ProblemPage;

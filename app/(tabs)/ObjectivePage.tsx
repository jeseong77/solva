import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  FlatList,
} from "react-native";

// Assuming your project resolves @/types to your types/index.ts file
import {
  Problem, // Not directly used in this component's logic but often related
  Objective,
  ObjectiveStatus,
  Priority, // Not directly used in this component's logic but often related
  ProblemStatus, // Not directly used in this component's logic but often related
} from "@/types";

// --- Color Palette ---
const COLORS = {
  background: "#FFFFFF",
  inputBackground: "#F5F5F5",
  cardBackground: "#EEEEEE", // Used for Sub-Objective items
  infoBoxBackground: "#F0F0F0",
  statusChipBackground: "#E0E0E0",
  statusChipActiveText: "#000000",
  buttonPrimaryBackground: "#000000",
  buttonSecondaryBackground: "#E0E0E0",
  textPrimary: "#000000",
  textSecondary: "#555555",
  textLight: "#898989",
  textOnPrimaryButton: "#FFFFFF",
  textOnSecondaryButton: "#000000",
  disabledInputBackground: "#FAFAFA",
  deleteButtonBackground: "#D32F2F",
  textOnDeleteButton: "#FFFFFF",
  headerIconColor: "#000000",
  playButtonColor: "#007AFF",
  workRecordItemBackground: "#F9F9F9",
};

// --- NEW Local Data Type for WorkRecord ---
interface WorkRecord {
  id: string;
  objectiveId: string;
  startTime?: Date;
  durationMinutes: number;
  title: string;
  description?: string;
  createdAt: Date;
  type: "tracked" | "manual";
}

// --- Helper Function for Time Formatting ---
const formatTimeSpent = (totalMinutes: number): string => {
  if (isNaN(totalMinutes) || totalMinutes <= 0) return "-";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  let result = "";
  if (hours > 0) {
    result += `${hours}시간 `;
  }
  if (minutes > 0 || (hours === 0 && totalMinutes > 0)) {
    result += `${minutes}분`;
  }
  return result.trim();
};

// --- Helper Function for Date Formatting (Simple) ---
const formatDate = (date?: Date): string => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// --- Initial State & Mock Data ---
const getInitialObjective = (
  problemId: string,
  parentId: string | null = null
): Objective => ({
  id: `obj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More unique temp ID
  problemId: problemId,
  title: "",
  description: "",
  parentId: parentId,
  childObjectiveIds: [],
  blockingProblemIds: [],
  workSessionIds: [],
  status: "todo",
  deadline: undefined,
  timeSpent: 0,
  createdAt: new Date(),
  completedAt: undefined,
  order: undefined,
});

const MOCK_ALL_OBJECTIVES: Objective[] = [
  {
    id: "obj-parent-1",
    problemId: "problem-1",
    title: "Develop core authentication module",
    description:
      "Implement user sign-up, login, and password reset functionalities.",
    parentId: null,
    childObjectiveIds: ["obj-child-1A", "obj-child-1B"],
    blockingProblemIds: [],
    workSessionIds: [],
    status: "inProgress",
    deadline: new Date(2025, 6, 15),
    timeSpent: 0,
    createdAt: new Date(),
    completedAt: undefined,
    order: 1,
  },
  {
    id: "obj-child-1A",
    problemId: "problem-1",
    title: "Design database schema for users",
    description: "Define user table, roles, and permissions.",
    parentId: "obj-parent-1",
    childObjectiveIds: [],
    blockingProblemIds: [],
    workSessionIds: [],
    status: "todo",
    deadline: new Date(2025, 5, 20),
    timeSpent: 0,
    createdAt: new Date(),
    completedAt: undefined,
    order: 1,
  },
  {
    id: "obj-child-1B",
    problemId: "problem-1",
    title: "Implement OAuth 2.0 integration",
    description: "Allow login with Google and Facebook.",
    parentId: "obj-parent-1",
    childObjectiveIds: ["obj-grandchild-1Bi"],
    blockingProblemIds: [],
    workSessionIds: [],
    status: "blocked",
    deadline: new Date(2025, 5, 30),
    timeSpent: 0,
    createdAt: new Date(),
    completedAt: undefined,
    order: 2,
  },
  {
    id: "obj-grandchild-1Bi",
    problemId: "problem-1",
    title: "API key setup for Google OAuth",
    description: "",
    parentId: "obj-child-1B",
    childObjectiveIds: [],
    blockingProblemIds: [],
    workSessionIds: [],
    status: "todo",
    deadline: undefined,
    timeSpent: 0,
    createdAt: new Date(),
    completedAt: undefined,
    order: 1,
  },
  {
    id: "obj-parent-2",
    problemId: "problem-1",
    title: "Setup CI/CD pipeline",
    description: "Automate build, test, and deployment processes.",
    parentId: null,
    childObjectiveIds: [],
    blockingProblemIds: [],
    workSessionIds: [],
    status: "todo",
    deadline: new Date(2025, 7, 1),
    timeSpent: 0,
    createdAt: new Date(),
    completedAt: undefined,
    order: 2,
  },
];

const MOCK_WORK_RECORDS_FOR_OBJECTIVE: { [objectiveId: string]: WorkRecord[] } =
  {
    "obj-parent-1": [
      {
        id: "wr-1",
        objectiveId: "obj-parent-1",
        durationMinutes: 120,
        title: "2시간 연구 세션",
        description: "Initial research and planning for auth module.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        type: "manual",
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 25),
      },
      {
        id: "wr-2",
        objectiveId: "obj-parent-1",
        durationMinutes: 90,
        title: "1시간 30분 코딩",
        description: "Basic structure setup.",
        createdAt: new Date(),
        type: "tracked",
        startTime: new Date(),
      },
      {
        id: "wr-3",
        objectiveId: "obj-parent-1",
        durationMinutes: 90,
        title: "1시간 30분 테스트",
        description: "Login endpoint test.",
        createdAt: new Date(),
        type: "tracked",
        startTime: new Date(),
      },
    ],
    "obj-child-1A": [
      {
        id: "wr-4",
        objectiveId: "obj-child-1A",
        durationMinutes: 60,
        title: "1시간 DB 설계",
        createdAt: new Date(),
        type: "manual",
      },
    ],
  };

// --- Helper Components ---
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
    <TextInput
      style={[
        styles.textInput,
        !editable && styles.disabledTextInput,
        inputStyle,
      ]}
      value={value || ""} // Ensure value is not undefined for TextInput
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

// --- Objective Page ---
interface ObjectivePageProps {
  objectiveId?: string; // If editing
  // Props for creating a new objective:
  // problemIdForNew?: string;
  // parentIdForNew?: string | null;
}

const ObjectivePage: React.FC<ObjectivePageProps> = ({
  objectiveId,
  // problemIdForNew, // Example: receive from navigation
  // parentIdForNew = null, // Example: receive from navigation
}) => {
  const [currentObjective, setCurrentObjective] = useState<Objective | null>(
    null
  );
  const [childObjectives, setChildObjectives] = useState<Objective[]>([]);
  const [workRecords, setWorkRecords] = useState<WorkRecord[]>([]);
  const isEditing = !!objectiveId && !!currentObjective;

  const objectiveStatusOptions: { label: string; value: ObjectiveStatus }[] = [
    { label: "To Do", value: "todo" },
    { label: "In Progress", value: "inProgress" },
    { label: "Completed", value: "completed" },
    { label: "Blocked", value: "blocked" },
    { label: "On Hold", value: "onHold" },
    { label: "Cancelled", value: "cancelled" },
  ];

  useEffect(() => {
    if (objectiveId) {
      const fetchedObjective = MOCK_ALL_OBJECTIVES.find(
        (obj) => obj.id === objectiveId
      );
      if (fetchedObjective) {
        setCurrentObjective({ ...fetchedObjective, timeSpent: 0 }); // Initialize timeSpent, will be updated by workRecords
        const children = MOCK_ALL_OBJECTIVES.filter((obj) =>
          fetchedObjective.childObjectiveIds.includes(obj.id)
        );
        setChildObjectives(children);
        setWorkRecords(MOCK_WORK_RECORDS_FOR_OBJECTIVE[objectiveId] || []);
      } else {
        Alert.alert("Error", "Objective not found. (ID: " + objectiveId + ")");
        // Consider navigation.goBack() here if navigation prop were available
      }
    } else {
      // Creating a new objective (using a mock problemId for now)
      const mockProblemIdForNew = "problem-1"; // This should come from props/navigation
      // const mockParentIdForNew = parentIdForNew; // This should come from props/navigation
      setCurrentObjective(
        getInitialObjective(mockProblemIdForNew, /* mockParentIdForNew */ null)
      );
      setChildObjectives([]);
      setWorkRecords([]);
    }
  }, [objectiveId /*, problemIdForNew, parentIdForNew */]); // Dependencies for creating new

  useEffect(() => {
    if (currentObjective) {
      const totalDurationFromRecords = workRecords.reduce(
        (sum, record) => sum + record.durationMinutes,
        0
      );
      if (currentObjective.timeSpent !== totalDurationFromRecords) {
        // Use functional update for setCurrentObjective to avoid stale closures if handleInputChange also sets it
        setCurrentObjective((prev) =>
          prev ? { ...prev, timeSpent: totalDurationFromRecords } : null
        );
      }
    }
  }, [workRecords, currentObjective?.id]); // currentObjective.id ensures it runs if the objective itself changes

  const handleInputChange = (field: keyof Objective, value: any) => {
    setCurrentObjective((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleAddSubObjective = () => {
    if (!currentObjective) return;
    Alert.alert(
      "Navigate",
      `Create new sub-objective for "${
        currentObjective.title || "this objective"
      }"`
    );
    // Example: navigation.push('ObjectivePage', { problemIdForNew: currentObjective.problemId, parentIdForNew: currentObjective.id });
  };

  const handleAddManualWorkRecord = () => {
    if (!currentObjective) return;
    Alert.prompt(
      // Using Alert.prompt for simpler input for this mock
      "Add Manual Work Record",
      "Enter duration in minutes:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: (durationStr) => {
            const duration = parseInt(durationStr || "0", 10);
            if (duration > 0) {
              Alert.prompt(
                "Add Description (Optional)",
                undefined,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Save",
                    onPress: (descStr) => {
                      const newRecord: WorkRecord = {
                        id: `wr-manual-${Date.now()}`,
                        objectiveId: currentObjective.id, // Ensured currentObjective is not null
                        durationMinutes: duration,
                        title: `${formatTimeSpent(duration)} 수동 기록`,
                        description: descStr || undefined,
                        createdAt: new Date(),
                        type: "manual",
                      };
                      setWorkRecords((prev) => [...prev, newRecord]);
                    },
                  },
                ],
                "plain-text"
              );
            } else if (durationStr !== null) {
              // Only alert if user entered something invalid (not just cancelled)
              Alert.alert(
                "Invalid Duration",
                "Please enter a positive number for minutes."
              );
            }
          },
        },
      ],
      "plain-text", // Default text for prompt
      "", // Default value for prompt
      "numeric" // Keyboard type
    );
  };

  const handleSaveObjective = () => {
    if (!currentObjective || !currentObjective.title.trim()) {
      Alert.alert("Validation Error", "Objective title cannot be empty.");
      return;
    }
    // In a real app, you'd also save workRecords associated with this objective
    console.log("Saving objective:", JSON.stringify(currentObjective, null, 2));
    console.log("Work Records:", JSON.stringify(workRecords, null, 2));
    Alert.alert(
      isEditing ? "Objective Updated" : "Objective Created",
      "Changes saved (simulated)."
    );
    // navigation.goBack();
  };

  const handleDeleteObjective = () => {
    if (!currentObjective) return;
    Alert.alert(
      "Delete Objective",
      `Are you sure you want to delete "${
        currentObjective.title || "this objective"
      }"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            console.log("Deleting objective:", currentObjective.id);
            Alert.alert(
              "Objective Deleted",
              `"${currentObjective.title || "Objective"}" deleted (simulated).`
            );
            // navigation.goBack();
          },
        },
      ]
    );
  };

  const handleMarkAsComplete = () => {
    if (!currentObjective) return;
    handleInputChange("status", "completed");
    handleInputChange("completedAt", new Date());
    Alert.alert(
      "Status Updated",
      `"${currentObjective.title || "Objective"}" marked as completed.`
    );
  };

  const handleHeaderMenuPress = () => {
    if (!currentObjective) return;
    const menuOptions: any[] = []; // Use 'any' for Alert button type temporarily
    if (currentObjective.status !== "completed") {
      menuOptions.push({
        text: "Mark as Completed",
        onPress: handleMarkAsComplete,
      });
    }
    menuOptions.push({
      text: "Delete Objective",
      onPress: handleDeleteObjective,
      style: "destructive",
    });
    menuOptions.push({ text: "Cancel", style: "cancel" });

    Alert.alert("Objective Options", undefined, menuOptions);
  };

  const handlePlayPress = () => {
    if (!currentObjective) return;
    Alert.prompt(
      "Tracked Session Note (Optional)",
      "A 25 minute session will be logged. Add a note?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Session",
          onPress: (desc) => {
            const newRecord: WorkRecord = {
              id: `wr-tracked-${Date.now()}`,
              objectiveId: currentObjective.id, // Ensured currentObjective is not null
              startTime: new Date(Date.now() - 25 * 60000), // Simulate it started 25 mins ago
              durationMinutes: 25,
              title: "25분 집중 세션",
              description: desc || undefined,
              createdAt: new Date(),
              type: "tracked",
            };
            setWorkRecords((prev) => [...prev, newRecord]);
            Alert.alert("Work Logged", "25 minute session added to records.");
          },
        },
      ],
      "plain-text"
    );
  };

  const handleNavigateToSubObjective = (subObjectiveId: string) => {
    Alert.alert("Navigate", `Go to Sub-Objective Page (ID: ${subObjectiveId})`);
    // Example: navigation.push('ObjectivePage', { objectiveId: subObjectiveId });
  };

  const renderChildObjectiveItem = ({ item }: { item: Objective }) => (
    <TouchableOpacity onPress={() => handleNavigateToSubObjective(item.id)}>
      <View style={styles.childObjectiveItemContainer}>
        <View style={styles.childObjectiveContentWrapper}>
          <Text style={styles.childObjectiveTitleText}>
            {item.title || "Untitled Sub-Objective"}
          </Text>
          <Text style={styles.childObjectiveTimeSpentText}>
            Logged: {formatTimeSpent(item.timeSpent || 0)} | Status:{" "}
            {item.status}
          </Text>
        </View>
        <Text style={styles.objectiveChevron}>›</Text>
      </View>
    </TouchableOpacity>
  );

  const renderWorkRecordItem = ({ item }: { item: WorkRecord }) => (
    <View style={styles.workRecordItemContainer}>
      <View style={styles.workRecordHeader}>
        <Text style={styles.workRecordTitle}>{item.title}</Text>
        <Text style={styles.workRecordDate}>
          {formatDate(item.createdAt)} ({item.type})
        </Text>
      </View>
      {item.description && (
        <Text style={styles.workRecordDescription}>{item.description}</Text>
      )}
    </View>
  );

  if (!currentObjective) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.customHeader}>
          <TouchableOpacity
            onPress={() => Alert.alert("Navigate Back", "Go back.")}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer} />
          <TouchableOpacity
            onPress={() => {}}
            style={styles.headerButton}
            disabled
          >
            <Text style={styles.headerButtonText}>…</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centeredMessageContainer}>
          <Text>Loading Objective...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusLabel =
    objectiveStatusOptions.find((s) => s.value === currentObjective.status)
      ?.label || currentObjective.status; // Fallback to raw status if label not found

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.customHeader}>
        <TouchableOpacity
          onPress={() => Alert.alert("Navigate Back", "Go back.")}
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
        <View style={styles.pageTitleSection}>
          <Text style={styles.pageTitle}>
            {isEditing ? "Edit Objective" : "New Objective"}
          </Text>
        </View>

        <View style={styles.titleSectionContainer}>
          <TextInput // Changed from CustomTextInput for direct styling control
            style={styles.objectiveMainTitleInput}
            value={currentObjective.title}
            onChangeText={(text) => handleInputChange("title", text)}
            placeholder="Objective Title*"
            placeholderTextColor={COLORS.textSecondary}
          />
          <TouchableOpacity onPress={handlePlayPress} style={styles.playButton}>
            <Text style={styles.playButtonText}>▶</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.metaInfoContainer}>
          <TouchableOpacity
            style={[styles.statusChip]}
            onPress={() =>
              Alert.alert(
                `Select Status`,
                undefined,
                objectiveStatusOptions.map((opt) => ({
                  text: opt.label,
                  onPress: () => handleInputChange("status", opt.value),
                }))
              )
            }
          >
            <Text style={styles.statusChipText}>{statusLabel}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deadlineDisplay}
            onPress={() =>
              Alert.alert("Set Deadline", "Date picker would show here.")
            }
          >
            <Text style={styles.deadlineText}>
              Deadline: {formatDate(currentObjective.deadline)}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.fieldLabelHelper}>Details / Notes</Text>
        <CustomTextInput // Using CustomTextInput here for consistency if it has more features
          value={currentObjective.description}
          onChangeText={(text) => handleInputChange("description", text)}
          placeholder="+ add details or notes for this objective"
          multiline
          numberOfLines={5}
          inputStyle={styles.descriptionInput}
        />

        <View style={styles.timeSpentDisplaySection}>
          <Text style={styles.infoBoxLabel}>Logged (Total):</Text>
          <Text style={styles.infoBoxValue}>
            {formatTimeSpent(currentObjective.timeSpent)}
          </Text>
        </View>
        {currentObjective.parentId && (
          <Text style={styles.parentInfoText}>
            Sub-objective of: [Parent Objective Title Here - ID:
            {currentObjective.parentId}]
          </Text>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sub-Objectives</Text>
          {childObjectives.length > 0 ? (
            <FlatList
              data={childObjectives}
              renderItem={renderChildObjectiveItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyStateText}>
              No sub-objectives defined yet.
            </Text>
          )}
          <TouchableOpacity
            style={styles.addSubObjectiveButton}
            onPress={handleAddSubObjective}
          >
            <Text style={styles.addSubObjectiveButtonText}>
              + Add Sub-Objective
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- NEW Work Records Section --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Records</Text>
          {workRecords.length > 0 ? (
            <FlatList
              data={workRecords}
              renderItem={renderWorkRecordItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyStateText}>
              No work sessions recorded yet.
            </Text>
          )}
          <TouchableOpacity
            style={styles.addWorkRecordButton}
            onPress={handleAddManualWorkRecord}
          >
            <Text style={styles.addWorkRecordButtonText}>
              + Record Manual Session
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveObjective}
          >
            <Text style={styles.saveButtonText}>
              {isEditing ? "Update Objective" : "Create Objective"}
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
  centeredMessageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  customHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.background,
  },
  headerButton: { padding: 8 },
  headerButtonText: {
    fontSize: 24,
    color: COLORS.headerIconColor,
    fontWeight: "bold",
  },
  headerTitleContainer: { flex: 1 },
  pageTitleSection: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  pageTitle: { fontSize: 28, fontWeight: "bold", color: COLORS.textPrimary },
  titleSectionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  objectiveMainTitleInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.inputBackground,
  },
  playButton: { marginLeft: 12, padding: 10 },
  playButtonText: {
    fontSize: 24,
    color: COLORS.playButtonColor,
    fontWeight: "bold",
  },
  metaInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.statusChipBackground,
    marginRight: 12,
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.statusChipActiveText,
  },
  deadlineDisplay: {
    paddingHorizontal: 0,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deadlineText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  fieldLabelHelper: {
    fontSize: 14,
    marginBottom: 4,
    color: COLORS.textLight,
    marginTop: 0,
    marginHorizontal: 16,
  },
  descriptionInput: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 0,
    borderRadius: 8,
    minHeight: 120,
    padding: 12,
    textAlignVertical: "top",
    marginHorizontal: 16,
    marginBottom: 20,
  },
  timeSpentDisplaySection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.infoBoxBackground,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  infoBoxLabel: { fontSize: 14, color: COLORS.textSecondary },
  infoBoxValue: { fontSize: 14, fontWeight: "500", color: COLORS.textPrimary },
  parentInfoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: "italic",
    marginHorizontal: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 8,
    backgroundColor: COLORS.background,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
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
  childObjectiveItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  childObjectiveContentWrapper: { flex: 1, marginRight: 8 },
  childObjectiveTitleText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  childObjectiveTimeSpentText: { fontSize: 13, color: COLORS.textSecondary },
  objectiveChevron: { fontSize: 20, color: COLORS.textSecondary },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    paddingVertical: 16,
    fontStyle: "italic",
  },
  addSubObjectiveButton: {
    backgroundColor: COLORS.buttonSecondaryBackground,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  addSubObjectiveButtonText: {
    color: COLORS.textOnSecondaryButton,
    fontSize: 15,
    fontWeight: "500",
  },

  workRecordItemContainer: {
    backgroundColor: COLORS.workRecordItemBackground,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  workRecordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  workRecordTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  workRecordDate: { fontSize: 11, color: COLORS.textSecondary },
  workRecordDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  addWorkRecordButton: {
    backgroundColor: COLORS.buttonSecondaryBackground,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  addWorkRecordButtonText: {
    color: COLORS.textOnSecondaryButton,
    fontSize: 15,
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
});

export default ObjectivePage;

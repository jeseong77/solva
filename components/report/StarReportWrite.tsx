import { useAppStore } from "@/store/store";
import {
  SessionThreadItem,
  StarReport,
  ThreadItem,
  ThreadItemType,
} from "@/types";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useShallow } from "zustand/react/shallow";
import StarReportPreviewModal from "./StarReportPreviewModal";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from "react-native-reanimated"; // ✅ Reanimated 훅 추가

// --- Helper Functions and Constants ---
const formatSeconds = (totalSeconds: number): string => {
  if (typeof totalSeconds !== "number" || isNaN(totalSeconds)) return "00:00";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const parts = [
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ];
  if (hours > 0) parts.unshift(String(hours).padStart(2, "0"));
  return parts.join(":");
};

const typeStyles: {
  [key in Exclude<ThreadItemType, "Session" | "General">]: {
    color: string;
    name: string;
  };
} = {
  Insight: { color: "#2b8a3e", name: "인사이트" },
  Bottleneck: { color: "#2b8a3e", name: "병목" },
  Task: { color: "#2b8a3e", name: "할 일" },
  Action: { color: "#2b8a3e", name: "액션" },
};

// ✅ [추가] 애니메이션이 적용된 입력창 그룹 컴포넌트
interface StarInputGroupProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}
const StarInputGroup: React.FC<StarInputGroupProps> = ({ label, value, onChangeText, placeholder }) => {
  const [isFocused, setIsFocused] = useState(false);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      progress.value,
      [0, 1],
      ["#e9ecef", "#2b8a3e"]
    );
    return {
      borderColor,
    };
  });

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Animated.View
        style={[styles.textInputContainer, animatedContainerStyle]}
      >
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#adb5bd"
          multiline
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </Animated.View>
    </View>
  );
};

// --- Main Component ---
interface StarReportWriteProps {
  isVisible: boolean;
  onClose: () => void;
  problemId: string;
}
export default function StarReportWrite({
  isVisible,
  onClose,
  problemId,
}: StarReportWriteProps) {
  const [isPreviewVisible, setPreviewVisible] = useState(false);
  const [situation, setSituation] = useState("");
  const [task, setTask] = useState("");
  const [action, setAction] = useState("");
  const [result, setResult] = useState("");
  const [learnings, setLearnings] = useState("");

  const {
    getProblemById,
    getStarReportByProblemId,
    updateStarReport,
    threadItems,
  } = useAppStore(
    useShallow((state) => ({
      getProblemById: state.getProblemById,
      getStarReportByProblemId: state.getStarReportByProblemId,
      updateStarReport: state.updateStarReport,
      threadItems: state.threadItems,
    }))
  );

  const problem = getProblemById(problemId);
  const starReport = getStarReportByProblemId(problemId);
  const problemThreads = threadItems.filter((t) => t.problemId === problemId);

  useEffect(() => {
    if (isVisible && starReport) {
      setSituation(starReport.situation || "");
      setTask(starReport.task || "");
      setAction(starReport.action || "");
      setResult(starReport.result || "");
      setLearnings(starReport.learnings || "");
    }
  }, [isVisible, starReport]);

  const handleSave = () => {
    if (!starReport) return;
    const updatedReport: StarReport = {
      ...starReport,
      situation,
      task,
      action,
      result,
      learnings,
    };
    updateStarReport(updatedReport);
    onClose();
  };

  if (!problem) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color="#343a40" />
          </TouchableOpacity>
          <View style={styles.headerRightContainer}>
            <TouchableOpacity onPress={() => setPreviewVisible(true)}>
              <Text style={styles.headerButton}>미리보기</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave}>
              <Text style={[styles.headerButton, styles.headerButtonSave]}>
                저장
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <KeyboardAwareScrollView
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.referenceSection}>
            <Text style={styles.problemTitle}>{problem.title}</Text>
            <Text style={styles.sectionTitle}>문제 해결 과정 요약</Text>
            {problemThreads
              .filter((t) => !t.parentId)
              .map((thread) => (
                <ReferenceThreadItem
                  key={thread.id}
                  thread={thread}
                  allThreads={problemThreads}
                  level={0}
                />
              ))}
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>STAR 회고</Text>
            <StarInputGroup
              label="Situation (상황)"
              placeholder="문제가 발생한 배경이나 맥락은 어땠나요?"
              value={situation}
              onChangeText={setSituation}
            />
            <StarInputGroup
              label="Task (과제)"
              placeholder="해결해야 할 구체적인 과제는 무엇이었나요?"
              value={task}
              onChangeText={setTask}
            />
            <StarInputGroup
              label="Action (행동)"
              placeholder="과제를 해결하기 위해 어떤 행동을 했나요?"
              value={action}
              onChangeText={setAction}
            />
            <StarInputGroup
              label="Result (결과)"
              placeholder="행동의 결과로 어떤 변화가 있었나요?"
              value={result}
              onChangeText={setResult}
            />
            <StarInputGroup
              label="Learnings (배운 점)"
              placeholder="이번 경험을 통해 무엇을 배웠나요?"
              value={learnings}
              onChangeText={setLearnings}
            />
          </View>
        </KeyboardAwareScrollView>

        <StarReportPreviewModal
          isVisible={isPreviewVisible}
          onClose={() => setPreviewVisible(false)}
          reportData={{ situation, task, action, result, learnings }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const ReferenceThreadItem = ({
  thread,
  allThreads,
  level,
}: {
  thread: ThreadItem;
  allThreads: ThreadItem[];
  level: number;
}) => {
  const allChildren = allThreads.filter((t) => t.parentId === thread.id);
  const sessionChildren = allChildren.filter(
    (t): t is SessionThreadItem => t.type === "Session"
  );
  const nonSessionChildren = allChildren.filter((t) => t.type !== "Session");
  const sessionCount = sessionChildren.length;
  const totalSessionTime = sessionChildren.reduce(
    (sum, s) => sum + s.timeSpent,
    0
  );
  let isCompleted = false;
  if (thread.type === "Task") isCompleted = thread.isCompleted;
  else if (thread.type === "Action")
    isCompleted = thread.status === "completed";
  else if (thread.type === "Bottleneck") isCompleted = thread.isResolved;

  const tagStyle =
    thread.type !== "General" && thread.type !== "Session"
      ? typeStyles[thread.type as keyof typeof typeStyles]
      : null;

  if (thread.type === "Session") return null;

  return (
    <View style={{ marginLeft: level * 20, marginBottom: 10 }}>
      <View style={styles.threadItemContainer}>
        <Feather
          name={isCompleted ? "check-square" : "square"}
          size={16}
          color={isCompleted ? "#2b8a3e" : "#adb5bd"}
          style={{ marginRight: 8, marginTop: 2 }}
        />
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.threadItemText,
              isCompleted && styles.threadItemTextCompleted,
            ]}
          >
            {thread.content}
          </Text>
          {tagStyle && (
            <Text style={[styles.typeTagText, { color: tagStyle.color }]}>
              #{tagStyle.name}
            </Text>
          )}
        </View>
      </View>
      {sessionCount > 0 && (
        <View style={styles.sessionSummaryContainer}>
          <Feather name="clock" size={14} color="#868e96" />
          <Text style={styles.sessionSummaryText}>
            {sessionCount}개의 세션 - {formatSeconds(totalSessionTime)} 작업함
          </Text>
        </View>
      )}
      {nonSessionChildren.map((child) => (
        <ReferenceThreadItem
          key={child.id}
          thread={child}
          allThreads={allThreads}
          level={level + 1}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#f1f3f5",
  },
  headerRightContainer: { flexDirection: "row", alignItems: "center" },
  headerButton: { fontSize: 16, color: "#2b8a3e" },
  headerButtonSave: { fontWeight: "bold", marginLeft: 12 },
  scrollView: { flex: 1 },

  referenceSection: {
    padding: 20,
    paddingBottom: 24,
    backgroundColor: "#f8f9fa",
  },
  problemTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#212529",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#868e96",
    textTransform: "uppercase",
  },
  threadItemContainer: { flexDirection: "row" },
  threadItemText: { fontSize: 15, color: "#495057", lineHeight: 22 },
  threadItemTextCompleted: {
    color: "#adb5bd",
    textDecorationLine: "line-through",
  },
  typeTagText: { fontSize: 13, fontWeight: "500", marginTop: 4 },
  sessionSummaryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 24,
    marginTop: 4,
    marginBottom: 8,
  },
  sessionSummaryText: {
    marginLeft: 6,
    fontSize: 13,
    color: "#868e96",
    fontStyle: "italic",
  },

  // Input Section
  inputSection: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 },
  inputGroup: { marginBottom: 32 },
  inputLabel: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 12,
  },
  // ✅ [추가] TextInput을 감싸는 애니메이션 컨테이너 스타일
  textInputContainer: {
    borderWidth: 1.5,
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  // ✅ [수정] TextInput 자체는 테두리와 배경이 없음
  textInput: {
    padding: 16,
    paddingTop: 16,
    fontSize: 16,
    minHeight: 140,
    textAlignVertical: "top",
    color: "#212529",
    lineHeight: 24,
  },
});

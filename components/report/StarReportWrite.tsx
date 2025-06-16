import { useAppStore } from "@/store/store";
import {
  SessionThreadItem,
  StarReport,
  ThreadItem,
  ThreadItemType,
} from "@/types";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react"; // ✅ useEffect 추가
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view"; // ✅ [추가]
import { useShallow } from "zustand/react/shallow";
import StarReportPreviewModal from "./StarReportPreviewModal";

// 초(seconds)를 HH:MM:SS 형식으로 변환하는 헬퍼 함수
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

// ✅ [추가] 타입별 칩 스타일 정보
const typeStyles: {
  [key in Exclude<ThreadItemType, "Session">]: {
    color: string;
    backgroundColor: string;
    name: string;
  };
} = {
  General: { color: "#1c7ed6", backgroundColor: "#d0ebff", name: "일반" },
  Bottleneck: { color: "#f76707", backgroundColor: "#fff4e6", name: "병목" },
  Task: { color: "#2b8a3e", backgroundColor: "#e6fcf5", name: "할 일" },
  Action: { color: "#d9480f", backgroundColor: "#fff0f6", name: "액션" },
  Insight: { color: "#845ef7", backgroundColor: "#f3f0ff", name: "인사이트" },
};

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

  // ✅ [추가] STAR 필드 입력을 위한 상태
  const [situation, setSituation] = useState("");
  const [task, setTask] = useState("");
  const [action, setAction] = useState("");
  const [result, setResult] = useState("");
  const [learnings, setLearnings] = useState("");

  // ✅ [추가] 스토어에서 데이터 및 액션 가져오기
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

  // ✅ [추가] prop으로 받은 problemId를 기반으로 데이터 조회
  const problem = getProblemById(problemId);
  const starReport = getStarReportByProblemId(problemId);
  const problemThreads = threadItems.filter((t) => t.problemId === problemId);

  // ✅ [추가] 모달이 열리거나, starReport 데이터가 로드되면 입력 필드 상태를 초기화/업데이트
  useEffect(() => {
    if (starReport) {
      setSituation(starReport.situation);
      setTask(starReport.task);
      setAction(starReport.action);
      setResult(starReport.result);
      setLearnings(starReport.learnings || "");
    }
  }, [starReport]);

  // ✅ [추가] 저장 핸들러
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
        {/* 고정 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color="#343a40" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>STAR 리포트 작성</Text>
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
          extraScrollHeight={20} // 키보드와 입력창 사이의 추가 여백 (선택 사항)
        >
          {/* 참고 정보 섹션 */}
          <View style={styles.referenceSection}>
            {/* ✅ [수정] 제목과 아이콘을 포함하는 컨테이너 View로 변경 */}
            <View style={styles.problemTitleContainer}>
              <Text style={styles.problemTitle}>{problem.title}</Text>
              <TouchableOpacity>
                <Feather name="chevron-right" size={28} color="#adb5bd" />
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionTitle}>문제 해결 과정 요약</Text>
            {problemThreads
              .filter((t) => !t.parentId)
              .map((thread) => (
                <ReferenceThreadItem
                  key={thread.id}
                  thread={thread}
                  allThreads={problemThreads} // ✅ 전체 스레드 목록을 prop으로 전달
                  level={0}
                />
              ))}
          </View>

          {/* STAR 입력 섹션 */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>STAR 회고</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Situation (상황)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="문제가 발생한 배경이나 맥락은 어땠나요?"
                multiline
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Task (과제)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="해결해야 할 구체적인 과제는 무엇이었나요?"
                multiline
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Action (행동)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="과제를 해결하기 위해 어떤 행동을 했나요?"
                multiline
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Result (결과)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="행동의 결과로 어떤 변화가 있었나요?"
                multiline
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Learnings (배운 점)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="이번 경험을 통해 무엇을 배웠나요?"
                multiline
              />
            </View>
          </View>
        </KeyboardAwareScrollView>

        {/* 4. JSX 최하단에 미리보기 모달 렌더링 코드 추가 */}
        <StarReportPreviewModal
          isVisible={isPreviewVisible}
          onClose={() => setPreviewVisible(false)}
          // ✅ [추가] 현재 작성 중인 내용을 reportData prop으로 전달
          reportData={{ situation, task, action, result, learnings }}
        />
      </SafeAreaView>
    </Modal>
  );
}
const ReferenceThreadItem = ({
  thread,
  allThreads, // ✅ 1. prop을 받도록 수정
  level,
}: {
  thread: ThreadItem;
  allThreads: ThreadItem[]; // ✅ 1. allThreads의 타입을 명시
  level: number;
}) => {
  // ✅ 2. dummyThreads 대신 prop으로 받은 allThreads 사용
  const allChildren = allThreads.filter((t) => t.parentId === thread.id);
  const sessionChildren = allChildren.filter(
    (t): t is SessionThreadItem => t.type === "Session"
  );
  const nonSessionChildren = allChildren.filter((t) => t.type !== "Session");

  // --- 세션 정보 계산 ---
  const sessionCount = sessionChildren.length;
  const totalSessionTime = sessionChildren.reduce(
    (sum, s) => sum + s.timeSpent,
    0
  );

  // --- 아이콘 및 완료 상태 결정 로직 (기존과 유사) ---
  const isCompletable =
    thread.type === "Task" ||
    thread.type === "Action" ||
    thread.type === "Bottleneck";

  let isCompleted = false;
  if (thread.type === "Task") isCompleted = thread.isCompleted;
  else if (thread.type === "Action")
    isCompleted = thread.status === "completed";
  else if (thread.type === "Bottleneck") isCompleted = thread.isResolved;

  let iconName: React.ComponentProps<typeof Feather>["name"] =
    "corner-down-right";
  if (isCompletable) iconName = isCompleted ? "check-circle" : "circle";

  const tagStyle =
    thread.type !== "General"
      ? typeStyles[
          thread.type as Exclude<ThreadItemType, "Session" | "General">
        ]
      : null;

  // Session 타입 자체는 이제 렌더링하지 않음
  if (thread.type === "Session") return null;

  return (
    <View style={{ marginLeft: level * 20 }}>
      <View style={styles.threadItemContainer}>
        <View style={styles.threadItemLeft}>
          <Feather
            name={iconName}
            size={16}
            color={isCompleted ? "#2b8a3e" : "#adb5bd"}
            style={{ marginRight: 8 }}
          />
          {tagStyle && (
            <View
              style={[
                styles.typeTag,
                { backgroundColor: tagStyle.backgroundColor },
              ]}
            >
              <Text style={[styles.typeTagText, { color: tagStyle.color }]}>
                {tagStyle.name}
              </Text>
            </View>
          )}
          <Text
            style={[
              styles.threadItemText,
              isCompleted && styles.threadItemTextCompleted,
            ]}
            numberOfLines={1}
          >
            {thread.content}
          </Text>
        </View>
      </View>

      {/* 세션 요약 정보 표시 */}
      {sessionCount > 0 && (
        <View style={styles.sessionSummaryContainer}>
          <Feather name="clock" size={14} color="#868e96" />
          <Text style={styles.sessionSummaryText}>
            {sessionCount}개의 세션 - {formatSeconds(totalSessionTime)} 작업함
          </Text>
        </View>
      )}

      {/* Session이 아닌 자식 스레드만 재귀적으로 렌더링 */}
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
    borderColor: "#e9ecef",
  },
  headerTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    zIndex: -1,
  },
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: { fontSize: 16, color: "#1971c2" },
  headerButtonSave: { fontWeight: "bold", marginLeft: 16 },
  scrollView: { flex: 1, marginBottom: 20 },
  referenceSection: {
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderColor: "#e9ecef",
  },
  // ✅ [추가] 제목과 아이콘을 감싸는 컨테이너 스타일
  problemTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  // ✅ [수정] 제목 스타일
  problemTitle: {
    fontSize: 22,
    fontWeight: "bold",
    flex: 1, // 아이콘을 제외한 남은 공간을 모두 차지
    marginRight: 8, // 아이콘과의 간격
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  threadItemContainer: {
    flexDirection: "row",
    justifyContent: "space-between", // 왼쪽과 오른쪽 내용을 양 끝으로
    alignItems: "flex-start",
    marginBottom: 10,
  },
  threadItemLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1, // 텍스트가 길어지면 공간을 차지하도록
    marginRight: 8,
  },
  threadItemText: {
    fontSize: 15,
    color: "#868e96",
    flex: 1, // 텍스트가 아이콘 옆 남은 공간을 모두 차지
  },
  threadItemTextCompleted: {
    textDecorationLine: "line-through",
    color: "#2b8a3e",
  },
  typeTag: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginRight: 6,
  },
  typeTagText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  // ✅ [추가] 세션 시간 텍스트 스타일
  sessionTimeText: {
    fontSize: 14,
    color: "#868e96",
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  sessionSummaryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 24, // 아이콘 너비만큼 들여쓰기
    marginBottom: 12,
  },
  sessionSummaryText: {
    marginLeft: 6,
    fontSize: 13,
    color: "#868e96",
    fontStyle: "italic",
  },
  inputSection: { padding: 20 },
  inputGroup: { marginBottom: 24 },
  inputLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#343a40",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#f1f3f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: "top",
  },
});

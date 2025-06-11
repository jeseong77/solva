// app/components/problem/ProblemDetail.tsx

import { useAppStore } from "@/store/store";
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useShallow } from "zustand/react/shallow";
import ProblemPost from "./ProblemPost";

// 컴포넌트가 받을 Props 정의
interface ProblemDetailProps {
  isVisible: boolean;
  onClose: () => void;
  problemId: string | null; // problemId는 nullable일 수 있음
}

export default function ProblemDetail({
  isVisible,
  onClose,
  problemId,
}: ProblemDetailProps) {
  // 스토어에서 필요한 함수들을 가져옴
  const { getProblemById, getPersonaById } = useAppStore(
    useShallow((state) => ({
      getProblemById: state.getProblemById,
      getPersonaById: state.getPersonaById,
    }))
  );

  // problemId를 기반으로 problem과 persona 객체를 조회
  const problem = problemId ? getProblemById(problemId) : null;
  const persona = problem ? getPersonaById(problem.personaId) : null;

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={26} color="#343a40" />
          </TouchableOpacity>
        </View>

        {/* problem과 persona가 모두 존재할 때만 내용 표시 */}
        {problem && persona ? (
          <ScrollView style={styles.contentScrollView}>
            {/* 1. 문제 상세 내용 (ProblemPost) */}
            <ProblemPost problem={problem} persona={persona} />

            <View style={styles.divider} />

            {/* 2. 향후 추가될 스레드(댓글) 리스트 영역 */}
            <View style={styles.threadSection}>
              <Text style={styles.threadTitle}>Threads</Text>
              {/* 여기에 스레드 리스트 컴포넌트가 들어옵니다. */}
            </View>
          </ScrollView>
        ) : (
          // 데이터 로딩 중이거나 오류 시 표시될 UI
          <View style={styles.loadingContainer}>
            <Text>문제 정보를 불러오는 중...</Text>
          </View>
        )}

        {/* 푸터: 댓글 입력 창 */}
        <View style={styles.commentInputContainer}>
          <Text style={styles.commentInputPlaceholder}>Add a thread...</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#e9ecef",
  },
  contentScrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: 8,
    backgroundColor: "#f1f3f5",
  },
  threadSection: {
    padding: 16,
    backgroundColor: "#ffffff",
  },
  threadTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  commentInputContainer: {
    padding: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderColor: "#e9ecef",
  },
  commentInputPlaceholder: {
    color: "#adb5bd",
  },
});

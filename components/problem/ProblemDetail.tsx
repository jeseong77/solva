// app/components/problem/ProblemDetail.tsx

import { useAppStore } from "@/store/store";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react"; // useState 임포트
import {
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useShallow } from "zustand/react/shallow";
import ThreadWrite from "../thread/ThreadWrite";
import ProblemPost from "./ProblemPost";

// 컴포넌트가 받을 Props 정의
interface ProblemDetailProps {
  isVisible: boolean;
  onClose: () => void;
  problemId: string | null;
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

  // 1. ThreadWrite 모달 제어를 위한 상태 추가
  const [isWriteModalVisible, setWriteModalVisible] = useState(false);
  const [replyParentId, setReplyParentId] = useState<string | null>(null);

  // problemId를 기반으로 problem과 persona 객체를 조회
  const problem = problemId ? getProblemById(problemId) : null;
  const persona = problem ? getPersonaById(problem.personaId) : null;

  // 2. 모달을 여는 핸들러 함수들 정의
  // 최상위 스레드 작성 모달 열기
  const handleOpenRootWriteModal = () => {
    setReplyParentId(null); // 부모 ID가 없으므로 null
    setWriteModalVisible(true);
  };

  // 답글 작성 모달 열기 (향후 ThreadItem에서 사용)
  const handleOpenReplyWriteModal = (parentId: string) => {
    setReplyParentId(parentId);
    setWriteModalVisible(true);
  };

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={26} color="#343a40" />
          </TouchableOpacity>
        </View>

        {problem && persona ? (
          <ScrollView style={styles.contentScrollView}>
            <ProblemPost problem={problem} persona={persona} />
            <View style={styles.divider} />
            <View style={styles.threadSection}>
              <Text style={styles.threadTitle}>Threads</Text>
              {/* 향후 여기에 ThreadList 컴포넌트가 위치하며,
                handleOpenReplyWriteModal 함수를 props로 전달하게 됩니다.
              */}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.loadingContainer}>
            <Text>문제 정보를 불러오는 중...</Text>
          </View>
        )}

        {/* 3. 푸터: 눌러서 스레드 작성 모달을 열도록 수정 */}
        <TouchableOpacity
          style={styles.commentInputContainer}
          onPress={handleOpenRootWriteModal}
        >
          <Text style={styles.commentInputPlaceholder}>Add a thread...</Text>
        </TouchableOpacity>
      </SafeAreaView>

      {/* 4. ThreadWrite 모달 렌더링 */}
      {problem && (
        <ThreadWrite
          isVisible={isWriteModalVisible}
          onClose={() => setWriteModalVisible(false)}
          problemId={problem.id}
          parentThreadId={replyParentId}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#ffffff", // 배경색을 흰색으로 변경
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
    backgroundColor: "#f8f9fa", // 스크롤 배경은 다른 색으로
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
    minHeight: 200, // 스레드가 없을 때도 최소 높이 확보
  },
  threadTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  commentInputContainer: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 30 : 16, // iOS 하단 여백 추가
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderColor: "#e9ecef",
  },
  commentInputPlaceholder: {
    color: "#adb5bd",
  },
});

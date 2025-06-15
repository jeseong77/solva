import StarReportContent from "@/components/report/StarReportContent";
import StarReportWrite from "@/components/report/StarReportWrite";
import { useAppStore } from "@/store/store";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useShallow } from "zustand/react/shallow";

export default function StarReportDetailScreen() {
  const router = useRouter();
  // 1. URL 파라미터에서 reportId를 가져옵니다.
  const { reportId } = useLocalSearchParams<{ reportId: string }>();

  // 2. 스토어에서 필요한 데이터와 getter를 가져옵니다.
  const { getStarReportById, getProblemById } = useAppStore(
    useShallow((state) => ({
      getStarReportById: state.getStarReportById,
      getProblemById: state.getProblemById,
    }))
  );

  // 3. 수정 모달의 표시 여부를 관리할 상태
  const [isWriteModalVisible, setWriteModalVisible] = useState(false);

  if (!reportId) {
    // reportId가 없는 예외 상황 처리
    return (
      <View style={styles.centered}>
        <Text>리포트 ID가 올바르지 않습니다.</Text>
      </View>
    );
  }

  const report = getStarReportById(reportId);
  const problem = report ? getProblemById(report.problemId) : undefined;

  // 데이터 로딩 중 처리
  if (!report || !problem) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더: 뒤로가기, 문제 제목, 수정하기 버튼 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
        >
          <Feather name="chevron-left" size={26} color="#343a40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {problem.title}
        </Text>
        <TouchableOpacity
          onPress={() => setWriteModalVisible(true)}
          style={styles.headerButton}
        >
          <Feather name="edit-2" size={20} color="#343a40" />
        </TouchableOpacity>
      </View>

      {/* 4. 재사용 가능한 StarReportContent 컴포넌트를 사용하여 리포트 내용 표시 */}
      <StarReportContent reportData={report} />

      {/* 5. 수정하기 버튼을 눌렀을 때 나타날 StarReportWrite 모달 */}
      <StarReportWrite
        isVisible={isWriteModalVisible}
        onClose={() => setWriteModalVisible(false)}
        problemId={problem.id}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#e9ecef",
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
    marginHorizontal: 12,
  },
});

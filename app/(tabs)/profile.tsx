import StarReportList from "@/components/report/StarReportList";
import { useAppStore } from "@/store/store";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { useShallow } from "zustand/react/shallow";

export default function ProfileScreen() {
  const router = useRouter();

  const { starReports, fetchStarReports, problems, fetchProblems } =
    useAppStore(
      useShallow((state) => ({
        starReports: state.starReports,
        fetchStarReports: state.fetchStarReports,
        problems: state.problems, // ✅ [추가]
        fetchProblems: state.fetchProblems, // ✅ [추가]
      }))
    );
  useFocusEffect(
    useCallback(() => {
      // ✅ [수정] 모든 리포트와 모든 문제를 병렬로 가져옵니다.
      Promise.all([fetchStarReports(), fetchProblems()]);
    }, [fetchStarReports, fetchProblems])
  );

  // ✅ [추가] 유효한 리포트만 필터링하고 최신순으로 정렬합니다.
  const validAndSortedReports = useMemo(() => {
    const problemIdSet = new Set(problems.map((p) => p.id));
    return starReports
      .filter((report) => problemIdSet.has(report.problemId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [starReports, problems]);

  // 3. 리스트 아이템을 눌렀을 때 실행될 핸들러 함수를 정의합니다.
  const handlePressReportItem = (reportId: string) => {
    // 해당 리포트의 상세 페이지로 이동합니다.
    router.push(`/report/${reportId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 여기에 프로필 사진, 사용자 이름 등 
          다른 프로필 관련 컴포넌트들이 추가될 수 있습니다. 
        */}

        <StarReportList
          reports={validAndSortedReports} // ✅ 필터링 및 정렬된 데이터 전달
          onPressItem={handlePressReportItem}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa", // 배경색을 홈 화면과 유사하게 설정
  },
  scrollView: {
    flex: 1,
  },
});

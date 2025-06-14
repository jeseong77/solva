import StarReportList from "@/components/report/StarReportList";
import { useAppStore } from "@/store/store";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { useShallow } from "zustand/react/shallow";

export default function ProfileScreen() {
  const router = useRouter();

  // 1. 스토어에서 리포트 데이터와 fetch 함수를 가져옵니다.
  const { starReports, fetchStarReports, problems } = useAppStore(
    useShallow((state) => ({
      starReports: state.starReports,
      fetchStarReports: state.fetchStarReports,
      problems: state.problems, // ✅ 추가
    }))
  );
  const validReports = useMemo(() => {
    const problemIds = new Set(problems.map((p) => p.id));
    return starReports.filter((report) => problemIds.has(report.problemId));
  }, [starReports, problems]);

  // 2. 프로필 화면에 들어올 때마다 최신 리포트 목록을 불러옵니다.
  useFocusEffect(
    useCallback(() => {
      fetchStarReports();
    }, [fetchStarReports])
  );

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

        {/* 4. StarReportList 컴포넌트를 렌더링하고, 데이터와 핸들러를 전달합니다. */}
        <StarReportList
          reports={validReports}
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

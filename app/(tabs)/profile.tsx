import ProfileCard from "@/components/user/ProfileCard";
import StarReportList from "@/components/report/StarReportList";
import { useAppStore } from "@/store/store";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useShallow } from "zustand/react/shallow";
import { useBottomTabOverflow } from "@/components/ui/TabBarBackground";

export default function ProfileScreen() {
  const router = useRouter();
  const bottom = useBottomTabOverflow();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    user,
    personas,
    problems,
    threadItems,
    starReports,
    fetchStarReports,
    fetchProblems,
    fetchPersonas,
    fetchThreads,
  } = useAppStore(
    useShallow((state) => ({
      user: state.user,
      personas: state.personas,
      problems: state.problems,
      threadItems: state.threadItems,
      starReports: state.starReports,
      fetchStarReports: state.fetchStarReports,
      fetchProblems: state.fetchProblems,
      fetchPersonas: state.fetchPersonas,
      fetchThreads: state.fetchThreads,
    }))
  );

  const loadProfileData = useCallback(async () => {
    await Promise.all([fetchPersonas(), fetchProblems(), fetchStarReports()]);
    const currentProblems = useAppStore.getState().problems;
    if (currentProblems.length > 0) {
      const threadFetchPromises = currentProblems.map((p) =>
        fetchThreads({ problemId: p.id })
      );
      await Promise.all(threadFetchPromises);
    }
  }, [fetchPersonas, fetchProblems, fetchStarReports, fetchThreads]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadProfileData();
    } catch (error) {
      console.error("Failed to refresh profile data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadProfileData]);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData])
  );

  const profileStats = useMemo(() => {
    if (!user) return null;
    const userPersonas = personas.filter((p) => p.userId === user.id);
    const userProblemIds = new Set(userPersonas.flatMap((p) => p.problemIds));
    const userProblems = problems.filter((p) => userProblemIds.has(p.id));
    const problemsSolved = userProblems.filter(
      (p) => p.status === "resolved"
    ).length;
    const totalSeconds = threadItems
      .filter((t) => userProblemIds.has(t.problemId)) // 현재 유저의 문제에 속한 스레드만 필터링
      .reduce((sum, item) => {
        // 'Action' 또는 'Session' 타입에만 timeSpent가 존재
        if (item.type === "Action" || item.type === "Session") {
          return sum + (item.timeSpent || 0);
        }
        return sum;
      }, 0);
    const totalHours = totalSeconds / 3600; // 초 단위를 시간으로
    const activePersonas = userPersonas.length;
    const insightsGained = threadItems.filter(
      (t) => t.type === "Insight"
    ).length;
    return { problemsSolved, totalHours, activePersonas, insightsGained };
  }, [user, personas, problems, threadItems]);

  const validAndSortedReports = useMemo(() => {
    const problemIdSet = new Set(problems.map((p) => p.id));
    return starReports
      .filter((report) => problemIdSet.has(report.problemId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [starReports, problems]);

  const handlePressReportItem = (reportId: string) => {
    router.push(`/report/${reportId}`);
  };

  const handleEditProfile = () => {
    router.push("/profile/edit");
  };

  return (
    <View style={[styles.container, { paddingBottom: bottom }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#868e96"
            colors={["#868e96"]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <ProfileCard
          user={user}
          stats={profileStats}
          onEditProfile={handleEditProfile}
          onEditCover={handleEditProfile}
          onEditAvatar={handleEditProfile}
        />
        <StarReportList
          reports={validAndSortedReports}
          onPressItem={handlePressReportItem}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
});

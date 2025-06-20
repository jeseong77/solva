// app/(tabs)/profile.tsx

import StarReportList from "@/components/report/StarReportList";
import { useBottomTabOverflow } from "@/components/ui/TabBarBackground";
import ProfileCard from "@/components/user/ProfileCard";
import { useAppStore } from "@/store/store";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useShallow } from "zustand/react/shallow";

export default function ProfileScreen() {
  const router = useRouter();
  const bottom = useBottomTabOverflow();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ [변경] Persona -> Objective 관련 상태와 액션으로 변경
  const {
    user,
    objectives, // personas -> objectives
    problems,
    threadItems,
    starReports,
    fetchStarReports,
    fetchProblems,
    fetchObjectives, // fetchPersonas -> fetchObjectives
    fetchThreads,
  } = useAppStore(
    useShallow((state) => ({
      user: state.user,
      objectives: state.objectives, // state.personas -> state.objectives
      problems: state.problems,
      threadItems: state.threadItems,
      starReports: state.starReports,
      fetchStarReports: state.fetchStarReports,
      fetchProblems: state.fetchProblems,
      fetchObjectives: state.fetchObjectives, // state.fetchPersonas -> state.fetchObjectives
      fetchThreads: state.fetchThreads,
    }))
  );

  const loadProfileData = useCallback(async () => {
    // ✅ [변경] fetchPersonas -> fetchObjectives
    await Promise.all([fetchObjectives(), fetchProblems(), fetchStarReports()]);
    const currentProblems = useAppStore.getState().problems;
    if (currentProblems.length > 0) {
      const threadFetchPromises = currentProblems.map((p) =>
        fetchThreads({ problemId: p.id })
      );
      await Promise.all(threadFetchPromises);
    }
  }, [fetchObjectives, fetchProblems, fetchStarReports, fetchThreads]);

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

    // Dynamically derive userProblemIds
    const userProblemIds = new Set(
      problems
        .filter((p) => objectives.some((o) => o.id === p.objectiveId))
        .map((p) => p.id)
    );

    const userProblems = problems.filter((p) => userProblemIds.has(p.id));
    const problemsSolved = userProblems.filter(
      (p) => p.status === "resolved"
    ).length;

    const totalSeconds = threadItems
      .filter((t) => userProblemIds.has(t.problemId))
      .reduce((sum, item) => {
        if (item.type === "Action" || item.type === "Session") {
          return sum + (item.timeSpent || 0);
        }
        return sum;
      }, 0);

    const totalHours = totalSeconds / 3600;
    const activeObjectives = objectives.filter(
      (o) => o.userId === user.id
    ).length;
    const insightsGained = threadItems.filter(
      (t) => userProblemIds.has(t.problemId) && t.type === "Insight"
    ).length;

    return { problemsSolved, totalHours, activeObjectives, insightsGained };
  }, [user, objectives, problems, threadItems]);

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

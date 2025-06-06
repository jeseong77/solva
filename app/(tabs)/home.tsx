import React from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StatusBar,
} from "react-native";

// --- 색상 팔레트 (Black & White 테마) ---
const COLORS = {
  background: "#FFFFFF",
  sectionBackground: "#F5F5F5",
  cardBackground: "#EEEEEE",
  newProblemButtonBackground: "#E0E0E0", // 새 Problem 추가 버튼 배경색
  fabBackground: "#000000",
  textPrimary: "#000000",
  textSecondary: "#555555",
  textOnFab: "#FFFFFF",
  progressBarFilled: "#000000",
  progressBarBackground: "#D3D3D3",
  iconColor: "#000000",
};

// --- 수정된 더미 데이터 (문제 해결 프레임워크 컨셉) ---
// FOCUS_PROBLEMS_DATA는 이제 순수 문제 데이터만 가짐
const FOCUS_PROBLEMS_DATA = [
  {
    id: "problem-1",
    title: "앱 사용자 이탈률 30% 증가 문제",
    priority: "High",
    progress: 0.15,
  },
  {
    id: "problem-2",
    title: "만성적인 수면 부족으로 인한 주간 피로도 심각",
    priority: "High",
    progress: 0.05,
  },
  {
    id: "problem-3",
    title: "프로젝트 마감일 임박과 주요 기능 버그 미해결",
    priority: "Critical",
    progress: 0.4,
  },
  {
    id: "problem-4",
    title: "업무 스트레스 누적으로 인한 번아웃 초기 증상 발현",
    priority: "Medium",
    progress: 0.1,
  },
];

const UPCOMING_OBJECTIVES_DATA = [
  {
    id: "obj-1",
    title: "이탈 사용자 그룹 인터뷰 (5명) 준비 및 질문지 작성",
    problemTitle: "앱 사용자 이탈률 30% 증가 문제",
    deadline: "D-2",
    completed: false,
  },
  {
    id: "obj-2",
    title: "취침 전 1시간 스마트폰 사용 금지 규칙 3일차 실행",
    problemTitle: "만성적인 수면 부족으로 인한 주간 피로도 심각",
    deadline: "오늘",
    completed: false,
  },
  {
    id: "obj-3",
    title: "로그인 관련 치명적 버그 원인 분석",
    problemTitle: "프로젝트 마감일 임박과 주요 기능 버그 미해결",
    deadline: "오늘",
    completed: false,
  },
  {
    id: "obj-4",
    title: "하루 10분 명상 앱 설치 및 첫 세션 진행",
    problemTitle: "업무 스트레스 누적으로 인한 번아웃 초기 증상 발현",
    deadline: "내일",
    completed: true,
  },
  {
    id: "obj-5",
    title: "경쟁사 UX 분석 자료 수집",
    problemTitle: "앱 사용자 이탈률 30% 증가 문제",
    deadline: "D-3",
    completed: false,
  },
];

const RECENT_ACTIVITY_DATA = {
  completedObjectives: 1,
  newProblems: 0,
  timeSpentHours: 2.5,
};

const RULE_REMINDER_DATA = {
  title: "문제 정의 시, 측정 가능한 해결 기준으로 명시하기",
};

// --- 컴포넌트 ---

const ProgressBar = ({ progress }: { progress: number }) => (
  <View style={styles.progressBarContainer}>
    <View
      style={[
        styles.progressBarFilled,
        { width: `${Math.max(0, Math.min(1, progress)) * 100}%` },
      ]}
    />
  </View>
);

// Focus Problem 카드
const FocusProblemCard = ({
  item,
  onPress,
}: {
  item: (typeof FOCUS_PROBLEMS_DATA)[0];
  onPress: () => void;
}) => (
  <TouchableOpacity onPress={onPress} style={styles.problemCard}>
    <Text style={styles.problemCardTitle}>{item.title}</Text>
    <Text style={styles.problemCardSubtitle}>중요도: {item.priority}</Text>
    <ProgressBar progress={item.progress} />
    <Text style={styles.problemCardProgressText}>
      {Math.round(item.progress * 100)}% 해결 진행
    </Text>
  </TouchableOpacity>
);

// Upcoming Objective 아이템 (이전과 동일)
const UpcomingObjectiveItem = ({
  item,
}: {
  item: (typeof UPCOMING_OBJECTIVES_DATA)[0];
}) => (
  <View
    style={[
      styles.objectiveItem,
      {
        backgroundColor: item.completed
          ? COLORS.sectionBackground
          : COLORS.cardBackground,
      },
    ]}
  >
    <View style={styles.objectiveItemCheckbox}>
      <Text style={styles.objectiveItemCheckboxText}>
        {item.completed ? "✓" : " "}
      </Text>
    </View>
    <View style={styles.objectiveItemTextContainer}>
      <Text
        style={[
          styles.objectiveItemTitle,
          item.completed && styles.objectiveItemCompletedText,
        ]}
      >
        {item.title}
      </Text>
      <Text
        style={[
          styles.objectiveItemSubtitle,
          item.completed && styles.objectiveItemCompletedText,
        ]}
      >
        ({item.problemTitle}) - {item.deadline}
      </Text>
    </View>
  </View>
);

// --- 홈 화면 ---
const HomeScreen = () => {
  const handleAddProblemPress = () => {
    console.log("New Problem");
    // navigation.navigate('AddProblemScreen'); // 예시
  };

  const handleProblemCardPress = (problemId: string) => {
    console.log(`${problemId} 상세 페이지로 이동`);
    // navigation.navigate('ProblemDetailScreen', { problemId }); // 예시
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* 나의 집중 Problem 섹션 */}
        <View style={styles.focusProblemSectionContainer}>
          <Text style={styles.sectionTitle}>나의 집중 Problem</Text>
          <FlatList
            horizontal
            data={FOCUS_PROBLEMS_DATA}
            renderItem={({ item }) => (
              <FocusProblemCard
                item={item}
                onPress={() => handleProblemCardPress(item.id)}
              />
            )}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContainer}
          />
          <TouchableOpacity
            onPress={handleAddProblemPress}
            style={styles.addNewProblemButton}
          >
            <Text style={styles.addNewProblemButtonText}>
              + New Problem
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>오늘 / 마감 임박 Objective</Text>
        <View style={styles.objectiveListContainer}>
          {UPCOMING_OBJECTIVES_DATA.map((item) => (
            <UpcomingObjectiveItem key={item.id} item={item} />
          ))}
        </View>

        <Text style={styles.sectionTitle}>최근 활동 요약</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>
            완료된 Objective: {RECENT_ACTIVITY_DATA.completedObjectives}개
          </Text>
          <Text style={styles.summaryText}>
            새로 생성된 Problem: {RECENT_ACTIVITY_DATA.newProblems}개
          </Text>
          <Text style={styles.summaryText}>
            총 집중 시간: {RECENT_ACTIVITY_DATA.timeSpentHours}시간
          </Text>
        </View>

        <Text style={styles.sectionTitle}>오늘의 원칙</Text>
        <View style={styles.ruleCard}>
          <Text style={styles.ruleText}>"{RULE_REMINDER_DATA.title}"</Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => console.log("FAB: 빠른 추가 액션")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

// --- 스타일 시트 ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  // 나의 집중 Problem 섹션 스타일
  focusProblemSectionContainer: {
    // FlatList와 추가 버튼을 감싸는 컨테이너
    // 이 컨테이너의 배경색을 지정할 수도 있습니다. (예: COLORS.sectionBackground)
    // 혹은 투명하게 두어 페이지 배경색이 보이도록 할 수도 있습니다.
    // 여기서는 별도 배경색 없이 진행
  },
  horizontalListContainer: {
    paddingLeft: 16,
    paddingRight: 4, // 카드와 화면 끝 간의 여백을 위해 약간 남김
  },
  problemCard: {
    backgroundColor: COLORS.cardBackground,
    padding: 16,
    marginRight: 12,
    width: 280,
    height: 150,
    borderRadius: 8,
    justifyContent: "space-between",
  },
  problemCardTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  problemCardSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  problemCardProgressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "right",
    marginTop: 4,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.progressBarBackground,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFilled: {
    height: "100%",
    backgroundColor: COLORS.progressBarFilled,
    borderRadius: 4,
  },
  addNewProblemButton: {
    // FlatList 아래에 위치할 새 버튼 스타일
    backgroundColor: COLORS.newProblemButtonBackground,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 16, // 좌우 여백
    marginTop: 16, // FlatList와의 간격
    marginBottom: 8, // 섹션 하단 여백 (다음 섹션 타이틀과의 간격 조절용)
    alignItems: "center",
  },
  addNewProblemButtonText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "500", // 약간 굵게
  },
  // 오늘/마감 임박 Objective 스타일 (이전과 동일)
  objectiveListContainer: {
    marginHorizontal: 16,
    backgroundColor: COLORS.sectionBackground,
    borderRadius: 8,
    padding: 8,
  },
  objectiveItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  objectiveItemCheckbox: {
    width: 24,
    height: 24,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderRadius: 4,
  },
  objectiveItemCheckboxText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  objectiveItemTextContainer: {
    flex: 1,
  },
  objectiveItemTitle: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  objectiveItemSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  objectiveItemCompletedText: {
    color: COLORS.textSecondary,
    textDecorationLine: "line-through",
  },
  // 최근 활동 요약 스타일 (이전과 동일)
  summaryCard: {
    backgroundColor: COLORS.sectionBackground,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  // Rule 리마인더 스타일 (이전과 동일)
  ruleCard: {
    backgroundColor: COLORS.sectionBackground,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
  },
  ruleText: {
    fontSize: 14,
    fontStyle: "italic",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  // FAB 스타일 (이전과 동일)
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.fabBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  fabText: {
    color: COLORS.textOnFab,
    fontSize: 30,
    lineHeight: 30,
  },
});

export default HomeScreen;

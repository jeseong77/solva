// src/components/DoListItem.tsx
import { DoItem } from "@/types"; // DoItem 타입 사용
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

interface DoListItemProps {
    doItem: DoItem;
    onPress: (doItemId: string) => void; // 편집 화면 등으로 이동
    onDelete: (doItemId: string) => void; // 삭제 처리
    onToggleComplete?: (doItemId: string, currentStatus: boolean) => void; // MVP 이후 추가 가능 (오늘 했는지 체크)
}

// 스와이프 관련 상수 (ProblemListItem과 유사하게)
const TRASH_ICON_ONLY_SIZE = 22; // 아이콘 크기 약간 작게 조절 가능
const CIRCULAR_BUTTON_PADDING = 8;
const CIRCULAR_BUTTON_DIAMETER = TRASH_ICON_ONLY_SIZE + CIRCULAR_BUTTON_PADDING * 2;
const REVEAL_WIDTH = CIRCULAR_BUTTON_DIAMETER + 16; // 버튼 크기에 맞게 조절
const SWIPE_THRESHOLD = REVEAL_WIDTH / 2.5;
const VELOCITY_THRESHOLD_TO_OPEN = -500;

export default function DoListItem({
    doItem,
    onPress,
    onDelete,
    onToggleComplete, // 이 기능은 추후 구현
}: DoListItemProps) {
    const translateX = useSharedValue(0);
    const isSwipedOpen = useSharedValue(false);

    // DoItem에 대한 메타 정보 (예: 반복 규칙, 성공/실패 횟수)
    const metaInfo = `${doItem.recurrenceRule} · S:${doItem.successCount} / F:${doItem.failureCount}`;
    const isLocked = doItem.isLocked || false;

    const showDeleteConfirmation = () => {
        Alert.alert(
            "Do 항목 삭제",
            `"${doItem.title}" 항목을 정말 삭제하시겠습니까?`,
            [
                { text: "취소", onPress: () => { translateX.value = withTiming(0); isSwipedOpen.value = false; }, style: "cancel" },
                { text: "삭제", onPress: () => { onDelete(doItem.id); isSwipedOpen.value = false; translateX.value = withTiming(0); }, style: "destructive" },
            ],
            { cancelable: true, onDismiss: () => { translateX.value = withTiming(0); isSwipedOpen.value = false; } }
        );
    };

    const handleDeletePress = () => { runOnJS(showDeleteConfirmation)(); };

    const panGesture = Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-5, 5])
        .enabled(!isLocked) // 잠금 상태일 때 제스처 비활성화
        .onUpdate((event) => {
            if (isLocked) return;
            const newX = event.translationX;
            translateX.value = Math.max(-REVEAL_WIDTH, Math.min(0, isSwipedOpen.value ? -REVEAL_WIDTH + newX : newX));
        })
        .onEnd((event) => {
            if (isLocked) return;
            if (event.translationX < -SWIPE_THRESHOLD || event.velocityX < VELOCITY_THRESHOLD_TO_OPEN) {
                translateX.value = withTiming(-REVEAL_WIDTH);
                isSwipedOpen.value = true;
            } else {
                translateX.value = withTiming(0);
                isSwipedOpen.value = false;
            }
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const handleItemPress = () => {
        if (isLocked) {
            Alert.alert("잠김", "이 항목은 현재 잠겨있어 수정할 수 없습니다.");
            return;
        }
        if (isSwipedOpen.value) {
            translateX.value = withTiming(0);
            isSwipedOpen.value = false;
        } else {
            onPress(doItem.id);
        }
    };

    // 오늘 완료 여부 체크 버튼 (MVP 이후 확장 기능)
    // const handleToggleToday = () => {
    //   if (onToggleComplete) {
    //     // 오늘 날짜와 lastUpdatedDate 비교하여 현재 완료 상태 결정하는 로직 필요
    //     // onToggleComplete(doItem.id, currentCompletedStatus);
    //   }
    // };

    return (
        <View style={[styles.swipeableOuterContainer, isLocked && styles.lockedItem]}>
            <View style={styles.deleteActionContainer}>
                <TouchableOpacity onPress={handleDeletePress} style={styles.deleteButton} disabled={isLocked}>
                    <Ionicons name="trash-outline" size={TRASH_ICON_ONLY_SIZE} color="white" />
                </TouchableOpacity>
            </View>

            <GestureDetector gesture={panGesture}>
                <Animated.View style={[styles.draggableCard, animatedStyle]}>
                    <TouchableOpacity
                        style={styles.itemContainerContent}
                        onPress={handleItemPress}
                        activeOpacity={1}
                        disabled={isLocked}
                    >
                        {/* MVP 이후 기능: 왼쪽에 완료 체크 버튼
            <TouchableOpacity onPress={handleToggleToday} style={styles.checkboxContainer}>
              <Ionicons name={isTodayCompleted ? "checkbox" : "square-outline"} size={24} color={isTodayCompleted ? "green" : "#ccc"} />
            </TouchableOpacity>
            */}
                        <View style={styles.infoContainer}>
                            <Text style={[styles.titleText, isLocked && styles.lockedText]} numberOfLines={1} ellipsizeMode="tail">
                                {doItem.title}
                            </Text>
                            <Text style={[styles.metaText, isLocked && styles.lockedText]} numberOfLines={1} ellipsizeMode="tail">
                                {metaInfo}
                            </Text>
                        </View>
                        {!isLocked && <Ionicons name="chevron-forward-outline" size={22} color="#cccccc" />}
                    </TouchableOpacity>
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

const styles = StyleSheet.create({
    swipeableOuterContainer: { backgroundColor: "white", marginVertical: 4, borderRadius: 8, overflow: 'hidden' },
    lockedItem: { opacity: 0.6, backgroundColor: '#f0f0f0' },
    lockedText: { textDecorationLine: 'line-through', color: '#999' },
    deleteActionContainer: { position: "absolute", right: 0, top: 0, bottom: 0, width: REVEAL_WIDTH, flexDirection: "row", alignItems: "center", justifyContent: "center" },
    deleteButton: { width: CIRCULAR_BUTTON_DIAMETER, height: CIRCULAR_BUTTON_DIAMETER, borderRadius: CIRCULAR_BUTTON_DIAMETER / 2, backgroundColor: "#EF4444", justifyContent: "center", alignItems: "center" },
    draggableCard: { backgroundColor: "white" },
    itemContainerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16 },
    infoContainer: { flex: 1, marginRight: 10 },
    titleText: { fontSize: 16, fontWeight: "500", marginBottom: 2 },
    metaText: { fontSize: 12, color: "#666" },
    // checkboxContainer: { marginRight: 10, padding: 5 }, // MVP 이후
});
// src/components/DontListItem.tsx
import { DontItem } from "@/types"; // DontItem 타입 사용
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

interface DontListItemProps {
    dontItem: DontItem;
    onPress: (dontItemId: string) => void; // 편집 화면 등으로 이동
    onDelete: (dontItemId: string) => void; // 삭제 처리
    // onToggleObservance?: (dontItemId: string, currentStatus: boolean) => void; // MVP 이후 추가 가능 (오늘 지켰는지 체크)
}

// 스와이프 관련 상수 (DoListItem과 동일하게)
const TRASH_ICON_ONLY_SIZE = 22;
const CIRCULAR_BUTTON_PADDING = 8;
const CIRCULAR_BUTTON_DIAMETER = TRASH_ICON_ONLY_SIZE + CIRCULAR_BUTTON_PADDING * 2;
const REVEAL_WIDTH = CIRCULAR_BUTTON_DIAMETER + 16;
const SWIPE_THRESHOLD = REVEAL_WIDTH / 2.5;
const VELOCITY_THRESHOLD_TO_OPEN = -500;

export default function DontListItem({
    dontItem,
    onPress,
    onDelete,
    // onToggleObservance, // 이 기능은 추후 구현
}: DontListItemProps) {
    const translateX = useSharedValue(0);
    const isSwipedOpen = useSharedValue(false);

    // DontItem에 대한 메타 정보 (예: 준수 주기, 성공/실패 횟수)
    const metaInfo = `매 ${dontItem.observancePeriod} · S:${dontItem.successCount} / F:${dontItem.failureCount}`;
    const isLocked = dontItem.isLocked || false;

    const showDeleteConfirmation = () => {
        Alert.alert(
            "Don't 항목 삭제",
            `"${dontItem.title}" 항목을 정말 삭제하시겠습니까?`,
            [
                { text: "취소", onPress: () => { translateX.value = withTiming(0); isSwipedOpen.value = false; }, style: "cancel" },
                { text: "삭제", onPress: () => { onDelete(dontItem.id); isSwipedOpen.value = false; translateX.value = withTiming(0); }, style: "destructive" },
            ],
            { cancelable: true, onDismiss: () => { translateX.value = withTiming(0); isSwipedOpen.value = false; } }
        );
    };

    const handleDeletePress = () => { runOnJS(showDeleteConfirmation)(); };

    const panGesture = Gesture.Pan()
        .activeOffsetX([-10, 10])
        .failOffsetY([-5, 5])
        .enabled(!isLocked)
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
            onPress(dontItem.id);
        }
    };

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
                        <View style={styles.infoContainer}>
                            <Text style={[styles.titleText, isLocked && styles.lockedText]} numberOfLines={1} ellipsizeMode="tail">
                                {dontItem.title}
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

// 스타일은 DoListItem.tsx와 동일하게 유지 (필요시 약간의 색상 테마 변경 가능)
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
});
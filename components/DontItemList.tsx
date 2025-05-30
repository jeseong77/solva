// src/components/DontItemList.tsx
import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { DontItem } from "@/types"; // DontItem 타입 사용
import { Ionicons } from "@expo/vector-icons";
import DontListItem from "./DontListItem"; // 생성한 DontListItem import

interface DontItemListProps {
    dontItems: DontItem[];
    projectId: string;
    isLoading: boolean;
    onPressDontItem: (dontItemId: string) => void;
    onPressAddDontItem: (projectId: string) => void;
    onDeleteDontItem: (dontItemId: string) => void;
}

export default function DontItemList({
    dontItems,
    projectId,
    isLoading,
    onPressDontItem,
    onPressAddDontItem,
    onDeleteDontItem,
}: DontItemListProps) {
    // "Add Dont Rule" 버튼은 항상 활성화된 상태로 가정 (비활성화 로직 없음)
    // const canAdd = true; 

    if (isLoading && dontItems.length === 0) {
        return (
            <View style={styles.messageContainer}>
                <ActivityIndicator size="large" />
                <Text style={styles.messageText}>Loading "Don't" rules...</Text>
            </View>
        );
    }

    return (
        <View style={styles.listOuterContainer}>
            <Text style={styles.sectionHeader}>Don't</Text>
            {dontItems.length === 0 && !isLoading && (
                <View style={styles.messageContainerNoFlex}>
                    <Text style={styles.messageText}>
                        아직 설정된 "Don't" 규칙이 없습니다.
                    </Text>
                </View>
            )}
            {dontItems.map((item) => (
                <DontListItem
                    key={item.id}
                    dontItem={item}
                    onPress={onPressDontItem}
                    onDelete={onDeleteDontItem}
                />
            ))}
            <TouchableOpacity
                style={styles.addButton} // DoItemList와 동일한 스타일 적용
                onPress={() => onPressAddDontItem(projectId)}
            // disabled={!canAdd} // 비활성화 로직 제거
            >
                <Ionicons
                    name="remove-circle-outline" // "Don't"에 어울리는 아이콘 (예시)
                    size={22}
                    color="#232f48" // DoItemList와 동일한 아이콘 색상
                    style={styles.addButtonIcon}
                />
                <Text style={styles.addButtonText}>add don't</Text>
            </TouchableOpacity>
        </View>
    );
}

// 스타일은 DoItemList.tsx와 동일하게 적용 (버튼 배경색, 아이콘/텍스트 색상 등)
const styles = StyleSheet.create({
    listOuterContainer: {
        backgroundColor: "#ffffff",
        borderRadius: 8,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        color: '#333',
    },
    messageContainer: {
        justifyContent: 'center', alignItems: 'center', paddingVertical: 30,
    },
    messageContainerNoFlex: {
        justifyContent: 'center', alignItems: 'center', paddingVertical: 30,
    },
    messageText: {
        fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8,
    },
    addButton: { // DoItemList.tsx의 addButton 스타일과 동일하게
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        backgroundColor: "#a8cbe8", // DoItemList와 동일한 배경색
        borderRadius: 8,
        marginTop: 16,
    },
    addButtonIcon: {
        marginRight: 8,
        color: "#232f48", // DoItemList와 동일한 아이콘 색상
    },
    addButtonText: {
        color: "#232f48", // DoItemList와 동일한 텍스트 색상
        fontSize: 16,
        fontWeight: "500",
    },
});
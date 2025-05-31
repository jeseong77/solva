import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Alert,
    Platform, // Platform 추가
    ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '@/store/store';
import { DoItem, DontItem, Problem } from '@/types'; // 필요한 타입들
import { useShallow } from 'zustand/react/shallow';
import { Ionicons } from '@expo/vector-icons';

const debounceTimeout = React.createRef<ReturnType<typeof setTimeout> | null>();


export default function RuleEditorScreen() {
    const router = useRouter();
    // projectId: 이 규칙이 속할 프로젝트 ID (새 규칙 생성 시)
    // doItemId: 편집할 DoItem ID
    // dontItemId: 편집할 DontItem ID
    // ruleTypeInitial: 새 규칙 생성 시 기본 타입 ('Do' 또는 'Dont')
    const params = useLocalSearchParams<{
        projectId?: string;
        doItemId?: string;
        dontItemId?: string;
        ruleTypeInitial?: 'Do' | 'Dont';
    }>();

    const {
        addDoItem, updateDoItem, getDoItemById, // DoItem 액션 및 셀렉터
        addDontItem, updateDontItem, getDontItemById, // DontItem 액션 및 셀렉터
    } = useAppStore(
        useShallow((state) => ({
            addDoItem: state.addDoItem,
            updateDoItem: state.updateDoItem,
            getDoItemById: state.getDoItemById,
            addDontItem: state.addDontItem,
            updateDontItem: state.updateDontItem,
            getDontItemById: state.getDontItemById,
        }))
    );

    const [ruleType, setRuleType] = useState<'Do' | 'Dont'>(params.ruleTypeInitial || 'Do');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [recurrenceRule, setRecurrenceRule] = useState(''); // For DoItem
    const [observancePeriod, setObservancePeriod] = useState(''); // For DontItem

    const [currentItemId, setCurrentItemId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const hasUnsavedChanges = useRef(false);


    const isEditing = !!(params.doItemId || params.dontItemId);

    const loadData = useCallback(() => {
        setIsLoading(true);
        if (params.doItemId) {
            const item = getDoItemById(params.doItemId);
            if (item) {
                setTitle(item.title);
                setDescription(item.description || '');
                setRecurrenceRule(item.recurrenceRule);
                setRuleType('Do');
                setCurrentItemId(item.id);
            } else { Alert.alert("Error", "Do Rule not found."); }
        } else if (params.dontItemId) {
            const item = getDontItemById(params.dontItemId);
            if (item) {
                setTitle(item.title);
                setDescription(item.description || '');
                setObservancePeriod(item.observancePeriod);
                setRuleType('Dont');
                setCurrentItemId(item.id);
            } else { Alert.alert("Error", "Don't Rule not found."); }
        } else if (params.projectId) { // 새 규칙 생성
            setTitle('');
            setDescription('');
            setRecurrenceRule('daily'); // 기본값 예시
            setObservancePeriod('daily'); // 기본값 예시
            setRuleType(params.ruleTypeInitial || 'Do'); // 전달받은 타입 또는 기본 'Do'
            setCurrentItemId(null);
        } else {
            Alert.alert("Error", "Project ID is required to create a new rule.");
            // router.back(); // 또는 다른 처리
        }
        setIsLoading(false);
        hasUnsavedChanges.current = false;
    }, [params, getDoItemById, getDontItemById]);

    useEffect(() => { loadData(); }, [loadData]);
    // useFocusEffect는 필요시 추가 (데이터 리프레시용)

    // 자동 저장 로직 (ProblemEditorScreen과 유사하게, 필요시 구현)
    // 여기서는 명시적인 저장 버튼을 가정하고 생략

    const handleSaveRule = async () => {
        if (!params.projectId && !currentItemId) {
            Alert.alert("Error", "Project information is missing.");
            return;
        }
        if (!title.trim()) {
            Alert.alert("Error", "Rule title is required.");
            return;
        }

        setIsSaving(true);
        let result: DoItem | DontItem | null = null;

        if (ruleType === 'Do') {
            const doItemData = {
                projectId: params.projectId || getDoItemById(currentItemId!)?.projectId!, // 편집 시 기존 projectId 사용
                title: title.trim(),
                description: description.trim(),
                recurrenceRule: recurrenceRule.trim() || 'daily', // 기본값
            };
            if (currentItemId && isEditing) { // DoItem 업데이트
                const existingItem = getDoItemById(currentItemId);
                if (existingItem) {
                    result = await updateDoItem({ ...existingItem, ...doItemData });
                }
            } else if (params.projectId) { // 새 DoItem 추가
                result = await addDoItem(doItemData);
            }
        } else { // Don't Item
            const dontItemData = {
                projectId: params.projectId || getDontItemById(currentItemId!)?.projectId!,
                title: title.trim(),
                description: description.trim(),
                observancePeriod: observancePeriod.trim() || 'daily',
            };
            if (currentItemId && isEditing) { // DontItem 업데이트
                const existingItem = getDontItemById(currentItemId);
                if (existingItem) {
                    result = await updateDontItem({ ...existingItem, ...dontItemData });
                }
            } else if (params.projectId) { // 새 DontItem 추가
                result = await addDontItem(dontItemData);
            }
        }
        setIsSaving(false);

        if (result) {
            Alert.alert("Success", `Rule successfully ${isEditing ? 'updated' : 'added'}.`);
            if (router.canGoBack()) router.back();
            else router.replace('/ProjectEditor.Screen'); // ProjectEditorScreen의 실제 경로로 수정 필요
        } else {
            Alert.alert("Error", `Failed to save rule.`);
        }
    };

    const createFieldChangeHandler = (setter: React.Dispatch<React.SetStateAction<string>>) =>
        (value: string) => {
            setter(value);
            hasUnsavedChanges.current = true;
        };
    const handleTitleChange = createFieldChangeHandler(setTitle);
    const handleDescriptionChange = createFieldChangeHandler(setDescription);
    const handleRecurrenceRuleChange = createFieldChangeHandler(setRecurrenceRule);
    const handleObservancePeriodChange = createFieldChangeHandler(setObservancePeriod);


    if (isLoading) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Stack.Screen options={{ title: "Loading Rule..." }} />
                <ActivityIndicator size="large" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <Stack.Screen
                options={{
                    title: isEditing ? `Edit ${ruleType} Rule` : `New ${ruleType} Rule`,
                    headerRight: () => (
                        <TouchableOpacity onPress={() => Alert.alert("More Options")} style={{ marginRight: 16 }}>
                            <Ionicons name="ellipsis-horizontal" size={24} color="#007AFF" />
                        </TouchableOpacity>
                    ),
                }}
            />
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 15, paddingBottom: 80 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
                    <TouchableOpacity
                        style={{ padding: 10, backgroundColor: ruleType === 'Do' ? '#cfe2ff' : '#f0f0f0', borderRadius: 5 }}
                        onPress={() => { setRuleType('Do'); hasUnsavedChanges.current = true; }}
                    >
                        <Text style={{ color: ruleType === 'Do' ? '#004085' : '#333' }}>Do (해야 할 일)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={{ padding: 10, backgroundColor: ruleType === 'Dont' ? '#f8d7da' : '#f0f0f0', borderRadius: 5 }}
                        onPress={() => { setRuleType('Dont'); hasUnsavedChanges.current = true; }}
                    >
                        <Text style={{ color: ruleType === 'Dont' ? '#721c24' : '#333' }}>Don't (하지 말아야 할 일)</Text>
                    </TouchableOpacity>
                </View>

                <Text>Rule Name:</Text>
                <TextInput
                    value={title}
                    onChangeText={handleTitleChange}
                    placeholder="예: 매일 아침 조깅하기"
                    style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 15, borderRadius: 4 }}
                />

                <Text>Rule Description (Optional):</Text>
                <TextInput
                    value={description}
                    onChangeText={handleDescriptionChange}
                    placeholder="규칙에 대한 상세 설명"
                    multiline
                    numberOfLines={3}
                    style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 15, minHeight: 60, borderRadius: 4, textAlignVertical: 'top' }}
                />

                {ruleType === 'Do' && (
                    <View>
                        <Text>Recurrence Rule (예: daily, weekly, MWF):</Text>
                        <TextInput
                            value={recurrenceRule}
                            onChangeText={handleRecurrenceRuleChange}
                            placeholder="daily"
                            style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 15, borderRadius: 4 }}
                        />
                    </View>
                )}

                {ruleType === 'Dont' && (
                    <View>
                        <Text>Observance Period (예: daily, weekly):</Text>
                        <TextInput
                            value={observancePeriod}
                            onChangeText={handleObservancePeriodChange}
                            placeholder="daily"
                            style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 15, borderRadius: 4 }}
                        />
                    </View>
                )}

                <View style={{ minHeight: 100, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', padding: 10, borderRadius: 4, marginTop: 10 }}>
                    <Text style={{ color: '#aaa', fontStyle: 'italic' }}>
                        향후 활동 기록 및 관련 정보가 여기에 표시됩니다.
                    </Text>
                </View>

                {/* 명시적인 저장 버튼 (자동 저장으로 대체 가능) */}
                <TouchableOpacity
                    onPress={handleSaveRule}
                    style={{ backgroundColor: '#007AFF', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 20 }}
                    disabled={isSaving}
                >
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                        {isSaving ? 'Saving...' : (isEditing ? 'Update Rule' : 'Add Rule')}
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}
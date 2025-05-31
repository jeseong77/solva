// ProblemEditor.Style.ts
import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    basicButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: "#000",
        alignItems: "center", // 'as "center"' 대신 TypeScript가 추론하도록 둠
        marginVertical: 5,
        flexDirection: "row", // 'as "row"' 대신 TypeScript가 추론하도록 둠
        justifyContent: "center", // 'as "center"' 대신 TypeScript가 추론하도록 둠
        backgroundColor: '#f0f0f0',
    },
    basicButtonDisabled: {
        borderColor: "#ccc",
        backgroundColor: '#f5f5f5',
        opacity: 0.5,
    },
    basicButtonText: {
        color: "#000",
        fontSize: 16,
        marginLeft: 5,
    },
    basicButtonTextDisabled: {
        color: "#aaa",
    },
    safeArea: {
        flex: 1,
        backgroundColor: "#fff",
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContentContainer: {
        padding: 15,
        paddingBottom: 20, // 스크롤 영역 하단 여백
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    parentTitleText: {
        fontSize: 14,
        color: "gray",
        marginBottom: 10,
        fontStyle: "italic",
    },
    // placeholderParentTitle 스타일은 원본 코드에서 거의 사용되지 않아 제거해도 무방해 보이지만,
    // 혹시 사용될 가능성이 있다면 유지합니다. 여기서는 일단 주석 처리합니다.
    // placeholderParentTitle: {
    //   height: 20,
    //   marginBottom: 10,
    // },
    titleInput: {
        fontSize: 22,
        fontWeight: "bold",
        borderBottomWidth: 1,
        borderColor: "#ccc",
        paddingVertical: 8,
        marginBottom: 20,
    },
    descriptionInput: {
        fontSize: 16,
        borderWidth: 1,
        borderColor: "#eee",
        padding: 10,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 20,
        borderRadius: 5,
        backgroundColor: '#fff', // 입력 필드 배경색 명시
    },
    section: {
        marginBottom: 20,
        padding: 10,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        borderRadius: 5,
        backgroundColor: '#fff', // 섹션 배경색 명시
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        color: '#333', // 섹션 제목 색상 명시
    },
    manageProjectButton: { // basicButton 스타일과 병합될 추가 스타일
        backgroundColor: '#e6ffe6', // 연한 녹색 계열
        marginTop: 10,
        borderColor: '#a3d9a5', // 테두리 색상도 조정
    },
    grayArea: {
        flexGrow: 1,
        minHeight: 100,
        backgroundColor: '#f5f5f5',
        padding: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
        marginTop: 20, // 위 요소와의 간격
    },
    grayAreaText: {
        color: '#aaa',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    savingIndicator: { // 헤더 오른쪽으로 옮기는 것을 고려하거나, 화면 중앙 상단 등에 고정
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 20, // 값은 헤더 높이에 따라 조정
        right: 20,
        zIndex: 1000, // 다른 요소 위에 오도록 zIndex 설정
    },
    headerRightContainer: { // 헤더 오른쪽에 여러 요소를 배치하기 위한 컨테이너
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
    },
    headerIconButton: { // 헤더 아이콘 버튼 기본 스타일
        padding: 5, // 터치 영역 확보
    },
    savingIndicatorInHeader: {
        marginRight: 10, // 더보기 아이콘과의 간격
    },
});
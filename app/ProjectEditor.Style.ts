// ProjectEditor.Style.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
    },
    scrollViewContainer: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    centeredMessageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    linkedProblemInfoContainer: {
        padding: 12,
        backgroundColor: "#e9ecef",
        borderRadius: 8,
        marginBottom: 16,
    },
    linkedProblemLabel: {
        fontSize: 13,
        color: "#495057",
        marginBottom: 4,
        fontWeight: '500',
    },
    linkedProblemTitle: {
        fontSize: 16,
        color: "#212529",
        fontWeight: 'bold',
    },
    projectTitleInput: {
        fontSize: 22,
        fontWeight: 'bold',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 8,
        marginBottom: 16,
        backgroundColor: '#fff',
    },
    sectionContainer: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#dee2e6',
    },
    infoText: {
        fontSize: 14,
        color: '#6c757d',
        textAlign: 'center',
        marginVertical: 20,
    },
    placeholderSection: {
        padding: 16,
        backgroundColor: "#ffffff",
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#dee2e6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        fontSize: 14,
        color: '#6c757d',
        fontStyle: 'italic',
    }
});
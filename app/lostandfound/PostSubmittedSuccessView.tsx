import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const LostPostSubmittedView = () => {
    const router = useRouter();

    return (
        <View style={styles.container}>
            {/* Content */}
            <View style={styles.content}>
                <Ionicons name="checkmark-circle" size={100} color="#ffb700" />
                <Text style={styles.title}>Thank You!</Text>
                <Text style={styles.message}>
                    Your lost pet report has been submitted successfully. We will notify you if there's any update.
                </Text>

                {/* Back to list button */}
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/lostAndFound/lostAnimalListView')}
                >
                    <Text style={styles.buttonText}>Back to Lost & Found</Text>
                </TouchableOpacity>

                {/* View My Posts button */}
                <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={() => router.push('/lostAndFound/viewLostFoundPost?id')}
                >
                    <Text style={styles.secondaryButtonText}>View My Post</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default LostPostSubmittedView;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f5e9',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#000',
        marginTop: 20,
        marginBottom: 10,
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24,
    },
    button: {
        backgroundColor: '#ffb700',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
        marginBottom: 15,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },

    // Second button style
    secondaryButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ffb700',
    },
    secondaryButtonText: {
        color: '#ffb700',
        fontWeight: '600',
        fontSize: 16,
    },
});
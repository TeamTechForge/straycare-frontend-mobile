import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import PrimaryButton from '../../components/PrimaryButton';

const LostPostSubmittedView = () => {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Icon wrapper for a premium feel */}
                <View style={styles.iconWrapper}>
                    <Ionicons name="checkmark-circle" size={90} color="#F5A623" />
                </View>
                
                <Text style={styles.title}>Thank You!</Text>
                
                <Text style={styles.message}>
                    Your post has been submitted successfully. We will notify you if there's any update.
                </Text>

                <View style={styles.buttonContainer}>
                    <PrimaryButton 
                        title="Back to Lost & Found" 
                        onPress={() => router.push('/lost-and-found')}
                    />

                    <PrimaryButton 
                        title="View My Posts" 
                        variant="outline"
                        onPress={() => router.push('/lost-and-found/MyPosts')}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

export default LostPostSubmittedView;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    iconWrapper: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#FFF7E6', // Light amber background
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#062425',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    message: {
        fontSize: 16,
        color: '#717878',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
    },
    buttonContainer: {
        width: '100%',
        gap: 8,
    },
});

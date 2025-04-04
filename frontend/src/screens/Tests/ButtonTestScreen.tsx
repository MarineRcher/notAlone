import React, { useState } from 'react';
import { SafeAreaView, View, StyleSheet, Text, ScrollView, Alert } from 'react-native';
import Button from '../../components/atoms/Button'; // Update this path based on your project structure
import { Feather } from '@expo/vector-icons'; // Assuming you're using Expo; otherwise, use your icon library

const ButtonTestScreen = () => {
    const [isLoading, setIsLoading] = useState(false);

    const handlePress = () => {
        Alert.alert('Button Pressed', 'You clicked on a button!');
    };

    const handleLoadingButtonPress = () => {
        setIsLoading(true);
        // Simulate an API call
        setTimeout(() => {
            setIsLoading(false);
            Alert.alert('Success', 'Operation completed!');
        }, 2000);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.title}>Button Component Test</Text>

                <SectionTitle title="Variants" />
                <View style={styles.row}>
                    <Button
                        label="Primary"
                        variant="primary"
                        onPress={handlePress}
                    />
                    <Button
                        label="Secondary"
                        variant="secondary"
                        onPress={handlePress}
                    />
                </View>
                <View style={styles.row}>
                    <Button
                        label="Outline"
                        variant="outline"
                        onPress={handlePress}
                    />
                    <Button
                        label="Ghost"
                        variant="ghost"
                        onPress={handlePress}
                    />
                </View>

                <SectionTitle title="Sizes" />
                <View style={styles.column}>
                    <Button
                        label="Small"
                        size="small"
                        onPress={handlePress}
                    />
                    <Button
                        label="Medium"
                        size="medium"
                        onPress={handlePress}
                    />
                    <Button
                        label="Large"
                        size="large"
                        onPress={handlePress}
                    />
                </View>

                <SectionTitle title="With Icons" />
                <View style={styles.column}>
                    <Button
                        label="Left Icon"
                        leftIcon={<Feather name="arrow-left" size={18} color="#fff" />}
                        onPress={handlePress}
                    />
                    <Button
                        label="Right Icon"
                        rightIcon={<Feather name="arrow-right" size={18} color="#fff" />}
                        onPress={handlePress}
                    />
                    <Button
                        label="Both Icons"
                        leftIcon={<Feather name="check" size={18} color="#fff" />}
                        rightIcon={<Feather name="chevron-right" size={18} color="#fff" />}
                        onPress={handlePress}
                    />
                </View>

                <SectionTitle title="States" />
                <View style={styles.column}>
                    <Button
                        label="Disabled"
                        disabled
                        onPress={handlePress}
                    />
                    <Button
                        label={isLoading ? "Loading..." : "Loading State"}
                        loading={isLoading}
                        onPress={handleLoadingButtonPress}
                    />
                </View>

                <SectionTitle title="Full Width" />
                <View style={styles.fullWidthContainer}>
                    <Button
                        label="Full Width Button"
                        fullWidth
                        onPress={handlePress}
                    />
                </View>

                <SectionTitle title="Custom Styling" />
                <View style={styles.column}>
                    <Button
                        label="Custom Colors"
                        containerStyle={styles.customContainer}
                        labelStyle={styles.customLabel}
                        onPress={handlePress}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// Helper component for section titles
const SectionTitle = ({ title }: any) => (
    <Text style={styles.sectionTitle}>{title}</Text>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 24,
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    column: {
        gap: 16,
        marginBottom: 16,
    },
    fullWidthContainer: {
        width: '100%',
        marginBottom: 16,
    },
    customContainer: {
        backgroundColor: '#8B5CF6', // Purple color
        borderRadius: 25,
        paddingVertical: 12,
    },
    customLabel: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ButtonTestScreen;
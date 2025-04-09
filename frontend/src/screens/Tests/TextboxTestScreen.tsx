import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, StyleSheet, Text } from 'react-native';
import Textbox from '../../components/atoms/Textbox'; // Adjust path as needed
import { Feather } from '@expo/vector-icons'; // Make sure this import works correctly

const TextboxTestScreen = () => {
    const [text1, setText1] = useState('');
    const [text2, setText2] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');

    // Toggle password visibility
    const [passwordVisible, setPasswordVisible] = useState(false);
    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.title}>Textbox Component Test</Text>

                <SectionTitle title="Variants" />
                <View style={styles.section}>
                    <Textbox
                        label="Default Variant"
                        placeholder="Enter text here"
                        variant="default"
                        value={text1}
                        onChangeText={setText1}
                        fullWidth
                    />

                    <Textbox
                        label="Outline Variant"
                        placeholder="Enter text here"
                        variant="outline"
                        value={text2}
                        onChangeText={setText2}
                        fullWidth
                    />

                    <Textbox
                        label="Filled Variant"
                        placeholder="Enter text here"
                        variant="filled"
                        fullWidth
                    />

                    <Textbox
                        label="Underline Variant"
                        placeholder="Enter text here"
                        variant="underline"
                        fullWidth
                    />
                </View>

                <SectionTitle title="Sizes" />
                <View style={styles.section}>
                    <Textbox
                        label="Small Size"
                        placeholder="Small input"
                        size="small"
                        fullWidth
                    />

                    <Textbox
                        label="Medium Size"
                        placeholder="Medium input"
                        size="medium"
                        fullWidth
                    />

                    <Textbox
                        label="Large Size"
                        placeholder="Large input"
                        size="large"
                        fullWidth
                    />
                </View>

                <SectionTitle title="With Icons" />
                <View style={styles.section}>
                    <Textbox
                        label="Left Icon"
                        placeholder="Search..."
                        leftIcon={<Feather name="search" size={20} color="#4A4A4A" />}
                        fullWidth
                    />

                    <Textbox
                        label="Right Icon"
                        placeholder="Email address"
                        rightIcon={<Feather name="mail" size={20} color="#4A4A4A" />}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        fullWidth
                    />

                    <Textbox
                        label="Password with Toggle"
                        placeholder="Enter password"
                        secureTextEntry={!passwordVisible}
                        value={password}
                        onChangeText={setPassword}
                        rightIcon={
                            <Feather
                                name={passwordVisible ? "eye-off" : "eye"}
                                size={20}
                                color="#4A4A4A"
                                onPress={togglePasswordVisibility}
                            />
                        }
                        fullWidth
                    />

                    <Textbox
                        label="Both Icons"
                        placeholder="Search location"
                        leftIcon={<Feather name="search" size={20} color="#4A4A4A" />}
                        rightIcon={<Feather name="map-pin" size={20} color="#4A4A4A" />}
                        fullWidth
                    />
                </View>

                <SectionTitle title="With Helper & Error" />
                <View style={styles.section}>
                    <Textbox
                        label="With Helper Text"
                        placeholder="Username"
                        helper="Username must be 3-16 characters"
                        fullWidth
                    />

                    <Textbox
                        label="With Error"
                        placeholder="Email address"
                        value="invalid-email"
                        error="Please enter a valid email address"
                        fullWidth
                    />
                </View>

                <SectionTitle title="Custom Styling" />
                <View style={styles.section}>
                    <Textbox
                        label="Custom Styling"
                        placeholder="Type here..."
                        containerStyle={styles.customContainer}
                        labelStyle={styles.customLabel}
                        inputStyle={styles.customInput}
                        leftIcon={<Feather name="edit-2" size={20} color="#6200EE" />}
                        variant="outline"
                        fullWidth
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// Helper component for section titles
const SectionTitle = ({ title }: { title: string }) => (
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
        marginTop: 20,
        marginBottom: 12,
        color: '#333',
    },
    section: {
        marginBottom: 16,
        gap: 16,
    },
    customContainer: {
        marginTop: 8,
    },
    customLabel: {
        color: '#6200EE',
        fontWeight: 'bold',
    },
    customInput: {
        color: '#6200EE',
    },
});

export default TextboxTestScreen;
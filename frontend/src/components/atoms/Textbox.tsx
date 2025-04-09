import React from 'react';
import {
    TextInput,
    View,
    Text,
    StyleSheet,
    TextInputProps,
    StyleProp,
    ViewStyle,
    TextStyle,
} from 'react-native';

// Define textbox variants
export type TextboxVariant = 'default' | 'outline' | 'filled' | 'underline';

// Define textbox sizes
export type TextboxSize = 'small' | 'medium' | 'large';

// Define textbox props
export interface TextboxProps extends Omit<TextInputProps, 'style'> {
    // Field identifiers
    label?: string;
    error?: string;
    helper?: string;

    // Styling options
    variant?: TextboxVariant;
    size?: TextboxSize;
    fullWidth?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;

    // Style overrides
    containerStyle?: StyleProp<ViewStyle>;
    labelStyle?: StyleProp<TextStyle>;
    inputStyle?: StyleProp<TextStyle>;
    helperStyle?: StyleProp<TextStyle>;
    errorStyle?: StyleProp<TextStyle>;
}

const Textbox = ({
                     // Field identifiers
                     label,
                     error,
                     helper,

                     // Styling options
                     variant = 'default',
                     size = 'medium',
                     fullWidth = false,
                     leftIcon,
                     rightIcon,

                     // Style overrides
                     containerStyle,
                     labelStyle,
                     inputStyle,
                     helperStyle,
                     errorStyle,

                     // Default TextInput props we want to control defaults for
                     placeholder,
                     placeholderTextColor,

                     // Rest of TextInput props
                     ...rest
                 }: TextboxProps) => {
    // Determine if the input has an error
    const hasError = !!error;

    // Get container styles based on props
    const getContainerStyle = (): StyleProp<ViewStyle>[] => {
        const containerStyles: StyleProp<ViewStyle>[] = [styles.container];

        // Add full width style if needed
        if (fullWidth) {
            containerStyles.push(styles.fullWidth);
        }

        // Add custom container style if provided
        if (containerStyle) {
            containerStyles.push(containerStyle);
        }

        return containerStyles;
    };

    // Get input wrapper styles based on props
    const getInputWrapperStyle = (): StyleProp<ViewStyle>[] => {
        const wrapperStyles: StyleProp<ViewStyle>[] = [styles.inputWrapper];

        // Add variant styles
        switch (variant) {
            case 'default':
                wrapperStyles.push(styles.defaultWrapper);
                break;
            case 'outline':
                wrapperStyles.push(styles.outlineWrapper);
                break;
            case 'filled':
                wrapperStyles.push(styles.filledWrapper);
                break;
            case 'underline':
                wrapperStyles.push(styles.underlineWrapper);
                break;
        }

        // Add size styles
        switch (size) {
            case 'small':
                wrapperStyles.push(styles.smallWrapper);
                break;
            case 'medium':
                wrapperStyles.push(styles.mediumWrapper);
                break;
            case 'large':
                wrapperStyles.push(styles.largeWrapper);
                break;
        }

        // Add error style if there's an error
        if (hasError) {
            wrapperStyles.push(styles.errorWrapper);
        }

        return wrapperStyles;
    };

    // Get input styles based on props
    const getInputStyle = (): StyleProp<TextStyle>[] => {
        const inputStyles: StyleProp<TextStyle>[] = [styles.input];

        // Add size-specific text styles
        switch (size) {
            case 'small':
                inputStyles.push(styles.smallInput);
                break;
            case 'medium':
                inputStyles.push(styles.mediumInput);
                break;
            case 'large':
                inputStyles.push(styles.largeInput);
                break;
        }

        // Add left padding if there's a left icon
        if (leftIcon) {
            inputStyles.push(styles.inputWithLeftIcon);
        }

        // Add right padding if there's a right icon
        if (rightIcon) {
            inputStyles.push(styles.inputWithRightIcon);
        }

        // Add custom input style if provided
        if (inputStyle) {
            inputStyles.push(inputStyle);
        }

        return inputStyles;
    };

    return (
        <View style={getContainerStyle()}>
            {/* Label */}
            {label && (
                <Text style={[styles.label, labelStyle]}>
                    {label}
                </Text>
            )}

            {/* Input with icons */}
            <View style={getInputWrapperStyle()}>
                {leftIcon && (
                    <View style={styles.leftIconContainer}>
                        {leftIcon}
                    </View>
                )}

                <TextInput
                    placeholder={placeholder}
                    placeholderTextColor={placeholderTextColor || '#A0A0A0'}
                    style={getInputStyle()}
                    {...rest}
                />

                {rightIcon && (
                    <View style={styles.rightIconContainer}>
                        {rightIcon}
                    </View>
                )}
            </View>

            {/* Error message */}
            {hasError && (
                <Text style={[styles.error, errorStyle]}>
                    {error}
                </Text>
            )}

            {/* Helper text - only shown if no error */}
            {!hasError && helper && (
                <Text style={[styles.helper, helperStyle]}>
                    {helper}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    // Container styles
    container: {
        marginBottom: 16,
    },
    fullWidth: {
        width: '100%',
    },

    // Label styles
    label: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
        color: '#333333',
    },

    // Input wrapper styles
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
    },

    // Variant styles - wrapper
    defaultWrapper: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    outlineWrapper: {
        borderWidth: 1,
        borderColor: '#BDBDBD',
    },
    filledWrapper: {
        backgroundColor: '#F5F5F5',
    },
    underlineWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: '#BDBDBD',
        borderRadius: 0,
    },

    // Size styles - wrapper
    smallWrapper: {
        height: 36,
    },
    mediumWrapper: {
        height: 44,
    },
    largeWrapper: {
        height: 52,
    },

    // Error state
    errorWrapper: {
        borderColor: '#E53935',
    },

    // Input styles
    input: {
        flex: 1,
        color: '#333333',
        paddingHorizontal: 12,
    },

    // Size styles - input
    smallInput: {
        fontSize: 14,
    },
    mediumInput: {
        fontSize: 16,
    },
    largeInput: {
        fontSize: 18,
    },

    // Input with icons
    inputWithLeftIcon: {
        paddingLeft: 8,
    },
    inputWithRightIcon: {
        paddingRight: 8,
    },

    // Icon container styles
    leftIconContainer: {
        paddingLeft: 12,
    },
    rightIconContainer: {
        paddingRight: 12,
    },

    // Helper and error text styles
    helper: {
        fontSize: 12,
        color: '#757575',
        marginTop: 4,
    },
    error: {
        fontSize: 12,
        color: '#E53935',
        marginTop: 4,
    },
});

export default Textbox;
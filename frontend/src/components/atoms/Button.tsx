import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    TouchableOpacityProps,
    View,
    StyleProp,
} from 'react-native';

// Define button variants
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

// Define button sizes
export type ButtonSize = 'small' | 'medium' | 'large';

// Define button props extending TouchableOpacityProps
export interface ButtonProps extends TouchableOpacityProps {
    // Required props
    label: string;

    // Optional props with defaults
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;

    // Optional style overrides
    containerStyle?: StyleProp<ViewStyle>;
    labelStyle?: StyleProp<TextStyle>;

    // Allow children if needed (though we're using label as the primary way to specify button text)
    children?: React.ReactNode;
}

const Button = ({
                    label,
                    variant = 'primary',
                    size = 'medium',
                    disabled = false,
                    loading = false,
                    fullWidth = false,
                    leftIcon,
                    rightIcon,
                    containerStyle,
                    labelStyle,
                    ...rest
                }: ButtonProps) => {
    // Get styles based on variant and size
    const getContainerStyle = (): StyleProp<ViewStyle>[] => {
        const buttonStyles: StyleProp<ViewStyle>[] = [styles.base];

        // Add variant styles
        switch (variant) {
            case 'primary':
                buttonStyles.push(styles.primaryContainer);
                break;
            case 'secondary':
                buttonStyles.push(styles.secondaryContainer);
                break;
            case 'outline':
                buttonStyles.push(styles.outlineContainer);
                break;
            case 'ghost':
                buttonStyles.push(styles.ghostContainer);
                break;
        }

        // Add size styles
        switch (size) {
            case 'small':
                buttonStyles.push(styles.smallContainer);
                break;
            case 'medium':
                buttonStyles.push(styles.mediumContainer);
                break;
            case 'large':
                buttonStyles.push(styles.largeContainer);
                break;
        }

        // Add full width style if needed
        if (fullWidth) {
            buttonStyles.push(styles.fullWidth);
        }

        // Add disabled style if needed
        if (disabled || loading) {
            buttonStyles.push(styles.disabledContainer);
        }

        // Add custom container style if provided
        if (containerStyle) {
            buttonStyles.push(containerStyle);
        }

        return buttonStyles;
    };

    // Get text styles based on variant and size
    const getLabelStyle = (): StyleProp<TextStyle>[] => {
        const textStyles: StyleProp<TextStyle>[] = [styles.label];

        // Add variant specific text styles
        switch (variant) {
            case 'primary':
                textStyles.push(styles.primaryLabel);
                break;
            case 'secondary':
                textStyles.push(styles.secondaryLabel);
                break;
            case 'outline':
                textStyles.push(styles.outlineLabel);
                break;
            case 'ghost':
                textStyles.push(styles.ghostLabel);
                break;
        }

        // Add size specific text styles
        switch (size) {
            case 'small':
                textStyles.push(styles.smallLabel);
                break;
            case 'medium':
                textStyles.push(styles.mediumLabel);
                break;
            case 'large':
                textStyles.push(styles.largeLabel);
                break;
        }

        // Add disabled text style if needed
        if (disabled) {
            textStyles.push(styles.disabledLabel);
        }

        // Add custom label style if provided
        if (labelStyle) {
            textStyles.push(labelStyle);
        }

        return textStyles;
    };

    return (
        <TouchableOpacity
            style={getContainerStyle()}
    disabled={disabled || loading}
    activeOpacity={0.7}
    onPress={rest.onPress}
        >
        {loading ? (
                    <ActivityIndicator
                        size="small"
                color={variant === 'primary' ? '#FFFFFF' : '#0066CC'}
    />
) : (
        <View style={styles.contentContainer}>
            {leftIcon}
            <Text style={getLabelStyle()}>{label}</Text>
    {rightIcon}
    </View>
)}
    </TouchableOpacity>
);
};

// Styles
const styles = StyleSheet.create({
    // Base Styles
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        gap: 8,
    },

    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Variant Styles - Container
    primaryContainer: {
        backgroundColor: '#0066CC',
    },
    secondaryContainer: {
        backgroundColor: '#E6F0FA',
    },
    outlineContainer: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#0066CC',
    },
    ghostContainer: {
        backgroundColor: 'transparent',
    },

    // Variant Styles - Label
    primaryLabel: {
        color: '#FFFFFF',
    },
    secondaryLabel: {
        color: '#0066CC',
    },
    outlineLabel: {
        color: '#0066CC',
    },
    ghostLabel: {
        color: '#0066CC',
    },

    // Size Styles - Container
    smallContainer: {
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    mediumContainer: {
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    largeContainer: {
        paddingVertical: 14,
        paddingHorizontal: 20,
    },

    // Size Styles - Label
    smallLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    mediumLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    largeLabel: {
        fontSize: 16,
        fontWeight: '600',
    },

    // Other Styles
    fullWidth: {
        width: '100%',
    },
    disabledContainer: {
        opacity: 0.5,
    },
    disabledLabel: {
        opacity: 0.8,
    },
    label: {
        textAlign: 'center',
    },
});

export default Button;
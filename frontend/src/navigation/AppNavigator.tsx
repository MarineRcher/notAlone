import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import LoginScreen from "../screens/auth/LoginScreen";
import Enable2FAScreen from "../screens/2fa/Enable2FAScreen";
import TwoFactorLoginScreen from "../screens/2fa/TwoFactorLoginScreen";
import Disable2FAScreen from "../screens/2fa/Disable2FAScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ChangePasswordScreen from "../screens/userInformations/ChangePasswordScreen";
import BottomTabNavigator from "../components/menu";
import Ask2faScreen from "../screens/2fa/Ask2faScreen";
import AddUserAddictionScreen from "../screens/userInformations/AddUserAddictionScreen";
import AskNotificationsScreen from "../screens/userInformations/askNotificationsScreen";
import AskNotificationsHourScreen from "../screens/userInformations/AskNotificationsHourScreen";
import ChangeEmailScreen from "../screens/userInformations/changeEmailScreen";
import SupportScreen from "../screens/userInformations/supportScreen";
import PrivacyPolicycreen from "../screens/userInformations/PrivacyPolicyScreen";
import ActivatePremiumScreen from "../screens/userInformations/activatePremium";
import colors from "../css/colors";

const Stack = createStackNavigator();
const MyTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: colors.background,
    },
};

const AppNavigator = () => {
    return (
        <NavigationContainer theme={MyTheme}>
            <Stack.Navigator>
                {/* Écrans d'authentification */}
                <Stack.Screen
                    name="Register"
                    component={RegisterScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen name="Login" component={LoginScreen} />

                {/* Écran principal avec les onglets */}
                <Stack.Screen
                    name="Main"
                    component={BottomTabNavigator}
                    options={{ headerShown: false }}
                />
                {/* Écrans 2FA */}
                <Stack.Screen name="Ask2fa" component={Ask2faScreen} />
                <Stack.Screen name="Enable2FA" component={Enable2FAScreen} />
                <Stack.Screen name="Disable2FA" component={Disable2FAScreen} />
                <Stack.Screen
                    name="TwoFactorLogin"
                    component={TwoFactorLoginScreen}
                />

                {/* user informations */}
                <Stack.Screen
                    name="ActivatePremium"
                    component={ActivatePremiumScreen}
                />
                <Stack.Screen
                    name="ChangeEmail"
                    component={ChangeEmailScreen}
                />
                <Stack.Screen
                    name="ChangePassword"
                    component={ChangePasswordScreen}
                />
                <Stack.Screen
                    name="AskNotifications"
                    component={AskNotificationsScreen}
                />
                <Stack.Screen
                    name="AskNotificationsHour"
                    component={AskNotificationsHourScreen}
                />
                <Stack.Screen
                    name="AddUserAddiction"
                    component={AddUserAddictionScreen}
                />
                <Stack.Screen
                    name="PrivacyPolicy"
                    component={PrivacyPolicycreen}
                />
                <Stack.Screen name="Support" component={SupportScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;

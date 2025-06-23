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
import AskDifficultyScreen from "../screens/Journal/AskDifficultyScreen";
import AskConsumedScreen from "../screens/Journal/AskConsumedScreen";
import NoteJourneyScreen from "../screens/Journal/NoteJourneyScreen";
import journeyGoalScreen from "../screens/Journal/journeyGoalScreen";
import TopActivitiesScreen from "../screens/Journal/TopActivitiesScreen";
import ResumeJourneyScreen from "../screens/Journal/ResumeJourneyScreen";
import JourneyGoalScreen from "../screens/Journal/journeyGoalScreen";

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
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{ headerShown: false }}
                />

                {/* Écran principal avec les onglets */}
                <Stack.Screen
                    name="Main"
                    component={BottomTabNavigator}
                    options={{ headerShown: false }}
                />
                {/* Écrans 2FA */}
                <Stack.Screen
                    name="Ask2fa"
                    component={Ask2faScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Enable2FA"
                    component={Enable2FAScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Disable2FA"
                    component={Disable2FAScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="TwoFactorLogin"
                    component={TwoFactorLoginScreen}
                    options={{ headerShown: false }}
                />

                {/* user informations */}
                <Stack.Screen
                    name="ActivatePremium"
                    component={ActivatePremiumScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="ChangeEmail"
                    component={ChangeEmailScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="ChangePassword"
                    component={ChangePasswordScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="AskNotifications"
                    component={AskNotificationsScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="AskNotificationsHour"
                    component={AskNotificationsHourScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="AddUserAddiction"
                    component={AddUserAddictionScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="PrivacyPolicy"
                    component={PrivacyPolicycreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Support"
                    component={SupportScreen}
                    options={{ headerShown: false }}
                />

                {/* journal */}
                <Stack.Screen
                    name="Difficulty"
                    component={AskDifficultyScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Consumed"
                    component={AskConsumedScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Note"
                    component={NoteJourneyScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Goals"
                    component={JourneyGoalScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Activities"
                    component={TopActivitiesScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="resume"
                    component={ResumeJourneyScreen}
                    options={{ headerShown: false }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;

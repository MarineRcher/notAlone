import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import ButtonTestScreen from "../screens/Tests/ButtonTestScreen";
import TextboxTestScreen from "../screens/Tests/TextboxTestScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import Enable2FAScreen from "../screens/2fa/Enable2FAScreen";
import TwoFactorLoginScreen from "../screens/2fa/TwoFactorLoginScreen";
import Disable2FAScreen from "../screens/2fa/Disable2FAScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ChangePasswordScreen from "../screens/auth/ChangePasswordScreen";
import BottomTabNavigator from "../components/organisms/menu";

const Stack = createStackNavigator();

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator>
                {/* Écrans d'authentification */}
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen
                    name="ChangePassword"
                    component={ChangePasswordScreen}
                />

                {/* Écran principal avec les onglets */}
                <Stack.Screen
                    name="Main"
                    component={BottomTabNavigator}
                    options={{ headerShown: false }}
                />
                {/* Écrans 2FA */}
                <Stack.Screen name="Enable2FA" component={Enable2FAScreen} />
                <Stack.Screen name="Disable2FA" component={Disable2FAScreen} />
                <Stack.Screen
                    name="TwoFactorLogin"
                    component={TwoFactorLoginScreen}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;

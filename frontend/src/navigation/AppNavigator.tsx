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

const Stack = createStackNavigator();

const AppNavigator = () => {
    return (
        <NavigationContainer>
            {/* <Stack.Navigator initialRouteName="Textebox test">
                <Stack.Screen
                    name="Button test"
                    component={ButtonTestScreen}
                    options={{ title: 'Buttons' }}
                />
                <Stack.Screen
                    name="Textebox test"
                    component={TextboxTestScreen}
                    options={{ title: 'Textboxs' }}
                />
            </Stack.Navigator> */}
            <Stack.Navigator initialRouteName="Register">
                <Stack.Screen
                    name="Register"
                    component={RegisterScreen}
                    options={{ title: "Inscription" }}
                />
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{ title: "Connexion" }}
                />
                <Stack.Screen
                    name="ChangePassword"
                    component={ChangePasswordScreen}
                    options={{ title: "changer de mot de passe" }}
                />
                <Stack.Screen
                    name="Enable2FA"
                    component={Enable2FAScreen}
                    options={{ title: "Activer la double authentification" }}
                />
                <Stack.Screen
                    name="TwoFactorLogin"
                    component={TwoFactorLoginScreen}
                    options={{
                        title: "Connexion avec la double authentification",
                    }}
                />
                <Stack.Screen
                    name="Disable2FA"
                    component={Disable2FAScreen}
                    options={{
                        title: "Desactiver avec la double authentification",
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;

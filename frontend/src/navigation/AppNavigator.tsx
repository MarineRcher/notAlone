import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import ButtonTestScreen from "../screens/Tests/ButtonTestScreen";
import TextboxTestScreen from "../screens/Tests/TextboxTestScreen";

const Stack = createStackNavigator();

const AppNavigator = () => {
    return (

        <NavigationContainer>
            <Stack.Navigator initialRouteName="Textebox test">
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
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
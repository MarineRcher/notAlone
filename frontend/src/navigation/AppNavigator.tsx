import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import ButtonTestScreen from "../screens/Tests/ButtonTestScreen";

const Stack = createStackNavigator();

const AppNavigator = () => {
    return (

        <NavigationContainer>
            <Stack.Navigator initialRouteName="Button test">
                <Stack.Screen
                    name="Button test"
                    component={ButtonTestScreen}
                    options={{ title: 'Buttons' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import HomeScreen from "../screens/HomeScreen";
import FollowScreen from "../screens/followScreen";
import UserScreen from "../screens/UserScreen";

import HomeIcon from "../../assets/icons/menu/home.svg";
import HomeIconActive from "../../assets/icons/menu/home-hover.svg";

import BookIcon from "../../assets/icons/menu/book.svg";
import BookIconActive from "../../assets/icons/menu/book-hover.svg";

import MapIcon from "../../assets/icons/menu/map.svg";
import MapIconActive from "../../assets/icons/menu/map-hover.svg";

import ResourceIcon from "../../assets/icons/menu/bookmark.svg";
import ResourceIconActive from "../../assets/icons/menu/bookmark-hover.svg";

import UserIcon from "../../assets/icons/menu/user.svg";
import UserIconActive from "../../assets/icons/menu/user-hover.svg";

import TabIcon from "./TabIcon";
import colors from "../css/colors";
import { Fonts } from "../css/font";
import TabLabel from "./tabLabel";
import ForestScreen from "../screens/forestScreen";
import HelpScreen from "../screens/HelpScreen";

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () =>
{
	return (
		<Tab.Navigator
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					backgroundColor: colors.background,
					height: 80,
					paddingVertical: 5,
				},
				tabBarActiveTintColor: colors.text,
				tabBarInactiveTintColor: colors.text,
				tabBarLabelStyle: {
					fontFamily: Fonts.quicksand.bold,
					fontSize: 12,
					fontWeight: "600",
				},
			}}
		>
			<Tab.Screen
				name="Accueil"
				component={HomeScreen}
				options={{
					tabBarIcon: ({ focused }) => (
						<TabIcon
							focused={focused}
							ActiveIcon={HomeIconActive}
							InactiveIcon={HomeIcon}
						/>
					),
					tabBarLabel: ({ focused, color }) => (
						<TabLabel
							focused={focused}
							color={color}
							label="Accueil"
						/>
					),
				}}
			/>
			<Tab.Screen
				name="Follow"
				component={FollowScreen}
				options={{
					tabBarIcon: ({ focused }) => (
						<TabIcon
							focused={focused}
							ActiveIcon={BookIconActive}
							InactiveIcon={BookIcon}
						/>
					),
					tabBarLabel: ({ focused, color }) => (
						<TabLabel
							focused={focused}
							color={color}
							label="Suivi"
						/>
					),
				}}
			/>
			<Tab.Screen
				name="Forêt"
				component={ForestScreen}
				options={{
					tabBarIcon: ({ focused }) => (
						<TabIcon
							focused={focused}
							ActiveIcon={MapIconActive}
							InactiveIcon={MapIcon}
						/>
					),
					tabBarLabel: ({ focused, color }) => (
						<TabLabel
							focused={focused}
							color={color}
							label="Forêt"
						/>
					),
				}}
			/>
			<Tab.Screen
				name="Aide"
				component={HelpScreen}
				options={{
					tabBarIcon: ({ focused }) => (
						<TabIcon
							focused={focused}
							ActiveIcon={ResourceIconActive}
							InactiveIcon={ResourceIcon}
						/>
					),
					tabBarLabel: ({ focused, color }) => (
						<TabLabel
							focused={focused}
							color={color}
							label="Aide"
						/>
					),
				}}
			/>
			<Tab.Screen
				name="Compte"
				component={UserScreen}
				options={{
					tabBarIcon: ({ focused }) => (
						<TabIcon
							focused={focused}
							ActiveIcon={UserIconActive}
							InactiveIcon={UserIcon}
						/>
					),
					tabBarLabel: ({ focused, color }) => (
						<TabLabel
							focused={focused}
							color={color}
							label="Compte"
						/>
					),
				}}
			/>
		</Tab.Navigator>
	);
};

export default BottomTabNavigator;

import React from "react";
import { SvgProps } from "react-native-svg";
import { useTheme } from "@react-navigation/native";

type TabIconProps = {
	focused: boolean;
	ActiveIcon: React.FC<SvgProps>;
	InactiveIcon: React.FC<SvgProps>;
};

const TabIcon: React.FC<TabIconProps> = ({
	focused,
	ActiveIcon,
	InactiveIcon,
}) => 
{
	const Icon = focused ? ActiveIcon : InactiveIcon;

	return <Icon width={24} height={24} />;
};

export default TabIcon;

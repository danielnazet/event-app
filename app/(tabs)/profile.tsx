import React, { memo } from "react";
import ProfileScreen from "../profile/index";

// Używamy memo, aby zapobiec niepotrzebnym renderowaniom
const ProfileTab = memo(function ProfileTab() {
	return <ProfileScreen />;
});

export default ProfileTab;

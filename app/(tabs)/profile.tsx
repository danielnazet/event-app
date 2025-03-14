import { Redirect } from "expo-router";
import React, { memo } from "react";

// Używamy memo, aby zapobiec niepotrzebnym renderowaniom
const ProfileTab = memo(function ProfileTab() {
	return <Redirect href="/profile" />;
});

export default ProfileTab;

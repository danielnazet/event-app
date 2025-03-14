import { Redirect } from "expo-router";
import React, { memo } from "react";

// Używamy memo, aby zapobiec niepotrzebnym renderowaniom
const BirthdaysTab = memo(function BirthdaysTab() {
	return <Redirect href="/birthdays" />;
});

export default BirthdaysTab;

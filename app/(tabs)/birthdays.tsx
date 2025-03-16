import React, { memo } from "react";
import BirthdaysScreen from "../birthdays/index";

// Używamy memo, aby zapobiec niepotrzebnym renderowaniom
const BirthdaysTab = memo(function BirthdaysTab() {
	return <BirthdaysScreen />;
});

export default BirthdaysTab;

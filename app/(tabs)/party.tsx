import React, { memo } from "react";
import PartyScreen from "../party/index";

// Używamy memo, aby zapobiec niepotrzebnym renderowaniom
const PartyTab = memo(function PartyTab() {
	return <PartyScreen />;
});

export default PartyTab; 
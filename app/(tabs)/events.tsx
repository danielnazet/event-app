import { Redirect } from "expo-router";
import React, { memo } from "react";

// Używamy memo, aby zapobiec niepotrzebnym renderowaniom
const EventsTab = memo(function EventsTab() {
	return <Redirect href="/events" />;
});

export default EventsTab;

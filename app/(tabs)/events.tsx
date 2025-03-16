import React, { memo } from "react";
import EventsScreen from "../events/index";

// Używamy memo, aby zapobiec niepotrzebnym renderowaniom
const EventsTab = memo(function EventsTab() {
	return <EventsScreen />;
});

export default EventsTab;

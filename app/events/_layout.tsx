import { Stack } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

export default function EventsLayout() {
	const colorScheme = useColorScheme();
	const colors = Colors[colorScheme ?? "light"];

	return (
		<Stack
			screenOptions={{
				headerStyle: {
					backgroundColor: colors.background,
				},
				headerTintColor: colors.text,
				headerTitleStyle: {
					fontWeight: "bold",
				},
				contentStyle: { backgroundColor: colors.background },
			}}
		>
			<Stack.Screen name="index" options={{ title: "Wydarzenia" }} />
			<Stack.Screen name="new" options={{ title: "Dodaj wydarzenie" }} />
			<Stack.Screen
				name="[id]"
				options={{ title: "Szczegóły wydarzenia" }}
			/>
		</Stack>
	);
}

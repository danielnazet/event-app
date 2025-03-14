import { Stack } from "expo-router";
import React from "react";

export default function AuthLayout() {
	return (
		<Stack>
			<Stack.Screen
				name="login"
				options={{
					title: "Logowanie",
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="register"
				options={{
					title: "Rejestracja",
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="forgot-password"
				options={{
					title: "Resetowanie hasła",
					headerShown: false,
				}}
			/>
		</Stack>
	);
}

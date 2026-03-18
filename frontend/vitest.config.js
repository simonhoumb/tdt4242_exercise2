import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "jsdom",
		setupFiles: ["src/tests/setup.js"],
		include: ["src/tests/**/*.test.{js,jsx}"],
		coverage: {
			enabled: true,
			provider: "v8",
			reporter: ["text", "html"],
			include: [
				"src/features/usage-compliance/components/**/*.jsx",
				"src/features/usage-compliance/hooks/**/*.js",
				"src/features/usage-compliance/services/**/*.js",
				"src/features/usage-compliance/utils/**/*.js",
			],
		},
	},
});

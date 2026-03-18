import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FeatureErrorBoundary } from "../features/usage-compliance/components/FeatureErrorBoundary";

function Bomb() {
	throw new Error("boom");
}

describe("FeatureErrorBoundary", () => {
	it("renders children when no error occurs", () => {
		render(
			<FeatureErrorBoundary fallbackText="Fallback text">
				<div>Healthy child</div>
			</FeatureErrorBoundary>,
		);

		expect(screen.getByText("Healthy child")).toBeInTheDocument();
	});

	it("renders fallback UI when child throws", () => {
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		render(
			<FeatureErrorBoundary fallbackText="Feature unavailable">
				<Bomb />
			</FeatureErrorBoundary>,
		);

		expect(screen.getByText("Feature unavailable")).toBeInTheDocument();
		consoleErrorSpy.mockRestore();
	});
});

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EthicalGuidanceCard } from "../features/usage-compliance/components/EthicalGuidanceCard";

describe("EthicalGuidanceCard", () => {
	it("renders title, message and guidance list", () => {
		render(
			<EthicalGuidanceCard
				title="Ethical AI Usage Guidance"
				message="Use AI as a thinking partner"
				guidancePoints={["Point 1", "Point 2"]}
			/>,
		);

		expect(
			screen.getByText("Ethical AI Usage Guidance"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Use AI as a thinking partner"),
		).toBeInTheDocument();
		expect(screen.getByText("Point 1")).toBeInTheDocument();
		expect(screen.getByText("Point 2")).toBeInTheDocument();
	});
});

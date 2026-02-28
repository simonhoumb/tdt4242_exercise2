import React from "react";

export class FeatureErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch(error) {
		console.error("Feature boundary caught an error:", error);
	}

	render() {
		if (this.state.hasError) {
			return <div className="card error">{this.props.fallbackText}</div>;
		}

		return this.props.children;
	}
}

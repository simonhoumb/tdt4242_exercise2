import { useCallback, useState } from "react";
import { createUsageLog } from "../services/usageApi";

export function useUsageLogs() {
	const [logs, setLogs] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const submitUsageLog = useCallback(async ({ userId, payload }) => {
		setIsLoading(true);
		setError("");

		try {
			const response = await createUsageLog({ userId, payload });
			setLogs((previousLogs) => [response.data, ...previousLogs]);
			return response;
		} catch (requestError) {
			setError(requestError.message || "Could not submit usage log");
			throw requestError;
		} finally {
			setIsLoading(false);
		}
	}, []);

	return {
		logs,
		isLoading,
		error,
		submitUsageLog,
	};
}

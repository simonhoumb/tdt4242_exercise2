import { useMemo, useState } from "react";
import { assistanceTypeOptions, defaultUsageLogDraft } from "../types";

export function UsageLogForm({
	texts,
	onSubmit,
	isSubmitting,
	submitError,
	onDraftChange,
}) {
	const [formState, setFormState] = useState(defaultUsageLogDraft);

	const isValid = useMemo(() => {
		return (
			formState.userId.trim() &&
			formState.courseId.trim() &&
			formState.assignmentId.trim() &&
			formState.toolName.trim() &&
			formState.contributionDescription.trim()
		);
	}, [formState]);

	function updateField(fieldName, value) {
		const nextState = {
			...formState,
			[fieldName]: value,
		};

		setFormState(nextState);

		onDraftChange({
			courseId: nextState.courseId,
			assignmentId: nextState.assignmentId,
			toolName: nextState.toolName,
			assistanceType: nextState.assistanceType,
			contributionDescription: nextState.contributionDescription,
			aiContributionPercent: Number(nextState.aiContributionPercent || 0),
			promptExcerpt: nextState.promptExcerpt,
		});
	}

	async function handleSubmit(event) {
		event.preventDefault();

		const payload = {
			courseId: formState.courseId,
			assignmentId: formState.assignmentId,
			toolName: formState.toolName,
			assistanceType: formState.assistanceType,
			contributionDescription: formState.contributionDescription,
			aiContributionPercent: Number(formState.aiContributionPercent || 0),
			promptExcerpt: formState.promptExcerpt,
		};

		await onSubmit({
			userId: formState.userId,
			payload,
		});
	}

	return (
		<form className="card" onSubmit={handleSubmit}>
			<h2>{texts.title}</h2>
			<div className="row">
				<div>
					<label htmlFor="userId">{texts.userId}</label>
					<input
						id="userId"
						value={formState.userId}
						onChange={(event) =>
							updateField("userId", event.target.value)
						}
					/>
				</div>
				<div>
					<label htmlFor="courseId">{texts.courseId}</label>
					<input
						id="courseId"
						value={formState.courseId}
						onChange={(event) =>
							updateField("courseId", event.target.value)
						}
					/>
				</div>
			</div>

			<div className="row">
				<div>
					<label htmlFor="assignmentId">{texts.assignmentId}</label>
					<input
						id="assignmentId"
						value={formState.assignmentId}
						onChange={(event) =>
							updateField("assignmentId", event.target.value)
						}
					/>
				</div>
				<div>
					<label htmlFor="toolName">{texts.toolName}</label>
					<input
						id="toolName"
						value={formState.toolName}
						onChange={(event) =>
							updateField("toolName", event.target.value)
						}
					/>
				</div>
			</div>

			<div className="row">
				<div>
					<label htmlFor="assistanceType">
						{texts.assistanceType}
					</label>
					<select
						id="assistanceType"
						value={formState.assistanceType}
						onChange={(event) =>
							updateField("assistanceType", event.target.value)
						}
					>
						{assistanceTypeOptions.map((optionValue) => (
							<option key={optionValue} value={optionValue}>
								{optionValue}
							</option>
						))}
					</select>
				</div>
				<div>
					<label htmlFor="aiContributionPercent">
						{texts.aiContributionPercent}
					</label>
					<input
						id="aiContributionPercent"
						type="number"
						min="0"
						max="100"
						value={formState.aiContributionPercent}
						onChange={(event) =>
							updateField(
								"aiContributionPercent",
								event.target.value,
							)
						}
					/>
				</div>
			</div>

			<div>
				<label htmlFor="contributionDescription">
					{texts.contributionDescription}
				</label>
				<textarea
					id="contributionDescription"
					value={formState.contributionDescription}
					onChange={(event) =>
						updateField(
							"contributionDescription",
							event.target.value,
						)
					}
				/>
			</div>

			<div>
				<label htmlFor="promptExcerpt">{texts.promptExcerpt}</label>
				<textarea
					id="promptExcerpt"
					value={formState.promptExcerpt}
					onChange={(event) =>
						updateField("promptExcerpt", event.target.value)
					}
				/>
			</div>

			{submitError ? (
				<p className="error">
					{texts.submitErrorPrefix}: {submitError}
				</p>
			) : null}

			<button type="submit" disabled={!isValid || isSubmitting}>
				{isSubmitting ? texts.submitting : texts.submit}
			</button>
		</form>
	);
}

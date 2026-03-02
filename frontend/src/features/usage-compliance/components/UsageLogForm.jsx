import { useMemo, useState } from "react";
import {
	assistanceTypeOptions,
	defaultUsageLogDraft,
	requiredFormFields,
} from "../types";

function toUsagePayload(state) {
	return {
		courseId: state.courseId,
		assignmentId: state.assignmentId,
		toolName: state.toolName,
		assistanceType: state.assistanceType,
		contributionDescription: state.contributionDescription,
		aiContributionPercent: Number(state.aiContributionPercent || 0),
		promptExcerpt: state.promptExcerpt,
	};
}

function IdentityFields({ texts, formState, updateField }) {
	return (
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
	);
}

function AssignmentFields({ texts, formState, updateField }) {
	return (
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
	);
}

function AssistanceFields({ texts, formState, updateField }) {
	return (
		<div className="row">
			<div>
				<label htmlFor="assistanceType">{texts.assistanceType}</label>
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
						updateField("aiContributionPercent", event.target.value)
					}
				/>
			</div>
		</div>
	);
}

function DescriptionFields({ texts, formState, updateField }) {
	return (
		<>
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
		</>
	);
}

export function UsageLogForm({
	texts,
	onSubmit,
	isSubmitting,
	submitError,
	onDraftChange,
}) {
	const [formState, setFormState] = useState(defaultUsageLogDraft);

	const isValid = useMemo(() => {
		return requiredFormFields.every(
			(fieldName) => String(formState[fieldName] || "").trim().length > 0,
		);
	}, [formState]);

	function updateField(fieldName, value) {
		const nextState = {
			...formState,
			[fieldName]: value,
		};

		setFormState(nextState);
		onDraftChange(toUsagePayload(nextState));
	}

	async function handleSubmit(event) {
		event.preventDefault();

		await onSubmit({
			userId: formState.userId,
			payload: toUsagePayload(formState),
		});
	}

	return (
		<form className="card" onSubmit={handleSubmit}>
			<h2>{texts.title}</h2>
			<IdentityFields
				texts={texts}
				formState={formState}
				updateField={updateField}
			/>
			<AssignmentFields
				texts={texts}
				formState={formState}
				updateField={updateField}
			/>
			<AssistanceFields
				texts={texts}
				formState={formState}
				updateField={updateField}
			/>
			<DescriptionFields
				texts={texts}
				formState={formState}
				updateField={updateField}
			/>

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

# AIGuidebook - AI Usage Logging & Compliance

## Project structure

- `backend/src/models/UsageLog.js`: FR2, FR4, NFR1 schema with data minimization and indexes for deletion/query.
- `backend/src/models/PolicyRule.js`: FR5, NFR5 configurable JSON-based course and assignment rules.
- `backend/src/services/loggingService.js`: FR4, NFR4 async log persistence and retry.
- `backend/src/services/complianceService.js`: FR5, FR6, FR7, NFR3, NFR6 rule evaluation and educational feedback.
- `backend/src/routes/logRoutes.js`: POST/GET logs, draft and batch compliance, GDPR delete.
- `backend/src/routes/policyRoutes.js`: course policy create/list endpoints.
- `backend/src/controllers/*`: request validation, service delegation, error handling.
- `backend/src/tests/*`: backend unit tests for services, controllers, repositories, utils, and config.
- `frontend/src/features/usage-compliance/components/UsageLogForm.jsx`: FR2, FR3 structured form with loading/error states.
- `frontend/src/features/usage-compliance/components/ComplianceFeedbackPanel.jsx`: FR6, NFR3 educational-first violations.
- `frontend/src/features/usage-compliance/components/EthicalGuidanceCard.jsx`: FR7, NFR6 proactive ethical guidance.
- `frontend/src/features/usage-compliance/services/usageApi.js`: retry logic and error transformation.
- `frontend/src/features/usage-compliance/hooks/*`: stateful data/compliance orchestration and debounce.
- `frontend/src/tests/*`: frontend unit tests for components, hooks, services, and utility functions.

## Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Configure backend environment

Copy `backend/.env.example` to `backend/.env` and set your Mongo URI.

### 3) Run backend

```bash
npm run dev --workspace backend
```

### 4) Run frontend

```bash
npm run dev --workspace frontend
```

Set optional frontend API target with:

```bash
VITE_API_URL=http://localhost:4000/api
```

## API summary

- `POST /api/logs` create usage log and return compliance feedback.
- `GET /api/logs` list logs (`userId`, `courseId`, `assignmentId`, `limit`).
- `DELETE /api/logs/user/:userId` GDPR deletion endpoint.
- `POST /api/logs/compliance/check` evaluate a draft log without saving.
- `POST /api/logs/compliance/batch` evaluate multiple logs for submission.
- `POST /api/policies` create a policy rule.
- `GET /api/policies` list policy rules.

## Example policy seed

See `backend/policies/example-course-policy.json`.

## Testing and coverage

### Run all tests (backend + frontend)

From the workspace root:

```bash
npm run test -- --coverage
```

This command runs:

- backend unit tests (`backend` workspace)
- frontend unit tests (`frontend` workspace)
- coverage output in both text and HTML format

### Run tests for one workspace only

Backend only:

```bash
npm run test --workspace backend -- --coverage
```

Frontend only:

```bash
npm run test --workspace frontend -- --coverage
```

### View HTML coverage reports

After running tests with coverage, open these files in a browser:

- Backend report: `backend/coverage/index.html`
- Frontend report: `frontend/coverage/index.html`

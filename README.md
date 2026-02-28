# AIGuidebook - AI Usage Logging & Compliance

## Project structure

- `backend/src/models/UsageLog.js`: FR2, FR4, NFR1 schema with data minimization and indexes for deletion/query.
- `backend/src/models/PolicyRule.js`: FR5, NFR5 configurable JSON-based course and assignment rules.
- `backend/src/services/loggingService.js`: FR4, NFR4 async log persistence and retry.
- `backend/src/services/complianceService.js`: FR5, FR6, FR7, NFR3, NFR6 rule evaluation and educational feedback.
- `backend/src/middleware/autoLoggingMiddleware.js`: FR4, NFR4 non-blocking post-response logging.
- `backend/src/routes/logRoutes.js`: POST/GET logs, draft and batch compliance, GDPR delete.
- `backend/src/routes/policyRoutes.js`: course policy create/list endpoints.
- `backend/src/controllers/*`: request validation, service delegation, error handling.
- `frontend/src/features/usage-compliance/components/UsageLogForm.jsx`: FR2, FR3 structured form with loading/error states.
- `frontend/src/features/usage-compliance/components/ComplianceFeedbackPanel.jsx`: FR6, NFR3 educational-first violations.
- `frontend/src/features/usage-compliance/components/EthicalGuidanceCard.jsx`: FR7, NFR6 proactive ethical guidance.
- `frontend/src/features/usage-compliance/services/usageApi.js`: retry logic and error transformation.
- `frontend/src/features/usage-compliance/hooks/*`: stateful data/compliance orchestration and debounce.

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

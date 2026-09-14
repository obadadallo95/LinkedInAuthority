# Backend API Testing Documentation

## Overview
Our backend is built using Node.js and Express. It integrates with Google GenAI for content generation and GitHub repository services. LinkedIn publishing and official analytics are not implemented in the current beta.

We test our backend using **Vitest** combined with **Supertest**. Supertest allows us to simulate HTTP requests (GET, POST) against our Express application without having to start a physical server on a port.

## Core Concepts

### 1. Route Testing with Supertest
We create integration tests that load the Express router and make requests to it.
- **Example Files:** `ai.test.ts`, `cron.test.ts`.
- **Methodology:** We initialize an instance of Express, attach our routes, and use `request(app).post('/api/ai/analyze-repo').send({ data })`.

### 2. Mocking External Services
It is strictly forbidden to make live API calls to Google, GitHub, or LinkedIn during automated testing. Live calls cost money, introduce latency, and lead to flaky tests due to network issues.
- **Google GenAI Mocking:** In `ai.test.ts`, we use `vi.mock('@google/genai')` to intercept AI generation requests. We return deterministic JSON strings matching the schemas expected by our frontend.
- **External service mocking:** No live LinkedIn integration is tested because it is not implemented; external GitHub and Gemini calls are mocked where needed.

## Writing a New Backend Test
1. **Locate the Route:** If testing a new route in `server/routes/billing.ts`, create `test/routes/billing.test.ts`.
2. **Setup Express:** 
   ```typescript
   import express from 'express';
   import request from 'supertest';
   import billingRouter from '../../server/routes/billing';
   
   const app = express();
   app.use(express.json());
   app.use('/billing', billingRouter);
   ```
3. **Mock Dependencies:** Ensure any Stripe, Firebase Admin, or Database calls are mocked using `vi.mock()`.
4. **Assert Status Codes and Payloads:**
   ```typescript
   const response = await request(app).post('/billing/checkout').send({ planId: 'pro' });
   expect(response.status).toBe(200);
   expect(response.body.url).toBeDefined();
   ```

## Best Practices
- **Reset Mocks:** Always call `vi.clearAllMocks()` in a `beforeEach` block to ensure tests do not pollute one another.
- **Error Simulation:** Explicitly test how your route handles external API failures. Mock `node-fetch` to return a `500 Internal Server Error` and verify that the Express route returns the correct error JSON to the frontend instead of crashing.

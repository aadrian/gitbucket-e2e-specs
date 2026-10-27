// GitBucket's REST API (api/v3) as a persona: checks the result of a UI step without depending on the database.

import { request } from '@playwright/test';
import { target } from './target.js';

export async function apiAs(persona) {
  return request.newContext({
    baseURL: `${target.baseURL}api/v3/`,
    ignoreHTTPSErrors: target.ignoreHTTPSErrors,
    httpCredentials: { username: persona.username, password: persona.password(), send: 'always' },
  });
}

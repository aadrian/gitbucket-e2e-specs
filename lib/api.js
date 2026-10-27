// GitBucket's REST API (api/v3) as a persona: checks the result of a UI step without depending on the database.

import { expect, request } from '@playwright/test';
import { target } from './target.js';

export async function apiAs(persona) {
  return request.newContext({
    baseURL: `${target.baseURL}api/v3/`,
    ignoreHTTPSErrors: target.ignoreHTTPSErrors,
    httpCredentials: { username: persona.username, password: persona.password(), send: 'always' },
  });
}

/** GET as the persona: { status, body } (body only for 2xx) */
export async function apiGet(persona, path) {
  const api = await apiAs(persona);
  try {
    const response = await api.get(path);
    return { status: response.status(), body: response.ok() ? await response.json() : null };
  } finally {
    await api.dispose();
  }
}

/** GET that must succeed; returns the body */
export async function apiGetOk(persona, path) {
  const { status, body } = await apiGet(persona, path);
  expect(status, `GET api/v3/${path}`).toBe(200);
  return body;
}

/** HTTP status of a GET with a personal access token instead of a password */
export async function apiStatusWithToken(token, path = 'user') {
  const api = await request.newContext({
    baseURL: `${target.baseURL}api/v3/`,
    ignoreHTTPSErrors: target.ignoreHTTPSErrors,
    extraHTTPHeaders: { Authorization: `token ${token}` },
  });
  try {
    return (await api.get(path)).status();
  } finally {
    await api.dispose();
  }
}

/** names of a repository's branches */
export async function branchNames(persona, repoPath) {
  return (await apiGetOk(persona, `repos/${repoPath}/branches`)).map((b) => b.name);
}

// The GitBucket instance under test (E2E_BASE_URL). The tests create users, groups and repositories: only
// throwaway or test instances. Hosts other than localhost / *.local / *.test / *.localhost are refused unless
// E2E_ALLOW_REMOTE=1.

const raw = process.env.E2E_BASE_URL || 'http://localhost:8080/';
// a trailing slash keeps a context path (e.g. /gitbucket/) when tests use relative paths ('signin', not '/signin')
const baseURL = raw.endsWith('/') ? raw : `${raw}/`;
const { hostname } = new URL(baseURL);

const local = ['localhost', '127.0.0.1'].includes(hostname) || /\.(local|test|localhost)$/.test(hostname);
if (!local && process.env.E2E_ALLOW_REMOTE !== '1') {
  throw new Error(`E2E_BASE_URL ${baseURL} is not a local host; set E2E_ALLOW_REMOTE=1 for a remote test instance`);
}

export const target = {
  baseURL,
  // self-signed or local CA certificates (e.g. an https alias in front of a local instance)
  ignoreHTTPSErrors: process.env.E2E_IGNORE_HTTPS_ERRORS === 'true',
};

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set (see README.md)`);
  }
  return value;
}

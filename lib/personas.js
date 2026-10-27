// The test accounts: the single place for user names, account types and memberships (docs/e2e-plan.md).
// Created once per instance by the setup project and kept. Account type letters as in core/use-cases.md.

const password = () => process.env.E2E_PASSWORD || 'e2e-password';

const user = (username, type, fullName) => ({
  key: username, username, type, fullName, mailAddress: `${username}@example.com`, admin: false, password,
});

export const personas = {
  root: {
    key: 'root',
    username: 'root',
    type: 'A',
    admin: true,
    existing: true,
    // GitBucket's initial password; set E2E_ROOT_PASSWORD when the instance has another one
    password: () => process.env.E2E_ROOT_PASSWORD || 'root',
  },
  user: user('e2e-user', 'U', 'E2E User'),
  manager: user('e2e-manager', 'M', 'E2E Manager'),
  owner: user('e2e-owner', 'O', 'E2E Owner'),
  developer: user('e2e-developer', 'D', 'E2E Developer'),
};

// shared data, created by the setup project and kept
export const shared = {
  // managed by the manager
  group: 'e2e-group',
  // owned by the owner, the developer is a collaborator with the Developer role
  repo: { owner: 'e2e-owner', name: 'e2e-repo' },
};

export const repoPath = (repo = shared.repo) => `${repo.owner}/${repo.name}`;

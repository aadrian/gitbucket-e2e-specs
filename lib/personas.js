// The test accounts: the single place for user names, account types and memberships (docs/e2e-plan.md).
// Placeholder: only the administrator every fresh GitBucket has. The account types follow with the use cases.

export const personas = {
  root: {
    key: 'root',
    username: 'root',
    admin: true,
    existing: true,
    // GitBucket's initial password; set E2E_ROOT_PASSWORD when the instance has another one
    password: () => process.env.E2E_ROOT_PASSWORD || 'root',
  },
};

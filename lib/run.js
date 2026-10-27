// The id of a test run: part of the names of the data a test case creates, so leftovers of a run can be found and
// removed. Set once in playwright.config.js (main process) and inherited by the workers; E2E_RUN reuses an id.

const pad = (n) => String(n).padStart(2, '0');

export function newRunId(now = new Date()) {
  return `e2e${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

export const runId = () => {
  if (!process.env.E2E_RUN) {
    throw new Error('E2E_RUN is not set (playwright.config.js sets it)');
  }
  return process.env.E2E_RUN;
};

/** a name for data of this run: `<runId>-<what>` */
export const named = (what) => `${runId()}-${what}`;

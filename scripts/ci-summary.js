#!/usr/bin/env node
// Turns Playwright's JSON report into Markdown for the CI run's summary page.
// Usage: node scripts/ci-summary.js <results.json> <heading>
import { readFileSync } from 'node:fs';

const [file, heading = 'e2e'] = process.argv.slice(2);
if (!file) {
  console.error('usage: ci-summary.js <results.json> <heading>');
  process.exit(2);
}

let report;
try {
  report = JSON.parse(readFileSync(file, 'utf8'));
} catch (e) {
  console.log(`### ${heading}\n\nNo test results (${e.message}).`);
  process.exit(0);
}

// one row per test and project, in run order
const rows = [];
const walk = (suite, path) => {
  const here = suite.title ? [...path, suite.title] : path;
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const last = test.results?.at(-1);
      rows.push({
        project: test.projectName,
        title: [...here.slice(1), spec.title].join(' › '),
        file: here[0],
        status: test.status, // expected | unexpected | flaky | skipped
        duration: last?.duration ?? 0,
      });
    }
  }
  for (const child of suite.suites ?? []) walk(child, here);
};
for (const suite of report.suites ?? []) walk(suite, []);

const icon = { expected: '✅', unexpected: '❌', flaky: '⚠️', skipped: '⏭️' };
const label = { expected: 'passed', unexpected: 'failed', flaky: 'flaky', skipped: 'skipped' };
const s = report.stats ?? {};
const counts = ['expected', 'unexpected', 'flaky', 'skipped']
  .filter((k) => s[k])
  .map((k) => `${s[k]} ${label[k]}`)
  .join(', ');
const seconds = Math.round((s.duration ?? 0) / 1000);
const ok = !s.unexpected && !(report.errors?.length);

const out = [`### ${ok ? '✅' : '❌'} ${heading}`, '', `${counts || 'no tests'} in ${seconds} s`, ''];
for (const e of report.errors ?? []) out.push(`> ${String(e.message ?? e).split('\n')[0]}`, '');

const failed = rows.filter((r) => r.status === 'unexpected' || r.status === 'flaky');
if (failed.length) {
  out.push('Failed or flaky:', '');
  for (const r of failed) out.push(`- ${icon[r.status]} \`${r.project}\` ${r.title} (${r.file})`);
  out.push('');
}

const cell = (t) => String(t).replaceAll('|', '\\|');
out.push('<details><summary>All tests</summary>', '');
out.push('| | Project | Test | File | s |', '|---|---|---|---|---:|');
for (const r of rows) {
  out.push(
    `| ${icon[r.status] ?? r.status} | ${r.project} | ${cell(r.title)} | ${cell(r.file)} | ${(r.duration / 1000).toFixed(1)} |`,
  );
}
out.push('', '</details>', '');
console.log(out.join('\n'));

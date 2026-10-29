// A webhook receiver in the test process, on 127.0.0.1: GitBucket runs on the same host (locally and in CI), and
// 127.0.0.1 is a private address, which GitBucket can block.

import http from 'node:http';

/**
 * Starts a receiver that answers 200, or with `answer: false` accepts each request and never answers. Returns
 * { url, requests, close }; `requests` collects { method, headers, body } as they arrive.
 */
export async function startReceiver({ answer = true } = {}) {
  const requests = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      requests.push({ method: req.method, headers: req.headers, body });
      if (answer) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('ok');
      }
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}/`,
    requests,
    close: () => new Promise((resolve) => {
      server.closeAllConnections();
      server.close(resolve);
    }),
  };
}

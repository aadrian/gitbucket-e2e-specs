// Fresh public keys for a run: GitBucket refuses an SSH or GPG key that is already stored for anyone.

import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const sshString = (buffer) => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(buffer.length);
  return Buffer.concat([length, buffer]);
};

/** an OpenSSH ed25519 public key line */
export function newSshPublicKey(comment) {
  const { publicKey } = crypto.generateKeyPairSync('ed25519');
  const raw = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32);
  const blob = Buffer.concat([sshString(Buffer.from('ssh-ed25519')), sshString(raw)]);
  return `ssh-ed25519 ${blob.toString('base64')} ${comment}`;
}

/** an ASCII-armored GPG public key, made with the gpg command in a throwaway home */
export function newGpgPublicKey(name, email) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-gpg-'));
  const gpg = (...args) => execFileSync('gpg', ['--homedir', home, '--batch', ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    gpg('--pinentry-mode', 'loopback', '--passphrase', '', '--quick-gen-key', `${name} <${email}>`, 'rsa2048', 'sign', 'never');
    return gpg('--armor', '--export', email).toString();
  } finally {
    try {
      execFileSync('gpgconf', ['--homedir', home, '--kill', 'gpg-agent'], { stdio: 'ignore' });
    } catch {
      // no agent running
    }
    fs.rmSync(home, { recursive: true, force: true });
  }
}

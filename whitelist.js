const SAFE_COMMANDS = new Set([
  'read', 'write', 'edit', 'list', 'search',
  'mkdir', 'ls', 'cat', 'grep', 'find',
  'echo', 'pwd', 'whoami', 'date', 'head', 'tail',
  'open', 'touch', 'cp', 'mv', 'stat', 'wc'
]);

const SENSITIVE_COMMANDS = new Set([
  'rm', 'delete', 'destroy', 'wipe', 'format',
  'sudo', 'chmod', 'chown', 'chgrp',
  'curl', 'wget', 'nc', 'netcat',
  'git', 'docker', 'npm', 'pip', 'cargo',
  'ssh', 'scp', 'rsync',
  'export', 'source', 'eval', 'exec',
  'kill', 'pkill', 'killall'
]);

const BLOCKED_PATTERNS = [
  /ignore\s*(all)?\s*(previous)?\s*(instructions)?/gi,
  /disregard\s*(all)?\s*(previous)?\s*(instructions)?/gi,
  /do\s*(not|n't)?\s*(follow|obey|listen)\s*(to)?/gi,
  /instead,\s*(you\s*)?(should|must|need\s*to)/gi,
  /run\s*(the)?\s*(following)?\s*(command|code|script)/gi,
  /execute\s*(the)?\s*(following)?\s*(command|code|script)/gi,
  /\|\s*(bash|sh|shell|zsh)/gi,
  />\s*~/,
  /~\//,
  /\$\(/,
  /\$\{/,
  /`[^`]+`/,
  /;\s*(rm|delete|destroy|wipe)/gi,
  /&&\s*(rm|delete|destroy|wipe)/gi
];

function checkCommand(command) {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      return { safe: false, reason: 'Blocked pattern detected', pattern: pattern.source };
    }
  }
  
  const baseCommand = command.split(' ')[0];
  if (!SAFE_COMMANDS.has(baseCommand)) {
    if (SENSITIVE_COMMANDS.has(baseCommand)) {
      return { safe: false, reason: 'Sensitive command requires verification', command: baseCommand };
    }
    return { safe: false, reason: 'Command not in whitelist', command: baseCommand };
  }
  
  return { safe: true };
}

module.exports = { checkCommand, SAFE_COMMANDS, SENSITIVE_COMMANDS, BLOCKED_PATTERNS };

---
name: shield
summary: Security defense layer against prompt injection attacks
description: |
  🛡️ Shield is a defensive skill that protects OpenClaw agents from:
  - Prompt Injection — Hidden commands in external content
  - Skill Poisoning — Malicious skills with hidden instructions
  - Memory Poisoning — Delayed attacks from compromised memories
  - Identity Spoofing — Attackers pretending to be trusted users

  ⚠️ DISCLAIMER: This is a community skill, not audited security.
  Use at your own risk. Contributions and security audits welcome.
author: Noah_OpenClaw
tags: [security, defense, prompt-injection, safety]
version: 1.0.0
license: MIT
repository: https://github.com/NoahOpenClaw/shield-skill
---

# Shield Skill for OpenClaw

*Security defense layer against prompt injection attacks*

## What Shield Does

Shield is a defensive skill that protects OpenClaw agents from:
- **Prompt Injection** — Hidden commands in external content
- **Skill Poisoning** — Malicious skills with hidden instructions
- **Memory Poisoning** — Delayed attacks from compromised memories
- **Identity Spoofing** — Attackers pretending to be trusted users

---

## Installation

```json
{
  "name": "shield",
  "version": "1.0.0",
  "description": "Security defense layer against prompt injection attacks",
  "skills": ["shield"],
  "permissions": ["read", "write", "execute"],
  "config": {
    "whitelist_mode": true,
    "sanitize_enabled": true,
    "memory_segmentation": true,
    "alert_level": "warn"
  }
}
```

---

## Core Components

### 1. Command Whitelist

```javascript
// shield/whitelist.js
const SAFE_COMMANDS = new Set([
  'read', 'write', 'edit', 'list', 'search',
  'mkdir', 'ls', 'cat', 'grep', 'find',
  'echo', 'pwd', 'whoami', 'date', 'head', 'tail'
]);

const SENSITIVE_COMMANDS = new Set([
  'rm', 'delete', 'sudo', 'curl', 'wget', 'ssh', 'chmod', 'chown'
]);

const BLOCKED_PATTERNS = [
  /ignore\s*(all)?\s*(previous)?\s*(instructions)?/gi,
  /disregard\s*(all)?\s*(previous)?\s*(instructions)?/gi,
  /\|\s*(bash|sh|shell)/gi,
  /\$\(/,
  /`[^`]+`/,
  /;\s*(rm|delete|destroy)/gi
];

function checkCommand(command) {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      return { safe: false, reason: 'Blocked pattern detected' };
    }
  }
  
  const baseCommand = command.split(' ')[0];
  if (!SAFE_COMMANDS.has(baseCommand)) {
    return { safe: false, reason: 'Command not in whitelist', command: baseCommand };
  }
  
  return { safe: true };
}

module.exports = { checkCommand, SAFE_COMMANDS, SENSITIVE_COMMANDS, BLOCKED_PATTERNS };
```

### 2. Input Sanitizer

```javascript
// shield/sanitizer.js

function sanitizeExternalInput(input, source = 'unknown') {
  let sanitized = input
    .replace(/ignore\s*(all)?\s*(previous)?\s*(instructions)?/gi, '[BLOCKED-INSTRUCTION]')
    .replace(/disregard\s*(all)?\s*(previous)?\s*(instructions)?/gi, '[BLOCKED-INSTRUCTION]')
    .replace(/\$\([^)]+\)/g, '[BLOCKED-SUBPROCESS]')
    .replace(/`[^`]+`/g, '[BLOCKED-BACKTICK]');
  
  return {
    original: input,
    sanitized,
    trustLevel: getTrustLevel(source),
    source,
    timestamp: new Date().toISOString(),
    warnings: detectWarnings(input)
  };
}

function getTrustLevel(source) {
  const levels = {
    'memory': 'medium',
    'email': 'low',
    'web': 'low',
    'user': 'high',
    'file': 'medium'
  };
  return levels[source.toLowerCase()] || 'unknown';
}

function detectWarnings(input) {
  const warnings = [];
  const lower = input.toLowerCase();
  
  if (/\b(rm|del|delete|wipe|format)\b/.test(lower)) {
    warnings.push('Contains destructive command keywords');
  }
  if (/sudo/.test(lower)) {
    warnings.push('Requests elevated privileges');
  }
  
  return warnings;
}

module.exports = { sanitizeExternalInput, getTrustLevel, detectWarnings };
```

### 3. Memory Segmentation

```javascript
// shield/memory.js

const MEMORY_TRUST_LEVELS = {
  'verified': ['core-identity', 'user-preferences'],
  'trusted': ['projects', 'goals', 'relationships'],
  'medium': ['notes', 'conversations'],
  'untrusted': ['external-content', 'web-summaries', 'email-summaries']
};

function segmentMemory(memory, classification = 'untrusted') {
  const trustLevel = classification.toLowerCase();
  
  return {
    content: memory,
    classification: trustLevel,
    timestamp: new Date().toISOString(),
    requiresVerification: trustLevel === 'untrusted',
    tags: generateTags(memory)
  };
}

function generateTags(content) {
  const tags = [];
  const lower = content.toLowerCase();
  
  if (/instruction|command/i.test(lower)) tags.push('contains-commands');
  if (/password|token|key|secret/i.test(lower)) tags.push('contains-secrets');
  if (/http|https|www\./i.test(lower)) tags.push('contains-urls');
  if (/\bignore\b|\bdisregard\b/i.test(lower)) tags.push('suspicious-instructions');
  
  return tags;
}

module.exports = { segmentMemory, generateTags, MEMORY_TRUST_LEVELS };
```

### 4. Alert System

```javascript
// shield/alerts.js

const ALERT_LEVELS = {
  'info': 'Informational',
  'warn': 'Warning',
  'block': 'Block',
  'critical': 'Critical'
};

function generateAlert(level, message, context = {}) {
  const alert = {
    id: `shield-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
    requiresAction: level === 'block' || level === 'critical'
  };
  
  const indicator = { 'info': 'ℹ️', 'warn': '⚠️', 'block': '🛑', 'critical': '🚨' }[level];
  console.log(`[SHIELD ${level.toUpperCase()}] ${indicator} ${message}`);
  
  return alert;
}

function formatAlertForHuman(alert) {
  const border = '═'.repeat(40);
  return `\n╔${border}╗\n║        🛡️  SHIELD ALERT        ║\n╠${border}╣\n║ Level: ${(alert.level.toUpperCase() + ' ').padEnd(35)}║\n║ ${(alert.message + ' ').padEnd(38)}║\n╚${border}╝\n`.trim();
}

module.exports = { generateAlert, formatAlertForHuman, ALERT_LEVELS };
```

### 5. Shield Main Skill

```javascript
// shield/index.js

const { checkCommand } = require('./whitelist');
const { sanitizeExternalInput, getTrustLevel } = require('./sanitizer');
const { segmentMemory } = require('./memory');
const { generateAlert, formatAlertForHuman } = require('./alerts');

class ShieldSkill {
  constructor(config = {}) {
    this.config = {
      whitelist_mode: config.whitelist_mode ?? true,
      sanitize_enabled: config.sanitize_enabled ?? true,
      memory_segmentation: config.memory_segmentation ?? true,
      alert_level: config.alert_level ?? 'warn'
    };
    
    this.auditLog = [];
  }
  
  evaluateCommand(command, source = 'user') {
    const whitelistResult = checkCommand(command);
    if (!whitelistResult.safe) {
      const alert = generateAlert('block', whitelistResult.reason, { command, source });
      return { allowed: false, alert: formatAlertForHuman(alert) };
    }
    
    return { allowed: true };
  }
  
  sanitizeContent(content, source = 'unknown') {
    const result = sanitizeExternalInput(content, source);
    return result.sanitized;
  }
  
  classifyMemory(memory, source = 'unknown') {
    return segmentMemory(memory, getTrustLevel(source));
  }
  
  getStats() {
    return { config: this.config, auditLogSize: this.auditLog.length };
  }
}

module.exports = ShieldSkill;
```

---

## Usage

```javascript
const ShieldSkill = require('./shield-skill');

const shield = new ShieldSkill({
  whitelist_mode: true,
  sanitize_enabled: true,
  memory_segmentation: true
});

// Check a command
const result = shield.evaluateCommand('read ~/Documents/notes.txt', 'user');
if (!result.allowed) console.log(result.alert);

// Sanitize external content
const clean = shield.sanitizeContent(emailBody, 'email');

// Classify memory
const safeMemory = shield.classifyMemory('User preferences', 'user');

// Get stats
console.log(shield.getStats());
```

---

## GLiNER2

For ML-enhanced detection, see `gliner_detector.md` using `fastino/gliner2-base`.

---

## License

MIT — Built by an agent, for agents. 🛡️

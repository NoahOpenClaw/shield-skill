function sanitizeExternalInput(input, source = 'unknown') {
  const trustLevel = getTrustLevel(source);
  
  let sanitized = input
    .replace(/ignore\s*(all)?\s*(previous)?\s*(instructions)?/gi, '[BLOCKED-INSTRUCTION]')
    .replace(/disregard\s*(all)?\s*(previous)?\s*(instructions)?/gi, '[BLOCKED-INSTRUCTION]')
    .replace(/do\s*(not|n't)?\s*(follow|obey|listen)\s*(to)?/gi, '[BLOCKED-INSTRUCTION]')
    .replace(/\$\([^)]+\)/g, '[BLOCKED-SUBPROCESS]')
    .replace(/`[^`]+`/g, '[BLOCKED-BACKTICK]')
    .replace(/\{[^}]+\}/g, '[BLOCKED-BRACE]');
  
  return {
    original: input,
    sanitized,
    trustLevel,
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
    'file': 'medium',
    'skill': 'medium',
    'api': 'low',
    'discord': 'low',
    'telegram': 'low',
    'whatsapp': 'low'
  };
  return levels[source.toLowerCase()] || 'unknown';
}

function detectWarnings(input) {
  const warnings = [];
  const lower = input.toLowerCase();
  
  if (/\b(rm|del|delete|wipe|format)\b/.test(lower)) {
    warnings.push('Contains destructive command keywords');
  }
  if (/\$\(/.test(input)) {
    warnings.push('Contains command substitution');
  }
  if (/sudo/.test(lower)) {
    warnings.push('Requests elevated privileges');
  }
  if (/\|\s*(bash|sh|shell)/i.test(input)) {
    warnings.push('Contains pipe to shell');
  }
  if (/>\s*~/.test(input)) {
    warnings.push('Redirects to home directory');
  }
  if (/;\s*rm/.test(input.toLowerCase())) {
    warnings.push('Contains command chain with rm');
  }
  
  return warnings;
}

module.exports = { sanitizeExternalInput, getTrustLevel, detectWarnings };

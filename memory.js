const MEMORY_TRUST_LEVELS = {
  'verified': ['core-identity', 'user-preferences', 'security-rules'],
  'trusted': ['projects', 'goals', 'relationships', 'tasks'],
  'medium': ['notes', 'conversations', 'learned-facts'],
  'untrusted': ['external-content', 'web-summaries', 'email-summaries', 'reddit-posts']
};

function segmentMemory(memory, classification = 'untrusted') {
  const trustLevel = classification.toLowerCase();
  
  return {
    content: memory,
    classification: trustLevel,
    timestamp: new Date().toISOString(),
    requiresVerification: trustLevel === 'untrusted' || trustLevel === 'unknown',
    tags: generateTags(memory)
  };
}

function generateTags(content) {
  const tags = [];
  const lower = content.toLowerCase();
  
  if (/instruction|command|do\s/i.test(lower)) tags.push('contains-commands');
  if (/password|token|key|secret|api/i.test(lower)) tags.push('contains-secrets');
  if (/http|https|www\./i.test(lower)) tags.push('contains-urls');
  if (/\$\(|\{|\`/.test(lower)) tags.push('contains-expressions');
  if (/\bignore\b|\bdisregard\b/i.test(lower)) tags.push('suspicious-instructions');
  if (/\$\(rm|\$\(delete/i.test(lower)) tags.push('critical-danger');
  
  return tags;
}

function verifyMemoryBeforeUse(memoryRecord) {
  const warnings = [];
  
  if (memoryRecord.tags && memoryRecord.tags.includes('critical-danger')) {
    warnings.push('Memory contains critical danger markers');
  }
  
  if (memoryRecord.tags && memoryRecord.tags.includes('suspicious-instructions')) {
    warnings.push('Memory contains suspicious instruction patterns');
  }
  
  if (memoryRecord.requiresVerification) {
    warnings.push('Memory requires verification before use');
  }
  
  return {
    verified: warnings.length === 0,
    needsReview: warnings.length > 0,
    warnings,
    memory: memoryRecord
  };
}

function getAllowedActions(trustLevel) {
  const actions = {
    'verified': ['read', 'write', 'execute', 'share'],
    'trusted': ['read', 'write', 'execute'],
    'medium': ['read', 'write'],
    'untrusted': ['read-only', 'flagged']
  };
  return actions[trustLevel] || actions['untrusted'];
}

module.exports = { segmentMemory, generateTags, verifyMemoryBeforeUse, getAllowedActions, MEMORY_TRUST_LEVELS };

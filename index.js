// Shield Skill - Main Entry Point

const { checkCommand } = require('./whitelist');
const { sanitizeExternalInput, getTrustLevel } = require('./sanitizer');
const { segmentMemory } = require('./memory');
const { generateAlert, formatAlertForHuman, shouldBlockExecution, summarizeAlerts } = require('./alerts');

class ShieldSkill {
  constructor(config = {}) {
    this.config = {
      whitelist_mode: config.whitelist_mode !== undefined ? config.whitelist_mode : true,
      sanitize_enabled: config.sanitize_enabled !== undefined ? config.sanitize_enabled : true,
      memory_segmentation: config.memory_segmentation !== undefined ? config.memory_segmentation : true,
      alert_level: config.alert_level || 'warn',
      block_suspicious: config.block_suspicious !== undefined ? config.block_suspicious : false
    };
    
    this.auditLog = [];
    this.stats = {
      commandsChecked: 0,
      contentSanitized: 0,
      memoriesClassified: 0,
      alertsGenerated: 0
    };
  }
  
  evaluateCommand(command, source = 'user') {
    this.stats.commandsChecked++;
    
    const whitelistResult = checkCommand(command);
    if (!whitelistResult.safe) {
      const alert = generateAlert('block', whitelistResult.reason, { command, source });
      this.logAlert(alert);
      return { allowed: false, alert: formatAlertForHuman(alert) };
    }
    
    const injectionCheck = this.detectInjectionPatterns(command);
    if (injectionCheck.detected) {
      const alert = generateAlert('block', 'Injection pattern detected', injectionCheck);
      this.logAlert(alert);
      return { allowed: false, alert: formatAlertForHuman(alert) };
    }
    
    if (this.config.sanitize_enabled) {
      const sanitized = sanitizeExternalInput(command, source);
      if (sanitized.warnings.length > 0) {
        const alert = generateAlert('warn', 'Warnings detected in command', sanitized.warnings);
        this.logAlert(alert);
      }
    }
    
    return { allowed: true };
  }
  
  sanitizeContent(content, source = 'unknown') {
    this.stats.contentSanitized++;
    if (!this.config.sanitize_enabled) return content;
    const result = sanitizeExternalInput(content, source);
    if (result.warnings.length > 0) {
      const alert = generateAlert('warn', `External content from ${source} sanitized`, result.warnings);
      this.logAlert(alert);
    }
    return result.sanitized;
  }
  
  classifyMemory(memory, source = 'unknown') {
    this.stats.memoriesClassified++;
    if (!this.config.memory_segmentation) return memory;
    return segmentMemory(memory, getTrustLevel(source));
  }
  
  verifyMemory(memoryRecord) {
    const injectionCheck = this.detectInjectionPatterns(memoryRecord.content || memoryRecord);
    if (injectionCheck.detected) {
      const alert = generateAlert('critical', 'Injection pattern found in memory!', injectionCheck);
      this.logAlert(alert);
      return { safe: false, alert };
    }
    return { safe: true };
  }
  
  detectInjectionPatterns(text) {
    const patterns = [
      { name: 'ignore_instructions', regex: /ignore\s*(all)?\s*(previous)?\s*(instructions)?/i },
      { name: 'disregard_instructions', regex: /disregard\s*(all)?\s*(previous)?\s*(instructions)?/i },
      { name: 'subprocess', regex: /\$\([^)]+\)/ },
      { name: 'backtick', regex: /`[^`]+`/ },
      { name: 'block_read', regex: /\bread\b.*\|\|.*\b(cat|head|tail)\b/i },
      { name: 'command_injection', regex: /;\s*(rm|curl|wget|ssh)/i }
    ];
    
    const detected = [];
    for (const pattern of patterns) {
      if (pattern.regex.test(text)) {
        detected.push(pattern.name);
      }
    }
    
    return { detected, clean: detected.length === 0 };
  }
  
  logAlert(alert) {
    this.stats.alertsGenerated++;
    this.auditLog.push(alert);
    if (this.auditLog.length > 100) {
      this.auditLog = this.auditLog.slice(-100);
    }
  }
  
  getAuditLog() {
    return this.auditLog;
  }
  
  getStats() {
    return {
      ...this.stats,
      auditLogSize: this.auditLog.length,
      config: this.config,
      alertSummary: summarizeAlerts(this.auditLog)
    };
  }
}

module.exports = ShieldSkill;

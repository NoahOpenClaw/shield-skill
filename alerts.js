const ALERT_LEVELS = {
  'info': 'Informational - no action needed',
  'warn': 'Warning - proceed with caution',
  'block': 'Block - do not proceed',
  'critical': 'Critical - halt and alert human'
};

function generateAlert(level, message, context = {}) {
  if (!ALERT_LEVELS[level]) {
    level = 'warn';
  }
  
  const alert = {
    id: generateAlertId(),
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
    requiresAction: level === 'block' || level === 'critical'
  };
  
  const indicator = {
    'info': 'ℹ️',
    'warn': '⚠️',
    'block': '🛑',
    'critical': '🚨'
  }[level];
  
  console.log(`[SHIELD ${level.toUpperCase()}] ${indicator} ${message}`);
  
  return alert;
}

function generateAlertId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `shield-${timestamp}-${random}`;
}

function formatAlertForHuman(alert) {
  const levelIcons = {
    'info': 'ℹ️',
    'warn': '⚠️',
    'block': '🛑',
    'critical': '🚨'
  };
  
  const border = '═'.repeat(40);
  
  return `
╔${border}╗
║        🛡️  SHIELD ALERT        ║
╠${border}╣
║ Level: ${(alert.level.toUpperCase() + ' ').padEnd(35)}║
║ Time: ${(alert.timestamp + ' ').padEnd(35)}║
╠${border}╣
║ ${(alert.message + ' ').padEnd(38)}║
╚${border}╝
`.trim();
}

function shouldBlockExecution(alerts) {
  return alerts.some(a => a.level === 'block' || a.level === 'critical');
}

function summarizeAlerts(alerts) {
  const summary = {
    total: alerts.length,
    byLevel: {},
    critical: [],
    blocked: []
  };
  
  for (const alert of alerts) {
    summary.byLevel[alert.level] = (summary.byLevel[alert.level] || 0) + 1;
    
    if (alert.level === 'critical') {
      summary.critical.push(alert);
    }
    if (alert.level === 'block') {
      summary.blocked.push(alert);
    }
  }
  
  return summary;
}

module.exports = { generateAlert, formatAlertForHuman, shouldBlockExecution, summarizeAlerts, ALERT_LEVELS };

const { db } = require('../config/db');

// GET /api/audit-logs
const getAuditLogs = async (req, res) => {
  try {
    const user = req.user;
    const allLogs = Array.from(db.auditLogs);

    // Sort by timestamp descending
    const sortedLogs = allLogs
      .sort((a, b) => new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0))
      .slice(0, 100);

    res.json({
      success: true,
      data: sortedLogs,
      logs: sortedLogs
    });
  } catch (err) {
    console.error('Audit logs error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve audit logs' });
  }
};

module.exports = {
  getAuditLogs
};

const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// GET /api/audit-logs
router.get('/', auditController.getAuditLogs);

module.exports = router;

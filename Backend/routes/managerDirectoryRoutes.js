const express = require('express');
const router = express.Router();
const managerDirectoryController = require('../controllers/managerDirectoryController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// GET /api/managers - List lower level managers or all scoped managers
router.get('/', managerDirectoryController.getLowerLevelManagers);

// GET /api/managers/:id - Get manager details
router.get('/:id', managerDirectoryController.getManagerById);

// POST /api/managers/:id/approve - Approve manager registration
router.post('/:id/approve', managerDirectoryController.approveManager);

// POST /api/managers/:id/reject - Reject manager registration
router.post('/:id/reject', managerDirectoryController.rejectManager);

module.exports = router;

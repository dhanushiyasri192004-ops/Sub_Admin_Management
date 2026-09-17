const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const authMiddleware = require('../middleware/authMiddleware');
const { blockManagersFromAdminEndpoints } = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Location read endpoints
router.get('/states', locationController.getStates);
router.get('/districts', locationController.getDistricts);
router.get('/divisions', locationController.getDivisions);
router.get('/pincodes', locationController.getPincodes);

// Mutating location routes blocked for field managers
router.post('/states', blockManagersFromAdminEndpoints);
router.post('/districts', blockManagersFromAdminEndpoints);
router.post('/divisions', blockManagersFromAdminEndpoints);
router.post('/pincodes', blockManagersFromAdminEndpoints);

module.exports = router;

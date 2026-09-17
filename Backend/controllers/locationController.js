const { db } = require('../config/db');

// GET /api/states - Filtered by caller's scope
const getStates = async (req, res) => {
  try {
    const user = req.user;
    let states = [];

    if (user?.stateId) {
      const state = await db.states.findById(user.stateId);
      if (state) states = [state];
    } else if (user?.state) {
      const state = await db.states.findOne({ name: user.state });
      if (state) states = [state];
      else states = await db.states.find();
    } else {
      states = await db.states.find();
    }

    res.json({ success: true, data: states, states });
  } catch (err) {
    console.error('Get states error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve states' });
  }
};

// GET /api/districts - Scoped to state / district
const getDistricts = async (req, res) => {
  try {
    const user = req.user;
    const { stateId } = req.query;

    const queryStateId = stateId || user?.stateId;
    let districts = [];

    if (queryStateId) {
      districts = await db.districts.find({ stateId: queryStateId });
    } else if (user?.state) {
      const state = await db.states.findOne({ name: user.state });
      if (state) {
        districts = await db.districts.find({ stateId: state._id });
      } else {
        districts = await db.districts.find();
      }
    } else {
      districts = await db.districts.find();
    }

    if (user?.districtId) {
      districts = districts.filter(d => d._id === user.districtId);
    } else if (user?.district) {
      districts = districts.filter(d => d.name === user.district);
    }

    res.json({ success: true, data: districts, districts });
  } catch (err) {
    console.error('Get districts error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve districts' });
  }
};

// GET /api/divisions - Scoped to district / division
const getDivisions = async (req, res) => {
  try {
    const user = req.user;
    const { districtId, stateId } = req.query;

    const queryDistrictId = districtId || user?.districtId;

    let divisions = [];
    if (queryDistrictId) {
      divisions = await db.divisions.find({ districtId: queryDistrictId });
    } else if (stateId || user?.stateId) {
      divisions = await db.divisions.find({ stateId: stateId || user?.stateId });
    } else {
      divisions = await db.divisions.find();
    }

    if (user?.divisionId) {
      divisions = divisions.filter(d => d._id === user.divisionId);
    }

    res.json({ success: true, data: divisions, divisions });
  } catch (err) {
    console.error('Get divisions error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve divisions' });
  }
};

// GET /api/pincodes - Scoped to division / pincode
const getPincodes = async (req, res) => {
  try {
    const user = req.user;
    const { divisionId, districtId, stateId } = req.query;

    const queryDivId = divisionId || user?.divisionId;

    let pincodes = [];
    if (queryDivId) {
      pincodes = await db.pincodes.find({ divisionId: queryDivId });
    } else if (districtId || user?.districtId) {
      pincodes = await db.pincodes.find({ districtId: districtId || user?.districtId });
    } else if (stateId || user?.stateId) {
      pincodes = await db.pincodes.find({ stateId: stateId || user?.stateId });
    } else {
      pincodes = await db.pincodes.find();
    }

    if (user?.pincodeId) {
      pincodes = pincodes.filter(p => p._id === user.pincodeId);
    } else if (user?.pincode) {
      pincodes = pincodes.filter(p => p.code === user.pincode);
    }

    res.json({ success: true, data: pincodes, pincodes });
  } catch (err) {
    console.error('Get pincodes error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve pincodes' });
  }
};

module.exports = {
  getStates,
  getDistricts,
  getDivisions,
  getPincodes
};

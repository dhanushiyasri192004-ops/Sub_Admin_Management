const { db, filterByLocation } = require('../config/db');

function getHierarchy(req, res) {
  try {
    const { role, state, district, division, pincode } = req.user;
    let fullHierarchy = db.hierarchy.states;

    // Filter hierarchy according to role scope
    if (role === 'State Admin') {
      fullHierarchy = fullHierarchy.filter(s => s.name === state);
    } else if (role === 'District Admin') {
      fullHierarchy = fullHierarchy
        .filter(s => s.name === state)
        .map(s => ({
          ...s,
          districts: s.districts.filter(d => d.name === district)
        }));
    } else if (role === 'Divisional Admin') {
      fullHierarchy = fullHierarchy
        .filter(s => s.name === state)
        .map(s => ({
          ...s,
          districts: s.districts
            .filter(d => d.name === district)
            .map(d => ({
              ...d,
              divisions: d.divisions.filter(div => div.name === division)
            }))
        }));
    } else if (role === 'Pincode Admin') {
      fullHierarchy = fullHierarchy
        .filter(s => s.name === state)
        .map(s => ({
          ...s,
          districts: s.districts
            .filter(d => d.name === district)
            .map(d => ({
              ...d,
              divisions: d.divisions
                .filter(div => div.name === division)
                .map(div => ({
                  ...div,
                  pincodes: div.pincodes.filter(pin => pin === pincode)
                }))
            }))
        }));
    }

    return res.json({ success: true, hierarchy: fullHierarchy });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch hierarchy', error: error.message });
  }
}

function getSubordinateAdmins(req, res) {
  try {
    const { role } = req.user;
    const scopedAdmins = filterByLocation(db.admins, req.user);
    return res.json({ success: true, admins: scopedAdmins });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch admins', error: error.message });
  }
}

function getDistricts(req, res) {
  try {
    const stateObj = db.hierarchy.states.find(s => s.name === req.user.state);
    if (!stateObj) return res.json({ success: true, districts: [] });

    let districts = stateObj.districts;
    if (req.user.role === 'District Admin' || req.user.role === 'Divisional Admin' || req.user.role === 'Pincode Admin') {
      districts = districts.filter(d => d.name === req.user.district);
    }

    const enrichedDistricts = districts.map(d => {
      const assigned = db.admins.find(a => a.district === d.name && (a.role === 'District Admin' || a.role.includes('District')));
      const adminName = assigned ? assigned.name.replace(/\s*\(.*?\)\s*/g, '').trim() : 'Unassigned';
      const adminEmail = assigned ? assigned.email : '-';
      const status = d.status || 'Active';

      return {
        ...d,
        adminName,
        adminEmail,
        status
      };
    });

    return res.json({ success: true, districts: enrichedDistricts });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch districts', error: error.message });
  }
}

function updateDistrictStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    let updated = null;

    db.hierarchy.states.forEach(s => {
      s.districts.forEach(d => {
        if (d.id === id || d.name === id || d.code === id) {
          d.status = status;
          updated = d;
        }
      });
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'District not found' });
    }

    return res.json({ success: true, message: `District status updated to ${status}`, district: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update district status', error: error.message });
  }
}

function updateDivisionStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    let updated = null;

    db.hierarchy.states.forEach(s => {
      s.districts.forEach(d => {
        d.divisions?.forEach(div => {
          if (div.id === id || div.name === id) {
            div.status = status;
            updated = div;
          }
        });
      });
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Division not found' });
    }

    return res.json({ success: true, message: `Division status updated to ${status}`, division: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update division status', error: error.message });
  }
}

function getDivisions(req, res) {
  try {
    const stateObj = db.hierarchy.states.find(s => s.name === req.user.state);
    if (!stateObj) return res.json({ success: true, divisions: [] });

    let divisions = [];
    stateObj.districts.forEach(d => {
      if (!req.user.district || d.name === req.user.district) {
        d.divisions.forEach(div => {
          if (!req.user.division || div.name === req.user.division) {
            const assigned = db.admins.find(a => a.division === div.name && (a.role === 'Divisional Admin' || a.role.includes('Divisional')));
            const adminName = assigned ? assigned.name.replace(/\s*\(.*?\)\s*/g, '').trim() : 'Unassigned';
            const adminEmail = assigned ? assigned.email : '-';
            const status = div.status || 'Active';

            divisions.push({
              ...div,
              districtName: d.name,
              stateName: stateObj.name,
              adminName,
              adminEmail,
              status
            });
          }
        });
      }
    });

    return res.json({ success: true, divisions });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch divisions', error: error.message });
  }
}

module.exports = {
  getHierarchy,
  getSubordinateAdmins,
  getDistricts,
  updateDistrictStatus,
  updateDivisionStatus,
  getDivisions
};


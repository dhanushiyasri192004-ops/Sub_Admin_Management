const { db } = require('../config/db');

const getScopeFilter = (user) => {
  const filter = {};
  if (!user) return filter;

  const role = (user.role || '').toLowerCase().replace(/_/g, ' ');

  if (role.includes('super admin') || role === 'admin') {
    return filter;
  }

  if (role.includes('state')) {
    if (user.stateId) {
      filter.stateId = user.stateId;
    } else if (user.regionId) {
      filter.regionId = user.regionId;
    }
  } else if (role.includes('district')) {
    if (user.districtId) filter.districtId = user.districtId;
  } else if (role.includes('division')) {
    if (user.divisionId) filter.divisionId = user.divisionId;
  } else if (role.includes('pincode')) {
    if (user.pincodeId) filter.pincodeId = user.pincodeId;
    else if (user.pincode) filter.pincode = user.pincode;
  }

  return filter;
};

// Check if a specific vendor falls within the user's scope
const isVendorInScope = (vendor, user) => {
  if (!vendor || !user) return false;

  const role = (user.role || '').toLowerCase().replace(/_/g, ' ');
  if (role.includes('super admin') || role === 'admin') return true;

  if (role.includes('state')) {
    if (user.stateId && vendor.stateId === user.stateId) return true;
    if (user.state && vendor.state === user.state) return true;
    if (user.regionId && (vendor.regionId === user.regionId || vendor.stateId === user.regionId)) return true;
    return false;
  }

  if (role.includes('district')) {
    if (user.districtId && vendor.districtId === user.districtId) return true;
    if (user.district && vendor.district === user.district) return true;
    return false;
  }

  if (role.includes('division')) {
    if (user.divisionId && vendor.divisionId === user.divisionId) return true;
    if (user.division && vendor.division === user.division) return true;
    return false;
  }

  if (role.includes('pincode')) {
    if (user.pincodeId && vendor.pincodeId === user.pincodeId) return true;
    if (user.pincode && (vendor.pincode === user.pincode || vendor.pincodeCode === user.pincode)) return true;
    return false;
  }

  return false;
};

// Middleware: Verifies that the requested vendor ID is strictly within the caller's scope
const verifyVendorScope = async (req, res, next) => {
  try {
    const vendorId = req.params.id;
    if (!vendorId) {
      return res.status(400).json({ success: false, message: 'Vendor ID is required' });
    }

    const vendor = await db.vendors.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    if (!isVendorInScope(vendor, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You do not have permission to view or manage vendors outside your assigned scope.'
      });
    }

    req.targetVendor = vendor;
    next();
  } catch (err) {
    console.error('Scope verification error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during scope verification' });
  }
};

// Middleware: Enforces and validates location assignment when creating or updating a vendor
const validateVendorCreationScope = async (req, res, next) => {
  try {
    const user = req.user;
    const body = req.body;
    const userRegion = user.regionId || user.stateId;
    const role = (user.role || '').toLowerCase().replace(/_/g, ' ');

    if (role.includes('pincode')) {
      body.regionId = userRegion;
      body.stateId = user.stateId;
      body.districtId = user.districtId;
      body.divisionId = user.divisionId;
      body.pincodeId = user.pincodeId;
    } else if (role.includes('division')) {
      body.regionId = userRegion;
      body.stateId = user.stateId;
      body.districtId = user.districtId;
      body.divisionId = user.divisionId;

      if (!body.pincodeId) {
        return res.status(400).json({ success: false, message: 'Pincode is required' });
      }
      const pincode = await db.pincodes.findById(body.pincodeId);
      if (user.divisionId && pincode && pincode.divisionId !== user.divisionId) {
        return res.status(403).json({
          success: false,
          message: 'Selected pincode does not belong to your assigned division.'
        });
      }
    } else if (role.includes('district')) {
      body.regionId = userRegion;
      body.stateId = user.stateId;
      body.districtId = user.districtId;

      if (!body.divisionId || !body.pincodeId) {
        return res.status(400).json({ success: false, message: 'Division and Pincode are required' });
      }
      const division = await db.divisions.findById(body.divisionId);
      if (user.districtId && division && division.districtId !== user.districtId) {
        return res.status(403).json({
          success: false,
          message: 'Selected division does not belong to your assigned district.'
        });
      }
    } else if (role.includes('state')) {
      body.regionId = userRegion;
      body.stateId = user.stateId || userRegion;
    }

    next();
  } catch (err) {
    console.error('Vendor creation scope validation error:', err);
    return res.status(500).json({ success: false, message: 'Scope validation failed' });
  }
};

module.exports = {
  getScopeFilter,
  isVendorInScope,
  verifyVendorScope,
  validateVendorCreationScope
};

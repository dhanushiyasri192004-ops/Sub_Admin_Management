const ALLOWED_MANAGER_ROLES = [
  'state_manager',
  'district_manager',
  'division_manager',
  'pincode_manager'
];

const ALLOWED_ADMIN_ROLES = [
  'State Admin',
  'District Admin',
  'Divisional Admin',
  'Pincode Admin',
  'Super Admin'
];

const checkRole = (allowedRoles = [...ALLOWED_MANAGER_ROLES, ...ALLOWED_ADMIN_ROLES]) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User role not established.' });
    }

    // Normalize roles for comparison
    const normalizedUserRole = req.user.role.toLowerCase().replace(/_/g, ' ');
    const isAllowed = allowedRoles.some(role => {
      const normalizedAllowed = role.toLowerCase().replace(/_/g, ' ');
      return normalizedAllowed === normalizedUserRole || req.user.role === role;
    });

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized for this action.`
      });
    }

    next();
  };
};

const blockManagersFromAdminEndpoints = (req, res, next) => {
  const role = (req.user?.role || '').toLowerCase();
  if (role.includes('manager') && !role.includes('admin')) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Admin operations are out of scope for field managers.'
    });
  }
  next();
};

module.exports = {
  ALLOWED_MANAGER_ROLES,
  ALLOWED_ADMIN_ROLES,
  checkRole,
  blockManagersFromAdminEndpoints
};

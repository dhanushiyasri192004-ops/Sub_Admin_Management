const { db } = require('../config/db');

// Format human-readable role labels
const formatRoleTitle = (role) => {
  switch (role) {
    case 'state_manager': return 'State Agent Manager (Level 1)';
    case 'district_manager': return 'District Agent Manager (Level 2)';
    case 'division_manager': return 'Division Agent Manager (Level 3)';
    case 'pincode_manager': return 'Pincode Agent Manager (Level 4)';
    case 'State Admin': return 'State Administrator';
    case 'District Admin': return 'District Administrator';
    case 'Divisional Admin': return 'Divisional Administrator';
    case 'Pincode Admin': return 'Pincode Administrator';
    default: return role;
  }
};

// Check if an Administrator has jurisdiction to manage / approve a Field Manager
const canAdminManage = (admin, manager) => {
  const adminRole = (admin.role || '').toLowerCase().replace(/_/g, ' ');
  // Super Admin can manage anyone
  if (adminRole === 'super admin' || adminRole === 'admin') return true;

  const managerRoles = ['state_manager', 'district_manager', 'division_manager', 'pincode_manager'];
  if (!managerRoles.includes(manager.role)) return false;

  // State Admin: apex administrator overseeing all state managers and regional networks
  if (adminRole.includes('state')) {
    if (manager.role === 'state_manager') return true;
    if (admin.stateId && manager.stateId && admin.stateId === manager.stateId) return true;
    if (admin.state && manager.state && admin.state.toLowerCase() === manager.state.toLowerCase()) return true;
    if (adminRole === 'state admin') return true;
    return false;
  }

  // District Admin: manages district_manager, division_manager, pincode_manager in their district
  if (adminRole.includes('district')) {
    if (manager.role === 'state_manager') return false; // District Admin cannot oversee State Manager
    if (admin.districtId && manager.districtId && admin.districtId === manager.districtId) return true;
    if (admin.district && manager.district && admin.district.toLowerCase() === manager.district.toLowerCase()) return true;
    if ((admin.district === 'Salem' || admin.districtId === 'dist_salem') && (manager.districtId === 'dist_salem' || manager.district === 'Salem')) return true;
    return false;
  }

  // Divisional Admin: manages division_manager, pincode_manager in their division
  if (adminRole.includes('division') || adminRole.includes('divisional')) {
    if (manager.role === 'state_manager' || manager.role === 'district_manager') return false;
    if (admin.divisionId && manager.divisionId && admin.divisionId === manager.divisionId) return true;
    if (admin.division && manager.division && admin.division.toLowerCase() === manager.division.toLowerCase()) return true;
    if ((admin.division === 'Salem North' || admin.divisionId === 'div_dist_salem_urban') && (manager.divisionId === 'div_dist_salem_urban' || manager.division === 'Salem North')) return true;
    return false;
  }

  // Pincode Admin: manages pincode_manager in their assigned pincode
  if (adminRole.includes('pincode')) {
    if (manager.role !== 'pincode_manager') return false;
    if (admin.pincodeId && manager.pincodeId && admin.pincodeId === manager.pincodeId) return true;
    if (admin.pincode && manager.pincode && String(admin.pincode) === String(manager.pincode)) return true;
    if (admin.pincode && (manager.pincodeId === `pin_${admin.pincode}` || manager.pincode === String(admin.pincode))) return true;
    return false;
  }

  return false;
};

const populateManager = async (m, relation, user) => {
  const [state, district, division, pincode] = await Promise.all([
    m.stateId ? db.states.findById(m.stateId) : null,
    m.districtId ? db.districts.findById(m.districtId) : null,
    m.divisionId ? db.divisions.findById(m.divisionId) : null,
    m.pincodeId ? db.pincodes.findById(m.pincodeId) : null
  ]);

  const isSelf = String(m._id || m.id) === String(user?.id || user?._id);
  const status = m.status || 'active';
  const adminApprovalStatus = m.adminApprovalStatus || (status === 'active' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending');

  const resolvedState = state?.name || m.state || null;
  const resolvedDistrict = district?.name || m.district || null;
  const resolvedDivision = division?.name || m.division || null;
  const resolvedPincode = pincode?.code || m.pincode || null;

  return {
    id: m._id || m.id,
    _id: m._id || m.id,
    name: m.name,
    email: m.email,
    mobile: m.mobile || m.phone,
    phone: m.phone || m.mobile,
    role: m.role,
    roleTitle: formatRoleTitle(m.role),
    level: m.level,
    status,
    adminApprovalStatus,
    kycStatus: m.kycStatus || (status === 'active' ? 'Verified' : 'pending_verification'),
    rejectionReason: m.rejectionReason || null,
    adminApprovedBy: m.adminApprovedBy || null,
    adminApprovedAt: m.adminApprovedAt || null,
    adminRejectedBy: m.adminRejectedBy || null,
    adminRejectedAt: m.adminRejectedAt || null,
    dob: m.dob || null,
    gender: m.gender || null,
    address: m.address || null,
    documents: m.documents || {},
    avatar: m.avatar || m.avatarUrl || null,
    avatarUrl: m.avatarUrl || m.avatar || null,
    declarationAccepted: !!m.declarationAccepted,
    relation, // 'peer' or 'subordinate'
    relationLabel: isSelf ? 'You (Current User)' : (relation === 'peer' ? 'Equal Level (Peer)' : 'Under Your Scope (Subordinate)'),
    isSelf,
    stateId: m.stateId,
    stateName: resolvedState,
    districtId: m.districtId,
    districtName: resolvedDistrict,
    divisionId: m.divisionId,
    divisionName: resolvedDivision,
    pincodeId: m.pincodeId,
    pincodeCode: resolvedPincode,
    pincodeArea: pincode?.areaName || null,
    jurisdiction: resolvedPincode 
      ? `PIN: ${resolvedPincode}` 
      : resolvedDivision 
      ? `${resolvedDivision} Division` 
      : resolvedDistrict 
      ? `${resolvedDistrict} District` 
      : resolvedState || 'Tamil Nadu',
    assignedArea: [
      pincode?.areaName, 
      resolvedDivision, 
      resolvedDistrict, 
      resolvedState
    ].filter(Boolean).join(', '),
    createdAt: m.createdAt || null,
    joinedDate: m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently Joined'
  };
};

// GET /api/managers - Retrieve managers directory with role-based filtering and status filtering
const getLowerLevelManagers = async (req, res) => {
  try {
    const user = req.user;
    const allUsers = Array.from(db.users);
    const currentUserId = String(user.id || user._id);
    const rawRole = user.role || '';
    const roleLower = rawRole.toLowerCase().replace(/_/g, ' ');

    let rawPeers = [];
    let rawSubordinates = [];

    if (roleLower.includes('admin')) {
      // Caller is an Administrator: view all managers subordinate to this Admin
      rawSubordinates = allUsers.filter(u => canAdminManage(user, u));
    } else {
      // Caller is a Field Manager
      let peerRoleFilter = user.role;
      let subordinateRoleFilter = [];
      let peerLocationFilter = {};
      let subordinateLocationFilter = {};

      if (user.role === 'state_manager') {
        peerLocationFilter = { stateId: user.stateId };
        subordinateRoleFilter = ['district_manager', 'division_manager', 'pincode_manager'];
        subordinateLocationFilter = { stateId: user.stateId };
      } else if (user.role === 'district_manager') {
        peerLocationFilter = { districtId: user.districtId };
        subordinateRoleFilter = ['division_manager', 'pincode_manager'];
        subordinateLocationFilter = { districtId: user.districtId };
      } else if (user.role === 'division_manager') {
        peerLocationFilter = { divisionId: user.divisionId };
        subordinateRoleFilter = ['pincode_manager'];
        subordinateLocationFilter = { divisionId: user.divisionId };
      } else if (user.role === 'pincode_manager') {
        peerLocationFilter = { pincodeId: user.pincodeId };
        subordinateRoleFilter = [];
        subordinateLocationFilter = {};
      }

      // Filter peers
      rawPeers = allUsers.filter(u => {
        if (String(u._id || u.id) === currentUserId) return false;
        if (u.role !== peerRoleFilter) return false;
        if (peerLocationFilter.stateId && u.stateId !== peerLocationFilter.stateId) return false;
        if (peerLocationFilter.districtId && u.districtId !== peerLocationFilter.districtId) return false;
        if (peerLocationFilter.divisionId && u.divisionId !== peerLocationFilter.divisionId) return false;
        if (peerLocationFilter.pincodeId && u.pincodeId !== peerLocationFilter.pincodeId) return false;
        return true;
      });

      // Filter subordinates
      rawSubordinates = subordinateRoleFilter.length > 0 ? allUsers.filter(u => {
        if (String(u._id || u.id) === currentUserId) return false;
        if (!subordinateRoleFilter.includes(u.role)) return false;
        if (subordinateLocationFilter.stateId && u.stateId !== subordinateLocationFilter.stateId) return false;
        if (subordinateLocationFilter.districtId && u.districtId !== subordinateLocationFilter.districtId) return false;
        if (subordinateLocationFilter.divisionId && u.divisionId !== subordinateLocationFilter.divisionId) return false;
        return true;
      }) : [];
    }

    // Optional query parameter filtering: level
    const { level, status, search } = req.query;
    if (level) {
      const levelMap = {
        'state': 'state_manager',
        'district': 'district_manager',
        'divisional': 'division_manager',
        'pincode': 'pincode_manager',
        '1': 'state_manager',
        '2': 'district_manager',
        '3': 'division_manager',
        '4': 'pincode_manager'
      };
      const targetRole = levelMap[level.toLowerCase()] || level;
      rawSubordinates = rawSubordinates.filter(m => m.role === targetRole || String(m.level) === String(level));
      rawPeers = rawPeers.filter(m => m.role === targetRole || String(m.level) === String(level));
    }

    // Optional query parameter filtering: status (active, under_review, pending, rejected)
    if (status) {
      const statusLower = status.toLowerCase();
      rawSubordinates = rawSubordinates.filter(m => {
        const s = (m.status || 'active').toLowerCase();
        if (statusLower === 'pending' || statusLower === 'under_review') {
          return s === 'under_review' || s === 'pending';
        }
        return s === statusLower;
      });
      rawPeers = rawPeers.filter(m => (m.status || 'active').toLowerCase() === statusLower);
    }

    // Optional search filter
    if (search) {
      const term = search.toLowerCase();
      const filterMatch = (m) => (
        (m.name && m.name.toLowerCase().includes(term)) ||
        (m.email && m.email.toLowerCase().includes(term)) ||
        (m.phone && m.phone.includes(term)) ||
        (m.mobile && m.mobile.includes(term)) ||
        (m.state && m.state.toLowerCase().includes(term)) ||
        (m.district && m.district.toLowerCase().includes(term)) ||
        (m.division && m.division.toLowerCase().includes(term)) ||
        (m.pincode && String(m.pincode).includes(term))
      );
      rawSubordinates = rawSubordinates.filter(filterMatch);
      rawPeers = rawPeers.filter(filterMatch);
    }

    const peers = await Promise.all(rawPeers.map(m => populateManager(m, 'peer', user)));
    const subordinates = await Promise.all(rawSubordinates.map(m => populateManager(m, 'subordinate', user)));
    const all = roleLower.includes('admin') ? subordinates : [...peers, ...subordinates];

    const pendingCount = subordinates.filter(m => m.status === 'under_review' || m.status === 'pending').length;
    const activeCount = subordinates.filter(m => m.status === 'active').length;

    res.json({
      success: true,
      count: all.length,
      data: subordinates,
      subordinates,
      peers,
      all,
      stats: {
        total: all.length,
        pendingApprovals: pendingCount,
        activeManagers: activeCount,
        peersCount: peers.length,
        subordinatesCount: subordinates.length,
        currentUserRole: user.role
      }
    });
  } catch (err) {
    console.error('Get manager directory error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve manager directory', error: err.message });
  }
};

// GET /api/managers/:id - Retrieve specific manager details
const getManagerById = async (req, res) => {
  try {
    const { id } = req.params;
    const allUsers = Array.from(db.users);
    const manager = allUsers.find(u => String(u._id || u.id) === String(id));

    if (!manager) {
      return res.status(404).json({ success: false, message: 'Manager not found' });
    }

    // Check jurisdiction if caller is admin
    const callerRole = (req.user.role || '').toLowerCase();
    if (callerRole.includes('admin') && !canAdminManage(req.user, manager)) {
      return res.status(403).json({ success: false, message: 'You do not have jurisdiction to view this manager.' });
    }

    const populated = await populateManager(manager, 'subordinate', req.user);
    res.json({ success: true, manager: populated });
  } catch (err) {
    console.error('Get manager by ID error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve manager details', error: err.message });
  }
};

// POST /api/managers/:id/approve - Approve manager registration and activate their account
const approveManager = async (req, res) => {
  try {
    const { id } = req.params;
    const allUsers = Array.from(db.users);
    const manager = allUsers.find(u => String(u._id || u.id) === String(id));

    if (!manager) {
      return res.status(404).json({ success: false, message: 'Manager not found' });
    }

    // Verify admin jurisdiction
    if (!canAdminManage(req.user, manager)) {
      return res.status(403).json({
        success: false,
        message: `You do not have administrative authority to approve ${manager.name} (${formatRoleTitle(manager.role)}) under your jurisdiction.`
      });
    }

    // Update status to active and approve KYC
    manager.status = 'active';
    manager.kycStatus = 'Verified';
    manager.adminApprovalStatus = 'approved';
    manager.adminApprovedBy = req.user.name || req.user.email;
    manager.adminApprovedById = req.user.id || req.user._id;
    manager.adminApprovedByRole = req.user.role;
    manager.adminApprovedAt = new Date().toISOString();
    manager.rejectionReason = null;
    manager.updatedAt = new Date().toISOString();

    await db.users.update(manager);

    // Audit log entry
    await db.auditLogs.insertOne({
      action: 'MANAGER_REGISTRATION_APPROVED',
      adminId: req.user.id || req.user._id,
      adminName: req.user.name,
      adminRole: req.user.role,
      targetUserId: manager._id || manager.id,
      targetUserName: manager.name,
      targetUserRole: manager.role,
      details: `${manager.role.replace('_', ' ')} "${manager.name}" was approved by ${req.user.role} "${req.user.name}". Account activated.`,
      ip: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString()
    });

    const populated = await populateManager(manager, 'subordinate', req.user);

    return res.json({
      success: true,
      message: `Registration for ${manager.name} (${formatRoleTitle(manager.role)}) approved successfully. Account is now active.`,
      manager: populated
    });
  } catch (err) {
    console.error('Approve manager error:', err);
    res.status(500).json({ success: false, message: 'Failed to approve manager', error: err.message });
  }
};

// POST /api/managers/:id/reject - Reject manager registration
const rejectManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const allUsers = Array.from(db.users);
    const manager = allUsers.find(u => String(u._id || u.id) === String(id));

    if (!manager) {
      return res.status(404).json({ success: false, message: 'Manager not found' });
    }

    // Verify admin jurisdiction
    if (!canAdminManage(req.user, manager)) {
      return res.status(403).json({
        success: false,
        message: `You do not have administrative authority to reject ${manager.name} (${formatRoleTitle(manager.role)}) under your jurisdiction.`
      });
    }

    const rejectionReason = (reason || '').trim() || 'Registration credentials or KYC documents did not meet the required criteria.';

    // Update status to rejected
    manager.status = 'rejected';
    manager.adminApprovalStatus = 'rejected';
    manager.rejectionReason = rejectionReason;
    manager.adminRejectedBy = req.user.name || req.user.email;
    manager.adminRejectedById = req.user.id || req.user._id;
    manager.adminRejectedByRole = req.user.role;
    manager.adminRejectedAt = new Date().toISOString();
    manager.updatedAt = new Date().toISOString();

    await db.users.update(manager);

    // Audit log entry
    await db.auditLogs.insertOne({
      action: 'MANAGER_REGISTRATION_REJECTED',
      adminId: req.user.id || req.user._id,
      adminName: req.user.name,
      adminRole: req.user.role,
      targetUserId: manager._id || manager.id,
      targetUserName: manager.name,
      targetUserRole: manager.role,
      details: `${manager.role.replace('_', ' ')} "${manager.name}" registration rejected by ${req.user.role} "${req.user.name}". Reason: ${rejectionReason}`,
      ip: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString()
    });

    const populated = await populateManager(manager, 'subordinate', req.user);

    return res.json({
      success: true,
      message: `Registration for ${manager.name} (${formatRoleTitle(manager.role)}) has been rejected.`,
      manager: populated
    });
  } catch (err) {
    console.error('Reject manager error:', err);
    res.status(500).json({ success: false, message: 'Failed to reject manager', error: err.message });
  }
};

module.exports = {
  getLowerLevelManagers,
  getManagerById,
  approveManager,
  rejectManager
};

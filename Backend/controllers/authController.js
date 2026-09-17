const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db } = require('../config/db');
const { generateToken, JWT_SECRET } = require('../utils/jwt');

const ROLE_LIMITS = {
  state_manager: 8,      // 8 managers per State
  district_manager: 2,   // 2 managers per District
  division_manager: 2,   // 2 managers per Division
  pincode_manager: 2     // 2 managers per PIN Code
};

const ROLE_LEVELS = {
  'State Admin': 1,
  'District Admin': 2,
  'Divisional Admin': 3,
  'Pincode Admin': 4,
  'Super Admin': 0,
  state_manager: 1,
  district_manager: 2,
  division_manager: 3,
  pincode_manager: 4
};

// Calculate occupancy for a location and role
const getOccupancy = async (role, { stateId, districtId, divisionId, pincodeId }) => {
  const users = await db.users.find();
  const occupiedUsers = users.filter(u => u.status === 'active' || u.status === 'under_review' || u.status === 'kyc_pending');
  const limit = ROLE_LIMITS[role] || 2;

  if (role === 'state_manager') {
    if (!stateId) return { count: 0, limit, isFull: false, remaining: limit };
    const matches = occupiedUsers.filter(u => u.role === 'state_manager' && u.stateId === stateId);
    return { count: matches.length, limit, isFull: matches.length >= limit, remaining: Math.max(0, limit - matches.length) };
  }

  if (role === 'district_manager') {
    if (!districtId) return { count: 0, limit, isFull: false, remaining: limit };
    const matches = occupiedUsers.filter(u => u.role === 'district_manager' && u.districtId === districtId);
    return { count: matches.length, limit, isFull: matches.length >= limit, remaining: Math.max(0, limit - matches.length) };
  }

  if (role === 'division_manager') {
    if (!divisionId) return { count: 0, limit, isFull: false, remaining: limit };
    const matches = occupiedUsers.filter(u => u.role === 'division_manager' && u.divisionId === divisionId);
    return { count: matches.length, limit, isFull: matches.length >= limit, remaining: Math.max(0, limit - matches.length) };
  }

  if (role === 'pincode_manager') {
    if (!pincodeId) return { count: 0, limit, isFull: false, remaining: limit };
    const matches = occupiedUsers.filter(u => u.role === 'pincode_manager' && u.pincodeId === pincodeId);
    return { count: matches.length, limit, isFull: matches.length >= limit, remaining: Math.max(0, limit - matches.length) };
  }

  return { count: 0, limit, isFull: false, remaining: limit };
};

// Helper: build normalized user profile matching both portals
const buildUserProfile = async (user) => {
  const [regionObj, state, district, division, pincode] = await Promise.all([
    (user.regionId || user.stateId) ? db.states.findById(user.regionId || user.stateId) : null,
    user.stateId ? db.states.findById(user.stateId) : null,
    user.districtId ? db.districts.findById(user.districtId) : null,
    user.divisionId ? db.divisions.findById(user.divisionId) : null,
    user.pincodeId ? db.pincodes.findById(user.pincodeId) : null
  ]);

  const stateName = user.state || state?.name || null;
  const districtName = user.district || district?.name || null;
  const divisionName = user.division || division?.name || null;
  const pincodeCode = user.pincode || pincode?.code || null;
  const avatar = user.avatar || user.avatarUrl || null;
  const mobile = user.mobile || user.phone || null;
  const phone = user.phone || user.mobile || null;
  const status = user.status || 'active';

  return {
    id: user._id || user.id,
    _id: user._id || user.id,
    name: user.name,
    email: user.email,
    mobile,
    phone,
    role: user.role,
    level: user.level || ROLE_LEVELS[user.role] || 1,
    status,
    adminApprovalStatus: user.adminApprovalStatus || (status === 'kyc_pending' ? 'approved' : 'pending'),
    kycStatus: user.kycStatus || (status === 'active' ? 'Verified' : 'pending_verification'),
    dob: user.dob || null,
    gender: user.gender || null,
    address: user.address || null,
    documents: user.documents || {},
    avatar,
    avatarUrl: avatar,
    state: stateName,
    district: districtName,
    division: divisionName,
    pincode: pincodeCode,
    stateId: user.stateId || (state ? state._id : null),
    districtId: user.districtId || (district ? district._id : null),
    divisionId: user.divisionId || (division ? division._id : null),
    pincodeId: user.pincodeId || (pincode ? pincode._id : null),
    regionId: user.regionId || user.stateId,
    scope: {
      regionId: user.regionId || user.stateId,
      regionName: regionObj?.name || stateName,
      stateId: user.stateId || (state ? state._id : null),
      stateName,
      districtId: user.districtId || (district ? district._id : null),
      districtName,
      divisionId: user.divisionId || (division ? division._id : null),
      divisionName,
      pincodeId: user.pincodeId || (pincode ? pincode._id : null),
      pincodeCode,
      pincodeArea: pincode?.areaName || null
    }
  };
};

// Universal Login: accepts email or mobile / identifier
const login = async (req, res) => {
  try {
    const { email, identifier, password } = req.body;
    const loginId = (identifier || email || '').trim();

    if (!loginId || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email or mobile number, and password.' });
    }

    const allUsers = Array.from(db.users);
    const user = allUsers.find(u => 
      (u.email && u.email.toLowerCase() === loginId.toLowerCase()) ||
      (u.mobile && u.mobile === loginId) ||
      (u.phone && u.phone.replace(/[^0-9]/g, '').slice(-10) === loginId.replace(/[^0-9]/g, '').slice(-10))
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        success: false,
        status: 'rejected',
        rejectionReason: user.rejectionReason || 'Application rejected by administrator.',
        message: `Your registration application was rejected by the administrator. Reason: ${user.rejectionReason || 'Documents or eligibility criteria not met.'}`
      });
    }

    const token = generateToken(user);
    const userProfile = await buildUserProfile(user);

    return res.json({
      success: true,
      message: `Welcome ${user.name}. Logged in successfully.`,
      token,
      user: userProfile
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Login failed', error: err.message });
  }
};

const getMe = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const allUsers = Array.from(db.users);
    const user = allUsers.find(u => String(u._id || u.id) === String(userId));

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const profile = await buildUserProfile(user);
    return res.json({ success: true, user: profile });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile', error: err.message });
  }
};

const getDemoAdmins = (req, res) => {
  const demoList = db.admins.map(a => ({
    id: a.id || a._id,
    name: a.name,
    email: a.email,
    role: a.role,
    state: a.state,
    district: a.district,
    division: a.division,
    pincode: a.pincode,
    avatar: a.avatar || a.avatarUrl
  }));
  return res.json({ success: true, admins: demoList });
};

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
      role,
      dob,
      gender,
      address,
      documents,
      declarationAccepted,
      stateId,
      zone,
      districtId,
      divisionId,
      pincodeId,
      avatarUrl
    } = req.body;

    if (!name || !email || !mobile || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields: Full Name, Email, Mobile, Password, and Role.' });
    }

    if (!['state_manager', 'district_manager', 'division_manager', 'pincode_manager'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid manager role selected.' });
    }

    if (role === 'state_manager' && !stateId) {
      return res.status(400).json({ success: false, message: 'State selection is required for State Manager.' });
    }
    if (role === 'district_manager' && (!stateId || !districtId)) {
      return res.status(400).json({ success: false, message: 'State and District selections are required for District Manager.' });
    }
    if (role === 'division_manager' && (!stateId || !districtId || !divisionId)) {
      return res.status(400).json({ success: false, message: 'State, District, and Division selections are required for Division Manager.' });
    }
    if (role === 'pincode_manager' && (!stateId || !districtId || !divisionId || !pincodeId)) {
      return res.status(400).json({ success: false, message: 'State, District, Division, and PIN Code selections are required for PIN Code Manager.' });
    }

    const existingEmail = await db.users.findOne({ email: email.trim().toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists. Please sign in or use another email.' });
    }

    const existingMobile = await db.users.findOne({ mobile: mobile.trim() });
    if (existingMobile) {
      return res.status(400).json({ success: false, message: 'An account with this mobile number already exists. Please sign in or use another mobile number.' });
    }

    const occupancy = await getOccupancy(role, { stateId, districtId, divisionId, pincodeId });
    if (occupancy.isFull) {
      return res.status(400).json({
        success: false,
        limitReached: true,
        message: `This place has reached its maximum manager capacity (${occupancy.count}/${occupancy.limit}). Registration not allowed for this location.`
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const level = ROLE_LEVELS[role] || 1;

    const [selectedState, selectedDistrict, selectedDivision, selectedPincode] = await Promise.all([
      stateId ? db.states.findById(stateId) : null,
      districtId ? db.districts.findById(districtId) : null,
      divisionId ? db.divisions.findById(divisionId) : null,
      pincodeId ? db.pincodes.findById(pincodeId) : null
    ]);

    const stateName = selectedState?.name || req.body.state || null;
    const districtName = selectedDistrict?.name || req.body.district || null;
    const divisionName = selectedDivision?.name || req.body.division || null;
    const pincodeCode = selectedPincode?.code || req.body.pincode || null;

    const newUser = await db.users.insertOne({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      phone: mobile.trim(),
      passwordHash,
      role,
      level,
      status: 'under_review',
      adminApprovalStatus: 'pending',
      dob: dob || null,
      gender: gender || null,
      address: address ? address.trim() : null,
      documents: documents || {},
      declarationAccepted: !!declarationAccepted,
      kycStatus: 'pending_verification',
      state: stateName,
      district: districtName,
      division: divisionName,
      pincode: pincodeCode,
      stateId: stateId || null,
      zone: zone || null,
      districtId: districtId || null,
      divisionId: divisionId || null,
      pincodeId: pincodeId || null,
      regionId: stateId || null,
      avatarUrl: avatarUrl || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await db.auditLogs.insertOne({
      action: 'MANAGER_REGISTERED_UNDER_REVIEW',
      userId: newUser._id,
      userName: newUser.name,
      userRole: newUser.role,
      details: `New ${role.replace('_', ' ')} registration submitted for approval with KYC documents. Status: under_review.`,
      ip: req.ip || '127.0.0.1'
    });

    const userProfile = await buildUserProfile(newUser);

    res.status(201).json({
      success: true,
      status: 'under_review',
      message: 'Manager registration submitted successfully. Your account is currently under review for administrator approval.',
      user: userProfile
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Internal server error during registration' });
  }
};

const checkCapacity = async (req, res) => {
  try {
    const { role, stateId, districtId, divisionId, pincodeId } = req.query;
    if (!role) {
      return res.status(400).json({ success: false, message: 'Role parameter is required.' });
    }

    const occupancy = await getOccupancy(role, { stateId, districtId, divisionId, pincodeId });
    res.json({
      success: true,
      role,
      limit: occupancy.limit,
      currentCount: occupancy.count,
      remaining: occupancy.remaining,
      isFull: occupancy.isFull,
      isAllowed: !occupancy.isFull
    });
  } catch (err) {
    console.error('Check capacity error:', err);
    res.status(500).json({ success: false, message: 'Failed to verify location capacity' });
  }
};

const simulateApproval = async (req, res) => {
  try {
    const { userId } = req.body;
    const targetId = userId || req.user?.id;

    if (!targetId) {
      return res.status(400).json({ success: false, message: 'User ID is required to simulate approval.' });
    }

    const user = await db.users.findById(targetId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await db.users.findByIdAndUpdate(user._id, { 
      status: 'kyc_pending',
      adminApprovalStatus: 'approved',
      adminApprovedAt: new Date().toISOString()
    });
    const updatedUser = await db.users.findById(user._id);

    await db.auditLogs.insertOne({
      action: 'ADMIN_APPROVAL_SIMULATED',
      userId: updatedUser._id,
      userName: updatedUser.name,
      userRole: updatedUser.role,
      details: `Regional administrator approved application for ${updatedUser.name} (${updatedUser.role}). Next requirement: KYC document verification.`,
      ip: req.ip || '127.0.0.1'
    });

    const profile = await buildUserProfile(updatedUser);
    res.json({
      success: true,
      status: 'kyc_pending',
      message: 'Admin approval granted! Application is now in KYC Pending status.',
      user: profile
    });
  } catch (err) {
    console.error('Simulate approval error:', err);
    res.status(500).json({ success: false, message: 'Failed to simulate approval' });
  }
};

const simulateKyc = async (req, res) => {
  try {
    const { userId } = req.body;
    const targetId = userId || req.user?.id;

    if (!targetId) {
      return res.status(400).json({ success: false, message: 'User ID is required to simulate KYC verification.' });
    }

    const user = await db.users.findById(targetId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await db.users.findByIdAndUpdate(user._id, {
      status: 'active',
      kycStatus: 'verified',
      kycVerifiedAt: new Date().toISOString()
    });
    const updatedUser = await db.users.findById(user._id);

    await db.auditLogs.insertOne({
      action: 'KYC_VERIFICATION_SIMULATED',
      userId: updatedUser._id,
      userName: updatedUser.name,
      userRole: updatedUser.role,
      details: `KYC verification completed for ${updatedUser.name}. Account status transitioned to active with full portal access.`,
      ip: req.ip || '127.0.0.1'
    });

    const profile = await buildUserProfile(updatedUser);
    res.json({
      success: true,
      status: 'active',
      message: 'KYC verified successfully! Your account is now active.',
      user: profile
    });
  } catch (err) {
    console.error('Simulate KYC error:', err);
    res.status(500).json({ success: false, message: 'Failed to simulate KYC' });
  }
};

const getRegistrationLocations = async (req, res) => {
  try {
    const states = await db.states.find();
    const districts = await db.districts.find();
    const divisions = await db.divisions.find();
    const pincodes = await db.pincodes.find();

    const users = await db.users.find();
    const activeOrPending = users.filter(u => u.status === 'active' || u.status === 'under_review' || u.status === 'kyc_pending');

    const enrichedStates = states.map(s => {
      const count = activeOrPending.filter(u => u.role === 'state_manager' && u.stateId === s._id).length;
      return { ...s, managerCount: count, limit: ROLE_LIMITS.state_manager, isFull: count >= ROLE_LIMITS.state_manager };
    });

    const enrichedDistricts = districts.map(d => {
      const count = activeOrPending.filter(u => u.role === 'district_manager' && u.districtId === d._id).length;
      return { ...d, managerCount: count, limit: ROLE_LIMITS.district_manager, isFull: count >= ROLE_LIMITS.district_manager };
    });

    const enrichedDivisions = divisions.map(v => {
      const count = activeOrPending.filter(u => u.role === 'division_manager' && u.divisionId === v._id).length;
      return { ...v, managerCount: count, limit: ROLE_LIMITS.division_manager, isFull: count >= ROLE_LIMITS.division_manager };
    });

    const enrichedPincodes = pincodes.map(p => {
      const count = activeOrPending.filter(u => u.role === 'pincode_manager' && u.pincodeId === p._id).length;
      return { ...p, managerCount: count, limit: ROLE_LIMITS.pincode_manager, isFull: count >= ROLE_LIMITS.pincode_manager };
    });

    res.json({
      success: true,
      states: enrichedStates,
      districts: enrichedDistricts,
      divisions: enrichedDivisions,
      pincodes: enrichedPincodes,
      roleLimits: ROLE_LIMITS
    });
  } catch (err) {
    console.error('Get registration locations error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve location data' });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      avatarUrl: fileUrl,
      file: {
        name: req.file.originalname,
        filename: req.file.filename,
        url: fileUrl,
        size: req.file.size
      }
    });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ success: false, message: 'Avatar upload failed' });
  }
};

const uploadDocument = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No document file uploaded.' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      message: 'Document uploaded successfully',
      file: {
        name: req.file.originalname,
        filename: req.file.filename,
        url: fileUrl,
        size: req.file.size,
        type: req.file.mimetype
      }
    });
  } catch (err) {
    console.error('Document upload error:', err);
    res.status(500).json({ success: false, message: 'Document upload failed' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const userId = req.user.id || req.user._id;
    const user = await db.users.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = bcrypt.compareSync(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    await db.users.findByIdAndUpdate(user._id, { passwordHash });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await db.users.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.json({
        success: true,
        message: 'If the email exists in our system, a password reset link has been dispatched.'
      });
    }

    const resetToken = crypto.randomBytes(24).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000).toISOString();

    await db.users.findByIdAndUpdate(user._id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires
    });

    res.json({
      success: true,
      message: 'Password reset link generated.',
      demoResetToken: resetToken
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Failed to process forgot password request' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await db.users.findOne({ resetPasswordToken: token });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    if (new Date(user.resetPasswordExpires) < new Date()) {
      return res.status(400).json({ success: false, message: 'Reset token has expired' });
    }

    const passwordHash = bcrypt.hashSync(newPassword, 10);
    await db.users.findByIdAndUpdate(user._id, {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    res.json({ success: true, message: 'Password reset successful. You may now log in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

module.exports = {
  login,
  getMe,
  getDemoAdmins,
  register,
  checkCapacity,
  simulateApproval,
  simulateKyc,
  getRegistrationLocations,
  uploadAvatar,
  uploadDocument,
  changePassword,
  forgotPassword,
  resetPassword,
  ROLE_LIMITS
};

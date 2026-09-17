/**
 * Frontend Pincode Directory & Hierarchy Resolver
 * Automatically identifies and displays the complete location hierarchy:
 * State -> District -> Division -> Pincode
 * And resolves the assigned Pincode Admin, Pincode Manager, and Pincode Agent.
 */

const defaultTeam = {
  pincodeAdmin: {
    id: '-',
    name: 'Unassigned',
    role: 'Pincode Admin',
    phone: '-',
    email: '-'
  },
  pincodeManager: {
    id: '-',
    name: 'Unassigned',
    role: 'Pincode Manager',
    phone: '-',
    email: '-'
  },
  pincodeAgent: {
    id: '-',
    name: 'Unassigned',
    role: 'Pincode Agent',
    phone: '-',
    email: '-'
  }
};

export const PINCODE_DIRECTORY = {
  '636001': {
    state: 'Tamil Nadu',
    district: 'Salem',
    division: 'Salem North',
    pincode: '636001',
    areaName: 'Salem Town Fort & Bazaar',
    ...defaultTeam
  },
  '636002': {
    state: 'Tamil Nadu',
    district: 'Salem',
    division: 'Salem North',
    pincode: '636002',
    areaName: 'Shevapet & Wholesale Grain Market',
    ...defaultTeam
  },
  '636007': {
    state: 'Tamil Nadu',
    district: 'Salem',
    division: 'Salem North',
    pincode: '636007',
    areaName: 'Alagapuram & Fairlands Zone',
    ...defaultTeam
  },
  '636003': {
    state: 'Tamil Nadu',
    district: 'Salem',
    division: 'Salem South',
    pincode: '636003',
    areaName: 'Ammapet Colony Hub',
    ...defaultTeam
  },
  '636004': {
    state: 'Tamil Nadu',
    district: 'Salem',
    division: 'Salem South',
    pincode: '636004',
    areaName: 'Gugai Industrial Yard',
    ...defaultTeam
  },
  '641001': {
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    division: 'Coimbatore Central',
    pincode: '641001',
    areaName: 'Town Hall & Big Bazaar',
    ...defaultTeam
  },
  '641002': {
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    division: 'Coimbatore Central',
    pincode: '641002',
    areaName: 'RS Puram & DB Road',
    ...defaultTeam
  }
};

export const AVAILABLE_PINCODES = Object.keys(PINCODE_DIRECTORY);

/**
 * Resolve any postal code string into location hierarchy + assigned team.
 */
export function resolvePincodeHierarchy(pincode) {
  const pin = String(pincode || '').trim();
  if (PINCODE_DIRECTORY[pin]) {
    return PINCODE_DIRECTORY[pin];
  }

  // Fallback heuristic for custom pincode
  let state = 'Tamil Nadu';
  let district = 'Salem';
  let division = 'Salem North';

  if (pin.startsWith('641')) {
    district = 'Coimbatore';
    division = 'Coimbatore Central';
  } else if (pin.startsWith('600')) {
    district = 'Chennai';
    division = 'Chennai Central';
  } else if (pin.startsWith('625')) {
    district = 'Madurai';
    division = 'Madurai Central';
  } else if (pin.startsWith('411')) {
    state = 'Maharashtra';
    district = 'Pune';
    division = 'Pune West';
  }

  return {
    state,
    district,
    division,
    pincode: pin || '-',
    areaName: `${division} Zone`,
    ...defaultTeam
  };
}

/**
 * Resolves which Admin, Manager, or Agent added / onboarded this vendor.
 */
export function resolveVendorAddedBy(vendor) {
  if (!vendor) {
    return {
      id: '-',
      name: 'Unassigned',
      role: '-',
      phone: '-',
      email: '-',
      addedAt: '-'
    };
  }

  // 1. Direct addedBy property on vendor object
  if (vendor.addedBy && vendor.addedBy.name) {
    return {
      id: vendor.addedBy.id || '-',
      name: vendor.addedBy.name,
      role: vendor.addedBy.role || '-',
      phone: vendor.addedBy.phone || '-',
      email: vendor.addedBy.email || '-',
      addedAt: vendor.addedBy.addedAt || (vendor.createdAt ? vendor.createdAt.split('T')[0] : '-')
    };
  }

  // 2. Fallback to assigned agent if any
  if (vendor.assignedAgent && vendor.assignedAgent.name) {
    return {
      id: vendor.assignedAgent.id || '-',
      name: vendor.assignedAgent.name,
      role: 'Pincode Agent',
      phone: vendor.assignedAgent.phone || '-',
      email: vendor.assignedAgent.email || '-',
      addedAt: vendor.createdAt ? vendor.createdAt.split('T')[0] : '-'
    };
  }

  // Default fallback
  return {
    id: '-',
    name: 'Unassigned',
    role: '-',
    phone: '-',
    email: '-',
    addedAt: vendor.createdAt ? vendor.createdAt.split('T')[0] : '-'
  };
}

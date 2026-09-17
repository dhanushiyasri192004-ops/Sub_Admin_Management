const bcrypt = require('bcryptjs');

// Pre-hashed password for "admin123"
const DEFAULT_HASH = bcrypt.hashSync('admin123', 10);

const hierarchy = {
  states: [
    {
      id: 'ST-TN',
      name: 'Tamil Nadu',
      code: 'TN',
      districts: [
        {
          id: 'DST-SALEM',
          name: 'Salem',
          code: 'SLM',
          divisions: [
            {
              id: 'DIV-SLM-N',
              name: 'Salem North',
              pincodes: ['636001', '636002']
            },
            {
              id: 'DIV-SLM-S',
              name: 'Salem South',
              pincodes: ['636003', '636004']
            }
          ]
        },
        {
          id: 'DST-CBE',
          name: 'Coimbatore',
          code: 'CBE',
          divisions: [
            {
              id: 'DIV-CBE-C',
              name: 'Coimbatore Central',
              pincodes: ['641001', '641002']
            },
            {
              id: 'DIV-CBE-N',
              name: 'Coimbatore North',
              pincodes: ['641003', '641004']
            }
          ]
        }
      ]
    }
  ]
};

// System Administrative Accounts for Role-Based Access
const admins = [
  {
    id: 'ADM-001',
    name: 'State Admin',
    email: 'state_admin@admin.com',
    passwordHash: DEFAULT_HASH,
    role: 'State Admin',
    state: 'Tamil Nadu',
    district: null,
    division: null,
    pincode: null,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    phone: '+91 98765 43210'
  },
  {
    id: 'ADM-002',
    name: 'District Admin',
    email: 'district_admin@admin.com',
    passwordHash: DEFAULT_HASH,
    role: 'District Admin',
    state: 'Tamil Nadu',
    district: 'Salem',
    division: null,
    pincode: null,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    phone: '+91 98765 43211'
  },
  {
    id: 'ADM-003',
    name: 'Divisional Admin',
    email: 'divisional_admin@admin.com',
    passwordHash: DEFAULT_HASH,
    role: 'Divisional Admin',
    state: 'Tamil Nadu',
    district: 'Salem',
    division: 'Salem North',
    pincode: null,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    phone: '+91 98765 43212'
  },
  {
    id: 'ADM-004',
    name: 'Pincode Admin (636001)',
    email: 'pincode_admin@admin.com',
    passwordHash: DEFAULT_HASH,
    role: 'Pincode Admin',
    state: 'Tamil Nadu',
    district: 'Salem',
    division: 'Salem North',
    pincode: '636001',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    phone: '+91 98765 43213'
  },
  {
    id: 'ADM-005',
    name: 'Pincode Admin (636002)',
    email: 'pincode_admin_636002@admin.com',
    passwordHash: DEFAULT_HASH,
    role: 'Pincode Admin',
    state: 'Tamil Nadu',
    district: 'Salem',
    division: 'Salem North',
    pincode: '636002',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    phone: '+91 98765 43214'
  }
];

// Clean Operational Stores (No mock/sample data)
const pincodeDetails = [];
const customers = [];
const vendors = [];
const vendorPayments = [];
const orders = [];
const bookings = [];
const jobs = [];
const technicians = [];
const executives = [];
const supportTeam = [];
const agents = [];
const agentPayments = [];
const agentActivities = [];
const kycRecords = [];
const qualityCheckRecords = [];

module.exports = {
  hierarchy,
  admins,
  pincodeDetails,
  customers,
  vendors,
  vendorPayments,
  orders,
  bookings,
  jobs,
  technicians,
  executives,
  supportTeam,
  agents,
  agentPayments,
  agentActivities,
  kycRecords,
  qualityCheckRecords
};

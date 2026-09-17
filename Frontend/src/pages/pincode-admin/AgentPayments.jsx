import React, { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { DataTable } from '../../components/DataTable';
import { StatusBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { IndianRupee, Plus, CheckCircle, Clock } from 'lucide-react';

export function PincodeAgentPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Request Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqAgentName, setReqAgentName] = useState('');
  const [reqAmount, setReqAmount] = useState('');
  const [reqDetails, setReqDetails] = useState('');
  const [reqNotes, setReqNotes] = useState('');

  // Process Modal
  const [activeItem, setActiveItem] = useState(null);
  const [actionType, setActionType] = useState('approve');
  const [notes, setNotes] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await dataService.getAgentPayments();
      if (res.success) setPayments(res.payments);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await dataService.requestAgentPayment({
        agentName: reqAgentName,
        amount: reqAmount,
        paymentDetails: reqDetails,
        notes: reqNotes
      });
      setShowRequestModal(false);
      setReqAgentName('');
      setReqAmount('');
      setReqDetails('');
      setReqNotes('');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to submit payment request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcess = async () => {
    if (!activeItem) return;
    setSubmitting(true);
    try {
      await dataService.processAgentPayment(activeItem.id, {
        action: actionType,
        transactionRef: txnRef,
        notes
      });
      setActiveItem(null);
      setNotes('');
      setTxnRef('');
      loadData();
    } catch (e) {
      alert(e.message || 'Payment processing failed');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Agent Details',
      accessor: 'agentName',
      render: (row) => (
        <div>
          <div className="font-bold text-white text-sm">{row.agentName}</div>
          <div className="text-[11px] text-slate-400 font-mono">Req ID: {row.id}</div>
          <div className="text-[11px] text-indigo-400 font-mono mt-0.5">{row.paymentDetails}</div>
        </div>
      )
    },
    {
      header: 'Commission Amount',
      accessor: 'amount',
      render: (row) => <span className="font-bold text-emerald-400 text-sm">₹{row.amount?.toLocaleString()}</span>
    },
    {
      header: 'Request Date',
      accessor: 'requestDate',
      render: (row) => <span className="text-xs text-slate-300 font-mono">{row.requestDate}</span>
    },
    {
      header: 'Status & Approval',
      accessor: 'status',
      render: (row) => (
        <div>
          <StatusBadge status={row.status} />
          {row.approvedBy && (
            <div className="text-[10px] text-slate-400 mt-1">
              By: {row.approvedBy} ({row.approvalDate})
            </div>
          )}
          {row.transactionRef && (
            <div className="text-[10px] font-mono text-indigo-300 mt-0.5">
              Ref: {row.transactionRef}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          {row.status === 'Pending' && (
            <button
              onClick={() => {
                setActiveItem(row);
                setActionType('approve');
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
            >
              Approve
            </button>
          )}
          {row.status === 'Approved' && (
            <button
              onClick={() => {
                setActiveItem(row);
                setActionType('pay');
              }}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
            >
              Disburse / Pay
            </button>
          )}
          {row.status === 'Paid' && <span className="text-xs text-slate-500 font-medium">Settled</span>}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Agent Commission Payments</h2>
          <p className="text-xs text-slate-400">Payment request & approval mechanism (Pending → Approved → Paid).</p>
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" />
          <span>New Payment Request</span>
        </button>
      </div>

      <DataTable
        title="Agent Payment Requests"
        subtitle="Restricted to assigned pincode agents"
        columns={columns}
        data={payments}
        loading={loading}
        onRefresh={loadData}
        searchPlaceholder="Search agent payment..."
        exportFileName="pincode_agent_payments.csv"
      />

      {/* New Request Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Create Agent Payment Request"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Agent Full Name</label>
            <input
              type="text"
              required
              value={reqAgentName}
              onChange={(e) => setReqAgentName(e.target.value)}
              placeholder="e.g. Enter agent name"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Requested Amount (₹)</label>
            <input
              type="number"
              required
              value={reqAmount}
              onChange={(e) => setReqAmount(e.target.value)}
              placeholder="e.g. 14500"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Channel / UPI ID</label>
            <input
              type="text"
              required
              value={reqDetails}
              onChange={(e) => setReqDetails(e.target.value)}
              placeholder="e.g. GPay UPI: 9894055101@okaxis"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Claim Notes & Period</label>
            <textarea
              rows="2"
              value={reqNotes}
              onChange={(e) => setReqNotes(e.target.value)}
              placeholder="e.g. Q1 Customer Membership Acquisition Commission"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowRequestModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Action Dialog Modal */}
      <Modal
        isOpen={!!activeItem}
        onClose={() => setActiveItem(null)}
        title={actionType === 'approve' ? 'Approve Agent Payment Request' : 'Mark Commission as Paid'}
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs text-slate-400">Payee Agent</div>
            <div className="font-bold text-white text-base">{activeItem?.agentName}</div>
            <div className="text-lg font-black text-emerald-400 mt-1">₹{activeItem?.amount?.toLocaleString()}</div>
          </div>

          {actionType === 'pay' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Transaction Reference ID / UTR
              </label>
              <input
                type="text"
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
                placeholder="e.g. UPI-TXN-2026-991204"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Approval / Settlement Notes
            </label>
            <textarea
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add audit notes..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setActiveItem(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs">
              Cancel
            </button>
            <button
              disabled={submitting}
              onClick={handleProcess}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
            >
              {submitting ? 'Processing...' : actionType === 'approve' ? 'Confirm Approval' : 'Confirm Disbursement'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

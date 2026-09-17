import React from 'react';
import { Modal } from './Modal';
import { StatusBadge } from './Badge';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Store,
  Building2,
  Car,
  Compass,
  Calendar,
  CheckCircle2,
  Clock,
  Briefcase,
  ShieldCheck,
  BedDouble,
  Tag
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ExecutiveDetailsModal({ isOpen, onClose, executive }) {
  const { isDark } = useTheme();

  if (!executive) return null;

  const execId = executive.id || '-';
  const name = executive.name || 'Executive';
  const phone = executive.phone || '-';
  const email = executive.email || '-';
  const type = executive.type || (executive.role?.includes('Travel') ? 'Travel Executive' : 'Stay Executive');
  const vendorName = executive.vendorName || executive.vendor || '-';
  const shopName = executive.shopName || executive.shop || '-';
  const district = executive.district || '-';
  const division = executive.division || '-';
  const pincode = executive.pincode || '-';
  const activeBookings = executive.activeBookings ?? 0;
  const completedBookings = executive.completedBookings ?? (executive.merchantsOnboarded ? executive.merchantsOnboarded * 3 : 0);
  const totalBookings = (Number(activeBookings) || 0) + (Number(completedBookings) || 0);
  const status = executive.status || 'Active';

  const isStay = type.toLowerCase().includes('stay');

  const recentBookings = executive.recentBookings && executive.recentBookings.length > 0 ? executive.recentBookings : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
            {execId}
          </span>
          <StatusBadge status={status} />
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${
              isStay
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                : 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900'
            }`}
          >
            {isStay ? <BedDouble className="w-3.5 h-3.5" /> : <Car className="w-3.5 h-3.5" />}
            <span>{type}</span>
          </span>
        </div>
      }
      maxWidth="max-w-3xl"
    >
      <div className="space-y-5 pb-1">
        {/* Top Profile Card - 50/50 Split */}
        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 gap-4 sm:gap-0">
            {/* Left: Executive Personal & Contact */}
            <div className="sm:pr-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Executive Profile
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  Verified Member
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {name}
                </h4>
                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  <span>{type}</span>
                </div>
              </div>

              <div className="space-y-1 text-xs pt-1">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <a href={`tel:${phone.replace(/\s+/g, '')}`} className="hover:underline text-indigo-600 dark:text-indigo-400 font-medium">
                    {phone}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-mono">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <a href={`mailto:${email}`} className="hover:underline text-slate-700 dark:text-slate-300">
                    {email}
                  </a>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs space-y-1">
                <div className="flex flex-wrap items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="font-semibold">{district}</span>
                  {division && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span className="font-medium text-slate-600 dark:text-slate-300">{division}</span>
                    </>
                  )}
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">PIN: {pincode}</span>
                </div>
              </div>
            </div>

            {/* Right: Vendor & Shop Affiliation */}
            <div className="sm:pl-5 pt-4 sm:pt-0 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Vendor Affiliation
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  Assigned Executive
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Shop / Enterprise Name</div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-500" />
                  <span>{shopName}</span>
                </h4>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Vendor Owner:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {vendorName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Operational Role:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Vendor Bookings &amp; Operations
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Flow Relationship:</span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Vendor Added &amp; Authorized
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Performance & Bookings Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Active Bookings */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-500" />
              Active Bookings
            </span>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
              {Number(activeBookings).toLocaleString()}
            </div>
            <div className="text-[10px] text-sky-600 dark:text-sky-400 mt-0.5 font-medium">
              Ongoing assignments
            </div>
          </div>

          {/* Completed Bookings */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Completed Bookings
            </span>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
              {Number(completedBookings).toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
              Successfully fulfilled
            </div>
          </div>

          {/* Total Bookings */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-indigo-500" />
              Total Bookings
            </span>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
              {Number(totalBookings).toLocaleString()}
            </div>
            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5 font-medium">
              Lifetime volume
            </div>
          </div>

          {/* Status */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              Status
            </span>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              <StatusBadge status={status} />
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-medium">
              Operational availability
            </div>
          </div>
        </div>

        {/* Recent Bookings & Operations Table */}
        <div
          className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-500" />
              Recent Vendor Bookings &amp; Operations
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              Last {recentBookings.length} assignments
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className={`${isDark ? 'bg-slate-950/30 text-slate-400' : 'bg-slate-50/60 text-slate-500'} uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 dark:border-slate-800`}>
                <tr>
                  <th className="py-3 pl-5 pr-4 whitespace-nowrap">Booking ID</th>
                  <th className="py-3 px-4 whitespace-nowrap">Customer</th>
                  <th className="py-3 px-4">Service / Room / Trip</th>
                  <th className="py-3 px-4 whitespace-nowrap">Dates / Schedule</th>
                  <th className="py-3 px-4 whitespace-nowrap">Amount</th>
                  <th className="py-3 pl-4 pr-5 text-right whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                      No recent bookings or operations recorded
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((bkg, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 pl-5 pr-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        {bkg.bookingId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {bkg.customer}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-200">
                        <div className="truncate max-w-[220px]" title={bkg.roomOrTrip}>
                          {bkg.roomOrTrip}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {bkg.dates}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        ₹{bkg.amount?.toLocaleString()}
                      </td>
                      <td className="py-3 pl-4 pr-5 text-right whitespace-nowrap">
                        <StatusBadge status={bkg.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 pb-1 border-t border-slate-200/80 dark:border-slate-800">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Store className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Vendor → Executive Entity (Operates under Vendor Booking &amp; Fulfillment Desk)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer self-end sm:self-auto"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

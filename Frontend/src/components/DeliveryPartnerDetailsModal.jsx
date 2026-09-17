import React from 'react';
import { Modal } from './Modal';
import { StatusBadge } from './Badge';
import { useTheme } from '../context/ThemeContext';
import {
  User,
  Phone,
  Truck,
  MapPin,
  Star,
  Package,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Navigation,
  CheckCheck,
  Bike,
  Calendar,
  AlertCircle
} from 'lucide-react';

export function DeliveryPartnerDetailsModal({ partner, isOpen, onClose }) {
  const { isDark } = useTheme();

  if (!partner) return null;

  const partnerName = partner.name || 'Delivery Partner';
  const partnerId = partner.id || 'DEL-TN-001';
  const phone = partner.phone || '+91 98405 11223';
  const vehicleType = partner.vehicleType || (partner.vehicle ? partner.vehicle.split('(')[0].trim() : '-');
  const registrationNumber = partner.registrationNumber || (partner.vehicle && partner.vehicle.includes('(') ? partner.vehicle.split('(')[1].replace(')', '').trim() : '-');
  const district = partner.district || '-';
  const division = partner.division || '-';
  const pincode = partner.pincode || '-';
  const rating = partner.rating || 0;
  const totalTrips = partner.totalTrips || partner.completedDeliveries || 0;
  const shiftStatus = partner.shift || partner.shiftStatus || partner.status || 'Available';
  const deliveryStatus = partner.deliveryStatus || (shiftStatus === 'On Duty' ? 'Active in Transit' : shiftStatus === 'Available' ? 'Idle - Ready for Dispatch' : 'Off Duty');
  const status = partner.partnerStatus || (partner.status === 'Inactive' ? 'Inactive' : 'Active');
  const verificationStatus = partner.verificationStatus || 'Verified';

  // Recent deliveries
  const recentDeliveries = partner.recentDeliveries || [];


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
            {partnerId}
          </span>
          <StatusBadge status={shiftStatus} />
          <StatusBadge status={status} />
        </div>
      }
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Top Profile Card - 50/50 Split */}
        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 gap-4 sm:gap-0">
            {/* Left: Partner Personal & Contact */}
            <div className="sm:pr-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Partner Information
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  {verificationStatus}
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {partnerName}
                </h4>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <a href={`tel:${phone.replace(/\s+/g, '')}`} className="hover:underline text-blue-600 dark:text-blue-400">
                    {phone}
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

            {/* Right: Vehicle & Registration */}
            <div className="sm:pl-5 pt-4 sm:pt-0 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Vehicle & Registration
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  RC Active
                </span>
              </div>

              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Assigned Vehicle Type</div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
                  <Bike className="w-4 h-4 text-indigo-500" />
                  <span>{vehicleType}</span>
                </h4>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Registration No:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {registrationNumber}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Compliance:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Insurance & Pollution Valid
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Performance & Status Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Rating */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              Rating
            </span>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1">
              <span>{rating}</span>
              <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
            </div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
              Verified customer rating
            </div>
          </div>

          {/* Total Trips */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Package className="w-3 h-3 text-indigo-500" />
              Total Trips
            </span>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
              {Number(totalTrips).toLocaleString()}
            </div>
            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5 font-medium">
              Completed deliveries
            </div>
          </div>

          {/* Shift Status */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-500" />
              Shift Status
            </span>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              <StatusBadge status={shiftStatus} />
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-medium">
              Current working shift
            </div>
          </div>

          {/* Delivery Status */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Navigation className="w-3 h-3 text-emerald-500" />
              Delivery Status
            </span>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 truncate" title={deliveryStatus}>
              {deliveryStatus}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              Fleet dispatch state
            </div>
          </div>
        </div>

        {/* Recent Delivery History Table */}
        <div
          className={`rounded-2xl border overflow-hidden ${
            isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-500" />
              Recent Delivery History
            </h4>
            <span className="text-[11px] font-mono text-slate-400">
              Last {recentDeliveries.length} trips
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className={`${isDark ? 'bg-slate-950/30 text-slate-400' : 'bg-slate-50/60 text-slate-500'} uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 dark:border-slate-800`}>
                <tr>
                  <th className="py-3 pl-5 pr-4 whitespace-nowrap">Order ID</th>
                  <th className="py-3 px-4 whitespace-nowrap">Customer</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4 whitespace-nowrap">Time</th>
                  <th className="py-3 pl-4 pr-5 text-right whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {recentDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                      No recent deliveries recorded
                    </td>
                  </tr>
                ) : (
                  recentDeliveries.map((trip, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 pl-5 pr-4 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        {trip.orderId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {trip.customer}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <div className="truncate max-w-[220px]" title={trip.destination}>
                          {trip.destination}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px] whitespace-nowrap">
                        {trip.time}
                      </td>
                      <td className="py-3 pl-4 pr-5 text-right whitespace-nowrap">
                        <StatusBadge status={trip.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 pb-1 border-t border-slate-200/80 dark:border-slate-800">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Identity &amp; Driving License Verified (Forge India Logistics Network)</span>
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

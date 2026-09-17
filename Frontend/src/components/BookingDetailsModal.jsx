import React from 'react';
import { Modal } from './Modal';
import { StatusBadge, CardTierIcon } from './Badge';
import { useTheme } from '../context/ThemeContext';
import {
  CalendarCheck,
  Calendar,
  CreditCard,
  MapPin,
  Clock,
  CheckCircle2,
  CircleDot,
  Circle,
  XCircle,
  RotateCcw,
  IndianRupee,
  ShieldCheck,
  User,
  Wrench,
  Building,
  Car,
  FileText,
  Phone
} from 'lucide-react';

export function BookingDetailsModal({ booking, isOpen, onClose }) {
  const { isDark } = useTheme();

  if (!booking) return null;

  const typeLower = (booking.bookingType || booking.type || booking.category || '').toLowerCase();
  const serviceLower = (booking.service || '').toLowerCase();
  const statusLower = (booking.status || '').toLowerCase();

  const isStay = typeLower === 'stay' || serviceLower.includes('stay') || serviceLower.includes('hotel') || serviceLower.includes('villa') || serviceLower.includes('resort') || serviceLower.includes('room');
  const isTravel = typeLower === 'travel' || serviceLower.includes('travel') || serviceLower.includes('tour') || serviceLower.includes('cab') || serviceLower.includes('shuttle') || serviceLower.includes('trip') || serviceLower.includes('ride');

  // Determine member role and name
  let representativeName = booking.technicianName || booking.technicianAssigned || 'Unassigned';
  let representativeRole = 'Technician';
  let RepIcon = Wrench;
  let repId = booking.technicianId || '-';
  let repPhone = booking.technicianPhone || '-';

  if (isStay) {
    representativeName = booking.stayExecutive || booking.stayExecutiveName || booking.executiveName || booking.executiveAssigned || booking.technicianAssigned || 'Unassigned';
    representativeRole = 'Stay Executive';
    RepIcon = Building;
    repId = booking.executiveId || '-';
    repPhone = booking.executivePhone || '-';
  } else if (isTravel) {
    representativeName = booking.travelExecutive || booking.travelExecutiveName || booking.executiveName || booking.executiveAssigned || booking.technicianAssigned || 'Unassigned';
    representativeRole = 'Travel Executive';
    RepIcon = Car;
    repId = booking.executiveId || '-';
    repPhone = booking.executivePhone || '-';
  }

  const isCardMember = booking.membershipTier && 
    !['normal', 'standard', 'customer', 'none'].includes(String(booking.membershipTier).toLowerCase());
  const normalizedTier = isCardMember ? 
    (booking.membershipTier.charAt(0).toUpperCase() + booking.membershipTier.slice(1).toLowerCase()) : null;

  // Build timeline based on booking category & current status
  const buildTimeline = () => {
    let steps = [];
    if (isStay) {
      steps = [
        { status: 'Booking Requested', desc: 'Customer selected dates & requested hotel/room stay' },
        { status: 'Availability Confirmed', desc: 'Vendor confirmed room inventory & availability' },
        { status: 'Booking Confirmed', desc: 'Room reservation verified & payment confirmed' },
        { status: 'Check-in', desc: 'Guest arrived and completed hotel check-in' },
        { status: 'Check-out', desc: 'Guest completed room stay and checked out' },
        { status: 'Completed', desc: 'Stay concluded and verified' }
      ];
    } else if (isTravel) {
      steps = [
        { status: 'Booking Created', desc: 'Travel itinerary & pickup details scheduled' },
        { status: 'Confirmed', desc: 'Travel request verified & booking confirmed' },
        { status: 'Vehicle Assigned', desc: 'Driver & vehicle allocated for the journey' },
        { status: 'Pickup Started', desc: 'Driver en route to customer pickup doorstep' },
        { status: 'In Transit', desc: 'Journey in progress with GPS tracking active' },
        { status: 'Completed', desc: 'Safely arrived at destination & trip completed' }
      ];
    } else {
      steps = [
        { status: 'Booking Created', desc: 'Customer placed service appointment request' },
        { status: 'Confirmed', desc: 'Appointment verified & parts inventory reserved' },
        { status: 'Technician Assigned', desc: 'Certified technician allocated to service ticket' },
        { status: 'In Progress', desc: 'On-site service inspection & repair underway' },
        { status: 'Completed', desc: 'Service completed & verified by customer sign-off' }
      ];
    }

    let currentIdx = 0;
    if (isStay) {
      if (statusLower === 'completed') currentIdx = 5;
      else if (statusLower === 'check-out') currentIdx = 4;
      else if (statusLower === 'in progress' || statusLower === 'in-progress' || statusLower === 'check-in') currentIdx = 3;
      else if (statusLower === 'confirmed') currentIdx = 2;
      else if (statusLower === 'availability confirmed') currentIdx = 1;
      else currentIdx = 0;
    } else if (isTravel) {
      if (statusLower === 'completed') currentIdx = 5;
      else if (statusLower === 'in progress' || statusLower === 'in-progress' || statusLower === 'in transit') currentIdx = 4;
      else if (statusLower === 'pickup started') currentIdx = 3;
      else if (statusLower === 'vehicle assigned') currentIdx = 2;
      else if (statusLower === 'confirmed') currentIdx = 1;
      else currentIdx = 0;
    } else {
      if (statusLower === 'completed') currentIdx = 4;
      else if (statusLower === 'in progress' || statusLower === 'in-progress') currentIdx = 3;
      else if (statusLower === 'confirmed') currentIdx = 1;
      else currentIdx = 0;
    }

    const baseDate = booking.scheduledDate || '2026-03-05 10:00 AM';
    const datePart = baseDate.split(' ')[0];

    const getTimeForStep = (idx) => {
      if (isStay) {
        const times = ['09:30 AM', '10:45 AM', '12:00 PM', '02:00 PM', '11:00 AM', '12:30 PM'];
        return `${datePart}, ${times[idx] || '12:00 PM'}`;
      }
      if (isTravel) {
        const times = ['07:00 AM', '07:30 AM', '08:00 AM', '08:20 AM', '08:45 AM', '10:15 AM'];
        return `${datePart}, ${times[idx] || '08:30 AM'}`;
      }
      return `${datePart}, ${10 + idx * 2}:00 AM`;
    };

    return steps.map((s, idx) => {
      let state = 'upcoming';
      if (idx < currentIdx) state = 'completed';
      else if (idx === currentIdx) state = 'current';

      return {
        status: s.status,
        desc: s.desc,
        time: idx <= currentIdx ? getTimeForStep(idx) : null,
        state
      };
    });
  };

  const timelineEvents = buildTimeline();

  // Pricing calculations
  const baseCharge = Number(booking.charge) || 0;
  const discountRate = normalizedTier === 'Diamond' ? 0.20 : normalizedTier === 'Gold' ? 0.15 : normalizedTier === 'Silver' ? 0.10 : 0;
  const discountAmount = isCardMember ? Math.round(baseCharge * discountRate) : 0;
  const netAmount = baseCharge - discountAmount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-base font-bold text-slate-900 dark:text-white">
            {booking.bookingNumber}
          </span>
          <StatusBadge status={booking.status} />
        </div>
      }
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6">
        {/* Top Summary Card - Clean & Balanced 50/50 Layout */}
        <div className={`p-4 rounded-xl border ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/70 border-slate-200'
        }`}>
          <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800">
            {/* Left: Customer Details */}
            <div className="pr-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy-muted dark:text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-navy dark:text-blue-400" />
                  Customer Details
                </span>
                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                  ID: {booking.customerId || '-'}
                </span>
              </div>

              <div>
                <div className="font-bold text-sm text-navy dark:text-white flex items-center gap-1.5">
                  <span>{booking.customerName}</span>
                  {normalizedTier && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      • {normalizedTier}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>{booking.district}, {booking.division}</span>
                  <span>•</span>
                  <span className="font-mono">PIN: {booking.pincode}</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-0.5">
                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Scheduled: <span className="font-medium text-navy-secondary dark:text-slate-200">{booking.scheduledDate}</span></span>
              </div>
            </div>

            {/* Right: Representative Details */}
            <div className="pl-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy-muted dark:text-slate-400 flex items-center gap-1.5">
                  <RepIcon className="w-3.5 h-3.5 text-navy dark:text-blue-400" />
                  Representative Details
                </span>
                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                  ID: {repId}
                </span>
              </div>

              <div>
                <div className="font-bold text-sm text-navy dark:text-white">
                  {representativeName}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span className="font-medium text-slate-700 dark:text-slate-300">{representativeRole}</span>
                  <span>•</span>
                  <span>{isStay ? 'Contact / Reference' : 'Certified Staff'}</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-0.5">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Contact: <span className="font-medium text-navy-secondary dark:text-slate-200">{repPhone}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Status Timeline Stepper */}
        <div className={`p-4 sm:p-5 rounded-2xl border ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
        } shadow-sm`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              Booking Status Flow & Detailed Timeline
            </h4>
            <span className="text-[11px] text-slate-400">
              Current: <strong className="text-slate-700 dark:text-slate-200">{booking.status}</strong>
            </span>
          </div>

          {/* Stepper Timeline */}
          <div className="space-y-0">
            {timelineEvents.map((evt, idx) => {
              const isDone = evt.state === 'completed';
              const isCurrent = evt.state === 'current';
              const isLast = idx === timelineEvents.length - 1;

              const nextEvt = timelineEvents[idx + 1];
              const isLineCompleted = isDone && (nextEvt?.state === 'completed' || nextEvt?.state === 'current');

              let icon = <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />;
              let titleColor = 'text-slate-500 dark:text-slate-400 font-medium';

              if (isDone) {
                icon = <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50 dark:fill-emerald-950/40" />;
                titleColor = 'text-emerald-700 dark:text-emerald-300 font-semibold';
              } else if (isCurrent) {
                icon = <CircleDot className="w-4 h-4 text-blue-600 dark:text-indigo-400 animate-pulse" />;
                titleColor = 'text-blue-600 dark:text-indigo-400 font-bold';
              }

              return (
                <div key={idx} className="flex items-stretch gap-3.5 text-xs">
                  {/* Timeline Indicator Column */}
                  <div className="flex flex-col items-center shrink-0 w-5">
                    <div className="flex items-center justify-center w-5 h-5 shrink-0">
                      {icon}
                    </div>
                    {!isLast && (
                      <div
                        className={`w-0.5 grow my-1 rounded-full ${
                          isLineCompleted 
                            ? 'bg-emerald-500 dark:bg-emerald-500' 
                            : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      />
                    )}
                  </div>

                  {/* Step Details */}
                  <div className={`min-w-0 flex-1 pt-0.5 ${!isLast ? 'pb-4' : 'pb-1'}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={titleColor}>{evt.status}</span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono font-semibold bg-blue-50 dark:bg-indigo-950/70 text-blue-600 dark:text-indigo-300 border border-blue-200 dark:border-indigo-800">
                          Current Stage
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {evt.desc}
                    </div>
                  </div>

                  {/* Step Timestamp */}
                  <div className={`shrink-0 text-right pt-0.5 ${!isLast ? 'pb-4' : 'pb-1'}`}>
                    {evt.time ? (
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {evt.time}
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-300 dark:text-slate-600 italic">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Service Requested & Scope Card */}
        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
        } shadow-sm space-y-3`}>
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Service Specifications
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
              {isStay ? 'Stay & Hospitality' : isTravel ? 'Outstation Travel' : 'On-Site Service'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {booking.service}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Category: {booking.bookingType || (isStay ? 'Stay' : isTravel ? 'Travel' : 'Service')} • Pincode: {booking.pincode}
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                ₹{baseCharge.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400">
                Service Fee
              </div>
            </div>
          </div>
        </div>

        {/* Pricing & Financial Summary Breakdown */}
        <div className={`p-4 rounded-2xl border ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50/80 border-slate-200'
        } space-y-2 text-xs`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span>Service Base Charge:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              ₹{baseCharge.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span>Card Tier Savings:</span>
              {isCardMember ? (
                <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                  <CardTierIcon tier={normalizedTier} className="w-3.5 h-3.5" />
                  <span>({normalizedTier} Card)</span>
                </span>
              ) : (
                <span className="text-slate-400 italic">(Standard Non-Card)</span>
              )}
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {discountAmount > 0 ? `-₹${discountAmount.toLocaleString()}` : '₹0'}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span>Payment Method & Status:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Online (UPI) • <span className="text-emerald-600 font-semibold">Verified</span>
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between font-bold text-sm">
            <span className="text-slate-900 dark:text-white">Final Net Amount:</span>
            <span className="text-emerald-600 dark:text-emerald-400 text-base font-extrabold">
              ₹{netAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

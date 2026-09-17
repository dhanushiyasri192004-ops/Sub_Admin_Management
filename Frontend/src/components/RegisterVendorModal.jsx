import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { resolvePincodeHierarchy } from '../utils/pincodeDirectory';
import { dataService } from '../services/dataService';
import {
  Store,
  User,
  Phone,
  Mail,
  Tag,
  MapPin,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export function RegisterVendorModal({ isOpen, onClose, onVendorCreated, initialPincode = '' }) {
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    category: 'Services',
    pincode: initialPincode || '',
    address: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialPincode !== undefined) {
      setFormData(prev => ({ ...prev, pincode: initialPincode || '' }));
    }
  }, [initialPincode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePincodeChange = (val) => {
    setFormData(prev => ({ ...prev, pincode: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Vendor Business Name is required');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Phone Number is required');
      return;
    }
    if (!formData.pincode || formData.pincode.trim().length !== 6) {
      setError('Please enter a valid 6-digit Pincode');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      // Automatically identify complete hierarchy based on the entered pincode
      const resolved = resolvePincodeHierarchy(formData.pincode.trim());

      const payload = {
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim() || formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || `${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@vendor.com`,
        category: formData.category,
        pincode: formData.pincode.trim(),
        address: formData.address.trim() || `${formData.pincode} Commercial Street`,
        // Location hierarchy auto-populated
        state: resolved.state,
        district: resolved.district,
        division: resolved.division
      };

      const res = await dataService.createVendor(payload);
      if (res.success) {
        if (onVendorCreated) {
          onVendorCreated(res.vendor);
        }
        onClose();
        // Reset form
        setFormData({
          name: '',
          contactPerson: '',
          phone: '',
          email: '',
          category: 'Services',
          pincode: initialPincode || '',
          address: ''
        });
      } else {
        setError(res.message || 'Failed to register vendor');
      }
    } catch (err) {
      setError(err.message || 'Failed to register vendor');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Vendor"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* VENDOR REGISTRATION FIELDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Vendor Business Name *
            </label>
            <div className="relative">
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Fresh Grocers"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <Store className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Contact Person *
            </label>
            <div className="relative">
              <input
                type="text"
                name="contactPerson"
                required
                placeholder="e.g. Contact Person Name"
                value={formData.contactPerson}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <input
                type="tel"
                name="phone"
                required
                placeholder="e.g. +91 94432 11001"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                placeholder="e.g. contact@muruganprovisions.in"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category *
            </label>
            <div className="relative">
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
              >
                <option value="Services">Services</option>
                <option value="Product">Product</option>
                <option value="Food">Food</option>
                <option value="Daily Needs">Daily Needs</option>
                <option value="Stay">Stay</option>
                <option value="Travel">Travel</option>
                <option value="Job">Job</option>
              </select>
              <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pincode *
            </label>
            <div className="relative">
              <input
                type="text"
                name="pincode"
                required
                maxLength={6}
                placeholder="Enter 6-digit Pincode (e.g. 636007)"
                value={formData.pincode}
                onChange={(e) => handlePincodeChange(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Shop / Office Address *
            </label>
            <input
              type="text"
              name="address"
              required
              placeholder="e.g. No. 42, Fairlands Main Road, Opposite City Center"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Form Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <span>{submitting ? 'Registering...' : 'Complete Registration'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </Modal>
  );
}

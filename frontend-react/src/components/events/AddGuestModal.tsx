import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertCircle, Search, X } from 'lucide-react';
import type { Member } from '@/types/member';

interface AddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  eventFee: number;
  onAddGuest: (guestData: {
    name: string;
    paymentStatus: 'Paid' | 'Not Paid';
  }) => Promise<void>;
  isSubmitting: boolean;
}

interface AddGuestFormContentProps {
  members: Member[];
  eventFee: number;
  onAddGuest: (guestData: {
    name: string;
    paymentStatus: 'Paid' | 'Not Paid';
  }) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}

const AddGuestFormContent: React.FC<AddGuestFormContentProps> = ({
  members,
  eventFee,
  onAddGuest,
  onClose,
  isSubmitting,
}) => {
  const [guestName, setGuestName] = useState('');
  const [guestAge, setGuestAge] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestDob, setGuestDob] = useState('');
  const [guestInvitedByMemberId, setGuestInvitedByMemberId] = useState('');
  const [invitedBySearch, setInvitedBySearch] = useState('');
  const [isInvitedDropdownOpen, setIsInvitedDropdownOpen] = useState(false);
  const [guestPaymentStatus, setGuestPaymentStatus] = useState<'Paid' | 'Not Paid'>(
    eventFee > 0 ? 'Not Paid' : 'Paid'
  );
  const [guestError, setGuestError] = useState('');

  const selectedInviter = members.find((m) => m.id === guestInvitedByMemberId);
  const inviterQuery = invitedBySearch.trim().toLowerCase();
  const filteredInviterMembers = members.filter((m) => {
    if (!inviterQuery) return true;
    const fullName = [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(' ').toLowerCase();
    const nickname = (m.nickname || '').toLowerCase();
    return fullName.includes(inviterQuery) || nickname.includes(inviterQuery);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestError('');

    const trimmedName = guestName.trim();
    if (!trimmedName) {
      setGuestError('Please enter the participant name.');
      return;
    }

    try {
      await onAddGuest({
        name: trimmedName,
        paymentStatus: guestPaymentStatus,
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to record participant.';
      setGuestError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {guestError && (
        <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md font-medium flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{guestError}</span>
        </div>
      )}

      <Input
        label="Name"
        required
        placeholder="Guest Full Name..."
        value={guestName}
        onChange={(e) => setGuestName(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Age"
          type="number"
          min="1"
          max="120"
          placeholder="e.g. 18"
          value={guestAge}
          onChange={(e) => setGuestAge(e.target.value)}
        />
        <Input
          label="Date of Birth"
          type="date"
          value={guestDob}
          onChange={(e) => setGuestDob(e.target.value)}
        />
      </div>

      <Input
        label="Email"
        type="email"
        placeholder="guest@example.com"
        value={guestEmail}
        onChange={(e) => setGuestEmail(e.target.value)}
      />

      {/* Invited by Searchable Dropdown */}
      <div className="space-y-1.5 relative">
        <label className="text-sm font-semibold text-slate-800">
          Invited by (MFC Youth Member)
        </label>
        {selectedInviter ? (
          <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs">
            <div>
              <span className="font-bold text-slate-900">
                {[selectedInviter.first_name, selectedInviter.middle_name, selectedInviter.last_name].filter(Boolean).join(' ')}
              </span>
              {selectedInviter.nickname && (
                <span className="text-slate-500 ml-1">
                  (&ldquo;{selectedInviter.nickname}&rdquo;)
                </span>
              )}
              <span className="text-slate-400 ml-2">
                • {selectedInviter.chapter_name || 'Member'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setGuestInvitedByMemberId('');
                setInvitedBySearch('');
              }}
              className="text-slate-400 hover:text-rose-600 p-1 rounded cursor-pointer"
              aria-label="Remove inviter"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <input
                id="searchRegisteredMembersInput"
                type="text"
                aria-label="Search registered members"
                placeholder="Search registered members..."
                value={invitedBySearch}
                onFocus={() => setIsInvitedDropdownOpen(true)}
                onChange={(e) => {
                  setInvitedBySearch(e.target.value);
                  setIsInvitedDropdownOpen(true);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
              />
            </div>
            {isInvitedDropdownOpen && (
              <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg z-50 divide-y divide-slate-100">
                {filteredInviterMembers.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    No registered members matched.
                  </div>
                ) : (
                  filteredInviterMembers.slice(0, 20).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setGuestInvitedByMemberId(m.id);
                        setIsInvitedDropdownOpen(false);
                      }}
                      className="w-full text-left p-2.5 hover:bg-slate-50 transition-colors text-xs flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <span className="font-semibold text-slate-900">
                          {[m.first_name, m.middle_name, m.last_name].filter(Boolean).join(' ')}
                        </span>
                        {m.nickname && (
                          <span className="text-slate-500 ml-1">
                            (&ldquo;{m.nickname}&rdquo;)
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {m.chapter_name || 'Member'}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {eventFee > 0 && (
        <div className="w-full flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-800">
            Payment Status
          </label>
          <select
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy min-h-[44px]"
            value={guestPaymentStatus}
            onChange={(e) =>
              setGuestPaymentStatus(e.target.value as 'Paid' | 'Not Paid')
            }
          >
            <option value="Not Paid">Not Paid</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          Add Guest
        </Button>
      </div>
    </form>
  );
};

export const AddGuestModal: React.FC<AddGuestModalProps> = ({
  isOpen,
  onClose,
  members,
  eventFee,
  onAddGuest,
  isSubmitting,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Guest / Visiting Youth"
      maxWidth="md"
    >
      {isOpen && (
        <AddGuestFormContent
          key={isOpen ? 'open' : 'closed'}
          members={members}
          eventFee={eventFee}
          onAddGuest={onAddGuest}
          onClose={onClose}
          isSubmitting={isSubmitting}
        />
      )}
    </Modal>
  );
};

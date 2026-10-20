import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Calendar, ShieldCheck } from 'lucide-react';
import type { CommunityEvent } from '@/types/event';
import type { UserProfile } from '@/types/auth';

interface MemberDigitalPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  events: CommunityEvent[];
}

export const MemberDigitalPassModal: React.FC<MemberDigitalPassModalProps> = ({
  isOpen,
  onClose,
  user,
  events,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(
    events.length > 0 ? events[0].id : 'all'
  );

  const isLinked = Boolean(user?.member_id);
  const memberId = user?.member_id || '';
  const memberName = user?.first_name
    ? [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ')
    : user?.email || 'Youth Member';

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const ticketPayload = isLinked ? `mfc_ticket:${selectedEventId}:${memberId}` : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="My Digital Event Pass"
      description="Official Missionary Families for Christ Youth Entry Ticket"
      maxWidth="md"
    >
      <div className="space-y-5">
        {!isLinked ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center space-y-3">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6 text-amber-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">Member Record Not Linked</h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Your user account is not currently linked to an official member profile in the Area Database.
                Please contact your Chapter Servant or Area Coordinator to link your account before generating an event pass.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Event Selector */}
            {events.length > 0 && (
              <div className="space-y-1.5">
                <label htmlFor="event-pass-select" className="block text-xs font-semibold text-slate-700">
                  Select Gathering
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-navy absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="event-pass-select"
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-xs bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy min-h-[44px] cursor-pointer"
                  >
                    <option value="all">Universal Area Pass (All Events)</option>
                    {events.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.name} ({new Date(evt.starts_at).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Digital Ticket Card */}
            <div className="bg-navy-deep text-white rounded-2xl p-6 border border-navy-surface text-center relative overflow-hidden">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-300 mb-3">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Verified MFC Youth Ticket</span>
              </div>

              <h3 className="text-lg font-bold font-heading text-white tracking-tight">
                {memberName}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {user?.chapter_name ? `${user.chapter_name} Chapter` : 'MFC Youth Member'}
              </p>
              {selectedEvent && selectedEventId !== 'all' && (
                <div className="mt-2 inline-block px-3 py-1 bg-white/10 rounded-full text-xs text-amber-200 border border-white/10 font-medium">
                  {selectedEvent.name}
                </div>
              )}

              {/* QR Code Container */}
              <div className="my-5 p-4 bg-white rounded-2xl shadow-inner inline-block mx-auto border-4 border-amber-400/30">
                <QRCodeSVG
                  value={ticketPayload}
                  size={210}
                  level="H"
                  fgColor="#002847"
                  bgColor="#ffffff"
                />
              </div>

              <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                Present this QR code to servant leaders at the registration counter for rapid check-in.
              </p>
              <p className="text-[11px] text-slate-400 mt-3 tabular-nums">
                Pass ID: {memberId.substring(0, 8)} &middot; Ticket Key: {selectedEventId === 'all' ? 'Universal' : selectedEventId.substring(0, 8)}
              </p>
            </div>
          </>
        )}

        {/* Action Controls */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            className="min-h-[44px] px-6"
          >
            Close Pass
          </Button>
        </div>
      </div>
    </Modal>
  );
};

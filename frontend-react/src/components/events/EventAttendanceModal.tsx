import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Users,
  Search,
  Eye,
  Edit2,
  UserPlus,
  CreditCard,
  CheckCircle,
  XCircle,
  Trash2,
  QrCode,
} from 'lucide-react';
import { QrAttendanceScannerModal } from './QrAttendanceScannerModal';
import type { CommunityEvent, Participant } from '@/types/event';
import type { Member } from '@/types/member';

interface EventAttendanceModalProps {
  event: CommunityEvent | null;
  isOpen: boolean;
  onClose: () => void;
  canEdit: boolean;
  members: Member[];
  participants: Participant[];
  isLoadingParticipants: boolean;
  onOpenSummary: (event: CommunityEvent) => void;
  onOpenEdit: (event: CommunityEvent) => void;
  onPromptPayment: (
    name: string,
    participant: Participant | undefined,
    memberId?: string
  ) => void;
  onSetAttendance: (
    attended: boolean,
    participant: Participant | undefined,
    memberId?: string
  ) => void;
  onOpenAddGuest: () => void;
  onDeleteGuest: (participantId: string) => void;
}

export const EventAttendanceModal: React.FC<EventAttendanceModalProps> = ({
  event,
  isOpen,
  onClose,
  canEdit,
  members,
  participants,
  isLoadingParticipants,
  onOpenSummary,
  onOpenEdit,
  onPromptPayment,
  onSetAttendance,
  onOpenAddGuest,
  onDeleteGuest,
}) => {
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  if (!event) return null;

  // Stat metrics
  const presentCount = participants.filter((p) => p.attended).length;
  const paidCount = participants.filter((p) => p.payment_status === 'Paid').length;
  const notPaidCount = participants.filter((p) => p.payment_status !== 'Paid').length;

  const nonMemberParticipants = participants.filter(
    (p) => !p.member_id && p.non_member_name
  );

  // Search filtering
  const query = attendeeSearch.trim().toLowerCase();
  const filteredMembers = members.filter((m) => {
    if (!query) return true;
    const fullName = [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(' ').toLowerCase();
    const track = (m.academic_track || '').toLowerCase();
    const chapter = (m.chapter_name || '').toLowerCase();
    return (
      fullName.includes(query) ||
      track.includes(query) ||
      chapter.includes(query)
    );
  });

  const filteredGuests = nonMemberParticipants.filter((g) => {
    if (!query) return true;
    return (g.non_member_name || '').toLowerCase().includes(query);
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Attendance: ${event.name}`}
      description={`${formatDateTime(event.starts_at)} | ${event.venue} | Fee: ${
        event.fee > 0 ? formatCurrency(event.fee) : 'Free'
      }`}
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Quick Operations Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <span className="text-xs text-slate-500 font-medium">
            Event Operations
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsQrScannerOpen(true)}
              className="flex items-center gap-1.5 min-h-[36px]"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan QR Code</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onOpenSummary(event)}
              className="flex items-center gap-1.5 min-h-[36px]"
            >
              <Eye className="w-3.5 h-3.5 text-navy" />
              <span>View Summary</span>
            </Button>
            {canEdit && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onOpenEdit(event)}
                className="flex items-center gap-1.5 min-h-[36px]"
              >
                <Edit2 className="w-3.5 h-3.5 text-navy" />
                <span>Edit Event</span>
              </Button>
            )}
          </div>
        </div>

        {/* Summary Stat Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200/90 rounded-xl text-center">
          <div className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
            <div className="text-xs text-slate-500 font-medium">Area Roster</div>
            <div className="text-xl font-bold text-slate-900">{members.length}</div>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
            <div className="text-xs text-slate-500 font-medium">Present</div>
            <div className="text-xl font-bold text-emerald-700">{presentCount}</div>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
            <div className="text-xs text-slate-500 font-medium">Paid</div>
            <div className="text-xl font-bold text-sky-700">{paidCount}</div>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
            <div className="text-xs text-slate-500 font-medium">Not Paid</div>
            <div className="text-xl font-bold text-amber-700">{notPaidCount}</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search area members by name, academic track, or chapter..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy min-h-[44px]"
            value={attendeeSearch}
            onChange={(e) => setAttendeeSearch(e.target.value)}
          />
        </div>

        {/* SECTION 1: Members Roster Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-navy" />
              <h3 className="text-sm font-bold text-slate-900">
                Area Database Members Roster ({filteredMembers.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500">Live Area Database</span>
          </div>

          {isLoadingParticipants ? (
            <div className="p-12 flex justify-center items-center">
              <Spinner size="lg" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
              No area members matched &quot;{attendeeSearch}&quot;.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100/90 text-slate-700 font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Member Name</th>
                      <th className="py-3 px-3">Chapter & Track</th>
                      <th className="py-3 px-3 text-center">Payment Status</th>
                      <th className="py-3 px-4 text-center">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 bg-white">
                    {filteredMembers.map((member) => {
                      const participant = participants.find(
                        (p) => p.member_id === member.id
                      );
                      const isPaid = participant?.payment_status === 'Paid';
                      const isAttended = participant?.attended ?? false;
                      const fullName = [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(' ');

                      return (
                        <tr
                          key={member.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                            <div>{fullName}</div>
                            {member.nickname && (
                              <span className="text-[11px] text-slate-500 font-normal">
                                &ldquo;{member.nickname}&rdquo;
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                            <div>{member.chapter_name || 'Unassigned Chapter'}</div>
                            <div className="text-[11px] text-slate-400">
                              {member.academic_track || 'Member'}
                            </div>
                          </td>

                          {/* Payment Status */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() =>
                                onPromptPayment(fullName, participant, member.id)
                              }
                              title="Click to change payment status"
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer min-h-[38px] ${
                                isPaid
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400'
                                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 hover:border-amber-400'
                              }`}
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>{isPaid ? 'Paid' : 'Not Paid'}</span>
                            </button>
                          </td>

                          {/* Attendance Status */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  onSetAttendance(true, participant, member.id)
                                }
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[38px] cursor-pointer border ${
                                  isAttended
                                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300'
                                }`}
                                title="Mark Present"
                              >
                                <CheckCircle
                                  className={`w-3.5 h-3.5 ${
                                    isAttended ? 'text-white' : 'text-slate-400'
                                  }`}
                                />
                                <span>Present</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  onSetAttendance(false, participant, member.id)
                                }
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[38px] cursor-pointer border ${
                                  !isAttended
                                    ? 'bg-slate-200 text-slate-800 border-slate-300 shadow-2xs font-bold'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                                }`}
                                title="Mark Not Present"
                              >
                                <XCircle
                                  className={`w-3.5 h-3.5 ${
                                    !isAttended
                                      ? 'text-slate-600'
                                      : 'text-slate-400'
                                  }`}
                                />
                                <span>Not Present</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: Guests Section */}
        <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-navy/10 text-navy">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Guests & Visiting Youth
                </h4>
                <p className="text-xs text-slate-500">
                  Quick check-in for walk-ins, companions, and non-registered guests.
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={onOpenAddGuest}
              className="shrink-0 flex items-center gap-1.5 font-bold"
              size="sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Guest</span>
            </Button>
          </div>

          {nonMemberParticipants.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Guest Participants List ({filteredGuests.length})
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Guest Name</th>
                      <th className="py-2.5 px-3 text-center">Payment Status</th>
                      <th className="py-2.5 px-3 text-center">Attendance</th>
                      <th className="py-2.5 px-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGuests.map((guest) => {
                      const isPaid = guest.payment_status === 'Paid';
                      const isAttended = guest.attended;
                      const gName = guest.non_member_name || 'Guest';

                      return (
                        <tr
                          key={guest.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            <span>{gName}</span>
                            <span className="ml-2 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                              Guest
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => onPromptPayment(gName, guest)}
                              title="Click to change payment status"
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold border cursor-pointer ${
                                isPaid
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                              }`}
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>{isPaid ? 'Paid' : 'Not Paid'}</span>
                            </button>
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onSetAttendance(true, guest)}
                                className={`px-2.5 py-1 rounded text-xs font-bold border cursor-pointer inline-flex items-center gap-1 ${
                                  isAttended
                                    ? 'bg-emerald-600 text-white border-emerald-700'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50'
                                }`}
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>Present</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onSetAttendance(false, guest)}
                                className={`px-2.5 py-1 rounded text-xs font-bold border cursor-pointer inline-flex items-center gap-1 ${
                                  !isAttended
                                    ? 'bg-slate-200 text-slate-800 border-slate-300 font-bold'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Not Present</span>
                              </button>
                            </div>
                          </td>

                          <td className="py-2.5 px-2 text-right">
                            <button
                              type="button"
                              onClick={() => onDeleteGuest(guest.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              title="Remove guest"
                              aria-label="Remove guest"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-200">
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>

      {isQrScannerOpen && (
        <QrAttendanceScannerModal
          isOpen={isQrScannerOpen}
          onClose={() => setIsQrScannerOpen(false)}
          event={event}
          members={members}
          participants={participants}
          onCheckInMember={(memberId) => {
            const existingParticipant = participants.find((p) => p.member_id === memberId);
            onSetAttendance(true, existingParticipant, memberId);
          }}
        />
      )}
    </Modal>
  );
};

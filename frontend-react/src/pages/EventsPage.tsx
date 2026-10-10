import React, { useState } from 'react';
import {
  useEvents,
  useCreateEvent,
  useEventParticipants,
  useRegisterParticipant,
  useUpdateParticipant,
  useDeleteParticipant,
} from '@/hooks/useEvents';
import { useMembers } from '@/hooks/useMembers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  CalendarPlus,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  Circle,
  UserPlus,
  Trash2,
  Search,
  CreditCard
} from 'lucide-react';
import type { CommunityEvent, Participant } from '@/types/event';

export const EventsPage: React.FC = () => {
  const { data: events = [], isLoading } = useEvents();
  const { data: members = [] } = useMembers();

  const createEvent = useCreateEvent();
  const registerParticipant = useRegisterParticipant();
  const updateParticipant = useUpdateParticipant();
  const deleteParticipant = useDeleteParticipant();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(null);

  // Event creation form state
  const [name, setName] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [venue, setVenue] = useState('');
  const [fee, setFee] = useState('0');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Selected event participants
  const { data: participants = [], isLoading: participantsLoading } = useEventParticipants(
    selectedEvent?.id || ''
  );

  // Non-community participant form state
  const [guestName, setGuestName] = useState('');
  const [guestPaymentStatus, setGuestPaymentStatus] = useState<'Paid' | 'Not Paid'>('Not Paid');
  const [guestError, setGuestError] = useState('');

  // Attendee search query inside modal
  const [attendeeSearch, setAttendeeSearch] = useState('');

  const openCreateModal = () => {
    setName('');
    setStartsAt('');
    setVenue('');
    setFee('0');
    setDescription('');
    setFormError('');
    setIsCreateOpen(true);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !startsAt.trim() || !venue.trim()) {
      setFormError('Event name, start schedule, and venue are required.');
      return;
    }

    try {
      await createEvent.mutateAsync({
        name: name.trim(),
        starts_at: startsAt,
        venue: venue.trim(),
        fee: parseFloat(fee) || 0,
        description: description.trim(),
      });
      setIsCreateOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Failed to schedule event.');
      }
    }
  };

  // Add non-community participant
  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestError('');
    if (!selectedEvent) return;

    const trimmedName = guestName.trim();
    if (!trimmedName) {
      setGuestError('Please enter the participant name.');
      return;
    }

    try {
      await registerParticipant.mutateAsync({
        event_id: selectedEvent.id,
        non_member_name: trimmedName,
        payment_status: guestPaymentStatus,
        attended: true,
      });
      setGuestName('');
      setGuestPaymentStatus(selectedEvent.fee > 0 ? 'Not Paid' : 'Paid');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setGuestError(err.message);
      } else {
        setGuestError('Failed to record participant.');
      }
    }
  };

  // Toggle Attendance
  const handleToggleAttendance = async (
    participant: Participant | undefined,
    memberId?: string
  ) => {
    if (!selectedEvent) return;
    try {
      if (participant?.id) {
        await updateParticipant.mutateAsync({
          id: participant.id,
          event_id: selectedEvent.id,
          attended: !participant.attended,
        });
      } else if (memberId) {
        await registerParticipant.mutateAsync({
          event_id: selectedEvent.id,
          member_id: memberId,
          attended: true,
          payment_status: selectedEvent.fee > 0 ? 'Not Paid' : 'Paid',
        });
      }
    } catch {
      alert('Failed to update attendance.');
    }
  };

  // Toggle Payment Status (Paid <-> Not Paid)
  const handleTogglePayment = async (
    participant: Participant | undefined,
    memberId?: string
  ) => {
    if (!selectedEvent) return;
    try {
      if (participant?.id) {
        const nextStatus = participant.payment_status === 'Paid' ? 'Not Paid' : 'Paid';
        await updateParticipant.mutateAsync({
          id: participant.id,
          event_id: selectedEvent.id,
          payment_status: nextStatus,
        });
      } else if (memberId) {
        await registerParticipant.mutateAsync({
          event_id: selectedEvent.id,
          member_id: memberId,
          attended: false,
          payment_status: 'Paid',
        });
      }
    } catch {
      alert('Failed to update payment status.');
    }
  };

  // Remove Guest participant
  const handleDeleteGuest = async (participantId: string) => {
    if (!selectedEvent) return;
    if (!confirm('Remove this participant from the event attendance list?')) return;
    try {
      await deleteParticipant.mutateAsync({
        id: participantId,
        event_id: selectedEvent.id,
      });
    } catch {
      alert('Failed to delete participant.');
    }
  };

  // Compute metrics for selected event
  const presentCount = participants.filter((p) => p.attended).length;
  const paidCount = participants.filter((p) => p.payment_status === 'Paid').length;
  const notPaidCount = participants.filter((p) => p.payment_status !== 'Paid').length;

  // Filter non-community participants
  const nonMemberParticipants = participants.filter((p) => !p.member_id && p.non_member_name);

  // Search query filter
  const query = attendeeSearch.trim().toLowerCase();
  const filteredMembers = members.filter((m) => {
    if (!query) return true;
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
    const track = (m.academic_track || '').toLowerCase();
    const chapter = (m.chapter_name || '').toLowerCase();
    return fullName.includes(query) || track.includes(query) || chapter.includes(query);
  });

  const filteredGuests = nonMemberParticipants.filter((g) => {
    if (!query) return true;
    return (g.non_member_name || '').toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
              Events & Gatherings
            </h1>
            <Badge variant="navy">
              {events.length} {events.length === 1 ? 'Gathering' : 'Gatherings'}
            </Badge>
          </div>
          <p className="text-sm text-slate-600">
            Assemblies, youth camps, payment status tracking, and rapid one-tap attendance check-ins.
          </p>
        </div>

        <Button onClick={openCreateModal} className="flex items-center gap-2 shrink-0">
          <CalendarPlus className="w-4 h-4" />
          <span>Schedule Event</span>
        </Button>
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 flex flex-col items-center justify-center gap-3 shadow-2xs">
          <Spinner size="lg" />
          <span className="text-xs text-slate-500 font-medium">Loading gatherings...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-2xs">
          <CalendarPlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900">No upcoming events</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Schedule a chapter assembly or youth camp gathering to start tracking community attendance.
          </p>
          <Button onClick={openCreateModal} className="mt-4" size="sm">
            Schedule First Event
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-bold text-slate-900 text-base font-heading group-hover:text-navy transition-colors">
                    {event.name}
                  </h3>
                  <Badge variant={event.fee > 0 ? 'warning' : 'success'}>
                    {event.fee > 0 ? formatCurrency(event.fee) : 'Free'}
                  </Badge>
                </div>

                {event.description && (
                  <p className="text-xs text-slate-600 mb-4 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                )}

                <div className="space-y-2 py-2 bg-slate-50/70 p-3 rounded-xl border border-slate-200/70">
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-navy shrink-0" />
                    <span className="font-medium">{formatDateTime(event.starts_at)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="truncate font-medium">{event.venue}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedEvent(event);
                    setGuestName('');
                    setGuestPaymentStatus(event.fee > 0 ? 'Not Paid' : 'Paid');
                    setAttendeeSearch('');
                  }}
                  className="w-full flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Users className="w-4 h-4 text-navy" />
                  <span>Attendance & Payments</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Event Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Schedule Community Event"
        maxWidth="md"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          {formError && (
            <div className="p-3 text-xs text-mfc-red bg-red-50 border border-red-200 rounded-md font-medium">
              {formError}
            </div>
          )}

          <Input
            label="Event Name"
            required
            placeholder="e.g. Monthly Chapter Assembly"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Date & Time"
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />

          <Input
            label="Venue Location"
            required
            placeholder="Parish Hall / Camp Site"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          />

          <Input
            label="Registration Fee (PHP)"
            type="number"
            min="0"
            step="1"
            placeholder="0 for Free"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
          />

          <div className="w-full flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">Description / Agenda</label>
            <textarea
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm bg-white text-text-main border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
              placeholder="Event details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createEvent.isPending}>
              Schedule Event
            </Button>
          </div>
        </form>
      </Modal>

      {/* Attendance & Payment Status Check-in Modal */}
      <Modal
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent ? `Attendance: ${selectedEvent.name}` : 'Attendance'}
        description={
          selectedEvent
            ? `Fee: ${selectedEvent.fee > 0 ? formatCurrency(selectedEvent.fee) : 'Free'} | Manage attendance & payment status.`
            : ''
        }
        maxWidth="lg"
      >
        <div className="space-y-5">
          {/* Summary Stat Pills */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <div>
              <div className="text-xs text-text-muted font-medium">Present</div>
              <div className="text-lg font-bold text-emerald-700">{presentCount}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted font-medium">Paid</div>
              <div className="text-lg font-bold text-emerald-600">{paidCount}</div>
            </div>
            <div>
              <div className="text-xs text-text-muted font-medium">Not Paid</div>
              <div className="text-lg font-bold text-amber-600">{notPaidCount}</div>
            </div>
          </div>

          {/* Section: Add Participant Not in Community Database */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-navy" />
              <h4 className="text-sm font-bold text-text-main">
                Add Participant (Not in Community Database)
              </h4>
            </div>
            <p className="text-xs text-text-muted">
              Record a walk-in, guest, or visiting youth without needing a member profile.
            </p>

            {guestError && (
              <div className="p-2 text-xs text-mfc-red bg-red-50 border border-red-200 rounded-md font-medium">
                {guestError}
              </div>
            )}

            <form onSubmit={handleAddGuest} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <input
                type="text"
                placeholder="Participant / Guest full name"
                className="flex-1 px-3.5 py-2.5 text-sm bg-white text-text-main border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy min-h-[44px]"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />

              {/* Payment Status Dropdown for guest */}
              <select
                aria-label="Payment status"
                className="px-3 py-2.5 text-sm bg-white text-text-main border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy min-h-[44px]"
                value={guestPaymentStatus}
                onChange={(e) => setGuestPaymentStatus(e.target.value as 'Paid' | 'Not Paid')}
              >
                <option value="Not Paid">Not Paid</option>
                <option value="Paid">Paid</option>
              </select>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={registerParticipant.isPending}
                className="shrink-0 min-h-[44px]"
              >
                Add Guest
              </Button>
            </form>
          </div>

          {/* Search attendee roster */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search participants by name, track, or chapter..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-white text-text-main border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy min-h-[44px]"
              value={attendeeSearch}
              onChange={(e) => setAttendeeSearch(e.target.value)}
            />
          </div>

          {/* Attendee Roster */}
          {participantsLoading ? (
            <div className="p-8 flex justify-center">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto divide-y divide-border-subtle pr-1">
              {/* 1. Render Non-Community Guests First */}
              {filteredGuests.map((guest) => {
                const isPaid = guest.payment_status === 'Paid';
                const isAttended = guest.attended;

                return (
                  <div
                    key={guest.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 px-1 hover:bg-slate-50 transition-colors rounded-md"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-text-main">
                          {guest.non_member_name}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded">
                          Guest / Non-Member
                        </span>
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">
                        Recorded walk-in participant
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Payment Status Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleTogglePayment(guest)}
                        title="Click to toggle Payment Status"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold min-h-[44px] transition-colors border ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{isPaid ? 'Paid' : 'Not Paid'}</span>
                      </button>

                      {/* Attendance Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleAttendance(guest)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold min-h-[44px] transition-colors ${
                          isAttended
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isAttended ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span>Present</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-4 h-4 text-slate-400" />
                            <span>Mark Present</span>
                          </>
                        )}
                      </button>

                      {/* Delete Guest Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteGuest(guest.id)}
                        className="p-2 text-slate-400 hover:text-mfc-red rounded-md min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                        title="Remove guest"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 2. Render Community Members */}
              {filteredMembers.map((member) => {
                const participant = participants.find((p) => p.member_id === member.id);
                const isPaid = participant?.payment_status === 'Paid';
                const isAttended = participant?.attended ?? false;

                return (
                  <div
                    key={member.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 px-1 hover:bg-slate-50 transition-colors rounded-md"
                  >
                    <div>
                      <div className="font-semibold text-sm text-text-main">
                        {member.first_name} {member.last_name}
                      </div>
                      <div className="text-xs text-text-muted">
                        {member.academic_track || 'Member'} &middot;{' '}
                        {member.chapter_name || 'Unassigned'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Payment Status Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleTogglePayment(participant, member.id)}
                        title="Click to toggle Payment Status"
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold min-h-[44px] transition-colors border ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>{isPaid ? 'Paid' : 'Not Paid'}</span>
                      </button>

                      {/* Attendance Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleAttendance(participant, member.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold min-h-[44px] transition-colors ${
                          isAttended
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isAttended ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span>Present</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-4 h-4 text-slate-400" />
                            <span>Mark Present</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredGuests.length === 0 && filteredMembers.length === 0 && (
                <div className="py-8 text-center text-xs text-text-muted">
                  No participants matching &quot;{attendeeSearch}&quot;.
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-border-subtle">
            <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

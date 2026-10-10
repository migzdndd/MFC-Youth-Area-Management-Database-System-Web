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
  XCircle,
  UserPlus,
  Trash2,
  Search,
  CreditCard,
  AlertCircle,
  ChevronRight,
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

  // Payment Confirmation Prompt State
  const [paymentPrompt, setPaymentPrompt] = useState<{
    participant?: Participant;
    memberId?: string;
    name: string;
    currentStatus: 'Paid' | 'Not Paid';
    targetStatus: 'Paid' | 'Not Paid';
  } | null>(null);

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

    if (!name.trim()) {
      setFormError('Event Name is required.');
      return;
    }
    if (!startsAt.trim()) {
      setFormError('Date & Time is required.');
      return;
    }
    if (!venue.trim()) {
      setFormError('Venue Location is required.');
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

  const openEventDetails = (event: CommunityEvent) => {
    setSelectedEvent(event);
    setGuestName('');
    setGuestPaymentStatus(event.fee > 0 ? 'Not Paid' : 'Paid');
    setAttendeeSearch('');
    setGuestError('');
    setPaymentPrompt(null);
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

  // Trigger Payment Confirmation Prompt
  const promptPaymentChange = (
    name: string,
    participant: Participant | undefined,
    memberId?: string
  ) => {
    const currentStatus = participant?.payment_status === 'Paid' ? 'Paid' : 'Not Paid';
    const targetStatus = currentStatus === 'Paid' ? 'Not Paid' : 'Paid';
    setPaymentPrompt({
      participant,
      memberId,
      name,
      currentStatus,
      targetStatus,
    });
  };

  // Confirm Payment Status Update
  const handleConfirmPaymentToggle = async () => {
    if (!paymentPrompt || !selectedEvent) return;
    const { participant, memberId, targetStatus } = paymentPrompt;

    try {
      if (participant?.id) {
        await updateParticipant.mutateAsync({
          id: participant.id,
          event_id: selectedEvent.id,
          payment_status: targetStatus,
        });
      } else if (memberId) {
        await registerParticipant.mutateAsync({
          event_id: selectedEvent.id,
          member_id: memberId,
          attended: false,
          payment_status: targetStatus,
        });
      }
      setPaymentPrompt(null);
    } catch {
      alert('Failed to update payment status.');
    }
  };

  // Explicit Attendance buttons (Present vs Not Present)
  const handleSetAttendance = async (
    targetAttended: boolean,
    participant: Participant | undefined,
    memberId?: string
  ) => {
    if (!selectedEvent) return;
    try {
      if (participant?.id) {
        await updateParticipant.mutateAsync({
          id: participant.id,
          event_id: selectedEvent.id,
          attended: targetAttended,
        });
      } else if (memberId) {
        await registerParticipant.mutateAsync({
          event_id: selectedEvent.id,
          member_id: memberId,
          attended: targetAttended,
          payment_status: selectedEvent.fee > 0 ? 'Not Paid' : 'Paid',
        });
      }
    } catch {
      alert('Failed to update attendance status.');
    }
  };

  // Remove Guest participant
  const handleDeleteGuest = async (participantId: string) => {
    if (!selectedEvent) return;
    if (!confirm('Remove this guest participant from the event attendance list?')) return;
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
            Assemblies, youth camps, payment tracking, and area member attendance check-ins.
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
              role="button"
              tabIndex={0}
              onClick={() => openEventDetails(event)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openEventDetails(event);
                }
              }}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-navy/40 transition-all duration-200 flex flex-col justify-between group cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-navy/30"
              title="Click to view Attendance & Payments Data Grid"
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

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-navy group-hover:text-navy-light">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-navy" />
                  <span>View Attendance Grid</span>
                </span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Event Name"
            name="eventName"
            required
            placeholder="e.g. Monthly Chapter Assembly"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Date & Time"
            name="eventSchedule"
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />

          <Input
            label="Venue Location"
            name="eventVenue"
            required
            placeholder="Parish Hall / Camp Site"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          />

          <Input
            label="Registration Fee (PHP)"
            name="eventFee"
            type="number"
            min="0"
            step="1"
            placeholder="0 for Free"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
          />

          <div className="w-full flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-800">Description / Agenda (Optional)</label>
            <textarea
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm bg-white text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
              placeholder="Event details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createEvent.isPending}>
              Schedule Event
            </Button>
          </div>
        </form>
      </Modal>

      {/* Attendance & Payment Status Check-in Modal (Data Grid View) */}
      <Modal
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent ? `Attendance: ${selectedEvent.name}` : 'Attendance'}
        description={
          selectedEvent
            ? `${formatDateTime(selectedEvent.starts_at)} | ${selectedEvent.venue} | Fee: ${selectedEvent.fee > 0 ? formatCurrency(selectedEvent.fee) : 'Free'}`
            : ''
        }
        maxWidth="xl"
      >
        <div className="space-y-6">
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

          {/* SECTION 1: Data Grid View of Members inside the Area Database */}
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

            {participantsLoading ? (
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
                        const participant = participants.find((p) => p.member_id === member.id);
                        const isPaid = participant?.payment_status === 'Paid';
                        const isAttended = participant?.attended ?? false;
                        const fullName = `${member.first_name} ${member.last_name}`;

                        return (
                          <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
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

                            {/* Payment Status with Confirmation Prompt */}
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => promptPaymentChange(fullName, participant, member.id)}
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

                            {/* Present and Not Present Buttons */}
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                {/* Present Button */}
                                <button
                                  type="button"
                                  onClick={() => handleSetAttendance(true, participant, member.id)}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[38px] cursor-pointer border ${
                                    isAttended
                                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                      : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300'
                                  }`}
                                  title="Mark Present"
                                >
                                  <CheckCircle className={`w-3.5 h-3.5 ${isAttended ? 'text-white' : 'text-slate-400'}`} />
                                  <span>Present</span>
                                </button>

                                {/* Not Present Button */}
                                <button
                                  type="button"
                                  onClick={() => handleSetAttendance(false, participant, member.id)}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[38px] cursor-pointer border ${
                                    !isAttended
                                      ? 'bg-slate-200 text-slate-800 border-slate-300 shadow-2xs font-bold'
                                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                                  }`}
                                  title="Mark Not Present"
                                >
                                  <XCircle className={`w-3.5 h-3.5 ${!isAttended ? 'text-slate-600' : 'text-slate-400'}`} />
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

          {/* SECTION 2: Bottom Section for Adding Guests (Not in Area Database) */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-navy/10 text-navy">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Add Guests & Visiting Youth (Not inside Area Database)
                </h4>
                <p className="text-xs text-slate-500">
                  Quick check-in for walk-ins, companions, and non-registered guests.
                </p>
              </div>
            </div>

            {guestError && (
              <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md font-medium flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{guestError}</span>
              </div>
            )}

            {/* Guest Registration Form */}
            <form onSubmit={handleAddGuest} className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
              <input
                type="text"
                placeholder="Guest Full Name..."
                className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy min-h-[44px]"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />

              <select
                aria-label="Guest payment status"
                className="px-3.5 py-2.5 text-xs sm:text-sm bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy min-h-[44px]"
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
                className="shrink-0 min-h-[44px] flex items-center gap-1.5 font-bold"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Guest</span>
              </Button>
            </form>

            {/* Registered Guests Sub-Grid */}
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
                          <tr key={guest.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              <span>{gName}</span>
                              <span className="ml-2 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                                Guest
                              </span>
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => promptPaymentChange(gName, guest)}
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
                                  onClick={() => handleSetAttendance(true, guest)}
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
                                  onClick={() => handleSetAttendance(false, guest)}
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
                                onClick={() => handleDeleteGuest(guest.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                title="Remove guest"
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
            <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment Status Confirmation Prompt Modal */}
      <Modal
        isOpen={Boolean(paymentPrompt)}
        onClose={() => setPaymentPrompt(null)}
        title="Confirm Payment Status Change"
        maxWidth="sm"
      >
        {paymentPrompt && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <CreditCard className="w-5 h-5 text-navy shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Update payment record for <strong className="text-slate-900">{paymentPrompt.name}</strong> from{' '}
                <span className="font-bold text-amber-700">{paymentPrompt.currentStatus}</span> to{' '}
                <span className="font-bold text-emerald-700">{paymentPrompt.targetStatus}</span>?
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setPaymentPrompt(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmPaymentToggle}
                isLoading={updateParticipant.isPending || registerParticipant.isPending}
              >
                Confirm Update
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

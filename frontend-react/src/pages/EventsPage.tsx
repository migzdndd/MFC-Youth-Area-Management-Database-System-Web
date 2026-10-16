import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useEventParticipants,
  useRegisterParticipant,
  useUpdateParticipant,
  useDeleteParticipant,
} from '@/hooks/useEvents';
import { useMembers } from '@/hooks/useMembers';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EventCardSkeleton } from '@/components/ui/Skeleton';
import { CalendarPlus } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import type { CommunityEvent, Participant } from '@/types/event';
import {
  EventCard,
  EventFormModal,
  PaymentConfirmModal,
  type PaymentPromptData,
  AddGuestModal,
  EventAttendanceModal,
  EventSummaryModal,
  generateEventBriefingText,
} from '@/components/events';

export const EventsPage: React.FC = () => {
  const location = useLocation();
  const { data: events = [], isLoading } = useEvents();
  const { data: members = [] } = useMembers();
  const toast = useToast();

  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEventHook = useDeleteEvent();
  const registerParticipant = useRegisterParticipant();
  const updateParticipant = useUpdateParticipant();
  const deleteParticipant = useDeleteParticipant();

  const { user, activeArea } = useAuthStore();
  const isCoreRole = Boolean(user && user.role !== 'member');
  const isAreaAdmin =
    user?.role === 'national_coordinator' ||
    user?.role === 'area_servant' ||
    user?.role === 'couple_coordinator';

  const canUserEditEvent = (event?: CommunityEvent | null): boolean => {
    if (!event || !user) return false;
    if (!isCoreRole) return false;
    if (isAreaAdmin) return true;
    if (!event.created_by) return true;
    return event.created_by === user.id;
  };

  // Modal display states
  const [isCreateOpen, setIsCreateOpen] = useState(() =>
    Boolean((location.state as { openCreate?: boolean })?.openCreate && isCoreRole)
  );
  const [editingEvent, setEditingEvent] = useState<CommunityEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(null);
  const [viewSummaryEvent, setViewSummaryEvent] = useState<CommunityEvent | null>(null);
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
  const [hasCopiedBriefing, setHasCopiedBriefing] = useState(false);

  // Participants for modals
  const {
    data: participants = [],
    isLoading: participantsLoading,
  } = useEventParticipants(selectedEvent?.id || '');

  const {
    data: summaryParticipants = [],
    isLoading: summaryParticipantsLoading,
  } = useEventParticipants(viewSummaryEvent?.id || '');

  // Payment confirmation prompt state
  const [paymentPrompt, setPaymentPrompt] = useState<PaymentPromptData | null>(null);

  // Clear navigation state if openCreate was set
  useEffect(() => {
    if ((location.state as { openCreate?: boolean })?.openCreate) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Briefing copy handler
  const handleCopyBriefing = (event: CommunityEvent) => {
    const text = generateEventBriefingText(event, activeArea?.name);
    navigator.clipboard.writeText(text);
    setHasCopiedBriefing(true);
    toast.success('Event briefing copied to clipboard.', 'Copied');
    setTimeout(() => setHasCopiedBriefing(false), 2500);
  };

  // Create / Edit modal openers
  const openCreateModal = () => {
    setEditingEvent(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (event: CommunityEvent) => {
    setEditingEvent(event);
    setIsCreateOpen(true);
  };

  // Save Event mutation
  const handleSaveEvent = async (payload: {
    name: string;
    starts_at: string;
    venue: string;
    fee: number;
    description: string;
  }) => {
    if (editingEvent) {
      await updateEvent.mutateAsync({
        id: editingEvent.id,
        ...payload,
      });
      if (selectedEvent?.id === editingEvent.id) {
        setSelectedEvent((prev) => (prev ? { ...prev, ...payload } : null));
      }
      if (viewSummaryEvent?.id === editingEvent.id) {
        setViewSummaryEvent((prev) => (prev ? { ...prev, ...payload } : null));
      }
      toast.success('Event details have been updated successfully.', 'Event Updated');
    } else {
      await createEvent.mutateAsync(payload);
      toast.success('Community gathering has been scheduled.', 'Event Created');
    }
    setEditingEvent(null);
  };

  // Delete Event mutation
  const handleDeleteEvent = async (event: CommunityEvent) => {
    if (!window.confirm(`Are you sure you want to delete event "${event.name}"?`)) {
      return;
    }
    try {
      await deleteEventHook.mutateAsync(event.id);
      if (selectedEvent?.id === event.id) {
        setSelectedEvent(null);
      }
      if (viewSummaryEvent?.id === event.id) {
        setViewSummaryEvent(null);
      }
      toast.success(`Event "${event.name}" was removed.`, 'Event Deleted');
    } catch {
      toast.error('Failed to delete event.', 'Error');
    }
  };

  // Open Details (Attendance Data Grid)
  const openEventDetails = (event: CommunityEvent) => {
    setSelectedEvent(event);
    setPaymentPrompt(null);
  };

  // Add Guest mutation
  const handleAddGuest = async (payload: {
    name: string;
    paymentStatus: 'Paid' | 'Not Paid';
  }) => {
    if (!selectedEvent) return;
    try {
      await registerParticipant.mutateAsync({
        event_id: selectedEvent.id,
        non_member_name: payload.name,
        payment_status: payload.paymentStatus,
        attended: true,
      });
      toast.success(`${payload.name} registered as guest!`, 'Guest Added');
      setIsAddGuestModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record participant.';
      toast.error(msg, 'Registration Failed');
      throw err;
    }
  };

  // Payment Confirmation trigger & update
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
      toast.error('Failed to update payment status.', 'Error');
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
      toast.error('Failed to update attendance status.', 'Error');
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
      toast.success('Guest participant removed.', 'Removed');
    } catch {
      toast.error('Failed to delete participant.', 'Error');
    }
  };

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
          <p className="text-xs text-slate-500">
            {isCoreRole
              ? 'Schedule, manage, and coordinate community events and youth assemblies.'
              : 'View community event schedules, briefings, and attendance rosters.'}
          </p>
        </div>

        {isCoreRole && (
          <Button onClick={openCreateModal} className="flex items-center gap-2 shrink-0">
            <CalendarPlus className="w-4 h-4" />
            <span>Schedule Event</span>
          </Button>
        )}
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={`event-skel-${i}`} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-2xs">
          <CalendarPlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900">No upcoming events</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Schedule a chapter assembly or youth camp gathering to start tracking community attendance.
          </p>
          {isCoreRole && (
            <Button onClick={openCreateModal} className="mt-4" size="sm">
              Schedule First Event
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              canEdit={canUserEditEvent(event)}
              onOpenDetails={openEventDetails}
              onViewSummary={(evt) => setViewSummaryEvent(evt)}
              onEdit={openEditModal}
              onDelete={handleDeleteEvent}
            />
          ))}
        </div>
      )}

      {/* Schedule / Edit Event Modal */}
      <EventFormModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingEvent(null);
        }}
        editingEvent={editingEvent}
        onSave={handleSaveEvent}
        isSubmitting={editingEvent ? updateEvent.isPending : createEvent.isPending}
      />

      {/* Attendance & Payment Status Check-in Modal */}
      <EventAttendanceModal
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
        canEdit={canUserEditEvent(selectedEvent)}
        members={members}
        participants={participants}
        isLoadingParticipants={participantsLoading}
        onOpenSummary={(evt) => setViewSummaryEvent(evt)}
        onOpenEdit={(evt) => openEditModal(evt)}
        onPromptPayment={promptPaymentChange}
        onSetAttendance={handleSetAttendance}
        onOpenAddGuest={() => setIsAddGuestModalOpen(true)}
        onDeleteGuest={handleDeleteGuest}
      />

      {/* Add Guest Modal */}
      <AddGuestModal
        isOpen={isAddGuestModalOpen}
        onClose={() => setIsAddGuestModalOpen(false)}
        members={members}
        eventFee={selectedEvent?.fee ?? 0}
        onAddGuest={handleAddGuest}
        isSubmitting={registerParticipant.isPending}
      />

      {/* Payment Confirmation Prompt Modal */}
      <PaymentConfirmModal
        prompt={paymentPrompt}
        onClose={() => setPaymentPrompt(null)}
        onConfirm={handleConfirmPaymentToggle}
        isConfirming={updateParticipant.isPending || registerParticipant.isPending}
      />

      {/* Comprehensive View-Only Event Summary Modal */}
      <EventSummaryModal
        isOpen={Boolean(viewSummaryEvent)}
        onClose={() => setViewSummaryEvent(null)}
        event={viewSummaryEvent}
        areaName={activeArea?.name}
        canEdit={canUserEditEvent(viewSummaryEvent)}
        summaryParticipants={summaryParticipants}
        isLoadingParticipants={summaryParticipantsLoading}
        hasCopiedBriefing={hasCopiedBriefing}
        onCopyBriefing={handleCopyBriefing}
        onOpenAttendance={(evt) => openEventDetails(evt)}
        onOpenEdit={(evt) => openEditModal(evt)}
      />
    </div>
  );
};

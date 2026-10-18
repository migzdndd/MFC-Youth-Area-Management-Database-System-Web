import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { Member, AcademicTrack, MemberStatus } from '@/types/member';
import type { Chapter } from '@/types/chapter';

export interface MemberFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  nickname: string;
  gender: 'Male' | 'Female';
  chapterId: string;
  track: AcademicTrack;
  service: string;
  contact: string;
  email: string;
  status: MemberStatus;
  guardianName: string;
  guardianContact: string;
}

export interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingMember: Member | null;
  chapters: Chapter[];
  ministryOptions: string[];
  onSave: (data: MemberFormData) => Promise<void>;
  isSubmitting: boolean;
}

interface MemberFormContentProps {
  editingMember: Member | null;
  chapters: Chapter[];
  ministryOptions: string[];
  onSave: (data: MemberFormData) => Promise<void>;
  isSubmitting: boolean;
  onClose: () => void;
}

const MemberFormContent: React.FC<MemberFormContentProps> = ({
  editingMember,
  chapters,
  ministryOptions,
  onSave,
  isSubmitting,
  onClose,
}) => {
  const [firstName, setFirstName] = useState(editingMember?.first_name || '');
  const [middleName, setMiddleName] = useState(editingMember?.middle_name || '');
  const [lastName, setLastName] = useState(editingMember?.last_name || '');
  const [nickname, setNickname] = useState(editingMember?.nickname || '');
  const [gender, setGender] = useState<'Male' | 'Female'>(editingMember?.gender === 'Female' ? 'Female' : 'Male');
  const [chapterId, setChapterId] = useState(editingMember?.chapter_id || chapters[0]?.id || '');
  const [track, setTrack] = useState<AcademicTrack>((editingMember?.academic_track as AcademicTrack) || 'College');
  const [service, setService] = useState(
    editingMember?.service || (editingMember?.assigned_services && editingMember.assigned_services[0]) || ''
  );
  const [contact, setContact] = useState(editingMember?.contact || editingMember?.contact_number || '');
  const [email, setEmail] = useState(editingMember?.email || '');
  const [status, setStatus] = useState<MemberStatus>(
    editingMember?.status?.toLowerCase() === 'inactive' ? 'inactive' : 'active'
  );
  const [guardianName, setGuardianName] = useState(editingMember?.guardian_name || '');
  const [guardianContact, setGuardianContact] = useState(editingMember?.guardian_contact || '');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Field-level validation
    const errors: Record<string, string> = {};
    const cleanFirst = firstName.trim();
    const cleanMiddle = middleName.trim();
    const cleanLast = lastName.trim();
    const cleanEmail = email.trim();
    const cleanContact = contact.trim();
    const cleanGuardianContact = guardianContact.trim();

    if (!cleanFirst) {
      errors.firstName = 'First name is required.';
    } else if (cleanFirst.length < 2) {
      errors.firstName = 'First name must be at least 2 characters.';
    }

    if (!cleanLast) {
      errors.lastName = 'Last name is required.';
    } else if (cleanLast.length < 2) {
      errors.lastName = 'Last name must be at least 2 characters.';
    }

    if (!cleanEmail) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = 'Please provide a valid email address (e.g., name@example.com).';
    }

    if (cleanContact && !/^[0-9+()\-\s]{7,20}$/.test(cleanContact)) {
      errors.contact = 'Please enter a valid phone number (at least 7 digits).';
    }

    if (cleanGuardianContact && !/^[0-9+()\-\s]{7,20}$/.test(cleanGuardianContact)) {
      errors.guardianContact = 'Please enter a valid emergency contact number.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Please resolve the highlighted field errors before saving.');
      return;
    }

    try {
      await onSave({
        firstName: cleanFirst,
        middleName: cleanMiddle,
        lastName: cleanLast,
        nickname: nickname.trim(),
        gender,
        chapterId,
        track,
        service,
        contact: cleanContact,
        email: cleanEmail,
        status,
        guardianName: guardianName.trim(),
        guardianContact: cleanGuardianContact,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save member record.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="p-3 text-xs text-mfc-red bg-red-50 border border-red-200 rounded-md font-medium">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          label="First Name"
          name="firstName"
          autoComplete="given-name"
          required
          value={firstName}
          onChange={(e) => {
            setFirstName(e.target.value);
            if (fieldErrors.firstName) setFieldErrors((prev) => ({ ...prev, firstName: '' }));
          }}
          error={fieldErrors.firstName}
        />
        <Input
          label="Middle Name"
          name="middleName"
          autoComplete="additional-name"
          placeholder="Optional"
          value={middleName}
          onChange={(e) => setMiddleName(e.target.value)}
        />
        <Input
          label="Last Name"
          name="lastName"
          autoComplete="family-name"
          required
          value={lastName}
          onChange={(e) => {
            setLastName(e.target.value);
            if (fieldErrors.lastName) setFieldErrors((prev) => ({ ...prev, lastName: '' }));
          }}
          error={fieldErrors.lastName}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Nickname"
          name="nickname"
          autoComplete="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <Select
          label="Gender"
          name="gender"
          value={gender}
          onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
          options={[
            { value: 'Male', label: 'Male' },
            { value: 'Female', label: 'Female' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Chapter"
          name="chapterId"
          value={chapterId}
          onChange={(e) => setChapterId(e.target.value)}
          options={[
            { value: '', label: 'Unassigned' },
            ...chapters.map((c) => ({ value: c.id, label: c.name })),
          ]}
        />
        <Select
          label="Academic Track"
          name="academicTrack"
          value={track}
          onChange={(e) => setTrack(e.target.value as AcademicTrack)}
          options={[
            { value: 'High School', label: 'High School' },
            { value: 'Senior High School', label: 'Senior High School' },
            { value: 'College', label: 'College' },
            { value: 'Working', label: 'Working' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Select
          label="Ministry Service Track"
          name="service"
          value={service}
          onChange={(e) => setService(e.target.value)}
          options={[
            { value: '', label: 'Unassigned / None' },
            ...ministryOptions.map((s) => ({ value: s, label: s })),
          ]}
        />
        <Select
          label="Membership Status"
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as MemberStatus)}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Mobile Number"
          name="contact"
          autoComplete="tel"
          value={contact}
          onChange={(e) => {
            setContact(e.target.value);
            if (fieldErrors.contact) setFieldErrors((prev) => ({ ...prev, contact: '' }));
          }}
          placeholder="09123456789"
          error={fieldErrors.contact}
        />
        <Input
          label="Email Address"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
          }}
          placeholder="name@example.com"
          error={fieldErrors.email}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Guardian Name"
          name="guardianName"
          autoComplete="name"
          value={guardianName}
          onChange={(e) => setGuardianName(e.target.value)}
          placeholder="Parent or Guardian"
        />
        <Input
          label="Guardian Contact"
          name="guardianContact"
          autoComplete="tel"
          value={guardianContact}
          onChange={(e) => {
            setGuardianContact(e.target.value);
            if (fieldErrors.guardianContact) setFieldErrors((prev) => ({ ...prev, guardianContact: '' }));
          }}
          placeholder="Emergency phone number"
          error={fieldErrors.guardianContact}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
        >
          {editingMember ? 'Save Changes' : 'Register Member'}
        </Button>
      </div>
    </form>
  );
};

export const MemberFormModal: React.FC<MemberFormModalProps> = (props) => {
  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={props.editingMember ? 'Edit Member Record' : 'Register New Member'}
      maxWidth="lg"
    >
      {props.isOpen && (
        <MemberFormContent
          key={props.editingMember?.id || 'new-member'}
          {...props}
        />
      )}
    </Modal>
  );
};

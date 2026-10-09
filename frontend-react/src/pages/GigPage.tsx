import React, { useState } from 'react';
import { useGigRecords, useCreateGigRecord } from '@/hooks/useGig';
import { useMembers } from '@/hooks/useMembers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { formatCurrency, formatDate } from '@/lib/utils';
import { HeartHandshake, Plus, TrendingUp } from 'lucide-react';

export const GigPage: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const { data: records = [], isLoading } = useGigRecords(selectedMonth);
  const { data: members = [] } = useMembers();
  const createGig = useCreateGigRecord();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [contributionDate, setContributionDate] = useState(() =>
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const totalCollected = records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const openModal = () => {
    setMemberId(members[0]?.id || '');
    setAmount('');
    setContributionDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const parsedAmount = parseFloat(amount);
    if (!memberId || isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please select a member and specify a valid contribution amount.');
      return;
    }

    try {
      await createGig.mutateAsync({
        member_id: memberId,
        amount: parsedAmount,
        contribution_date: contributionDate,
        notes: notes.trim(),
      });
      setIsModalOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Failed to record GIG contribution.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h1 className="text-2xl font-bold text-text-main font-heading tracking-tight">
            Give It Generously (GIG) Stewardship
          </h1>
          <p className="text-sm text-text-muted">
            Voluntary tithes and mission stewardship supporting youth activities and evangelization.
          </p>
        </div>

        <Button onClick={openModal} className="flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span>Record Contribution</span>
        </Button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-border-subtle rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-text-muted">Total Collections Recorded</span>
            <div className="text-2xl font-bold text-navy font-heading mt-1">
              {formatCurrency(totalCollected)}
            </div>
            <p className="text-xs text-text-muted mt-0.5">Voluntary youth tithes</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-border-subtle rounded-xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-text-muted">Total Givers Logged</span>
            <div className="text-2xl font-bold text-text-main font-heading mt-1">
              {records.length}
            </div>
            <p className="text-xs text-text-muted mt-0.5">Individual stewardship entries</p>
          </div>
          <div className="p-3 bg-navy/10 text-navy rounded-lg">
            <HeartHandshake className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-border-subtle rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border-subtle flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-main font-heading">Stewardship Ledger</h2>
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-auto text-xs py-1.5 min-h-[36px]"
          />
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <HeartHandshake className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-text-main">No GIG records found</h3>
            <p className="text-xs text-text-muted mt-1">
              Record youth tithes and offerings to maintain faithful pastoral stewardship.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold text-text-muted uppercase border-b border-border-subtle tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Member Name</th>
                  <th className="px-5 py-3.5">Notes</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {records.map((r) => {
                  const member = members.find((m) => m.id === r.member_id);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 text-xs font-medium text-text-muted whitespace-nowrap">
                        {formatDate(r.contribution_date)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-text-main">
                        {member ? `${member.first_name} ${member.last_name}` : 'Youth Member'}
                      </td>
                      <td className="px-5 py-4 text-xs text-text-muted">{r.notes || '-'}</td>
                      <td className="px-5 py-4 text-right font-bold text-navy whitespace-nowrap">
                        {formatCurrency(r.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record GIG Stewardship"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 text-xs text-mfc-red bg-red-50 border border-red-200 rounded-md font-medium">
              {formError}
            </div>
          )}

          <Select
            label="Contributing Member"
            required
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            options={[
              { value: '', label: 'Select Member' },
              ...members.map((m) => ({
                value: m.id,
                label: `${m.first_name} ${m.last_name} (${m.academic_track || 'Member'})`,
              })),
            ]}
          />

          <Input
            label="Contribution Amount (PHP)"
            type="number"
            step="0.01"
            min="1"
            required
            placeholder="e.g. 100.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Input
            label="Date of Contribution"
            type="date"
            required
            value={contributionDate}
            onChange={(e) => setContributionDate(e.target.value)}
          />

          <Input
            label="Notes / Intentions (Optional)"
            placeholder="e.g. Monthly household tithe"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createGig.isPending}>
              Record GIG
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

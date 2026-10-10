import React, { useState } from 'react';
import { useGigRecords, useCreateGigRecord } from '@/hooks/useGig';
import { useMembers } from '@/hooks/useMembers';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
              Give It Generously (GIG) Stewardship
            </h1>
            <Badge variant="gold">Tithes & Mission</Badge>
          </div>
          <p className="text-sm text-slate-600">
            Voluntary tithes and mission stewardship supporting youth gatherings and evangelization.
          </p>
        </div>

        <Button onClick={openModal} className="flex items-center gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span>Record Contribution</span>
        </Button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Collections Recorded</span>
            <div className="text-3xl font-bold text-navy font-heading mt-1">
              {formatCurrency(totalCollected)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Voluntary youth tithes</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200/80 shadow-2xs">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Givers Logged</span>
            <div className="text-3xl font-bold text-slate-900 font-heading mt-1">
              {records.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">Individual stewardship entries</p>
          </div>
          <div className="p-3 bg-navy/10 text-navy rounded-xl border border-navy/15 shadow-2xs">
            <HeartHandshake className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 font-heading">Stewardship Ledger</h2>
            <p className="text-xs text-slate-500">Historical records of voluntary contributions</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Month:</span>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-auto text-xs py-1.5 min-h-[38px]"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <span className="text-xs text-slate-500">Loading contribution records...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center">
            <HeartHandshake className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">No GIG records found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Record youth tithes and offerings to maintain faithful pastoral stewardship.
            </p>
            <Button onClick={openModal} className="mt-4" size="sm">
              Record First Tithe
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-xs font-bold text-slate-600 uppercase border-b border-border-subtle tracking-wider">
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
                        <td className="px-5 py-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                          {formatDate(r.contribution_date)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {member ? `${member.first_name} ${member.last_name}` : 'Youth Member'}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600">{r.notes || '-'}</td>
                        <td className="px-5 py-4 text-right font-bold text-emerald-700 whitespace-nowrap">
                          <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
                            {formatCurrency(r.amount)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-border-subtle p-3 space-y-3">
              {records.map((r) => {
                const member = members.find((m) => m.id === r.member_id);
                return (
                  <div key={r.id} className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold text-slate-500">
                          {formatDate(r.contribution_date)}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                          {member ? `${member.first_name} ${member.last_name}` : 'Youth Member'}
                        </h4>
                      </div>
                      <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold shrink-0">
                        {formatCurrency(r.amount)}
                      </span>
                    </div>
                    {r.notes && (
                      <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/70">
                        {r.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
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

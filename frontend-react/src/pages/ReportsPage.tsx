import React, { useState } from 'react';
import { useReports, useCreateReport } from '@/hooks/useReports';
import { useChapters } from '@/hooks/useChapters';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import { FilePlus, FileText, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ReportsPage: React.FC = () => {
  const { data: reports = [], isLoading } = useReports();
  const { data: chapters = [] } = useChapters();
  const createReport = useCreateReport();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [activityDate, setActivityDate] = useState('');
  const [participantCount, setParticipantCount] = useState('0');
  const [reportType, setReportType] = useState('Chapter Assembly');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const openCreateModal = () => {
    setTitle('');
    setChapterId(chapters[0]?.id || '');
    setActivityDate(new Date().toISOString().split('T')[0]);
    setParticipantCount('0');
    setReportType('Chapter Assembly');
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim() || !activityDate) {
      setFormError('Activity title and date are required.');
      return;
    }

    try {
      await createReport.mutateAsync({
        title: title.trim(),
        chapter_id: chapterId,
        activity_date: activityDate,
        participant_count: parseInt(participantCount, 10) || 0,
        report_type: reportType,
        notes: notes.trim(),
      });
      setIsModalOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Failed to record activity report.');
      }
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('MFC Youth Activity Reports Summary', 14, 18);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 25);

    const tableRows = reports.map((r) => [
      formatDate(r.activity_date),
      r.title,
      r.report_type,
      chapters.find((c) => c.id === r.chapter_id)?.name || 'General',
      String(r.participant_count),
    ]);

    autoTable(doc, {
      head: [['Date', 'Title', 'Type', 'Chapter', 'Headcount']],
      body: tableRows,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [0, 40, 71] },
    });

    doc.save('MFC_Youth_Activity_Reports.pdf');
  };

  const totalHeadcount = reports.reduce((acc, r) => acc + (r.participant_count || 0), 0);
  const avgHeadcount = reports.length > 0 ? Math.round(totalHeadcount / reports.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
              Activity Reports & Pastoral Logs
            </h1>
            <Badge variant="navy">
              {reports.length} {reports.length === 1 ? 'Report' : 'Reports'}
            </Badge>
          </div>
          <p className="text-sm text-slate-600">
            Documentation for chapter assemblies, household cells, and community pastoral missions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {reports.length > 0 && (
            <Button variant="secondary" onClick={exportPDF} className="flex items-center gap-2">
              <Download className="w-4 h-4 text-navy" />
              <span>Export PDF</span>
            </Button>
          )}

          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <FilePlus className="w-4 h-4" />
            <span>File Report</span>
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Reports Filed</span>
          <div className="text-3xl font-bold text-slate-900 font-heading mt-1">
            {reports.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Documented activities</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Youth Reached</span>
          <div className="text-3xl font-bold text-navy font-heading mt-1">
            {totalHeadcount}
          </div>
          <p className="text-xs text-slate-500 mt-1">Cumulative participants logged</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Average Attendance</span>
          <div className="text-3xl font-bold text-emerald-700 font-heading mt-1">
            {avgHeadcount}
          </div>
          <p className="text-xs text-slate-500 mt-1">Youth per activity</p>
        </div>
      </div>

      {/* Reports Table & Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <span className="text-xs text-slate-500 font-medium">Loading activity reports...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">No activity reports recorded</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              File a pastoral report following a chapter assembly or household meeting to track ministry growth.
            </p>
            <Button onClick={openCreateModal} className="mt-4" size="sm">
              File First Report
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/80 text-xs font-bold text-slate-600 uppercase border-b border-border-subtle tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Activity Date</th>
                    <th className="px-5 py-3.5">Report Title</th>
                    <th className="px-5 py-3.5">Type</th>
                    <th className="px-5 py-3.5">Chapter</th>
                    <th className="px-5 py-3.5 text-right">Headcount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 text-xs font-semibold text-slate-700 whitespace-nowrap">
                        {formatDate(report.activity_date)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{report.title}</div>
                        {report.notes && (
                          <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{report.notes}</div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        <Badge variant="navy">{report.report_type}</Badge>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-600">
                        {report.chapter_name ||
                          chapters.find((c) => c.id === report.chapter_id)?.name ||
                          'Area-wide'}
                      </td>
                      <td className="px-5 py-4 text-xs font-bold text-navy text-right whitespace-nowrap">
                        <span className="bg-navy/10 text-navy px-2.5 py-1 rounded-full font-bold">
                          {report.participant_count} youth
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-border-subtle p-3 space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-amber-700">
                        {formatDate(report.activity_date)}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                        {report.title}
                      </h4>
                    </div>
                    <span className="bg-navy/10 text-navy px-2 py-0.5 rounded-full text-xs font-bold shrink-0">
                      {report.participant_count} youth
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-xs pt-1">
                    <Badge variant="navy">{report.report_type}</Badge>
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium">
                      {report.chapter_name || chapters.find((c) => c.id === report.chapter_id)?.name || 'Area-wide'}
                    </span>
                  </div>

                  {report.notes && (
                    <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/70">
                      {report.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* File Report Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="File Activity Documentation"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {formError && (
            <div className="p-3 text-xs text-mfc-red bg-red-50 border border-red-200 rounded-md font-medium">
              {formError}
            </div>
          )}

          <Input
            label="Activity Title"
            required
            placeholder="e.g. November Chapter Assembly & Fellowship"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Date of Activity"
              type="date"
              required
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
            />
            <Input
              label="Participant Headcount"
              type="number"
              min="0"
              required
              value={participantCount}
              onChange={(e) => setParticipantCount(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Host Chapter"
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              options={[
                { value: '', label: 'Select Chapter' },
                ...chapters.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />

            <Select
              label="Report Category"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              options={[
                { value: 'Chapter Assembly', label: 'Chapter Assembly' },
                { value: 'Household Meeting', label: 'Household Meeting' },
                { value: 'External Engagement', label: 'External Engagement' },
              ]}
            />
          </div>

          <div className="w-full flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-main">
              Activity Notes & Pastoral Highlights
            </label>
            <textarea
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm bg-white text-text-main border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy"
              placeholder="Summary of activity, worship, and fellowship..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createReport.isPending}>
              Save Activity Report
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

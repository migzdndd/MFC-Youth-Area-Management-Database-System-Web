import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatDateTime } from '@/lib/utils';

export interface TableInspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string | null;
  tableData: Record<string, unknown>[];
  isLoading: boolean;
}

const FRIENDLY_TABLE_INFO: Record<string, { label: string; previewTitle: string; previewDesc: string }> = {
  members: {
    label: 'Members Directory',
    previewTitle: 'Members Directory Preview',
    previewDesc: 'Showing recent youth member records saved in the community.',
  },
  chapters: {
    label: 'Registered Chapters',
    previewTitle: 'Registered Chapters Preview',
    previewDesc: 'Showing recent youth chapters registered across areas.',
  },
  areas: {
    label: 'Area Communities',
    previewTitle: 'Area Communities Preview',
    previewDesc: 'Showing registered Area community divisions.',
  },
  events: {
    label: 'Community Events',
    previewTitle: 'Community Events Preview',
    previewDesc: 'Showing recent youth events, camps, and gatherings.',
  },
  event_participants: {
    label: 'Event Attendance',
    previewTitle: 'Event Attendance Preview',
    previewDesc: 'Showing recent attendee registrations and confirmations.',
  },
  activity_reports: {
    label: 'Activity Reports',
    previewTitle: 'Activity Reports Preview',
    previewDesc: 'Showing recent pastoral activity reports filed by servant leaders.',
  },
  services: {
    label: 'Universal Services',
    previewTitle: 'Universal Services Preview',
    previewDesc: 'Showing available pastoral service categories in the system.',
  },
  profiles: {
    label: 'Servant Accounts',
    previewTitle: 'Servant Accounts Preview',
    previewDesc: 'Showing registered servant leader account profiles.',
  },
};

const isTechnicalIdColumn = (col: string): boolean => {
  const lower = col.toLowerCase();
  return lower === 'id' || lower.endsWith('_id') || lower.endsWith('id');
};

const isUuid = (val: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

const formatColumnHeader = (col: string): string => {
  const customNames: Record<string, string> = {
    created_at: 'Date Created',
    updated_at: 'Last Updated',
    created_by: 'Created By',
    starts_at: 'Start Time',
    ends_at: 'End Time',
    first_name: 'First Name',
    last_name: 'Last Name',
    middle_name: 'Middle Name',
    must_change_password: 'Password Reset',
    is_active: 'Active Account',
    is_developer: 'Developer Access',
    report_type: 'Report Category',
    manual_attendance: 'Attendance',
    payment_status: 'Payment Status',
    venue: 'Location / Venue',
    fee: 'Fee',
    status: 'Status',
    role: 'Assigned Role',
    email: 'Email Address',
    name: 'Name',
    description: 'Description',
    title: 'Title',
    activity_date: 'Activity Date',
    participant_count: 'Headcount',
    notes: 'Notes / Remarks',
    code: 'Area Code',
  };
  if (customNames[col]) return customNames[col];
  return col.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatCellValue = (val: unknown): string => {
  if (val === null || val === undefined || val === '') return 'None';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'object') return JSON.stringify(val);
  const str = String(val);
  if (isUuid(str)) return 'Active Record';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(str)) {
    return formatDateTime(str);
  }
  return str;
};

export const TableInspectModal: React.FC<TableInspectModalProps> = ({
  isOpen,
  onClose,
  tableName,
  tableData,
  isLoading,
}) => {
  const info = FRIENDLY_TABLE_INFO[tableName || ''];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={info?.previewTitle || 'Record Preview'}
      description={info?.previewDesc || 'Showing recent entries sorted by newest first.'}
      maxWidth="xl"
    >
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <Spinner size="lg" />
            <span className="text-xs text-slate-500">Loading records...</span>
          </div>
        ) : tableData.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            No records found in this category.
          </div>
        ) : (() => {
          const rawCols = Object.keys(tableData[0] || {});
          const filteredCols = rawCols.filter((col) => !isTechnicalIdColumn(col));
          const activeCols = filteredCols.length > 0 ? filteredCols : rawCols;

          return (
            <div className="overflow-x-auto max-h-[50vh] rounded-xl border border-slate-200">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-200">
                  <tr>
                    {activeCols.map((col) => (
                      <th key={col} className="p-2.5 px-3 border-r border-slate-200/80 whitespace-nowrap">
                        {formatColumnHeader(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans text-[11px]">
                  {tableData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      {activeCols.map((col) => {
                        const val = row[col];
                        const renderedVal = formatCellValue(val);

                        return (
                          <td
                            key={col}
                            className="p-2.5 px-3 border-r border-slate-100 max-w-[200px] truncate text-slate-800"
                            title={renderedVal}
                          >
                            {renderedVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}

        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <span className="text-xs text-slate-500">
            Showing top {tableData.length} newest entries (View only)
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="min-h-[36px]"
          >
            Close Preview
          </Button>
        </div>
      </div>
    </Modal>
  );
};

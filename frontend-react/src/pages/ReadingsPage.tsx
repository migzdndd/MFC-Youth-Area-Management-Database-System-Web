import React, { useState } from 'react';
import { useDailyReadings } from '@/hooks/useReadings';
import { Spinner } from '@/components/ui/Spinner';
import { Input } from '@/components/ui/Input';
import { BookOpen, Calendar, ExternalLink } from 'lucide-react';

export const ReadingsPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(() =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
  );

  const { data, isLoading } = useDailyReadings(selectedDate);

  return (
    <div className="space-y-4 max-w-4xl mx-auto animate-page-enter">
      {/* Header */}
      <div className="bg-white dark:bg-[#0e1e36] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-heading tracking-tight">
          Daily Catholic Scripture Readings
        </h1>

        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/80 p-1 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0">
          <Calendar className="w-4 h-4 text-navy dark:text-sky-400 shrink-0" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto text-xs py-1 min-h-[36px] border-0 bg-transparent shadow-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-[#0e1e36] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 shadow-2xs">
          <Spinner size="lg" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading liturgical scriptures...</span>
        </div>
      ) : !data || !data.readings || data.readings.length === 0 ? (
        <div className="bg-white dark:bg-[#0e1e36] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-8 text-center shadow-2xs">
          <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Scriptures unavailable for this date</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Please check your network connection or verify the liturgical date selected.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Celebration Header */}
          <div className="bg-navy-deep text-white rounded-2xl p-5 sm:p-6 border border-navy-surface shadow-xs relative overflow-hidden">
            <span className="text-xs font-semibold text-amber-300 font-heading tracking-wide">
              {data.day}, {data.date}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-white mt-1 leading-snug">
              {data.celebration || 'Holy Mass of the Day'}
            </h2>
            {data.source?.url && (
              <a
                href={data.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-amber-200 hover:text-white mt-3 underline transition-colors"
              >
                <span>Read source feed on EWTN</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Readings Section */}
          <div className="space-y-3">
            {data.readings.map((reading, idx) => (
              <article
                key={idx}
                className="bg-white dark:bg-[#0e1e36] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3 card-interactive"
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-2xs" />
                    <h3 className="text-sm font-bold text-navy dark:text-sky-300 font-heading">
                      {reading.type}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                    {reading.reference}
                  </span>
                </div>

                {reading.text ? (
                  <div className="text-sm sm:text-base text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-line font-serif pl-3.5 border-l-2 border-amber-400/60 dark:border-amber-400/40">
                    {reading.text}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    Reading reference: {reading.reference}.
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

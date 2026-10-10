import React, { useState } from 'react';
import { useDailyReadings } from '@/hooks/useReadings';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
              Daily Catholic Mass Scripture Readings
            </h1>
            <Badge variant="gold">Daily Word</Badge>
          </div>
          <p className="text-sm text-slate-600">
            Liturgical Mass readings synchronized to Philippine Standard Time (Asia/Manila).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1.5 px-3 rounded-xl border border-slate-200 shadow-2xs shrink-0">
          <Calendar className="w-4 h-4 text-navy shrink-0" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto text-xs py-1.5 min-h-[38px] border-0 bg-transparent shadow-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 flex flex-col items-center justify-center gap-3 shadow-2xs">
          <Spinner size="lg" />
          <span className="text-xs text-slate-500 font-medium">Loading liturgical scriptures...</span>
        </div>
      ) : !data || !data.readings || data.readings.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center shadow-2xs">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900">Scriptures unavailable for this date</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Please check your network connection or verify the liturgical date selected.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Celebration Header */}
          <div className="bg-navy-deep text-white rounded-2xl p-6 sm:p-7 shadow-md border border-navy-surface">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-widest font-heading">
              {data.day}, {data.date}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-white mt-1.5 leading-snug">
              {data.celebration || 'Holy Mass of the Day'}
            </h2>
            {data.source?.url && (
              <a
                href={data.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-amber-200 hover:text-white mt-4 underline transition-colors"
              >
                <span>Read source feed on EWTN</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Readings Section */}
          <div className="space-y-4">
            {data.readings.map((reading, idx) => (
              <article
                key={idx}
                className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-2xs space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <h3 className="text-sm font-bold text-navy uppercase tracking-wider font-heading">
                      {reading.type}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                    {reading.reference}
                  </span>
                </div>

                {reading.text ? (
                  <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line font-serif pl-2 border-l-2 border-amber-200/60">
                    {reading.text}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
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

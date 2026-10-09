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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h1 className="text-2xl font-bold text-text-main font-heading tracking-tight">
            Daily Catholic Mass Scripture Readings
          </h1>
          <p className="text-sm text-text-muted">
            Liturgical Mass readings synchronized to Philippine Standard Time (Asia/Manila).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-navy shrink-0" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto text-xs py-1.5 min-h-[38px]"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white border border-border-subtle rounded-xl p-12 flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <span className="text-xs text-text-muted">Loading liturgical scriptures...</span>
        </div>
      ) : !data || !data.readings || data.readings.length === 0 ? (
        <div className="bg-white border border-border-subtle rounded-xl p-12 text-center">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-text-main">Scriptures unavailable for this date</h3>
          <p className="text-xs text-text-muted mt-1">
            Please check your network connection or verify the date selected.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Celebration Header */}
          <div className="bg-navy-deep text-white rounded-xl p-6 shadow-2xs border border-navy-surface">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider font-heading">
              {data.day}, {data.date}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-white mt-1">
              {data.celebration || 'Holy Mass of the Day'}
            </h2>
            {data.source?.url && (
              <a
                href={data.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-amber-200/90 hover:text-white mt-3 underline transition-colors"
              >
                <span>Read source feed on EWTN</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Readings Section */}
          <div className="space-y-4">
            {data.readings.map((reading, idx) => (
              <article
                key={idx}
                className="bg-white border border-border-subtle rounded-xl p-6 shadow-xs"
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-subtle">
                  <h3 className="text-sm font-bold text-navy uppercase tracking-wide font-heading">
                    {reading.type}
                  </h3>
                  <span className="text-xs font-semibold text-text-muted">
                    {reading.reference}
                  </span>
                </div>

                {reading.text ? (
                  <div className="text-sm text-text-main leading-relaxed whitespace-pre-line font-serif">
                    {reading.text}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted italic">
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

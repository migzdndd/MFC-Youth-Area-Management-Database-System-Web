import React, { useEffect, useState } from 'react';
import { History, GitCommit, ExternalLink } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';

interface CommitItem {
  sha: string;
  commit: {
    message: string;
    author: {
      date: string;
    };
  };
}

export const ChangelogsPage: React.FC = () => {
  const [commits, setCommits] = useState<CommitItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadChangelogs() {
      try {
        const res = await fetch('https://api.github.com/repos/migzdndd/MFC-Youth-Area-Management-System-Web/commits?per_page=15');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setCommits(data);
          }
        }
      } catch (err) {
        console.warn('Failed to load GitHub commits:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadChangelogs();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="pb-4 border-b border-border-subtle">
        <h1 className="text-2xl font-bold text-text-main font-heading tracking-tight">
          System Changelogs & Version History
        </h1>
        <p className="text-sm text-text-muted">
          Continuous improvements, security hardening, and releases for MFC Youth AMS.
        </p>
      </div>

      <div className="bg-white border border-border-subtle rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-navy" />
            <h2 className="font-bold text-base text-text-main font-heading">
              Recent Repository Commits
            </h2>
          </div>
          <a
            href="https://github.com/migzdndd/MFC-Youth-Area-Management-System-Web"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-navy hover:underline font-semibold"
          >
            <span>View on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Spinner />
          </div>
        ) : commits.length === 0 ? (
          <p className="text-xs text-text-muted">No live commits retrieved.</p>
        ) : (
          <div className="space-y-4">
            {commits.map((c) => (
              <div
                key={c.sha}
                className="p-3.5 rounded-lg border border-border-subtle bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-start gap-2.5">
                  <GitCommit className="w-4 h-4 text-navy mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-text-main">
                      {c.commit?.message?.split('\n')[0]}
                    </p>
                    <span className="text-xs text-text-muted">
                      {formatDate(c.commit?.author?.date)}
                    </span>
                  </div>
                </div>
                <code className="text-xs font-mono bg-white px-2 py-1 rounded border border-border-subtle text-slate-600 shrink-0 self-start sm:self-auto">
                  {c.sha.substring(0, 7)}
                </code>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

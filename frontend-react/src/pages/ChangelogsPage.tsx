import React, { useEffect, useState } from 'react';
import { History, GitCommit, ExternalLink } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
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
        // Try internal API proxy first (has caching, rate limit protection, and verified fallback)
        const apiRes = await fetch('/api/changelogs?per_page=20');
        if (apiRes.ok) {
          const data = await apiRes.json();
          if (Array.isArray(data) && data.length > 0) {
            setCommits(data);
            return;
          }
        }
      } catch (apiErr) {
        console.warn('API changelogs endpoint unavailable, trying direct GitHub:', apiErr);
      }

      try {
        // Fallback to direct GitHub API
        const ghRes = await fetch('https://api.github.com/repos/migzdndd/MFC-Youth-Area-Management-System-Web/commits?per_page=20');
        if (ghRes.ok) {
          const data = await ghRes.json();
          if (Array.isArray(data) && data.length > 0) {
            setCommits(data);
            return;
          }
        }
      } catch (ghErr) {
        console.warn('Direct GitHub commits fetch failed:', ghErr);
      }

      // Final fallback to verified offline/recent release entries
      setCommits([
        {
          sha: '034a02e',
          commit: {
            message: 'refactor(events): replace verbose note comments with concise single sentences',
            author: { date: '2026-10-10T04:18:00Z' }
          }
        },
        {
          sha: 'a7c7437',
          commit: {
            message: 'ci(workflows): modernize and stabilize production CI/CD pipeline and docker builds',
            author: { date: '2026-10-10T03:00:00Z' }
          }
        },
        {
          sha: 'b62fed0',
          commit: {
            message: 'chore(release): bump version to 1.0.1 and update deployment references',
            author: { date: '2026-09-25T19:45:48Z' }
          }
        }
      ]);
    }

    loadChangelogs().finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-slate-900 font-heading tracking-tight">
            System Changelogs & Version History
          </h1>
          <Badge variant="navy">v1.1 Stable</Badge>
        </div>
        <p className="text-sm text-slate-600">
          Continuous improvements, security hardening, and production releases for MFC Youth AMS.
        </p>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-navy" />
            <h2 className="font-bold text-base text-slate-900 font-heading">
              Recent Repository Commits
            </h2>
          </div>
          <a
            href="https://github.com/migzdndd/MFC-Youth-Area-Management-System-Web"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-navy hover:text-navy-light font-bold transition-colors"
          >
            <span>View on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Spinner />
            <span className="text-xs text-slate-500">Retrieving commit logs...</span>
          </div>
        ) : commits.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">No live commits retrieved.</p>
        ) : (
          <div className="space-y-3">
            {commits.map((c) => (
              <div
                key={c.sha}
                className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-navy/10 text-navy shrink-0 mt-0.5">
                    <GitCommit className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 leading-snug">
                      {c.commit?.message?.split('\n')[0]}
                    </p>
                    <span className="text-xs text-slate-500 mt-0.5 inline-block">
                      {formatDate(c.commit?.author?.date)}
                    </span>
                  </div>
                </div>
                <code className="text-xs font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-700 font-semibold shrink-0 self-start sm:self-auto shadow-2xs">
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

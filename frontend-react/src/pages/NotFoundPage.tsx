import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Compass, Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white border border-border-subtle rounded-2xl p-8 shadow-sm space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shadow-2xs">
          <Compass className="w-7 h-7" />
        </div>
        <div>
          <span className="text-xs font-bold tracking-widest text-amber-700 font-heading uppercase">
            Error 404
          </span>
          <h1 className="text-2xl font-bold text-text-main font-heading tracking-tight mt-1">
            Page Not Found
          </h1>
          <p className="text-sm text-text-muted mt-2 leading-relaxed">
            The page or view you requested could not be located in the MFC Youth Area Management System.
          </p>
        </div>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
          <Button
            variant="secondary"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </Button>
        </div>
      </div>
    </div>
  );
};


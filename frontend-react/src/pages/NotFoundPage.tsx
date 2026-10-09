import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white border border-border-subtle rounded-2xl p-8 shadow-sm space-y-4">
        <span className="text-4xl font-extrabold text-navy font-heading">404</span>
        <h1 className="text-xl font-bold text-text-main font-heading">Page Not Found</h1>
        <p className="text-sm text-text-muted">
          The requested page or view could not be located in the MFC Youth Area Management System.
        </p>
        <div className="pt-2">
          <Link to="/dashboard">
            <Button variant="primary" className="flex items-center gap-2 mx-auto">
              <Home className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

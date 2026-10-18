import React from 'react';
import { Database, MapPin, PlusCircle, Loader2, ShieldCheck } from 'lucide-react';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Area } from '@/types/auth';

export type AreaMode = 'select' | 'create';

export interface AreaDatabaseSelectorProps {
  mode: AreaMode;
  onModeChange: (mode: AreaMode) => void;
  selectedAreaId: string;
  onSelectAreaId: (id: string) => void;
  newAreaName: string;
  onChangeNewAreaName: (name: string) => void;
  areas: Area[];
  isLoadingAreas: boolean;
  areasError?: unknown;
  disabled?: boolean;
}

/**
 * Modular Area Database Assignment & Creation Selector
 */
export const AreaDatabaseSelector: React.FC<AreaDatabaseSelectorProps> = ({
  mode,
  onModeChange,
  selectedAreaId,
  onSelectAreaId,
  newAreaName,
  onChangeNewAreaName,
  areas,
  isLoadingAreas,
  areasError,
  disabled = false,
}) => {
  const selectedArea = areas.find((a) => a.id === selectedAreaId);

  return (
    <div className="pt-3 border-t border-border-subtle space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
          <Database className="w-4 h-4 text-navy" aria-hidden="true" />
          <span>{selectedArea ? selectedArea.name : 'Area Database'}</span>
          <span className="text-mfc-red">*</span>
        </label>
        <span className="text-xs text-text-muted">
          {areas.length} available {areas.length === 1 ? 'database' : 'databases'}
        </span>
      </div>

      {/* Mode Toggle Tabs */}
      <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'select'}
          disabled={disabled}
          onClick={() => onModeChange('select')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
            mode === 'select'
              ? 'bg-white text-navy shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Select Existing Area</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mode === 'create'}
          disabled={disabled}
          onClick={() => onModeChange('create')}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
            mode === 'create'
              ? 'bg-white text-navy shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Create New Area</span>
        </button>
      </div>

      {/* Mode 1: Select Existing Area Database */}
      {mode === 'select' && (
        <div className="space-y-2">
          {isLoadingAreas ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin text-navy" />
              <span>Loading available Area Databases...</span>
            </div>
          ) : areas.length > 0 ? (
            <Select
              label={selectedArea ? `Area Database: ${selectedArea.name}` : 'Area Database'}
              value={selectedAreaId}
              onChange={(e) => onSelectAreaId(e.target.value)}
              disabled={disabled}
              options={[
                { value: '', label: '-- Select Area Database --' },
                ...areas.map((a) => ({ value: a.id, label: a.name })),
              ]}
            />
          ) : (
            <div className="p-3.5 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center space-y-2">
              <p className="text-xs text-slate-600">
                No active Area Databases exist in the system yet.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => onModeChange('create')}
                className="text-xs"
              >
                Create First Area Database
              </Button>
            </div>
          )}
          {Boolean(areasError) && (
            <p className="text-xs text-amber-700">
              Notice: Could not load the area list. You can create a new area below.
            </p>
          )}
        </div>
      )}

      {/* Mode 2: Create New Area Database */}
      {mode === 'create' && (
        <div className="space-y-2">
          <Input
            label="New Area Database Name"
            required
            placeholder="e.g. Metro Manila South, Cebu Central, Laguna"
            value={newAreaName}
            onChange={(e) => onChangeNewAreaName(e.target.value)}
            disabled={disabled}
            helperText="Enter the official regional territory name for this new database."
          />
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              The system will automatically initialize standard youth ministry services upon registration.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

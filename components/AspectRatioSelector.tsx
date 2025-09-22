import React from 'react';

interface AspectRatioSelectorProps {
  selectedRatio: string;
  onSelectRatio: (ratio: string) => void;
  disabled: boolean;
}

const RATIOS = ['1:1', '16:9', '9:16', '4:3', '3:4'];

const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ selectedRatio, onSelectRatio, disabled }) => {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Aspect Ratio">
      {RATIOS.map(ratio => (
        <button
          key={ratio}
          type="button"
          onClick={() => onSelectRatio(ratio)}
          disabled={disabled}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed ${
            selectedRatio === ratio
              ? 'bg-cyan-500 text-white focus:ring-cyan-400'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600 focus:ring-cyan-500'
          }`}
        >
          {ratio}
        </button>
      ))}
    </div>
  );
};

export default AspectRatioSelector;

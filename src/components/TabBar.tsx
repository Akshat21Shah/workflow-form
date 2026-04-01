import React from 'react';
import type { TabKey, ValidationState } from '../store/types';
import { useTabMeta } from '../hooks/useFormStore';

interface Tab {
  key: TabKey;
  label: string;
  index: number;
}

const TABS: Tab[] = [
  { key: 'basicInfo', index: 0, label: 'Basic Info' },
  { key: 'triggerConfig', index: 1, label: 'Trigger Config' },
  { key: 'actionsConfig', index: 2, label: 'Actions' },
  { key: 'review', index: 3, label: 'Review & Submit' },
];

interface Props {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  validation: ValidationState;
}

// Inner component so each tab button can independently subscribe via useTabMeta
const TabButton: React.FC<{
  tab: Tab;
  isActive: boolean;
  validation: ValidationState;
  onTabChange: (tab: TabKey) => void;
}> = ({ tab, isActive, validation, onTabChange }) => {
  // Tab State Awareness — isDirty, isValid, hasBlockingErrors derived from state (not tracked separately)
  const { isDirty, isValid, hasBlockingErrors, errorCount } = useTabMeta(tab.key, validation);

  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${tab.key}`}
      className={[
        'tab-button',
        isActive ? 'tab-button--active' : '',
        hasBlockingErrors ? 'tab-button--error' : '',
        isValid && !hasBlockingErrors ? 'tab-button--valid' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => onTabChange(tab.key)}
    >
      <span className={`tab-step ${isValid && !hasBlockingErrors ? 'tab-step--valid' : ''}`}>
        {isValid && !hasBlockingErrors ? '✓' : tab.index + 1}
      </span>
      <span className="tab-label">{tab.label}</span>
      {isDirty && !hasBlockingErrors && !isValid && (
        <span className="tab-dirty-dot" aria-label="unsaved changes" title="Tab has unsaved changes" />
      )}
      {errorCount > 0 && (
        <span className="tab-error-badge" aria-label={`${errorCount} error${errorCount > 1 ? 's' : ''}`}>
          {errorCount}
        </span>
      )}
    </button>
  );
};

const TabBar: React.FC<Props> = ({ activeTab, onTabChange, validation }) => {
  return (
    <nav className="tab-bar" role="tablist" aria-label="Form sections">
      {TABS.map((tab) => (
        <TabButton
          key={tab.key}
          tab={tab}
          isActive={activeTab === tab.key}
          validation={validation}
          onTabChange={onTabChange}
        />
      ))}
    </nav>
  );
};

export default TabBar;

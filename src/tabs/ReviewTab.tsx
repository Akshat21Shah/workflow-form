import React from 'react';
import { useFormState } from '../hooks/useFormStore';
import type { ValidationState, TabKey } from '../store/types';

interface Props {
  validation: ValidationState;
  onNavigateToTab: (tab: TabKey) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitSuccess: boolean;
}

const TAB_LABELS: Record<TabKey, string> = {
  basicInfo: 'Basic Information',
  triggerConfig: 'Trigger Configuration',
  actionsConfig: 'Actions & Derived Values',
  review: 'Review',
};

const ReviewTab: React.FC<Props> = ({
  validation,
  onNavigateToTab,
  onSubmit,
  isSubmitting,
  submitSuccess,
}) => {
  const state = useFormState();
  const { basicInfo, triggerConfig, actionsConfig, derived } = state;

  const tabsWithErrors = (Object.keys(validation.errors) as TabKey[]).filter(
    (tab) => tab !== 'review' && validation.errors[tab].length > 0
  );
  const hasErrors = validation.hasValidated && tabsWithErrors.length > 0;

  if (submitSuccess) {
    return (
      <div className="tab-content">
        <div className="success-banner">
          <div className="success-icon">✓</div>
          <h2>Workflow Submitted Successfully!</h2>
          <p>Your workflow <strong>{basicInfo.workflowName}</strong> has been configured and submitted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <h2>Review &amp; Confirm</h2>
      <p className="tab-description">
        Review all configuration details before submitting. Errors across all tabs are shown below.
      </p>

      {/* ── Error Summary (cross-tab errors visible here) ── */}
      {validation.hasValidated && hasErrors && (
        <div className="error-summary">
          <h3>⚠ Please fix the following errors before submitting:</h3>
          {tabsWithErrors.map((tab) => (
            <div key={tab} className="error-summary-group">
              <button
                className="error-tab-link"
                onClick={() => onNavigateToTab(tab)}
              >
                {TAB_LABELS[tab]} ({validation.errors[tab].length} error
                {validation.errors[tab].length > 1 ? 's' : ''}) →
              </button>
              <ul>
                {validation.errors[tab].map((err, i) => (
                  <li key={i}>{err.message}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {validation.hasValidated && !hasErrors && (
        <div className="success-notice">✓ All fields are valid. Ready to submit.</div>
      )}

      {/* ── Data Summary ── */}
      <div className="review-grid">

        {/* Basic Info */}
        <div className="review-card">
          <div className="review-card-header">
            <h3>Basic Information</h3>
            <button className="edit-link" onClick={() => onNavigateToTab('basicInfo')}>Edit</button>
          </div>
          <div className="review-row"><span>Workflow Name</span><strong>{basicInfo.workflowName || '—'}</strong></div>
          <div className="review-row"><span>Workflow Type</span><strong>{basicInfo.workflowType}</strong></div>
          <div className="review-row"><span>Priority</span><strong>{basicInfo.priority}</strong></div>
        </div>

        {/* Trigger Config */}
        <div className="review-card">
          <div className="review-card-header">
            <h3>Trigger Configuration</h3>
            <button className="edit-link" onClick={() => onNavigateToTab('triggerConfig')}>Edit</button>
          </div>
          {basicInfo.workflowType === 'scheduled' && triggerConfig.schedule ? (
            <>
              <div className="review-row"><span>Schedule Type</span><strong>{triggerConfig.schedule.type}</strong></div>
              {triggerConfig.schedule.type === 'weekly' && (
                <div className="review-row"><span>Day of Week</span><strong>{triggerConfig.schedule.dayOfWeek ?? '—'}</strong></div>
              )}
              {triggerConfig.schedule.type === 'monthly' && (
                <div className="review-row"><span>Day of Month</span><strong>{triggerConfig.schedule.dayOfMonth ?? '—'}</strong></div>
              )}
              <div className="review-row"><span>Schedule Time</span><strong>{triggerConfig.schedule.time || '—'}</strong></div>
            </>
          ) : triggerConfig.event ? (
            <>
              <div className="review-row"><span>Event Source</span><strong>{triggerConfig.event.source || '—'}</strong></div>
              <div className="review-row"><span>Event Severity</span><strong>{triggerConfig.event.severity}</strong></div>
            </>
          ) : (
            <div className="review-row"><span>Not configured</span></div>
          )}
        </div>

        {/* Actions Config */}
        <div className="review-card">
          <div className="review-card-header">
            <h3>Actions &amp; Derived Values</h3>
            <button className="edit-link" onClick={() => onNavigateToTab('actionsConfig')}>Edit</button>
          </div>
          <div className="review-row"><span>Timeout</span><strong>{actionsConfig.timeoutSeconds ?? '—'}s</strong></div>
          <div className="review-row"><span>Retry Enabled</span><strong>{actionsConfig.retryPolicy.enabled ? 'Yes' : 'No'}</strong></div>
          {actionsConfig.retryPolicy.enabled && (
            <div className="review-row"><span>Max Retries</span><strong>{actionsConfig.retryPolicy.maxRetries ?? '—'}</strong></div>
          )}
          <div className="review-row derived-row">
            <span>Est. Execution Time</span>
            <strong>{derived.estimatedExecutionTime}s</strong>
          </div>
        </div>
      </div>

      {/* ── Submit ── */}
      <div className="submit-section">
        <button
          className="btn-submit"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Workflow'}
        </button>
        {validation.hasValidated && hasErrors && (
          <p className="submit-hint">Fix all errors above before submitting.</p>
        )}
      </div>
    </div>
  );
};

export default ReviewTab;

import React from 'react';
import { useFormSlice, useFormActions } from '../hooks/useFormStore';
import type { ValidationState } from '../store/types';

interface Props {
  validation: ValidationState;
}

const ActionsConfigTab: React.FC<Props> = ({ validation }) => {
  // Granular subscriptions — only re-renders when these specific slices change
  const retryPolicy = useFormSlice((s) => s.actionsConfig.retryPolicy);
  const timeoutSeconds = useFormSlice((s) => s.actionsConfig.timeoutSeconds);
  const estimatedExecutionTime = useFormSlice((s) => s.derived.estimatedExecutionTime);
  const priority = useFormSlice((s) => s.basicInfo.priority);
  const { updateActionsConfig } = useFormActions();

  const errors = validation.hasValidated ? validation.errors.actionsConfig : [];
  const getError = (field: string) => errors.find((e) => e.field === field)?.message;

  const HIGH_PRIORITY_LIMIT = 300;
  const isOverLimit = priority === 'high' && estimatedExecutionTime > HIGH_PRIORITY_LIMIT;

  return (
    <div className="tab-content">
      <h2>Actions &amp; Derived Values</h2>
      <p className="tab-description">Configure retry policy and timeout settings for the workflow.</p>

      {/* ── Timeout ── */}
      <div className="form-group">
        <label htmlFor="timeoutSeconds">
          Timeout (seconds) <span className="required">*</span>
        </label>
        <input
          id="timeoutSeconds"
          type="number"
          min="1"
          value={timeoutSeconds ?? ''}
          onChange={(e) =>
            updateActionsConfig({
              timeoutSeconds: e.target.value === '' ? null : Number(e.target.value),
            })
          }
          placeholder="e.g. 60"
          className={getError('timeoutSeconds') ? 'input-error' : ''}
        />
        {getError('timeoutSeconds') && (
          <span className="error-message">{getError('timeoutSeconds')}</span>
        )}
      </div>

      {/* ── Retry Policy ── */}
      <div className="form-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={retryPolicy.enabled}
            onChange={(e) =>
              updateActionsConfig({
                retryPolicy: {
                  ...retryPolicy,
                  enabled: e.target.checked,
                  maxRetries: e.target.checked ? (retryPolicy.maxRetries ?? 3) : null,
                },
              })
            }
          />
          Enable Retry Policy
        </label>
      </div>

      {retryPolicy.enabled && (
        <div className="form-group conditional-field">
          <label htmlFor="maxRetries">
            Max Retries <span className="required">*</span>
          </label>
          <input
            id="maxRetries"
            type="number"
            min="1"
            max="10"
            value={retryPolicy.maxRetries ?? ''}
            onChange={(e) =>
              updateActionsConfig({
                retryPolicy: {
                  ...retryPolicy,
                  maxRetries: e.target.value === '' ? null : Number(e.target.value),
                },
              })
            }
            placeholder="1–10"
            className={getError('retryPolicy.maxRetries') ? 'input-error' : ''}
          />
          {getError('retryPolicy.maxRetries') && (
            <span className="error-message">{getError('retryPolicy.maxRetries')}</span>
          )}
        </div>
      )}

      {/* ── Derived Value (read-only) ── */}
      <div className="derived-section">
        <h3>Derived Values</h3>
        <p className="field-hint">Auto-calculated from timeout, retries, and priority. Not editable.</p>

        <div className={`derived-field ${isOverLimit ? 'derived-field--error' : ''}`}>
          <div className="derived-label">Estimated Execution Time</div>
          <div className="derived-value">
            {estimatedExecutionTime}s
            {isOverLimit && (
              <span className="derived-warning"> ⚠ Exceeds {HIGH_PRIORITY_LIMIT}s limit for high priority</span>
            )}
          </div>
          <div className="derived-formula">
            <span className="cross-tab-notice">
              <span className="notice-badge">Cross-tab</span>
              Priority from Tab 1: <strong>{priority}</strong>
            </span>
          </div>
        </div>

        {getError('estimatedExecutionTime') && (
          <span className="error-message">{getError('estimatedExecutionTime')}</span>
        )}
      </div>
    </div>
  );
};

export default ActionsConfigTab;

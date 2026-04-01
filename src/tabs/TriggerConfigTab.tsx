import React from 'react';
import { useFormSlice, useFormActions } from '../hooks/useFormStore';
import type { ValidationState, ScheduleType, EventSeverity, DayOfWeek } from '../store/types';

interface Props {
  validation: ValidationState;
}

const DAY_OF_WEEK_OPTIONS: { value: DayOfWeek; label: string }[] = [
  { value: 'mon', label: 'Monday' },
  { value: 'tue', label: 'Tuesday' },
  { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' },
  { value: 'fri', label: 'Friday' },
  { value: 'sat', label: 'Saturday' },
  { value: 'sun', label: 'Sunday' },
];

const TriggerConfigTab: React.FC<Props> = ({ validation }) => {
  const workflowType = useFormSlice((s) => s.basicInfo.workflowType);
  const triggerConfig = useFormSlice((s) => s.triggerConfig);
  const { updateTriggerConfig } = useFormActions();

  const errors = validation.hasValidated ? validation.errors.triggerConfig : [];
  const getError = (field: string) => errors.find((e) => e.field === field)?.message;

  const handleScheduleChange = (patch: Partial<NonNullable<typeof triggerConfig.schedule>>) => {
    updateTriggerConfig({
      schedule: { ...triggerConfig.schedule!, ...patch },
    });
  };

  // When type changes, reset the day fields that no longer apply
  const handleScheduleTypeChange = (newType: ScheduleType) => {
    updateTriggerConfig({
      schedule: {
        ...triggerConfig.schedule!,
        type: newType,
        dayOfWeek: newType === 'weekly' ? (triggerConfig.schedule?.dayOfWeek ?? null) : null,
        dayOfMonth: newType === 'monthly' ? (triggerConfig.schedule?.dayOfMonth ?? null) : null,
      },
    });
  };

  const handleEventChange = (patch: Partial<NonNullable<typeof triggerConfig.event>>) => {
    updateTriggerConfig({
      event: { ...triggerConfig.event!, ...patch },
    });
  };

  const scheduleType = triggerConfig.schedule?.type ?? 'daily';

  return (
    <div className="tab-content">
      <h2>Trigger Configuration</h2>
      <p className="tab-description">
        Configure how this workflow is triggered. Options depend on the workflow type selected in
        Basic Information.
      </p>

      <div className="cross-tab-notice">
        <span className="notice-badge">Cross-tab</span>
        Workflow Type: <strong>{workflowType === 'scheduled' ? 'Scheduled' : 'Event-Based'}</strong>
      </div>

      {/* ── Scheduled Fields ── */}
      {workflowType === 'scheduled' && (
        <div className="conditional-section">
          <h3>Schedule Settings</h3>

          {/* Schedule Type */}
          <div className="form-group">
            <label htmlFor="scheduleType">
              Schedule Type <span className="required">*</span>
            </label>
            <select
              id="scheduleType"
              value={scheduleType}
              onChange={(e) => handleScheduleTypeChange(e.target.value as ScheduleType)}
              className={getError('schedule.type') ? 'input-error' : ''}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            {getError('schedule.type') && (
              <span className="error-message">{getError('schedule.type')}</span>
            )}
          </div>

          {/* Day of Week — only for Weekly */}
          {scheduleType === 'weekly' && (
            <div className="form-group">
              <label htmlFor="dayOfWeek">
                Day of Week <span className="required">*</span>
              </label>
              <select
                id="dayOfWeek"
                value={triggerConfig.schedule?.dayOfWeek ?? ''}
                onChange={(e) =>
                  handleScheduleChange({ dayOfWeek: e.target.value as DayOfWeek })
                }
                className={getError('schedule.dayOfWeek') ? 'input-error' : ''}
              >
                <option value="" disabled>Select a day</option>
                {DAY_OF_WEEK_OPTIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              {getError('schedule.dayOfWeek') && (
                <span className="error-message">{getError('schedule.dayOfWeek')}</span>
              )}
            </div>
          )}

          {/* Day of Month — only for Monthly */}
          {scheduleType === 'monthly' && (
            <div className="form-group">
              <label htmlFor="dayOfMonth">
                Day of Month <span className="required">*</span>
              </label>
              <input
                id="dayOfMonth"
                type="number"
                min="1"
                max="31"
                value={triggerConfig.schedule?.dayOfMonth ?? ''}
                onChange={(e) =>
                  handleScheduleChange({
                    dayOfMonth: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
                placeholder="1 – 31"
                className={getError('schedule.dayOfMonth') ? 'input-error' : ''}
              />
              {getError('schedule.dayOfMonth') && (
                <span className="error-message">{getError('schedule.dayOfMonth')}</span>
              )}
              <p className="field-hint">
                Note: months with fewer days will use the last available day.
              </p>
            </div>
          )}

          {/* Schedule Time */}
          <div className="form-group">
            <label htmlFor="scheduleTime">
              Schedule Time (HH:mm) <span className="required">*</span>
            </label>
            <input
              id="scheduleTime"
              type="time"
              value={triggerConfig.schedule?.time ?? ''}
              onChange={(e) => handleScheduleChange({ time: e.target.value })}
              className={getError('schedule.time') ? 'input-error' : ''}
            />
            {getError('schedule.time') && (
              <span className="error-message">{getError('schedule.time')}</span>
            )}
          </div>
        </div>
      )}

      {/* ── Event-Based Fields ── */}
      {workflowType === 'event-based' && (
        <div className="conditional-section">
          <h3>Event Settings</h3>

          <div className="form-group">
            <label htmlFor="eventSource">
              Event Source <span className="required">*</span>
            </label>
            <input
              id="eventSource"
              type="text"
              value={triggerConfig.event?.source ?? ''}
              onChange={(e) => handleEventChange({ source: e.target.value })}
              placeholder="e.g. sensor-001, payment-gateway"
              className={getError('event.source') ? 'input-error' : ''}
            />
            {getError('event.source') && (
              <span className="error-message">{getError('event.source')}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="eventSeverity">
              Event Severity <span className="required">*</span>
            </label>
            <select
              id="eventSeverity"
              value={triggerConfig.event?.severity ?? 'info'}
              onChange={(e) =>
                handleEventChange({ severity: e.target.value as EventSeverity })
              }
              className={getError('event.severity') ? 'input-error' : ''}
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
            {getError('event.severity') && (
              <span className="error-message">{getError('event.severity')}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TriggerConfigTab;

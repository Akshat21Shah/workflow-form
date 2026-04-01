import type { FormState, ValidationState, TabKey, FieldError } from '../store/types';

// ─── Validation Limits ────────────────────────────────────────────────────────

const ESTIMATED_EXECUTION_TIME_LIMIT_HIGH_PRIORITY = 300; // seconds

// ─── Per-Tab Validators ───────────────────────────────────────────────────────

function validateBasicInfo(state: FormState): FieldError[] {
  const errors: FieldError[] = [];
  const { workflowName, workflowType, priority } = state.basicInfo;

  if (!workflowName || workflowName.trim().length === 0) {
    errors.push({ field: 'workflowName', message: 'Workflow name is required.' });
  } else if (workflowName.trim().length < 5) {
    errors.push({ field: 'workflowName', message: 'Workflow name must be at least 5 characters.' });
  }

  if (!workflowType) {
    errors.push({ field: 'workflowType', message: 'Workflow type is required.' });
  }

  if (!priority) {
    errors.push({ field: 'priority', message: 'Priority is required.' });
  }

  return errors;
}

function validateTriggerConfig(state: FormState): FieldError[] {
  const errors: FieldError[] = [];
  const { workflowType } = state.basicInfo;
  const { schedule, event } = state.triggerConfig;

  if (workflowType === 'scheduled') {
    // Cross-tab: event fields must NOT exist
    if (event !== null) {
      errors.push({
        field: 'event',
        message: 'Event config must not exist when workflow type is "scheduled".',
      });
    }
    if (!schedule) {
      errors.push({ field: 'schedule', message: 'Schedule configuration is required.' });
    } else {
      if (!schedule.type) {
        errors.push({ field: 'schedule.type', message: 'Schedule type is required.' });
      }
      if (!schedule.time || !/^\d{2}:\d{2}$/.test(schedule.time)) {
        errors.push({ field: 'schedule.time', message: 'A valid time (HH:mm) is required.' });
      }
      // Conditional: weekly requires a day of week
      if (schedule.type === 'weekly' && !schedule.dayOfWeek) {
        errors.push({ field: 'schedule.dayOfWeek', message: 'Day of week is required for weekly schedules.' });
      }
      // Conditional: monthly requires a day of month (1–31)
      if (schedule.type === 'monthly') {
        if (schedule.dayOfMonth === null || schedule.dayOfMonth === undefined) {
          errors.push({ field: 'schedule.dayOfMonth', message: 'Day of month is required for monthly schedules.' });
        } else if (schedule.dayOfMonth < 1 || schedule.dayOfMonth > 31) {
          errors.push({ field: 'schedule.dayOfMonth', message: 'Day of month must be between 1 and 31.' });
        }
      }
    }
  } else {
    // event-based: scheduled fields must NOT exist
    if (schedule !== null) {
      errors.push({
        field: 'schedule',
        message: 'Schedule config must not exist when workflow type is "event-based".',
      });
    }
    if (!event) {
      errors.push({ field: 'event', message: 'Event configuration is required.' });
    } else {
      if (!event.source || event.source.trim().length === 0) {
        errors.push({ field: 'event.source', message: 'Event source is required.' });
      }
      if (!event.severity) {
        errors.push({ field: 'event.severity', message: 'Event severity is required.' });
      }
    }
  }

  return errors;
}

function validateActionsConfig(state: FormState): FieldError[] {
  const errors: FieldError[] = [];
  const { retryPolicy, timeoutSeconds } = state.actionsConfig;
  const { priority } = state.basicInfo;
  const { estimatedExecutionTime } = state.derived;

  if (timeoutSeconds === null || timeoutSeconds === undefined) {
    errors.push({ field: 'timeoutSeconds', message: 'Timeout (seconds) is required.' });
  } else if (timeoutSeconds <= 0) {
    errors.push({ field: 'timeoutSeconds', message: 'Timeout must be greater than 0.' });
  }

  // Cross-field: maxRetries required only if retryPolicy.enabled
  if (retryPolicy.enabled) {
    if (retryPolicy.maxRetries === null || retryPolicy.maxRetries === undefined) {
      errors.push({ field: 'retryPolicy.maxRetries', message: 'Max retries is required when retry is enabled.' });
    } else if (retryPolicy.maxRetries < 1) {
      errors.push({ field: 'retryPolicy.maxRetries', message: 'Max retries must be at least 1.' });
    } else if (retryPolicy.maxRetries > 10) {
      errors.push({ field: 'retryPolicy.maxRetries', message: 'Max retries cannot exceed 10.' });
    }
  }

  // Cross-tab: estimatedExecutionTime limit for high priority
  if (priority === 'high' && estimatedExecutionTime > ESTIMATED_EXECUTION_TIME_LIMIT_HIGH_PRIORITY) {
    errors.push({
      field: 'estimatedExecutionTime',
      message: `Estimated execution time (${estimatedExecutionTime}s) exceeds the ${ESTIMATED_EXECUTION_TIME_LIMIT_HIGH_PRIORITY}s limit for high priority workflows.`,
    });
  }

  return errors;
}

// ─── Main Validation Orchestrator ────────────────────────────────────────────
// Validates the entire form at once, collecting errors per tab.
// This is always called on submit. Can also be called on tab switch.

export function validateForm(state: FormState): ValidationState {
  const errors: Record<TabKey, FieldError[]> = {
    basicInfo: validateBasicInfo(state),
    triggerConfig: validateTriggerConfig(state),
    actionsConfig: validateActionsConfig(state),
    review: [], // Review tab itself has no input fields
  };

  return {
    errors,
    hasValidated: true,
  };
}

// ─── Tab-level helpers ────────────────────────────────────────────────────────

export function getTabErrorCount(validation: ValidationState, tab: TabKey): number {
  return validation.hasValidated ? (validation.errors[tab]?.length ?? 0) : 0;
}

export function hasTabErrors(validation: ValidationState, tab: TabKey): boolean {
  return getTabErrorCount(validation, tab) > 0;
}

export function isFormValid(validation: ValidationState): boolean {
  if (!validation.hasValidated) return false;
  return Object.values(validation.errors).every((errs) => errs.length === 0);
}

import type {
  FormState,
  BasicInfo,
  Priority,
  Selector,
  Subscriber,
  Unsubscribe,
} from './types';

// ─── Initial State ────────────────────────────────────────────────────────────

const INITIAL_STATE: FormState = {
  basicInfo: {
    workflowName: '',
    workflowType: 'scheduled',
    priority: 'medium',
  },
  triggerConfig: {
    schedule: { type: 'daily', time: '', dayOfWeek: null, dayOfMonth: null },
    event: null,
  },
  actionsConfig: {
    retryPolicy: { enabled: false, maxRetries: null },
    timeoutSeconds: null,
  },
  derived: {
    estimatedExecutionTime: 0,
  },
};

// ─── Derived Value Calculator ─────────────────────────────────────────────────
// estimatedExecutionTime = timeoutSeconds + (maxRetries * retryMultiplier)
// retryMultiplier varies by priority: low=1, medium=1.5, high=2

const PRIORITY_MULTIPLIER: Record<Priority, number> = {
  low: 1,
  medium: 1.5,
  high: 2,
};

function computeDerived(state: FormState): FormState {
  const { timeoutSeconds, retryPolicy } = state.actionsConfig;
  const { priority } = state.basicInfo;

  const timeout = timeoutSeconds ?? 0;
  const retries = retryPolicy.enabled ? (retryPolicy.maxRetries ?? 0) : 0;
  const multiplier = PRIORITY_MULTIPLIER[priority];

  const estimatedExecutionTime = Math.round(timeout + retries * multiplier * timeout);

  // Only produce a new object if the value actually changed
  if (state.derived.estimatedExecutionTime === estimatedExecutionTime) {
    return state;
  }

  return {
    ...state,
    derived: { estimatedExecutionTime },
  };
}

// ─── Subscription Entry ───────────────────────────────────────────────────────

interface SubscriptionEntry<T = unknown> {
  selector: Selector<T>;
  callback: Subscriber<T>;
  lastValue: T;
}

// ─── Form Store ───────────────────────────────────────────────────────────────
// Framework-agnostic core: does not import React.
// React integration is handled in hooks/useFormStore.ts.

class FormStore {
  private state: FormState;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private subscriptions: Set<SubscriptionEntry<any>> = new Set();

  constructor() {
    this.state = INITIAL_STATE;
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  getState(): FormState {
    return this.state;
  }

  /** Returns the original initial state — used to compute isDirty per tab. */
  getInitialState(): FormState {
    return INITIAL_STATE;
  }

  // ── Write (immutable) ─────────────────────────────────────────────────────

  /**
   * Deep-merge a partial update into the store, then recompute derived values
   * and notify only the affected subscribers.
   */
  setState(updater: (prev: FormState) => FormState): void {
    const prev = this.state;
    let next = updater(prev);
    next = computeDerived(next);

    if (next === prev) return; // nothing changed

    this.state = next;
    this.notifySubscribers(prev);
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────

  /**
   * Subscribe to a slice of state selected by `selector`.
   * The callback fires only when the selected slice changes (shallow equality).
   * Returns an unsubscribe function.
   */
  subscribe<T>(selector: Selector<T>, callback: Subscriber<T>): Unsubscribe {
    const entry: SubscriptionEntry<T> = {
      selector,
      callback,
      lastValue: selector(this.state),
    };
    this.subscriptions.add(entry);

    return () => {
      this.subscriptions.delete(entry);
    };
  }

  private notifySubscribers(_prev: FormState): void {
    this.subscriptions.forEach((entry) => {
      const nextValue = entry.selector(this.state);
      // Shallow reference equality — selectors should return same ref if unchanged
      if (nextValue !== entry.lastValue) {
        entry.lastValue = nextValue;
        entry.callback(nextValue);
      }
    });
  }

  // ── Cross-Tab Actions ─────────────────────────────────────────────────────

  /**
   * Update basicInfo and handle cross-tab side effects:
   * - workflowType change resets incompatible triggerConfig fields
   * - priority change updates derived defaults
   */
  updateBasicInfo(patch: Partial<BasicInfo>): void {
    this.setState((prev) => {
      const nextBasicInfo = { ...prev.basicInfo, ...patch };
      let nextTriggerConfig = prev.triggerConfig;

      // Cross-tab: workflowType changed → reset incompatible trigger fields
      if (patch.workflowType && patch.workflowType !== prev.basicInfo.workflowType) {
        if (patch.workflowType === 'scheduled') {
          nextTriggerConfig = {
            schedule: { type: 'daily', time: '', dayOfWeek: null, dayOfMonth: null },
            event: null,
          };
        } else {
          nextTriggerConfig = {
            schedule: null,
            event: { source: '', severity: 'info' },
          };
        }
      }

      return {
        ...prev,
        basicInfo: nextBasicInfo,
        triggerConfig: nextTriggerConfig,
      };
    });
  }

  updateTriggerConfig(patch: Partial<FormState['triggerConfig']>): void {
    this.setState((prev) => ({
      ...prev,
      triggerConfig: { ...prev.triggerConfig, ...patch },
    }));
  }

  updateActionsConfig(patch: Partial<FormState['actionsConfig']>): void {
    this.setState((prev) => ({
      ...prev,
      actionsConfig: { ...prev.actionsConfig, ...patch },
    }));
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────
// One store instance shared across the entire app.

export const formStore = new FormStore();

// ─── Enums / Union Types ──────────────────────────────────────────────────────

export type WorkflowType = 'scheduled' | 'event-based';
export type Priority = 'low' | 'medium' | 'high';
export type ScheduleType = 'daily' | 'weekly' | 'monthly';
export type EventSeverity = 'info' | 'warning' | 'critical';
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

// ─── Tab Data Shapes ──────────────────────────────────────────────────────────

export interface BasicInfo {
  workflowName: string;
  workflowType: WorkflowType;
  priority: Priority;
}

export interface ScheduleConfig {
  type: ScheduleType;
  time: string;           // HH:mm — required always
  dayOfWeek: DayOfWeek | null;  // required when type === 'weekly'
  dayOfMonth: number | null;    // required when type === 'monthly', 1–31
}

export interface EventConfig {
  source: string;
  severity: EventSeverity;
}

export interface TriggerConfig {
  schedule: ScheduleConfig | null;
  event: EventConfig | null;
}

export interface RetryPolicy {
  enabled: boolean;
  maxRetries: number | null;
}

export interface ActionsConfig {
  retryPolicy: RetryPolicy;
  timeoutSeconds: number | null;
}

export interface DerivedValues {
  estimatedExecutionTime: number; // read-only, auto-computed
}

// ─── Global Form State ────────────────────────────────────────────────────────

export interface FormState {
  basicInfo: BasicInfo;
  triggerConfig: TriggerConfig;
  actionsConfig: ActionsConfig;
  derived: DerivedValues;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export type TabKey = 'basicInfo' | 'triggerConfig' | 'actionsConfig' | 'review';

export interface FieldError {
  field: string;
  message: string;
}

export interface ValidationState {
  errors: Record<TabKey, FieldError[]>;
  hasValidated: boolean;
}

// ─── Tab Meta ─────────────────────────────────────────────────────────────────

export interface TabMeta {
  isDirty: boolean;
  isValid: boolean;
  hasBlockingErrors: boolean;
  errorCount: number;
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export type Selector<T> = (state: FormState) => T;
export type Subscriber<T> = (value: T) => void;
export type Unsubscribe = () => void;

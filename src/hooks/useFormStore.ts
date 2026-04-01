import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { formStore } from '../store/formStore';
import type { FormState, Selector, TabKey, ValidationState, TabMeta } from '../store/types';

/**
 * useFormSlice — subscribe to a specific slice of form state.
 * The component re-renders ONLY when the selected slice changes (shallow ref equality).
 * This is the primary performance primitive of the system.
 */
export function useFormSlice<T>(selector: Selector<T>): T {
  // Store selector in a ref so it's stable across renders
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const [value, setValue] = useState<T>(() => selector(formStore.getState()));

  useEffect(() => {
    // Subscribe: only fires when selected slice changes
    const unsubscribe = formStore.subscribe(
      (state) => selectorRef.current(state),
      (newValue) => {
        setValue(newValue);
      }
    );

    // Sync in case state changed between render and effect
    const current = selectorRef.current(formStore.getState());
    setValue(current);

    return unsubscribe;
  }, []); // empty deps — subscription is stable

  return value;
}

/**
 * useFormState — returns the full form state.
 * Only use this in components that genuinely need everything (e.g. Review tab).
 */
export function useFormState(): FormState {
  return useFormSlice((s) => s);
}

/**
 * useFormActions — returns stable action dispatchers (never changes reference).
 */
export function useFormActions() {
  return {
    updateBasicInfo: useCallback(
      (patch: Partial<FormState['basicInfo']>) => formStore.updateBasicInfo(patch),
      []
    ),
    updateTriggerConfig: useCallback(
      (patch: Partial<FormState['triggerConfig']>) => formStore.updateTriggerConfig(patch),
      []
    ),
    updateActionsConfig: useCallback(
      (patch: Partial<FormState['actionsConfig']>) => formStore.updateActionsConfig(patch),
      []
    ),
  };
}

// ─── Tab-state slices used for isDirty comparison ──────────────────────────
type TabStateSlice = {
  basicInfo: FormState['basicInfo'];
  triggerConfig: FormState['triggerConfig'];
  actionsConfig: FormState['actionsConfig'];
};

const TAB_SELECTORS: Record<Exclude<TabKey, 'review'>, (s: FormState) => TabStateSlice[keyof TabStateSlice]> = {
  basicInfo: (s) => s.basicInfo,
  triggerConfig: (s) => s.triggerConfig,
  actionsConfig: (s) => s.actionsConfig,
};

/**
 * useTabMeta — derives isDirty, isValid, and hasBlockingErrors for a given tab
 * purely from state — never tracked as separate flags.
 *
 * isDirty:           current tab state !== initial tab state (JSON deep equality)
 * isValid:           validation has run AND no errors for this tab
 * hasBlockingErrors: validation has run AND errors exist for this tab
 */
export function useTabMeta(tabKey: TabKey, validation: ValidationState): TabMeta {
  // Subscribe to the relevant state slice — drives isDirty
  const currentSlice = useFormSlice((s): unknown => {
    if (tabKey === 'review') return null;
    return TAB_SELECTORS[tabKey as Exclude<TabKey, 'review'>](s);
  });

  const initialSlice = useMemo(() => {
    if (tabKey === 'review') return null;
    return TAB_SELECTORS[tabKey as Exclude<TabKey, 'review'>](formStore.getInitialState());
  }, [tabKey]);

  return useMemo<TabMeta>(() => {
    const errorCount = validation.hasValidated
      ? (validation.errors[tabKey]?.length ?? 0)
      : 0;

    // isDirty: deep comparison via JSON (safe for our flat/nested primitives)
    const isDirty = tabKey !== 'review'
      ? JSON.stringify(currentSlice) !== JSON.stringify(initialSlice)
      : false;

    const isValid = validation.hasValidated && errorCount === 0;
    const hasBlockingErrors = validation.hasValidated && errorCount > 0;

    return { isDirty, isValid, hasBlockingErrors, errorCount };
  }, [currentSlice, validation, tabKey, initialSlice]);
}

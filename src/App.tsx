import React, { useState, useCallback } from 'react';
import TabBar from './components/TabBar';
import BasicInfoTab from './tabs/BasicInfoTab';
import TriggerConfigTab from './tabs/TriggerConfigTab';
import ActionsConfigTab from './tabs/ActionsConfigTab';
import ReviewTab from './tabs/ReviewTab';
import { formStore } from './store/formStore';
import { validateForm, isFormValid } from './validation/validationEngine';
import type { TabKey, ValidationState } from './store/types';
import './styles/global.css';

const INITIAL_VALIDATION: ValidationState = {
  errors: { basicInfo: [], triggerConfig: [], actionsConfig: [], review: [] },
  hasValidated: false,
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('basicInfo');
  const [validation, setValidation] = useState<ValidationState>(INITIAL_VALIDATION);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Validate on tab switch (deferred — not on every keystroke)
  const handleTabChange = useCallback(
    (tab: TabKey) => {
      // Run validation when leaving a tab so error badges appear
      const currentState = formStore.getState();
      const result = validateForm(currentState);
      setValidation(result);
      setActiveTab(tab);
    },
    []
  );

  // Navigate to a specific tab (used from Review tab error links)
  const handleNavigateToTab = useCallback((tab: TabKey) => {
    setActiveTab(tab);
  }, []);

  const handleSubmit = useCallback(() => {
    const currentState = formStore.getState();
    const result = validateForm(currentState);
    setValidation(result);

    if (!isFormValid(result)) {
      // Stay on Review tab and show errors
      setActiveTab('review');
      return;
    }

    setIsSubmitting(true);

    // Simulate async submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      console.log('Form submitted:', currentState);
    }, 1200);
  }, []);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'basicInfo':
        return <BasicInfoTab validation={validation} />;
      case 'triggerConfig':
        return <TriggerConfigTab validation={validation} />;
      case 'actionsConfig':
        return <ActionsConfigTab validation={validation} />;
      case 'review':
        return (
          <ReviewTab
            validation={validation}
            onNavigateToTab={handleNavigateToTab}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitSuccess={submitSuccess}
          />
        );
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <h1>Workflow Configuration</h1>
          <p>Set up your automated workflow in 4 steps</p>
        </div>
      </header>

      <main className="app-main">
        <div className="form-card">
          <TabBar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            validation={validation}
          />
          <div
            id={`tabpanel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={activeTab}
            className="tab-panel"
          >
            {renderActiveTab()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

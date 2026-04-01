import React from 'react';
import { useFormSlice, useFormActions } from '../hooks/useFormStore';
import type { ValidationState } from '../store/types';
import type { WorkflowType, Priority } from '../store/types';

interface Props {
  validation: ValidationState;
  onBlur: () => void;
}

const BasicInfoTab: React.FC<Props> = ({ validation, onBlur }) => {
  const basicInfo = useFormSlice((s) => s.basicInfo);
  const { updateBasicInfo } = useFormActions();

  const errors = validation.hasValidated ? validation.errors.basicInfo : [];
  const getError = (field: string) => errors.find((e) => e.field === field)?.message;

  return (
    <div className="tab-content">
      <h2>Basic Information</h2>
      <p className="tab-description">Configure the fundamental properties of your workflow.</p>

      <div className="form-group">
        <label htmlFor="workflowName">
          Workflow Name <span className="required">*</span>
        </label>
        <input
          id="workflowName"
          type="text"
          value={basicInfo.workflowName}
          onChange={(e) => updateBasicInfo({ workflowName: e.target.value })}
          onBlur={onBlur}
          placeholder="Enter workflow name (min. 5 characters)"
          className={getError('workflowName') ? 'input-error' : ''}
        />
        {getError('workflowName') && (
          <span className="error-message">{getError('workflowName')}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="workflowType">
          Workflow Type <span className="required">*</span>
        </label>
        <select
          id="workflowType"
          value={basicInfo.workflowType}
          onChange={(e) => updateBasicInfo({ workflowType: e.target.value as WorkflowType })}
          onBlur={onBlur}
          className={getError('workflowType') ? 'input-error' : ''}
        >
          <option value="scheduled">Scheduled</option>
          <option value="event-based">Event-Based</option>
        </select>
        {getError('workflowType') && (
          <span className="error-message">{getError('workflowType')}</span>
        )}
        <p className="field-hint">
          This determines what configuration options are available in the Trigger tab.
        </p>
      </div>

      <div className="form-group">
        <label htmlFor="priority">
          Priority <span className="required">*</span>
        </label>
        <select
          id="priority"
          value={basicInfo.priority}
          onChange={(e) => updateBasicInfo({ priority: e.target.value as Priority })}
          onBlur={onBlur}
          className={getError('priority') ? 'input-error' : ''}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        {getError('priority') && (
          <span className="error-message">{getError('priority')}</span>
        )}
        <p className="field-hint">
          Affects default values and limits in the Actions tab.
        </p>
      </div>
    </div>
  );
};

export default BasicInfoTab;

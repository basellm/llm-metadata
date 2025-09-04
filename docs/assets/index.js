/**
 * Submit Form Application Entry Point
 * Main initialization and module orchestration
 */

// Import all modules
import { EnvConfig } from './config/env.js';
import { CONSTANTS } from './config/constants.js';
import { DOMUtils, ValueUtils, ObjectUtils, IDUtils, URLUtils, TextUtils } from './utils/index.js';
import { HTTPClient, ProvidersAPI, ModelsAPI } from './api/index.js';
import { I18N } from './i18n/index.js';
import { Validation } from './validation/index.js';
import {
  FieldManager,
  SelectManager,
  LayoutManager,
  StatusManager,
  BatchPreview,
  ChipsComponent,
  SegmentComponent,
  SelectComponent,
} from './ui/index.js';
import { IssueManager } from './issue/index.js';
import { Controller, CoreActions } from './core/index.js';

// Create unified API for backward compatibility with existing window.* usage
const SubmitFormApp = {
  // Config
  Config: { EnvConfig, CONSTANTS },

  // Utils
  Utils: { DOMUtils, ValueUtils, ObjectUtils, IDUtils, URLUtils, TextUtils },

  // API
  API: { HTTPClient, ProvidersAPI, ModelsAPI },

  // i18n
  I18N,

  // Validation
  Validation,

  // UI
  UI: {
    FieldManager,
    SelectManager,
    LayoutManager,
    StatusManager,
    BatchPreview,
    ChipsComponent,
    SegmentComponent,
    SelectComponent,
  },

  // Issue
  Issue: IssueManager,

  // Core
  Core: { Controller, CoreActions },

  // Legacy compatibility methods (for existing window.* calls)
  getApiBase: EnvConfig.getApiBase.bind(EnvConfig),
  getCurrentLang: EnvConfig.getCurrentLang.bind(EnvConfig),
  t: I18N.t.bind(I18N),

  // Main initialization
  init: Controller.init.bind(Controller),
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', SubmitFormApp.init);
} else {
  SubmitFormApp.init();
}

// Export for both ESM and global usage
export default SubmitFormApp;

// Global fallback for backward compatibility
if (typeof window !== 'undefined') {
  // Legacy window.* API for backward compatibility
  window.SubmitFormAPI = {
    getApiBase: EnvConfig.getApiBase.bind(EnvConfig),
    getCurrentLang: EnvConfig.getCurrentLang.bind(EnvConfig),
    fetchJSON: HTTPClient.fetchJSON.bind(HTTPClient),
    fetchFirstOk: HTTPClient.fetchFirstOk.bind(HTTPClient),
    extractProviderList: ProvidersAPI.extractProviderList.bind(ProvidersAPI),
    extractModelList: ModelsAPI.extractModelList.bind(ModelsAPI),
    buildModelUrls: ModelsAPI.buildModelUrls.bind(ModelsAPI),
    buildI18nModelUrls: ModelsAPI.buildI18nModelUrls.bind(ModelsAPI),
    loadProviders: ProvidersAPI.loadProviders.bind(ProvidersAPI),
    loadModels: ModelsAPI.loadModels.bind(ModelsAPI),
    fetchNewApiModels: ModelsAPI.fetchNewApiModels.bind(ModelsAPI),
    findModelInAll: ModelsAPI.findModelInAll.bind(ModelsAPI),
    loadModelDetail: ModelsAPI.loadModelDetail.bind(ModelsAPI),
    loadProviderDetail: ProvidersAPI.loadProviderDetail.bind(ProvidersAPI),
  };

  window.SubmitFormCore = {
    t: I18N.t.bind(I18N),
    populateProviderDropdown: Controller.populateProviderDropdown.bind(Controller),
    populateModelDropdown: Controller.populateModelDropdown.bind(Controller),
    loadAndFillModelDetail: Controller.loadAndFillModelDetail.bind(Controller),
    loadAndFillProviderDetail: Controller.loadAndFillProviderDetail.bind(Controller),
    handleProviderChange: Controller.handleProviderChange,
    handleProviderSelectChange: Controller.handleProviderSelectChange,
    handleModelChange: Controller.handleModelChange,
    handleActionChange: Controller.handleActionChange,
    handleSubmissionTypeChange: Controller.handleSubmissionTypeChange,
    openIssue: CoreActions.openIssue.bind(CoreActions),
    copyBody: CoreActions.copyBody.bind(CoreActions),
    bindEvents: Controller.bindEvents.bind(Controller),
    init: Controller.init.bind(Controller),
  };

  window.SubmitFormUI = {
    t: I18N.t.bind(I18N),
    setOpenIssueEnabled: StatusManager.setOpenIssueEnabled.bind(StatusManager),
    setStatus: StatusManager.setStatus.bind(StatusManager),
    setHTML: DOMUtils.setHTML.bind(DOMUtils),
    setText: DOMUtils.setText.bind(DOMUtils),
    setValue: FieldManager.setValue.bind(FieldManager),
    setNumber: FieldManager.setNumber.bind(FieldManager),
    setChips: FieldManager.setChips.bind(FieldManager),
    setI18nFields: FieldManager.setI18nFields.bind(FieldManager),
    setProviderI18nFields: FieldManager.setProviderI18nFields.bind(FieldManager),
    clearAllFields: FieldManager.clearAllFields.bind(FieldManager),
    clearProviderFields: FieldManager.clearProviderFields.bind(FieldManager),
    populateSelect: SelectManager.populate.bind(SelectManager),
    toggleVisibility: LayoutManager.toggleVisibility.bind(LayoutManager),
    setMode: LayoutManager.setMode.bind(LayoutManager),
    toggleSubmissionType: LayoutManager.toggleSubmissionType.bind(LayoutManager),
    toggleMode: LayoutManager.toggleMode.bind(LayoutManager),
    updateBatchPreview: BatchPreview.update.bind(BatchPreview),
  };

  window.SubmitFormUtils = {
    $: DOMUtils.$.bind(DOMUtils),
    $$: DOMUtils.$$.bind(DOMUtils),
    value: ValueUtils.value.bind(ValueUtils),
    num: ValueUtils.num.bind(ValueUtils),
    checked: ValueUtils.checked.bind(ValueUtils),
    gather: ValueUtils.gather.bind(ValueUtils),
    getMode: ValueUtils.getMode.bind(ValueUtils),
    getAction: ValueUtils.getAction.bind(ValueUtils),
    getSubmissionType: ValueUtils.getSubmissionType.bind(ValueUtils),
    prune: ObjectUtils.prune.bind(ObjectUtils),
    pick: ObjectUtils.pick.bind(ObjectUtils),
    normalizeId: IDUtils.normalizeId.bind(IDUtils),
    modelIdVariants: IDUtils.modelIdVariants.bind(IDUtils),
    buildApiUrls: URLUtils.buildApiUrls.bind(URLUtils),
    normalizeIssueBody: TextUtils.normalizeIssueBody.bind(TextUtils),
  };

  window.SubmitFormValidation = {
    t: I18N.t.bind(I18N),
    validateSingleRequired: Validation.Single.validateRequired.bind(Validation.Single),
    validateBatchItems: Validation.Batch.validateItems.bind(Validation.Batch),
    parseAndValidateBatch: Validation.Batch.parseAndValidate.bind(Validation.Batch),
    ensureValidBeforeSubmit: Validation.ensureValidBeforeSubmit.bind(Validation),
  };

  window.SubmitFormIssue = {
    t: I18N.t.bind(I18N),
    buildPayload: IssueManager.buildPayload.bind(IssueManager),
    buildSingleTitle: (single) => IssueManager.buildIssue().title,
    buildBatchTitle: (items) => IssueManager.buildIssue().title,
    buildBatchItemList: (items) => '', // Legacy compatibility
    buildSingleIssueContent: (single) => IssueManager.buildIssue().body.split('\n'),
    buildBatchIssueContent: (items) => IssueManager.buildIssue().body.split('\n'),
    buildIssue: IssueManager.buildIssue.bind(IssueManager),
    createGitHubUrl: IssueManager.createGitHubUrl.bind(IssueManager),
    insertBatchTemplate: IssueManager.insertBatchTemplate.bind(IssueManager),
  };

  window.SubmitFormI18N = I18N.getTranslations();

  // Main app reference
  window.SubmitFormApp = SubmitFormApp;
}

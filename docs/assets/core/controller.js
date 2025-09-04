/**
 * Core Controller
 * Main application controller and event management
 */

import { ProvidersAPI, ModelsAPI } from '../api/index.js';
import {
  FieldManager,
  SelectManager,
  LayoutManager,
  StatusManager,
  BatchPreview,
} from '../ui/index.js';
import { ValueUtils, ObjectUtils, DOMUtils, IDUtils } from '../utils/index.js';
import { I18N } from '../i18n/index.js';
import { IssueManager } from '../issue/index.js';
import { CoreActions } from './actions.js';

export const Controller = {
  /**
   * Populate provider dropdown
   */
  async populateProviderDropdown() {
    const providers = await ProvidersAPI.loadProviders();
    SelectManager.populate('providerSelect', providers, I18N.t('providersSelect'));
    SelectManager.populate('provider-select', providers, I18N.t('providersSelect'));
  },

  /**
   * Populate model dropdown for provider
   */
  async populateModelDropdown(providerId) {
    const models = await ModelsAPI.loadModels(providerId);
    SelectManager.populate('modelSelect', models, I18N.t('modelsSelect'));
  },

  /**
   * Load and fill model details
   */
  async loadAndFillModelDetail(providerId, modelId) {
    if (!providerId || !modelId) return;

    // Clear all fields first
    FieldManager.clearAllFields();

    const { data, i18nData } = await ModelsAPI.loadModelDetail(providerId, modelId);

    // Set basic info from main data
    FieldManager.setI18nFields('en', data);

    // Set i18n data for all locales
    Object.entries(i18nData).forEach(([locale, localeData]) => {
      FieldManager.setI18nFields(locale, localeData);
    });

    // Set metadata
    FieldManager.setValue(
      'knowledge',
      ObjectUtils.pick(data, ['knowledge', 'knowledge_cutoff', 'knowledgeCutoff']),
    );
    FieldManager.setValue(
      'release-date',
      ObjectUtils.pick(data, ['release_date', 'releaseDate', 'released']),
    );
    FieldManager.setValue(
      'last-updated',
      ObjectUtils.pick(data, ['last_updated', 'lastUpdated', 'updated_at', 'updatedAt']),
    );

    // Set modalities
    FieldManager.setChips(
      'mod-in',
      ObjectUtils.pick(data, ['modalities.input', 'input_modalities', 'input']),
    );
    FieldManager.setChips(
      'mod-out',
      ObjectUtils.pick(data, ['modalities.output', 'output_modalities', 'output']),
    );

    // Set limits
    FieldManager.setNumber(
      'limit-context',
      ObjectUtils.pick(data, [
        'limit.context',
        'context_window',
        'contextWindow',
        'context',
        'contextTokens',
      ]),
    );
    FieldManager.setNumber(
      'limit-output',
      ObjectUtils.pick(data, [
        'limit.output',
        'max_output_tokens',
        'maxOutput',
        'max_output',
        'outputTokens',
      ]),
    );

    // Set pricing
    FieldManager.setNumber(
      'cost-input',
      ObjectUtils.pick(data, [
        'cost.input',
        'pricing.input',
        'pricing.prompt',
        'price.input',
        'price_input',
        'input_price',
      ]),
    );
    FieldManager.setNumber(
      'cost-output',
      ObjectUtils.pick(data, [
        'cost.output',
        'pricing.output',
        'pricing.completion',
        'price.output',
        'price_output',
        'output_price',
      ]),
    );
    FieldManager.setNumber(
      'cost-cache-read',
      ObjectUtils.pick(data, [
        'cost.cache_read',
        'pricing.cache_read',
        'price.cache_read',
        'cache_read_price',
      ]),
    );
    FieldManager.setNumber(
      'cost-cache-write',
      ObjectUtils.pick(data, [
        'cost.cache_write',
        'pricing.cache_write',
        'price.cache_write',
        'cache_write_price',
      ]),
    );

    // Set capabilities
    const capabilities = [
      [
        'cap-reasoning',
        ['reasoning', 'features.reasoning', 'capabilities.reasoning', 'supportsReasoning'],
      ],
      ['cap-tools', ['tool_call', 'tools', 'toolCalling', 'capabilities.tools', 'features.tools']],
      ['cap-files', ['attachment', 'file', 'files', 'capabilities.files', 'features.files']],
      ['cap-temp', ['temperature', 'features.temperature', 'capabilities.temperature']],
      ['cap-open-weights', ['open_weights', 'openWeights']],
    ];

    capabilities.forEach(([id, keys]) => {
      const el = DOMUtils.$(id);
      if (el) el.checked = !!ObjectUtils.pick(data, keys);
    });

    StatusManager.setStatus(I18N.t('loadedModel'));
  },

  /**
   * Load and fill provider details
   */
  async loadAndFillProviderDetail(providerId) {
    if (!providerId) return;

    // Clear provider fields first
    FieldManager.clearProviderFields();

    const { data, i18nData } = await ProvidersAPI.loadProviderDetail(providerId);

    // Set basic provider info
    FieldManager.setValue(
      'provider-api',
      ObjectUtils.pick(data, ['api', 'apiUrl', 'documentation']),
    );
    FieldManager.setValue('provider-icon-url', ObjectUtils.pick(data, ['iconURL', 'iconUrl', 'icon']));
    FieldManager.setValue('provider-lobe-icon', ObjectUtils.pick(data, ['lobeIcon']));

    // Set provider i18n fields from main data
    FieldManager.setProviderI18nFields('en', data);

    // Set i18n data for all locales
    Object.entries(i18nData).forEach(([locale, localeData]) => {
      FieldManager.setProviderI18nFields(locale, localeData);
    });

    StatusManager.setStatus(I18N.t('loadedProvider'));
  },

  // Event Handlers
  handleProviderChange() {
    const providerId = IDUtils.normalizeSubmissionId(this.value);
    FieldManager.setValue('providerId', providerId);
    Controller.populateModelDropdown(providerId);
  },

  handleProviderSelectChange() {
    const providerId = IDUtils.normalizeSubmissionId(this.value || '');
    FieldManager.setValue('provider-id', providerId);
    Controller.loadAndFillProviderDetail(providerId);
  },

  handleModelChange() {
    const modelId = IDUtils.normalizeSubmissionId(this.value || '');
    FieldManager.setValue('id', modelId);
    const providerId =
      ValueUtils.value('providerId') || ValueUtils.value('providerSelect');
    Controller.loadAndFillModelDetail(providerId, modelId);
  },

  handleActionChange() {
    if (this.checked) {
      LayoutManager.setMode(this.value);
    }
  },

  handleSubmissionTypeChange() {
    if (this.checked) {
      LayoutManager.toggleSubmissionType();
    }
  },

  /**
   * Bind all event handlers
   */
  bindEvents() {
    const events = [
      ['providerSelect', 'change', Controller.handleProviderChange],
      ['provider-select', 'change', Controller.handleProviderSelectChange],
      ['modelSelect', 'change', Controller.handleModelChange],
      ['mode-single', 'change', LayoutManager.toggleMode],
      ['mode-batch', 'change', LayoutManager.toggleMode],
      ['type-model', 'change', Controller.handleSubmissionTypeChange],
      ['type-provider', 'change', Controller.handleSubmissionTypeChange],
      ['batch-json', 'input', BatchPreview.update],
      ['batch-template', 'click', IssueManager.insertBatchTemplate],
      ['action-create', 'change', Controller.handleActionChange],
      ['action-update', 'change', Controller.handleActionChange],
      ['open-issue', 'click', CoreActions.openIssue],
      ['copy-body', 'click', CoreActions.copyBody],
    ];

    events.forEach(([id, event, handler]) => {
      DOMUtils.on(id, event, handler);
    });
  },

  /**
   * Initialize the application
   */
  init() {
    if (!DOMUtils.$('model-submit')) return;

    this.bindEvents();
    LayoutManager.toggleMode();
    LayoutManager.toggleSubmissionType();
    LayoutManager.setMode(ValueUtils.getAction());
  },
};

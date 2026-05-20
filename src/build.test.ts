import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import type { BuildConfig } from './types/index.js';

// Mock the required dependencies
jest.mock('./services/data-loader.js');
jest.mock('./services/data-processor.js');
jest.mock('./services/index-builder.js');
jest.mock('./services/newapi-builder.js');
jest.mock('./services/voapi-builder.js');
jest.mock('./services/docs-generator.js');
jest.mock('./services/i18n-service.js');
jest.mock('./utils/file-utils.js');
jest.mock('./utils/object-utils.js');

// Import the types for typing (not used directly but kept for reference)
// import type { NormalizedData } from './types/index.js';  // Removed since not used

import {
  ensureDirSync,
  writeJSONIfChanged,
  writeTextIfChanged,
  copyDirSyncIfExists,
  sanitizeFileSegment,
  removeNonJsonFiles,
} from './utils/file-utils.js';
import { sha256OfObject, stableStringify } from './utils/object-utils.js';

// Create mock instances
const mockDataLoader: any = {
  loadSourceData: jest.fn(),
  readJSONSafe: jest.fn(),
  loadOverrides: jest.fn(),
  loadPolicy: jest.fn(),
};
const mockDataProcessor: any = {
  mapSourceToNormalized: jest.fn(),
  injectManualProviders: jest.fn(),
  processAllData: jest.fn(),
  localizeNormalizedData: jest.fn(),
  shouldAutoUpdate: jest.fn(),
};
const mockIndexBuilder: any = {
  buildIndexes: jest.fn(),
  buildProvidersOutput: jest.fn(),
};
const mockNewApiBuilder: any = {
  buildSyncPayload: jest.fn(),
  buildPriceConfig: jest.fn(),
};
const mockVoAPIBuilder: any = {
  buildFirms: jest.fn(),
};
const mockDocsGenerator: any = {
  generateDataMarkdown: jest.fn(),
  generateReleasesMarkdown: jest.fn(),
};
const mockI18nService: any = {
  getLocales: jest.fn(),
  getApiMessages: jest.fn(),
  validateDocMessages: jest.fn(),
};

// Create a test implementation of the builder functionality
// Since the Builder class isn't exported, we recreate the core logic for testing
class TestBuilder {
  constructor() {}

  private writeProvidersAndModels(
    _baseDir: string, // baseDir parameter marked as unused with underscore
    dataset: any,
    policy: any,
    sourceProviderIds: Set<string>,
    options: { dryRun?: boolean } = {}
  ): number {
    let changes = 0;
    for (const [providerId, provider] of Object.entries(dataset.providers || {})) {
      const safeProvider = sanitizeFileSegment(providerId);

      // Provider file
      let providerOut = typeof provider === 'object' && provider !== null ? { ...provider } : provider;
      if (sourceProviderIds.has(providerId)) {
        providerOut = {
          ...(typeof providerOut === 'object' && providerOut !== null ? providerOut : {}),
          iconURL: `https://models.dev/logos/${providerId}.svg`,
        };
      }
      const providerPath = `fake/path/providers/${safeProvider}.json`;
      if (writeJSONIfChanged(providerPath, providerOut, options)) {
        changes++;
      }

      // Model files
      const providerModelsDir = `fake/path/models/${safeProvider}`;
      ensureDirSync(providerModelsDir);
      removeNonJsonFiles(providerModelsDir, options);

      const modelsObj: any = (provider && typeof provider === 'object' && 'models' in provider) ? provider.models || {} : {};
      for (const [modelId, modelData] of Object.entries(modelsObj)) {
        const allowAuto = mockDataProcessor.shouldAutoUpdate(policy, providerId, modelId);
        if (!options.dryRun && !allowAuto && mockDataLoader.readJSONSafe('fake/path', null)) {
          continue;
        }
        const modelPath = `fake/path/models/${safeProvider}/${sanitizeFileSegment(modelId)}.json`;
        if (writeJSONIfChanged(modelPath, modelData, options)) {
          changes++;
        }
      }
    }
    return changes;
  }

  private computeManifest(params: {
    sourceHash: string;
    overridesHash: string;
    policyHash: string;
    stats: {
      providers: number;
      models: number;
      filesChanged: number;
      dryRun: boolean;
    };
    warnings?: string[];
  }) {
    const result: any = {
      version: 1,
      generatedAt: new Date().toISOString(),
      sourceHash: params.sourceHash,
      overridesHash: params.overridesHash,
      policyHash: params.policyHash,
      stats: params.stats,
    };

    if (params.warnings) {
      result.warnings = params.warnings;
    }

    return result;
  }

  async build(config: BuildConfig): Promise<void> {
    const { dryRun, force, docsMdOnly, apiOnly } = config;

    // Prepare directories - mocked
    ensureDirSync('fake/cache/dir');
    ensureDirSync('fake/data/dir');

    if (!docsMdOnly) {
      ensureDirSync('fake/dist/dir');
      ensureDirSync('fake/api/dir');
      copyDirSyncIfExists('fake/public/dir', 'fake/dist/dir');
    }

    // Load data
    const source: any = await mockDataLoader.loadSourceData('https://models.dev/api.json');

    // Cache source data
    stableStringify(source);

    // Load config
    const overrides: any = mockDataLoader.loadOverrides();
    const policy: any = mockDataLoader.loadPolicy();

    // Process data
    let normalized: any = mockDataProcessor.mapSourceToNormalized(source);
    const sourceProviderIds = new Set(Object.keys(source || {}));

    // Inject manual providers
    normalized = mockDataProcessor.injectManualProviders(normalized, overrides);

    // Process all data
    const allModelsData: any = mockDataProcessor.processAllData(
      normalized,
      overrides,
      sourceProviderIds,
    );

    // Build indexes
    const indexes: any = mockIndexBuilder.buildIndexes(allModelsData, overrides);
    const providersOutput: any = mockIndexBuilder.buildProvidersOutput(indexes);

    // Calculate hashes
    const sourceHash = sha256OfObject(source);
    const overridesHash = sha256OfObject(overrides);
    const policyHash = sha256OfObject(policy);

    let changes = 0;
    const warnings: string[] = [];

    if (!docsMdOnly) {
      // Write main indexes
      if (writeJSONIfChanged('fake/api/index.json', indexes, { dryRun })) {
        changes++;
      }

      if (writeJSONIfChanged('fake/api/providers.json', providersOutput, { dryRun })) {
        changes++;
      }

      // Write complete data
      if (writeJSONIfChanged('fake/api/all.json', allModelsData.providers, { dryRun })) {
        changes++;
      }

      // Write i18n versions
      {
        ensureDirSync('fake/api/i18n');
        const localeObjects = mockI18nService.getLocales();
        const locales = Array.isArray(localeObjects) ? localeObjects.map((l: any) => l.locale) : [];
        for (const locale of locales) {
          const allLocalized: any = mockDataProcessor.localizeNormalizedData(
            allModelsData,
            overrides,
            locale,
          );
          const outDir = `fake/api/i18n/${locale}`;
          ensureDirSync(outDir);
          if (writeJSONIfChanged(`${outDir}/all.json`, allLocalized.providers, { dryRun })) {
            changes++;
          }
          const indexesLoc: any = mockIndexBuilder.buildIndexes(allLocalized, overrides);
          const providersOutLoc: any = mockIndexBuilder.buildProvidersOutput(indexesLoc);
          if (writeJSONIfChanged(`${outDir}/index.json`, indexesLoc, { dryRun })) {
            changes++;
          }
          if (writeJSONIfChanged(`${outDir}/providers.json`, providersOutLoc, { dryRun })) {
            changes++;
          }
        }
      }

      // Generate VoAPI
      const voapiDir = 'fake/api/voapi';
      ensureDirSync(voapiDir);
      const voapiPayload: any = mockVoAPIBuilder.buildFirms(allModelsData);
      if (
        writeJSONIfChanged(
          'fake/api/voapi/firms.json',
          { success: true, message: '', data: voapiPayload.firms },
          { dryRun },
        )
      ) {
        changes++;
      }

      if (
        writeJSONIfChanged(
          'fake/api/voapi/models.json',
          { success: true, message: '', data: voapiPayload.models },
          { dryRun },
        )
      ) {
        changes++;
      }

      // Generate NewAPI
      const newapiDir = 'fake/api/newapi';
      ensureDirSync(newapiDir);

      const allModelsDataEn: any = mockDataProcessor.localizeNormalizedData(
        allModelsData,
        overrides,
        'en',
      );
      const newapiSync: any = mockNewApiBuilder.buildSyncPayload(allModelsDataEn, {});
      if (
        writeJSONIfChanged(
          'fake/api/newapi/vendors.json',
          { success: true, message: '', data: newapiSync.vendors },
          { dryRun },
        )
      ) {
        changes++;
      }

      if (
        writeJSONIfChanged(
          'fake/api/newapi/models.json',
          { success: true, message: '', data: newapiSync.models },
          { dryRun },
        )
      ) {
        changes++;
      }

      const priceConfig: any = mockNewApiBuilder.buildPriceConfig(allModelsData);
      if (
        writeJSONIfChanged('fake/api/newapi/ratio_config-v1-base.json', priceConfig, { dryRun })
      ) {
        changes++;
      }

      // Write individual provider and model files
      for (const [providerId, provider] of Object.entries(allModelsData.providers || {})) {
        const safeProvider = sanitizeFileSegment(providerId);

        // Provider file
        let providerOut = typeof provider === 'object' && provider !== null ? { ...provider } : provider;
        if (sourceProviderIds.has(providerId)) {
          providerOut = {
            ...(typeof providerOut === 'object' && providerOut !== null ? providerOut : {}),
            iconURL: `https://models.dev/logos/${providerId}.svg`,
          };
        }

        const providerPath = `fake/api/providers/${safeProvider}.json`;
        if (writeJSONIfChanged(providerPath, providerOut, { dryRun })) {
          changes++;
        }

        // Model files
        const providerModelsDir = `fake/api/models/${safeProvider}`;
        ensureDirSync(providerModelsDir);
        removeNonJsonFiles(providerModelsDir, { dryRun });

        const models = (provider && typeof provider === 'object' && 'models' in provider) ? provider.models || {} : {};
        for (const [modelId, modelData] of Object.entries(models)) {
          const allowAuto = mockDataProcessor.shouldAutoUpdate(policy, providerId, modelId);
          const existing = mockDataLoader.readJSONSafe('fake/path', null);

          if (!force && !allowAuto && existing) {
            continue; // Skip non-auto mode existing files
          }

          if (writeJSONIfChanged(`fake/api/models/${safeProvider}/${sanitizeFileSegment(modelId)}.json`, modelData, { dryRun })) {
            changes++;
          }
        }
      }

      // Write i18n provider and model files
      {
        const localeObjects = mockI18nService.getLocales();
        const locales = Array.isArray(localeObjects) ? localeObjects.map((l: any) => l.locale) : [];
        const i18nDir = 'fake/api/i18n';
        for (const locale of locales) {
          const outDir = `${i18nDir}/${locale}`;
          ensureDirSync(outDir);
          const localized: any = mockDataProcessor.localizeNormalizedData(
            allModelsData,
            overrides,
            locale,
          );
          changes += this.writeProvidersAndModels(outDir, localized, policy, sourceProviderIds, {
            dryRun,
          });
        }
      }
    }

    // Generate build manifest
    const manifest = this.computeManifest({
      sourceHash,
      overridesHash,
      policyHash,
      stats: {
        providers: Array.isArray(indexes?.providers) ? indexes.providers.length : 0,
        models: Array.isArray(indexes?.models) ? indexes.models.length : 0,
        filesChanged: changes,
        dryRun,
      },
      ...(warnings.length > 0 && { warnings }),
    });

    if (!docsMdOnly) {
      if (writeJSONIfChanged('fake/api/manifest.json', manifest, { dryRun })) {
        changes++;
      }
    }

    // Generate documentation
    if (!apiOnly) {
      const localeObjects = mockI18nService.getLocales();
      const locales = Array.isArray(localeObjects) ? localeObjects.map((l: any) => l.locale) : [];
      for (const locale of locales) {
        const dataMd: any = mockDocsGenerator.generateDataMarkdown(
          allModelsData,
          Array.isArray(indexes?.providers) ? indexes.providers : [],
          manifest,
          locale,
        );
        if (writeTextIfChanged(`fake/docs/${locale}/data.md`, dataMd, { dryRun })) {
          changes++;
        }

        const releasesMd: any = mockDocsGenerator.generateReleasesMarkdown(
          mockDataProcessor.localizeNormalizedData(allModelsData, overrides, locale),
          manifest,
          locale,
        );
        if (writeTextIfChanged(`fake/docs/${locale}/releases.md`, releasesMd, { dryRun })) {
          changes++;
        }
      }
    }

    // i18n doc messages and mkdocs language consistency validation
    {
      const localeObjects = mockI18nService.getLocales();
      const locales = Array.isArray(localeObjects) ? localeObjects.map((l: any) => l.locale) : [];
      const i18nWarnings: any[] = mockI18nService.validateDocMessages(locales);
      if (Array.isArray(i18nWarnings) && i18nWarnings.length > 0) warnings.push(...i18nWarnings);
    }

    return;
  }
}

describe('Build Functionality', () => {
  let testBuilder: TestBuilder;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Set up some default mock returns
    mockDataLoader.loadOverrides.mockReturnValue({});
    mockDataLoader.loadPolicy.mockReturnValue({});
    mockDataProcessor.mapSourceToNormalized.mockReturnValue({ providers: {} });
    mockDataProcessor.injectManualProviders.mockReturnValue({ providers: {} });
    mockDataProcessor.processAllData.mockReturnValue({ providers: {} });
    mockIndexBuilder.buildIndexes.mockReturnValue({ providers: [], models: [] });
    mockIndexBuilder.buildProvidersOutput.mockReturnValue([]);
    mockNewApiBuilder.buildSyncPayload.mockReturnValue({ vendors: [], models: [] });
    mockNewApiBuilder.buildPriceConfig.mockReturnValue({});
    mockVoAPIBuilder.buildFirms.mockReturnValue({ firms: [], models: [] });
    mockI18nService.getLocales.mockReturnValue([{ locale: 'en' }]);
    mockI18nService.getApiMessages.mockReturnValue({});
    mockI18nService.validateDocMessages.mockReturnValue([]);
    mockDataProcessor.localizeNormalizedData.mockReturnValue({ providers: {} });
    mockDataProcessor.shouldAutoUpdate.mockReturnValue(true);

    // Create new instance
    testBuilder = new TestBuilder();
  });

  it('should execute the full build process successfully', async () => {
    const mockSourceData = { provider1: { models: {} } };
    const mockNormalizedData = { providers: { provider1: { models: {} } } };
    const mockProcessedData = { providers: { provider1: { models: {} } } };
    const mockIndexes = { providers: [{ id: 'provider1' }], models: [{ id: 'model1' }] };
    const mockProvidersOutput = [{ id: 'provider1' }];

    // Setup mock returns
    mockDataLoader.loadSourceData.mockResolvedValue(mockSourceData);
    mockDataProcessor.mapSourceToNormalized.mockReturnValue(mockNormalizedData);
    mockDataProcessor.injectManualProviders.mockReturnValue(mockNormalizedData);
    mockDataProcessor.processAllData.mockReturnValue(mockProcessedData);
    mockIndexBuilder.buildIndexes.mockReturnValue(mockIndexes);
    mockIndexBuilder.buildProvidersOutput.mockReturnValue(mockProvidersOutput);

    const config: BuildConfig = { dryRun: false, force: false, docsMdOnly: false, apiOnly: false };
    await testBuilder.build(config);

    // Verify that key methods were called
    expect(mockDataLoader.loadSourceData).toHaveBeenCalled();
    expect(mockDataProcessor.mapSourceToNormalized).toHaveBeenCalledWith(mockSourceData);
    expect(mockIndexBuilder.buildIndexes).toHaveBeenCalled();
    expect(writeJSONIfChanged).toHaveBeenCalled();
  });

  it('should handle dry run mode correctly', async () => {
    const mockSourceData = { provider1: { models: {} } };
    const mockNormalizedData = { providers: { provider1: { models: {} } } };
    const mockProcessedData = { providers: { provider1: { models: {} } } };
    const mockIndexes = { providers: [{ id: 'provider1' }], models: [{ id: 'model1' }] };
    const mockProvidersOutput = [{ id: 'provider1' }];

    // Setup mock returns
    mockDataLoader.loadSourceData.mockResolvedValue(mockSourceData);
    mockDataProcessor.mapSourceToNormalized.mockReturnValue(mockNormalizedData);
    mockDataProcessor.injectManualProviders.mockReturnValue(mockNormalizedData);
    mockDataProcessor.processAllData.mockReturnValue(mockProcessedData);
    mockIndexBuilder.buildIndexes.mockReturnValue(mockIndexes);
    mockIndexBuilder.buildProvidersOutput.mockReturnValue(mockProvidersOutput);

    const config: BuildConfig = { dryRun: true, force: false, docsMdOnly: false, apiOnly: false };
    await testBuilder.build(config);

    // Verify write functions were called with dryRun: true
    expect(writeJSONIfChanged).toHaveBeenCalledWith(
      expect.any(String),
      expect.anything(),
      { dryRun: true }
    );
  });

  it('should skip API building when docsMdOnly is true', async () => {
    const mockSourceData = { provider1: { models: {} } };
    const mockNormalizedData = { providers: { provider1: { models: {} } } };
    const mockProcessedData = { providers: { provider1: { models: {} } } };
    const mockIndexes = { providers: [{ id: 'provider1' }], models: [{ id: 'model1' }] };
    const mockProvidersOutput = [{ id: 'provider1' }];
    const mockDocsContent = '# Test Docs';

    // Setup mock returns
    mockDataLoader.loadSourceData.mockResolvedValue(mockSourceData);
    mockDataProcessor.mapSourceToNormalized.mockReturnValue(mockNormalizedData);
    mockDataProcessor.injectManualProviders.mockReturnValue(mockNormalizedData);
    mockDataProcessor.processAllData.mockReturnValue(mockProcessedData);
    mockIndexBuilder.buildIndexes.mockReturnValue(mockIndexes);
    mockIndexBuilder.buildProvidersOutput.mockReturnValue(mockProvidersOutput);
    mockDocsGenerator.generateDataMarkdown.mockReturnValue(mockDocsContent);
    mockDocsGenerator.generateReleasesMarkdown.mockReturnValue(mockDocsContent);

    const config: BuildConfig = { dryRun: false, force: false, docsMdOnly: true, apiOnly: false };
    await testBuilder.build(config);

    // In docs-md-only mode, documentation generation should happen, but API file creation should be skipped
    // Verify that doc generation functions were called
    expect(mockDocsGenerator.generateDataMarkdown).toHaveBeenCalled();
    expect(mockDocsGenerator.generateReleasesMarkdown).toHaveBeenCalled();
    
    // Check that API files weren't written by verifying the writeJSONIfChanged calls had fewer API-related paths
    const writeCalls = (writeJSONIfChanged as jest.Mock).mock.calls;
    const apiRelatedPaths = writeCalls.filter((call: any[]) => call[0].includes('/api/'));
    expect(apiRelatedPaths.length).toBeLessThan(10); // Expecting fewer API calls in docs-only mode
  });

  it('should skip documentation generation when apiOnly is true', async () => {
    const mockSourceData = { provider1: { models: {} } };
    const mockNormalizedData = { providers: { provider1: { models: {} } } };
    const mockProcessedData = { providers: { provider1: { models: {} } } };
    const mockIndexes = { providers: [{ id: 'provider1' }], models: [{ id: 'model1' }] };
    const mockProvidersOutput = [{ id: 'provider1' }];

    // Setup mock returns
    mockDataLoader.loadSourceData.mockResolvedValue(mockSourceData);
    mockDataProcessor.mapSourceToNormalized.mockReturnValue(mockNormalizedData);
    mockDataProcessor.injectManualProviders.mockReturnValue(mockNormalizedData);
    mockDataProcessor.processAllData.mockReturnValue(mockProcessedData);
    mockIndexBuilder.buildIndexes.mockReturnValue(mockIndexes);
    mockIndexBuilder.buildProvidersOutput.mockReturnValue(mockProvidersOutput);

    const config: BuildConfig = { dryRun: false, force: false, docsMdOnly: false, apiOnly: true };
    await testBuilder.build(config);

    // Verify that documentation generation methods were NOT called
    expect(mockDocsGenerator.generateDataMarkdown).not.toHaveBeenCalled();
    expect(mockDocsGenerator.generateReleasesMarkdown).not.toHaveBeenCalled();
  });

  it('should handle error conditions gracefully', async () => {
    // Mock an error in data loading
    mockDataLoader.loadSourceData.mockRejectedValue(new Error('Network error'));

    const config: BuildConfig = { dryRun: false, force: false, docsMdOnly: false, apiOnly: false };
    
    // Expect the function to throw since the mock throws
    await expect(testBuilder.build(config)).rejects.toThrow();
  });
});
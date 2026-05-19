import { DocumentationGenerator } from './docs-generator.js';
import type {
  BuildManifest,
  NormalizedData,
  ProviderIndexItem,
  Model,
  ModelCost,
  Provider,
  NewApiRatios
} from '../types/index.js';

describe('DocumentationGenerator', () => {
  let generator: DocumentationGenerator;

  beforeEach(() => {
    generator = new DocumentationGenerator('./test-data'); // Mock path
  });

  describe('constructor', () => {
    it('should initialize with root directory', () => {
      expect(generator).toBeInstanceOf(DocumentationGenerator);
    });
  });

  describe('parseDateToTimestamp', () => {
    it('should return null for invalid dates', () => {
      expect(generator['parseDateToTimestamp']()).toBeNull();
      expect(generator['parseDateToTimestamp']('')).toBeNull();
      expect(generator['parseDateToTimestamp']('invalid')).toBeNull();
    });

    it('should parse valid date strings', () => {
      const timestamp = generator['parseDateToTimestamp']('2023-10-01');
      expect(timestamp).toBeGreaterThanOrEqual(0);
    });

    it('should handle incomplete date formats', () => {
      const yearOnly = generator['parseDateToTimestamp']('2023');
      expect(yearOnly).toBeGreaterThanOrEqual(0);

      const monthOnly = generator['parseDateToTimestamp']('2023-10');
      expect(monthOnly).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getMinUnitPrice', () => {
    it('should return null for undefined cost', () => {
      expect(generator['getMinUnitPrice']()).toBeNull();
    });

    it('should return null for empty cost object', () => {
      expect(generator['getMinUnitPrice']({} as ModelCost)).toBeNull();
    });

    it('should return the minimum unit price', () => {
      const cost = {
        per_image: 0.02,
        per_second: 0.01,
        per_10k_chars: 0.03,
      } as ModelCost;
      expect(generator['getMinUnitPrice'](cost)).toBe(0.01);
    });

    it('should return null if no unit prices found', () => {
      const cost = {
        input: 0.01,
        output: 0.02,
      } as ModelCost;
      expect(generator['getMinUnitPrice'](cost)).toBeNull();
    });

    it('should handle variations of unit price fields', () => {
      const cost = {
        per_image: 0.02,
        per_second_var: 0.01,
      } as ModelCost;
      expect(generator['getMinUnitPrice'](cost)).toBe(0.01); // Both per_second and per_second_var match regex
    });
  });

  describe('formatNewApiRatios', () => {
    it('should return "-" for null ratios', () => {
      expect(generator['formatNewApiRatios'](null, undefined)).toBe('-');
    });

    it('should format ratios correctly', () => {
      const ratios: NewApiRatios = {
        model: 1.5,
        completion: 2.0,
        cache: 0.5,
      };
      const result = generator['formatNewApiRatios'](ratios, undefined);
      expect(result).toContain('Model: 1.500');
      expect(result).toContain('Completion: 2.000');
      expect(result).toContain('Cache: 0.500');
    });

    it('should handle null completion and cache values', () => {
      const ratios: NewApiRatios = {
        model: 1.5,
        completion: null,
        cache: null,
      };
      const result = generator['formatNewApiRatios'](ratios, undefined);
      expect(result).toContain('Model: 1.500');
      expect(result).not.toContain('Completion:');
      expect(result).not.toContain('Cache:');
    });

    it('should add currency conversion note when currency is not USD', () => {
      const ratios: NewApiRatios = {
        model: 1.5,
        completion: 2.0,
        cache: null,
      };
      const cost: ModelCost = { currency: 'CNY' };
      const result = generator['formatNewApiRatios'](ratios, cost);
      expect(result).toContain('(CNY pricing, multiply by USD/CNY rate for NewAPI)');
    });

    it('should not add currency conversion note when currency is USD', () => {
      const ratios: NewApiRatios = {
        model: 1.5,
        completion: 2.0,
        cache: null,
      };
      const cost: ModelCost = { currency: 'USD' };
      const result = generator['formatNewApiRatios'](ratios, cost);
      expect(result).not.toContain('pricing, multiply by');
    });
  });

  describe('calculateNewApiRatios', () => {
    it('should return null when no cost provided', () => {
      expect(generator['calculateNewApiRatios'](undefined)).toBeNull();
    });

    it('should return unit price ratios when no input token pricing', () => {
      const cost: ModelCost = {
        per_image: 0.01,
        per_second: 0.02,
      };
      const result = generator['calculateNewApiRatios'](cost);
      expect(result).toEqual({
        model: 0.01, // minimum unit price
        completion: null,
        cache: null,
      });
    });

    it('should return null for ratios when no unit prices', () => {
      const cost: ModelCost = {
        input: 2,
        output: 4,
      };
      const result = generator['calculateNewApiRatios'](cost);
      expect(result).toEqual({
        model: 1, // input / 2
        completion: 2, // output / input
        cache: null,
      });
    });

    it('should calculate ratios with cache_read', () => {
      const cost: ModelCost = {
        input: 2,
        output: 4,
        cache_read: 1,
      };
      const result = generator['calculateNewApiRatios'](cost);
      expect(result).toEqual({
        model: 1, // input / 2
        completion: 2, // output / input
        cache: 0.5, // cache_read / input
      });
    });
  });

  describe('buildModelRow', () => {
    it('should construct a model row correctly', () => {
      const providerId = 'openai';
      const provider = { name: 'OpenAI' };
      const modelId = 'gpt-4';
      const model: Model = {
        id: 'gpt-4',
        name: 'GPT-4',
        limit: {
          context: 128000,
          output: 4096,
        },
        cost: {
          input: 0.01,
          output: 0.03,
        },
        release_date: '2023-06-13',
        knowledge: 'Knowledge cutoff June 2023',
        modalities: {
          input: ['text', 'image'],
          output: ['text'],
        },
        attachment: true,
        reasoning: true,
        tool_call: true,
        temperature: true,
      };

      const row = generator['buildModelRow'](providerId, provider, modelId, model);

      expect(row.providerId).toBe('openai');
      expect(row.providerName).toBe('OpenAI');
      expect(row.modelId).toBe('gpt-4');
      expect(row.modelName).toBe('GPT-4');
      expect(row.releaseRaw).toBe('2023-06-13');
      expect(row.context).toBe(128000);
      expect(row.output).toBe(4096);
      expect(row.knowledge).toBe('Knowledge cutoff June 2023');
    });
  });

  describe('generateTable', () => {
    it('should generate a markdown table', () => {
      const headers = ['Name', 'Type'];
      const rows = [['John', 'Human'], ['Jane', 'Robot']];
      const table = generator['generateTable'](headers, rows);

      expect(table).toContain('| Name | Type |');
      expect(table).toContain('|--------|--------|');
      expect(table).toContain('| John | Human |');
      expect(table).toContain('| Jane | Robot |');
    });
  });

  describe('generateDocumentHeader', () => {
    it('should generate a document header with all required elements', () => {
      const mockTr = (key: string) => {
        const translations: Record<string, string> = {
          'stats.title': 'Statistics',
          'stats.providers': 'Providers',
          'stats.models': 'Models',
          'stats.updated': 'Last Updated',
        };
        return translations[key] || key;
      };

      const context = {
        tr: mockTr,
        trWith: (key: string) => key,
        stats: { providers: 5, models: 50 },
        lastUpdated: '2023-12-01',
      };

      const header = generator['generateDocumentHeader'](
        'Test Title',
        'Introduction text',
        context
      );

      expect(header).toContain('# Test Title');
      expect(header).toContain('Introduction text');
      expect(header).toContain('**Providers**: 5');
      expect(header).toContain('**Models**: 50');
    });

    it('should include icon in title when provided', () => {
      const mockTr = (key: string) => key;
      const context = {
        tr: mockTr,
        trWith: (key: string) => key,
        stats: { providers: 1, models: 1 },
        lastUpdated: '2023-12-01',
      };

      const header = generator['generateDocumentHeader'](
        'Test Title',
        'Intro',
        context,
        '🚀'
      );

      expect(header).toContain('# 🚀 Test Title');
    });
  });

  describe('createDocumentContext', () => {
    it('should create a document context with translated messages', () => {
      const manifest: BuildManifest = {
        version: 1,
        generatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        sourceHash: 'hash123',
        overridesHash: 'override456',
        policyHash: 'policy789',
        stats: {
          providers: 10,
          models: 100,
          filesChanged: 0,
          dryRun: false,
        },
      };

      const context = generator['createDocumentContext'](manifest, 'en');
      expect(context.tr).toBeInstanceOf(Function);
      expect(context.trWith).toBeInstanceOf(Function);
      expect(context.stats).toEqual(manifest.stats);
      expect(context.lastUpdated).toBeDefined();
    });
  });

  describe('buildAndSortModelRows', () => {
    it('should build and sort model rows by release date', () => {
      const allModelsData: NormalizedData = {
        providers: {
          openai: {
            id: 'openai',
            name: 'OpenAI',
            models: {
              'gpt-4': {
                id: 'gpt-4',
                name: 'GPT-4',
                release_date: '2023-06-13',
              } as Model,
              'gpt-3.5': {
                id: 'gpt-3.5',
                name: 'GPT-3.5',
                release_date: '2022-11-30',
              } as Model,
            },
          } as Provider,
          anthropic: {
            id: 'anthropic',
            name: 'Anthropic',
            models: {
              'claude-2': {
                id: 'claude-2',
                name: 'Claude 2',
                release_date: '2023-07-20',
              } as Model,
            },
          } as Provider,
        },
      };

      const rows = generator['buildAndSortModelRows'](allModelsData);

      expect(rows).toHaveLength(3);
      // Should be sorted with most recent first (Claude 2 released in July 2023, GPT-4 in June 2023, GPT-3.5 in Nov 2022)
      expect(rows[0].modelName).toBe('Claude 2');
      expect(rows[1].modelName).toBe('GPT-4');
      expect(rows[2].modelName).toBe('GPT-3.5');
    });
  });

  describe('groupModelsByTime', () => {
    it('should group models by time periods', () => {
      // Create models with different release dates
      const now = Date.now();
      const recentModel = {
        providerId: 'test',
        providerName: 'Test Provider',
        modelId: 'recent',
        modelName: 'Recent Model',
        releaseTs: now - 1 * 24 * 60 * 60 * 1000, // 1 day ago
        pricing: '-',
        ratios: '-',
        capabilities: '-',
        knowledge: '-',
        modalities: '-',
        details: '-',
      };

      const olderModel = {
        providerId: 'test',
        providerName: 'Test Provider',
        modelId: 'old',
        modelName: 'Old Model',
        releaseTs: now - 4 * 30 * 24 * 60 * 60 * 1000, // 4 months ago
        pricing: '-',
        ratios: '-',
        capabilities: '-',
        knowledge: '-',
        modalities: '-',
        details: '-',
      };

      const rows = [recentModel, olderModel];
      const groups = generator['groupModelsByTime'](rows);

      expect(groups.recent).toContain(recentModel);
      expect(groups.older).toContain(olderModel);
    });
  });

  describe('generateDataMarkdown', () => {
    it('should generate markdown with provider sections and tables', () => {
      const allModelsData: NormalizedData = {
        providers: {
          openai: {
            id: 'openai',
            name: 'OpenAI',
            api: 'https://api.openai.com',
            doc: 'https://platform.openai.com/docs',
            models: {
              'gpt-4': {
                id: 'gpt-4',
                name: 'GPT-4',
                limit: { context: 128000, output: 4096 },
                cost: { input: 0.01, output: 0.03 },
                knowledge: 'Knowledge cutoff June 2023',
                modalities: { input: ['text', 'image'], output: ['text'] },
                attachment: true,
                reasoning: true,
                tool_call: true,
              } as Model,
            },
          } as Provider,
        },
      };

      const providerIndex: ProviderIndexItem[] = [
        {
          id: 'openai',
          name: 'OpenAI',
          api: 'https://api.openai.com',
          doc: 'https://platform.openai.com/docs',
          modelCount: 1,
        },
      ];

      const manifest: BuildManifest = {
        version: 1,
        generatedAt: new Date().toISOString(),
        sourceHash: 'hash123',
        overridesHash: 'override456',
        policyHash: 'policy789',
        stats: {
          providers: 1,
          models: 1,
          filesChanged: 0,
          dryRun: false,
        },
      };

      const markdown = generator['generateDataMarkdown'](allModelsData, providerIndex, manifest, 'en');

      expect(markdown).toContain('## OpenAI');
      expect(markdown).toContain('[link.api](https://api.openai.com)');
      expect(markdown).toContain('[link.doc](https://platform.openai.com/docs)');
      expect(markdown).toContain('**GPT-4**');
    });
  });

  describe('renderModelCard', () => {
    it('should render a model card with all details', () => {
      const modelRow = {
        providerId: 'openai',
        providerName: 'OpenAI',
        modelId: 'gpt-4',
        modelName: 'GPT-4 Turbo',
        releaseRaw: '2023-06-13',
        releaseTs: Date.now(),
        context: 128000,
        output: 4096,
        pricing: '$0.01/input token<br/>$0.03/output token',
        ratios: 'Model: 1.000<br/>Completion: 3.000',
        capabilities: '🧠 🔧 📎 🌡️',
        knowledge: 'Knowledge cutoff June 2023',
        modalities: 'In: text, image<br/>Out: text',
        details: 'Released: 2023-06-13',
      };

      const mockTr = (key: string) => {
        const translations: Record<string, string> = {
          'table.released': 'Released',
          'table.context': 'Context',
          'table.output': 'Output',
        };
        return translations[key] || key;
      };

      const context = {
        tr: mockTr,
        trWith: (key: string) => key,
        stats: { providers: 1, models: 1 },
        lastUpdated: '2023-12-01',
      };

      const card = generator['renderModelCard'](modelRow, context);

      expect(card).toContain('**GPT-4 Turbo**');
      expect(card).toContain(':material-factory: **OpenAI**');
      expect(card).toContain(' :material-calendar: **Released**: ');
      expect(card).toContain('table.modalities');
    });
  });

  describe('renderModelCardSection', () => {
    it('should render a section with model cards', () => {
      const models = [{
        providerId: 'openai',
        providerName: 'OpenAI',
        modelId: 'gpt-4',
        modelName: 'GPT-4 Turbo',
        releaseRaw: '2023-06-13',
        releaseTs: Date.now(),
        pricing: '$0.01/input token<br/>$0.03/output token',
        ratios: 'Model: 1.000',
        capabilities: '🧠 🔧',
        knowledge: '-',
        modalities: 'In: text<br/>Out: text',
        details: 'Released: 2023-06-13',
      }];

      const mockTr = (key: string) => {
        const translations: Record<string, string> = {
          'note.showing_first': 'Showing first',
          'note.total_models': 'Total: {count} models',
        };
        return translations[key] || key;
      };

      const mockTrWith = (key: string, vars: Record<string, any>) => {
        if (key === 'note.total_models') {
          return `Total: ${vars.count} models`;
        }
        return key;
      };

      const context = {
        tr: mockTr,
        trWith: mockTrWith,
        stats: { providers: 1, models: 1 },
        lastUpdated: '2023-12-01',
      };

      const section = generator['renderModelCardSection'](models, 'Recent Models', '🚀', context);

      expect(section).toContain('## 🚀 Recent Models');
      expect(section).toContain('<div class="grid cards" markdown>');
      expect(section).toContain('**GPT-4 Turbo**');
    });
  });

  describe('renderOlderModelsTable', () => {
    it('should render a compact table for older models', () => {
      const olderRows = [{
        providerId: 'openai',
        providerName: 'OpenAI',
        modelId: 'gpt-3.5',
        modelName: 'GPT-3.5 Turbo',
        releaseRaw: '2022-11-30',
        releaseTs: Date.now() - 365 * 24 * 60 * 60 * 1000, // 1 year ago
        context: 16385,
        output: 4096,
        pricing: '$0.001/input token<br/>$0.002/output token',
        ratios: 'Model: 0.500',
        capabilities: '🧠 🔧',
        knowledge: 'Knowledge cutoff Sep 2021',
        modalities: 'In: text<br/>Out: text',
        details: 'Released: 2022-11-30',
      }];

      const mockTr = (key: string) => {
        const translations: Record<string, string> = {
          'section.earlier': 'Earlier Models',
          'note.compact_list': 'Compact List',
          'note.older_models': '{count} older models',
          'table.model': 'Model',
          'table.provider': 'Provider',
          'table.released': 'Released',
          'table.context': 'Context',
          'table.output': 'Output',
          'table.modalities': 'Modalities',
          'table.capabilities': 'Capabilities',
          'table.pricing': 'Pricing',
          'table.ratios': 'Ratios',
          'table.knowledge': 'Knowledge',
          'table.details': 'Details',
        };
        return translations[key] || key;
      };

      const mockTrWith = (key: string, vars: Record<string, any>) => {
        if (key === 'note.older_models') {
          return `${vars.count} older models`;
        }
        return key;
      };

      const context = {
        tr: mockTr,
        trWith: mockTrWith,
        stats: { providers: 1, models: 1 },
        lastUpdated: '2023-12-01',
      };

      const table = generator['renderOlderModelsTable'](olderRows, context);

      expect(table).toContain('## :material-archive:');
      expect(table).toContain('Earlier Models');
      expect(table).toContain('**GPT-3.5 Turbo**');
      expect(table).toContain('OpenAI');
    });
  });

  describe('generateReleasesMarkdown', () => {
    it('should generate release markdown with sections and models', () => {
      const allModelsData: NormalizedData = {
        providers: {
          openai: {
            id: 'openai',
            name: 'OpenAI',
            models: {
              'gpt-4': {
                id: 'gpt-4',
                name: 'GPT-4',
                release_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
              } as Model,
              'gpt-3.5': {
                id: 'gpt-3.5',
                name: 'GPT-3.5',
                release_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
              } as Model,
            },
          } as Provider,
        },
      };

      const manifest: BuildManifest = {
        version: 1,
        generatedAt: new Date().toISOString(),
        sourceHash: 'hash123',
        overridesHash: 'override456',
        policyHash: 'policy789',
        stats: {
          providers: 1,
          models: 2,
          filesChanged: 0,
          dryRun: false,
        },
      };

      const markdown = generator['generateReleasesMarkdown'](allModelsData, manifest, 'en');

      expect(markdown).toContain('# :material-rocket-launch:');
      expect(markdown).toContain('title.releases');
      expect(markdown).toContain('intro.releases');
    });
  });
});
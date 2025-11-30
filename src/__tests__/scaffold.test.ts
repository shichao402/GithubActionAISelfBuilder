/**
 * Scaffold 单元测试
 */

import { ScaffoldGenerator } from '../scaffold';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs with promises
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: jest.fn(() => true),
    mkdirSync: jest.fn(),
    readdirSync: jest.fn(() => []),
    readFileSync: jest.fn(() => '{}'),
    writeFileSync: jest.fn(),
    promises: {
      ...actualFs.promises,
    },
  };
});

jest.mock('js-yaml', () => ({
  dump: jest.fn((data) => JSON.stringify(data)),
  load: jest.fn(() => ({})),
}));

describe('ScaffoldGenerator', () => {
  let generator: ScaffoldGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => {});
    (fs.readdirSync as jest.Mock).mockReturnValue([]);
    generator = new ScaffoldGenerator();
  });

  describe('detectProjectRoot', () => {
    test('应该检测项目根目录', () => {
      (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
        return p.includes('package.json');
      });

      const root = (generator as any).detectProjectRoot();
      expect(root).toBeDefined();
    });
  });

  describe('generateWorkflowYAML', () => {
    test('应该生成工作流 YAML', () => {
      const metadata = {
        name: 'TestPipeline',
        description: 'Test Pipeline',
        module: 'TestPipeline',
        config: {
          triggers: {
            push: { branches: ['main'] },
          },
        },
      };

      const workflow = (generator as any).generateWorkflowYAML(metadata, {});

      expect(workflow).toHaveProperty('name');
      expect(workflow).toHaveProperty('on');
      expect(workflow).toHaveProperty('jobs');
    });

    test('应该包含正确的步骤', () => {
      const metadata = {
        name: 'TestPipeline',
        description: 'Test Pipeline',
        module: 'TestPipeline',
        config: {
          setup: {
            actions: [
              {
                name: 'Set up Node.js',
                uses: 'actions/setup-node@v3',
              },
            ],
          },
        },
      };

      const workflow = (generator as any).generateWorkflowYAML(metadata, {});

      const steps = workflow.jobs[Object.keys(workflow.jobs)[0]].steps;
      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0]).toHaveProperty('name', 'Checkout code');
    });
  });
});


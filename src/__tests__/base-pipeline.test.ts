/**
 * BasePipeline 单元测试
 */

import { BasePipeline, PipelineResult } from '../base-pipeline';

// Mock @actions/core
jest.mock('@actions/core', () => {
  const mockGetInput = jest.fn((key: string, options?: any) => {
    return process.env[`INPUT_${key.toUpperCase().replace(/-/g, '_')}`] || options?.defaultValue;
  });
  const mockSetOutput = jest.fn();
  const mockInfo = jest.fn();
  const mockWarning = jest.fn();
  const mockError = jest.fn();
  const mockDebug = jest.fn();

  return {
    getInput: mockGetInput,
    setOutput: mockSetOutput,
    info: mockInfo,
    warning: mockWarning,
    error: mockError,
    debug: mockDebug,
  };
});

// Mock child_process
jest.mock('child_process', () => {
  const mockExec = jest.fn((command: string, options: any, callback: any) => {
    if (command.includes('fail')) {
      callback(new Error('Command failed'), null, 'Error output');
    } else {
      callback(null, 'Success output', null);
    }
  });
  return {
    exec: mockExec,
  };
});

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  readFileSync: jest.fn(() => '{}'),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  statSync: jest.fn(() => ({ isDirectory: () => false })),
  readdirSync: jest.fn(() => []),
}));

class TestPipeline extends BasePipeline {
  static getWorkflowInputs() {
    return {
      'test-input': {
        description: 'Test input',
        required: true,
      },
    };
  }

  static getWorkflowSetup() {
    return {
      actions: [
        {
          name: 'Test Setup',
          uses: 'actions/setup-node@v3',
        },
      ],
    };
  }

  static getWorkflowTriggers() {
    return {
      push: { branches: ['main'] },
    };
  }

  static getWorkflowRunsOn(): string {
    return 'ubuntu-latest';
  }

  async execute(): Promise<PipelineResult> {
    const input = this.getInput('test-input');
    if (!input) {
      return {
        success: false,
        message: 'Missing test-input',
        exitCode: 1,
      };
    }

    const success = await this.runCommand('echo test');
    if (!success) {
      return {
        success: false,
        message: 'Command failed',
        exitCode: 1,
      };
    }

    this.setOutput('test-output', 'test-value');

    return {
      success: true,
      message: 'Test passed',
      data: {
        'test-output': 'test-value',
      },
      exitCode: 0,
    };
  }
}

describe('BasePipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {};
  });

  describe('静态方法', () => {
    test('getWorkflowInputs 应该返回输入配置', () => {
      const inputs = TestPipeline.getWorkflowInputs();
      expect(inputs).toHaveProperty('test-input');
      expect(inputs['test-input']).toHaveProperty('description');
    });

    test('getWorkflowSetup 应该返回设置配置', () => {
      const setup = TestPipeline.getWorkflowSetup();
      expect(setup).toHaveProperty('actions');
      expect(Array.isArray(setup.actions)).toBe(true);
    });

    test('getWorkflowTriggers 应该返回触发配置', () => {
      const triggers = TestPipeline.getWorkflowTriggers();
      expect(triggers).toHaveProperty('push');
    });

    test('getWorkflowRunsOn 应该返回运行环境', () => {
      const runsOn = TestPipeline.getWorkflowRunsOn();
      expect(runsOn).toBe('ubuntu-latest');
    });
  });

  describe('实例方法', () => {
    test('应该正确初始化', () => {
      const pipeline = new TestPipeline({ 'test-input': 'test-value' });
      expect(pipeline).toBeInstanceOf(BasePipeline);
      expect(pipeline['name']).toBe('TestPipeline');
    });

    test('getInput 应该返回输入值', () => {
      const pipeline = new TestPipeline({ 'test-input': 'test-value' });
      const value = pipeline['getInput']('test-input');
      expect(value).toBe('test-value');
    });

    test('getInput 应该支持多种命名格式', () => {
      const pipeline = new TestPipeline({ 'test-input': 'test-value' });
      expect(pipeline['getInput']('test-input')).toBe('test-value');
      expect(pipeline['getInput']('test_input')).toBe('test-value');
    });

    test('execute 应该返回成功结果', async () => {
      const pipeline = new TestPipeline({ 'test-input': 'test-value' });
      const result = await pipeline.execute();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Test passed');
      expect(result.exitCode).toBe(0);
    });

    test('execute 应该处理缺少输入的情况', async () => {
      const pipeline = new TestPipeline({});
      const result = await pipeline.execute();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Missing test-input');
      expect(result.exitCode).toBe(1);
    });

    test('run 应该调用 execute 并设置输出', async () => {
      const pipeline = new TestPipeline({ 'test-input': 'test-value' });
      const result = await pipeline.run();

      expect(result.success).toBe(true);
      expect(result).toMatchObject({
        success: true,
        message: 'Test passed',
        exitCode: 0,
      });
    });
  });
});


/**
 * ReleaseBasePipeline 单元测试
 * 
 * 测试重点：Pipeline 的行为和结果，而非实现细节
 */

import { ReleaseBasePipeline } from '../pipelines/base/release-base-pipeline';

// Mock @actions/core
jest.mock('@actions/core', () => {
  const mockSetOutput = jest.fn();
  const mockInfo = jest.fn();
  const mockWarning = jest.fn();
  const mockError = jest.fn();
  
  return {
    getInput: jest.fn((key: string, options?: any) => {
      const envKey = `INPUT_${key.toUpperCase().replace(/-/g, '_')}`;
      return process.env[envKey] || options?.defaultValue || '';
    }),
    setOutput: mockSetOutput,
    info: mockInfo,
    warning: mockWarning,
    error: mockError,
    debug: jest.fn(),
  };
});

// 获取 mock 函数引用
import * as core from '@actions/core';
const mockSetOutput = core.setOutput as jest.Mock;
const mockInfo = core.info as jest.Mock;
const mockWarning = core.warning as jest.Mock;
const mockError = core.error as jest.Mock;

// Mock child_process
jest.mock('child_process', () => {
  const mockExec = jest.fn((command: string, options: any, callback: any) => {
    callback(null, 'Success', null);
  });
  return {
    exec: mockExec,
  };
});

// Mock fs
jest.mock('fs', () => {
  const mockExistsSync = jest.fn(() => true);
  return {
    existsSync: mockExistsSync,
    readFileSync: jest.fn(() => '{}'),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn(),
    statSync: jest.fn(() => ({ isDirectory: () => false })),
    readdirSync: jest.fn(() => []),
  };
});

describe('ReleaseBasePipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {};
    const fs = require('fs');
    fs.existsSync.mockReturnValue(true);
    const { exec } = require('child_process');
    exec.mockImplementation((command: string, options: any, callback: any) => {
      callback(null, 'Success', null);
    });
  });

  describe('静态配置方法', () => {
    test('应该定义工作流输入参数', () => {
      const inputs = ReleaseBasePipeline.getWorkflowInputs();
      expect(inputs).toBeDefined();
      expect(inputs).toHaveProperty('version');
    });

    test('应该定义工作流触发条件', () => {
      const triggers = ReleaseBasePipeline.getWorkflowTriggers();
      expect(triggers).toHaveProperty('workflow_dispatch');
    });
  });

  describe('execute() - 完整发布流程', () => {
    test('应该成功执行完整的发布流程', async () => {
      process.env.INPUT_VERSION = '1.0.0';
      process.env.INPUT_RELEASE_NOTES = 'Test release';

      const pipeline = new ReleaseBasePipeline();
      const result = await pipeline.execute();

      // 验证结果：应该成功
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.message).toContain('创建成功');
      expect(result.data).toHaveProperty('version', '1.0.0');
      
      // 验证输出
      expect(mockSetOutput).toHaveBeenCalledWith('version', '1.0.0');
      expect(mockSetOutput).toHaveBeenCalledWith('release-status', 'success');
    });

    test('应该在缺少版本号时返回失败', async () => {
      const pipeline = new ReleaseBasePipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.message).toContain('版本号是必需的');
    });

    test('应该使用默认的发布说明', async () => {
      process.env.INPUT_VERSION = '1.0.0';

      const pipeline = new ReleaseBasePipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(true);
      // 应该使用默认的发布说明
      expect(mockInfo).toHaveBeenCalledWith(expect.stringContaining('Release 1.0.0'));
    });

    test('应该在 GitHub CLI 不可用时返回失败', async () => {
      process.env.INPUT_VERSION = '1.0.0';
      const { exec } = require('child_process');
      exec.mockImplementation((command: string, options: any, callback: any) => {
        if (command.includes('--version')) {
          callback(new Error('Command not found'), null, 'Error');
        } else {
          callback(null, 'Success', null);
        }
      });

      const pipeline = new ReleaseBasePipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.message).toContain('GitHub CLI');
    });

    test('应该在创建 Release 失败时返回失败', async () => {
      process.env.INPUT_VERSION = '1.0.0';
      const { exec } = require('child_process');
      exec.mockImplementation((command: string, options: any, callback: any) => {
        if (command.includes('release create')) {
          callback(new Error('Release failed'), null, 'Error');
        } else {
          callback(null, 'Success', null);
        }
      });

      const pipeline = new ReleaseBasePipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.message).toContain('创建 Release 失败');
    });

    test('应该处理自定义的发布说明', async () => {
      process.env.INPUT_VERSION = '1.0.0';
      process.env.INPUT_RELEASE_NOTES = 'Custom release notes';

      const pipeline = new ReleaseBasePipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(true);
    });

    test('应该处理构建分支参数', async () => {
      process.env.INPUT_VERSION = '1.0.0';
      process.env.INPUT_BUILD_BRANCH = 'main';

      const pipeline = new ReleaseBasePipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(true);
    });
  });

  describe('错误处理', () => {
    test('应该捕获并报告执行过程中的异常', async () => {
      process.env.INPUT_VERSION = '1.0.0';
      const { exec } = require('child_process');
      exec.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const pipeline = new ReleaseBasePipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.message).toContain('失败');
    });
  });
});


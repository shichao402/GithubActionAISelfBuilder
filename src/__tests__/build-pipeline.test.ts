/**
 * BuildPipeline 单元测试
 * 
 * 测试重点：Pipeline 的行为和结果，而非实现细节
 */

import { BuildPipeline } from '../pipelines/base/build-pipeline';

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
  const mockStatSync = jest.fn(() => ({ isDirectory: () => true, isFile: () => false }));
  
  return {
    existsSync: mockExistsSync,
    readFileSync: jest.fn(() => '{}'),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn(),
    statSync: mockStatSync,
    readdirSync: jest.fn(() => ['file1.txt', 'file2.txt']),
  };
});

describe('BuildPipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {};
    const fs = require('fs');
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValue({ isDirectory: () => true, isFile: () => false });
    const { exec } = require('child_process');
    exec.mockImplementation((command: string, options: any, callback: any) => {
      callback(null, 'Success', null);
    });
  });

  describe('静态配置方法', () => {
    test('应该定义工作流输入参数', () => {
      const inputs = BuildPipeline.getWorkflowInputs();
      expect(inputs).toBeDefined();
      expect(Object.keys(inputs).length).toBeGreaterThan(0);
    });

    test('应该定义工作流设置', () => {
      const setup = BuildPipeline.getWorkflowSetup();
      expect(setup).toBeDefined();
    });

    test('应该定义工作流触发条件', () => {
      const triggers = BuildPipeline.getWorkflowTriggers();
      expect(triggers).toHaveProperty('push');
      expect(triggers).toHaveProperty('pull_request');
    });
  });

  describe('execute() - 完整构建流程', () => {
    test('应该成功执行完整的构建流程', async () => {
      process.env.INPUT_SETUP_COMMAND = 'npm install';
      process.env.INPUT_BUILD_COMMAND = 'npm run build';
      process.env.INPUT_ARTIFACT_PATH = 'dist';

      const pipeline = new BuildPipeline();
      const result = await pipeline.execute();

      // 验证结果：应该成功
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.message).toContain('构建成功');
      
      // 验证输出：应该设置了正确的输出
      expect(mockSetOutput).toHaveBeenCalledWith('build-status', 'success');
    });

    test('应该在没有设置命令时也能成功构建', async () => {
      process.env.INPUT_BUILD_COMMAND = 'npm run build';

      const pipeline = new BuildPipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    test('应该在没有构建命令时也能成功（可能由子类实现）', async () => {
      const pipeline = new BuildPipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
    });

    test('应该在环境设置失败时返回失败', async () => {
      process.env.INPUT_SETUP_COMMAND = 'npm install';
      const { exec } = require('child_process');
      exec.mockImplementation((command: string, options: any, callback: any) => {
        if (command.includes('install')) {
          callback(new Error('Install failed'), null, 'Error');
        } else {
          callback(null, 'Success', null);
        }
      });

      const pipeline = new BuildPipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.message).toContain('环境设置失败');
    });

    test('应该在构建失败时返回失败', async () => {
      process.env.INPUT_BUILD_COMMAND = 'npm run build';
      const { exec } = require('child_process');
      exec.mockImplementation((command: string, options: any, callback: any) => {
        if (command.includes('build')) {
          callback(new Error('Build failed'), null, 'Error');
        } else {
          callback(null, 'Success', null);
        }
      });

      const pipeline = new BuildPipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.message).toContain('构建失败');
    });

    test('应该处理产物路径并设置输出', async () => {
      process.env.INPUT_BUILD_COMMAND = 'npm run build';
      process.env.INPUT_ARTIFACT_PATH = 'dist';
      const fs = require('fs');
      fs.existsSync.mockReturnValue(true);

      const pipeline = new BuildPipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('artifact-path');
    });

    test('应该在没有产物时也能成功（构建可能不产生产物）', async () => {
      process.env.INPUT_BUILD_COMMAND = 'npm run build';
      const fs = require('fs');
      fs.existsSync.mockReturnValue(false);

      const pipeline = new BuildPipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(true);
      // 应该记录警告但不影响成功
      expect(mockWarning).toHaveBeenCalled();
    });

    test('应该设置正确的构建类型输出', async () => {
      process.env.INPUT_BUILD_COMMAND = 'npm run build';
      process.env.INPUT_BUILD_TYPE = 'debug';

      const pipeline = new BuildPipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('build-type', 'debug');
      expect(mockSetOutput).toHaveBeenCalledWith('build-type', 'debug');
    });
  });

  describe('错误处理', () => {
    test('应该捕获并报告执行过程中的异常', async () => {
      process.env.INPUT_BUILD_COMMAND = 'npm run build';
      const { exec } = require('child_process');
      // exec 在回调中返回错误，这会导致 runCommand 返回 false
      exec.mockImplementation((command: string, options: any, callback: any) => {
        callback(new Error('Unexpected error'), null, 'Error');
      });

      const pipeline = new BuildPipeline();
      const result = await pipeline.execute();

      // 构建失败应该返回失败
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.message).toContain('构建失败');
    });
  });
});


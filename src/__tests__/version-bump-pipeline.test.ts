/**
 * VersionBumpPipeline 单元测试
 * 
 * 测试重点：版本号递增的业务逻辑，而非实现细节
 */

import { VersionBumpPipeline } from '../pipelines/ProjectOnly/version-bump-pipeline';

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
  const mockReadFileSync = jest.fn(() => JSON.stringify({ version: '1.0.0' }));
  const mockWriteFileSync = jest.fn();
  
  return {
    existsSync: mockExistsSync,
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
    mkdirSync: jest.fn(),
    statSync: jest.fn(() => ({ isDirectory: () => false })),
    readdirSync: jest.fn(() => []),
  };
});

describe('VersionBumpPipeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {};
    const fs = require('fs');
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ version: '1.0.0' }));
    const { exec } = require('child_process');
    exec.mockImplementation((command: string, options: any, callback: any) => {
      callback(null, 'Success', null);
    });
  });

  describe('静态配置方法', () => {
    test('应该定义工作流输入参数', () => {
      const inputs = VersionBumpPipeline.getWorkflowInputs();
      expect(inputs).toBeDefined();
      expect(inputs).toHaveProperty('version-file');
      expect(inputs).toHaveProperty('version-type');
    });
  });

  describe('execute() - 版本号递增业务逻辑', () => {
    test('应该正确递增 patch 版本号', async () => {
      process.env.INPUT_VERSION_FILE = 'package.json';
      process.env.INPUT_VERSION_TYPE = 'patch';
      process.env.INPUT_COMMIT_CHANGES = 'false';

      const pipeline = new VersionBumpPipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('old-version', '1.0.0');
      expect(result.data).toHaveProperty('new-version', '1.0.1');
      expect(result.data).toHaveProperty('version-type', 'patch');
      
      // 验证文件被更新（writeFileSync 的第一个参数是路径，第二个是内容）
      const fs = require('fs');
      const writeCall = fs.writeFileSync.mock.calls[0];
      expect(writeCall).toBeDefined();
      expect(writeCall.length).toBeGreaterThanOrEqual(2);
      const writtenContent = JSON.parse(writeCall[1]);
      expect(writtenContent.version).toBe('1.0.1');
    });

    test('应该正确递增 minor 版本号', async () => {
      process.env.INPUT_VERSION_FILE = 'package.json';
      process.env.INPUT_VERSION_TYPE = 'minor';
      process.env.INPUT_COMMIT_CHANGES = 'false';

      const pipeline = new VersionBumpPipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('new-version', '1.1.0');
    });

    test('应该正确递增 major 版本号', async () => {
      process.env.INPUT_VERSION_FILE = 'package.json';
      process.env.INPUT_VERSION_TYPE = 'major';
      process.env.INPUT_COMMIT_CHANGES = 'false';

      const pipeline = new VersionBumpPipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('new-version', '2.0.0');
    });

    test('应该在文件不存在时返回失败', async () => {
      process.env.INPUT_VERSION_FILE = 'nonexistent.json';
      const fs = require('fs');
      fs.existsSync.mockReturnValue(false);

      const pipeline = new VersionBumpPipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.message).toContain('不存在');
    });

    test('应该在文件没有 version 字段时返回失败', async () => {
      process.env.INPUT_VERSION_FILE = 'package.json';
      const fs = require('fs');
      fs.readFileSync.mockReturnValue(JSON.stringify({ name: 'test' }));

      const pipeline = new VersionBumpPipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.message).toContain('version 字段');
    });

    test('应该在版本类型无效时返回失败', async () => {
      process.env.INPUT_VERSION_FILE = 'package.json';
      process.env.INPUT_VERSION_TYPE = 'invalid';

      const pipeline = new VersionBumpPipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.message).toContain('版本号类型');
    });

    test('应该在启用提交时提交更改', async () => {
      process.env.INPUT_VERSION_FILE = 'package.json';
      process.env.INPUT_VERSION_TYPE = 'patch';
      process.env.INPUT_COMMIT_CHANGES = 'true';

      const pipeline = new VersionBumpPipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(true);
      // 应该调用了 git add 和 git commit
      const { exec } = require('child_process');
      expect(exec).toHaveBeenCalledWith(
        expect.stringContaining('git add'),
        expect.any(Object),
        expect.any(Function)
      );
      expect(mockSetOutput).toHaveBeenCalledWith('committed', 'true');
    });

    test('应该在不启用提交时跳过 git 操作', async () => {
      process.env.INPUT_VERSION_FILE = 'package.json';
      process.env.INPUT_VERSION_TYPE = 'patch';
      process.env.INPUT_COMMIT_CHANGES = 'false';

      const pipeline = new VersionBumpPipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(true);
      expect(mockSetOutput).toHaveBeenCalledWith('committed', 'false');
      // 不应该调用 git 命令
      const { exec } = require('child_process');
      const gitCalls = exec.mock.calls.filter((call: any[]) => 
        call[0] && call[0].includes('git')
      );
      expect(gitCalls.length).toBe(0);
    });

    test('应该处理复杂的版本号格式', async () => {
      const fs = require('fs');
      fs.readFileSync.mockReturnValue(JSON.stringify({ version: '2.5.10' }));
      process.env.INPUT_VERSION_FILE = 'package.json';
      process.env.INPUT_VERSION_TYPE = 'patch';
      process.env.INPUT_COMMIT_CHANGES = 'false';

      const pipeline = new VersionBumpPipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('old-version', '2.5.10');
      expect(result.data).toHaveProperty('new-version', '2.5.11');
    });
  });

  describe('错误处理', () => {
    test('应该捕获并报告执行过程中的异常', async () => {
      process.env.INPUT_VERSION_FILE = 'package.json';
      const fs = require('fs');
      fs.readFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });

      const pipeline = new VersionBumpPipeline();
      const result = await pipeline.execute();

      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
      expect(result.message).toContain('失败');
    });
  });
});


/**
 * WorkflowManager 单元测试
 */

import { WorkflowManager } from '../workflow-manager';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

// Mock child_process
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

// Mock util.promisify - 创建一个全局 mock 函数
const mockExecAsyncFactory = () => {
  const mockFn = jest.fn();
  return mockFn;
};

jest.mock('util', () => {
  const actualUtil = jest.requireActual('util');
  const mockExecAsync = jest.fn();
  return {
    ...actualUtil,
    promisify: jest.fn(() => mockExecAsync),
    __mockExecAsync: mockExecAsync, // 导出以便测试中使用
  };
});

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(() => '{}'),
}));

// Mock @actions/core
jest.mock('@actions/core', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
}));

describe('WorkflowManager', () => {
  let manager: WorkflowManager;
  const mockProjectRoot = '/test/project';
  let mockExecAsync: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // 获取 mock 函数
    const util = require('util');
    mockExecAsync = util.__mockExecAsync || jest.fn();
    manager = new WorkflowManager(mockProjectRoot);
  });

  describe('checkGhCli', () => {
    test('应该检查 GitHub CLI 是否安装', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'gh version 2.0.0' });
      const result = await manager.checkGhCli();
      expect(result).toBe(true);
    });

    test('应该返回 false 如果未安装', async () => {
      mockExecAsync.mockRejectedValue(new Error('Command not found'));
      const result = await manager.checkGhCli();
      expect(result).toBe(false);
    });
  });

  describe('checkGhAuth', () => {
    test('应该检查 GitHub CLI 是否已登录', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'Logged in' });
      const result = await manager.checkGhAuth();
      expect(result).toBe(true);
    });

    test('应该返回 false 如果未登录', async () => {
      mockExecAsync.mockRejectedValue(new Error('Not logged in'));
      const result = await manager.checkGhAuth();
      expect(result).toBe(false);
    });
  });

  describe('triggerWorkflow', () => {
    test('应该触发 workflow 并返回 run ID', async () => {
      // Mock 所有需要的调用
      mockExecAsync
        .mockResolvedValueOnce({ stdout: 'gh version' }) // checkGhCli
        .mockResolvedValueOnce({ stdout: 'Logged in' }) // checkGhAuth
        .mockResolvedValueOnce({ stdout: 'owner/repo' }) // getRepoInfo
        .mockResolvedValueOnce({ stdout: 'main' }) // git rev-parse
        .mockResolvedValueOnce({ stdout: '' }) // gh workflow run
        .mockResolvedValueOnce({ stdout: '123456789' }); // gh run list (第一次尝试)

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      // 使用 jest.spyOn 来 mock setTimeout
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
        // 立即执行回调，而不是等待
        if (typeof fn === 'function') {
          fn();
        }
        return 0 as any;
      });

      const result = await manager.triggerWorkflow('.github/workflows/build.yml', {
        ref: 'main',
      });

      expect(result.success).toBe(true);
      expect(result.runId).toBe(123456789);
      expect(result.message).toContain('Workflow 已触发');

      setTimeoutSpy.mockRestore();
    });

    test('应该返回错误如果 GitHub CLI 未安装', async () => {
      // checkGhCli 应该失败
      mockExecAsync.mockImplementationOnce(() => {
        return Promise.reject(new Error('Command not found'));
      });

      const result = await manager.triggerWorkflow('.github/workflows/build.yml');

      expect(result.success).toBe(false);
      expect(result.message).toContain('未找到 GitHub CLI');
    });

    test('应该返回错误如果 workflow 文件不存在', async () => {
      mockExecAsync.mockResolvedValue({ stdout: 'gh version' });
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await manager.triggerWorkflow('.github/workflows/nonexistent.yml');

      expect(result.success).toBe(false);
      expect(result.message).toContain('不存在');
    });
  });

  describe('getRunInfo', () => {
    test('应该获取 run 信息', async () => {
      const mockInfo = {
        databaseId: 123456789,
        status: 'completed',
        conclusion: 'success',
        url: 'https://github.com/owner/repo/actions/runs/123456789',
      };

      mockExecAsync.mockResolvedValue({
        stdout: JSON.stringify(mockInfo),
      });

      const info = await manager.getRunInfo(123456789);

      expect(info).not.toBeNull();
      expect(info).toMatchObject({
        id: 123456789,
        status: 'completed',
        conclusion: 'success',
      });
    });

    test('应该返回 null 如果获取失败', async () => {
      mockExecAsync.mockRejectedValue(new Error('Not found'));

      const info = await manager.getRunInfo(123456789);

      expect(info).toBeNull();
    });
  });

  describe('collectWorkflowLogs', () => {
    test('应该收集 workflow 日志', async () => {
      const mockRunData = {
        workflowName: 'Test Workflow',
        headBranch: 'main',
        event: 'push',
        status: 'completed',
        conclusion: 'failure',
        jobs: [
          {
            id: 1,
            name: 'test-job',
            status: 'completed',
            conclusion: 'failure',
          },
        ],
        url: 'https://github.com/owner/repo/actions/runs/123456789',
      };

      mockExecAsync
        .mockResolvedValueOnce({
          stdout: JSON.stringify(mockRunData),
        })
        .mockResolvedValueOnce({
          stdout: 'Job log content',
        });

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});

      const logFile = await manager.collectWorkflowLogs(123456789);

      expect(logFile).toContain('workflow_123456789_error.log');
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('应该返回 null 如果收集失败', async () => {
      mockExecAsync.mockRejectedValue(new Error('Failed'));

      const logFile = await manager.collectWorkflowLogs(123456789);

      expect(logFile).toBeNull();
    });
  });
});


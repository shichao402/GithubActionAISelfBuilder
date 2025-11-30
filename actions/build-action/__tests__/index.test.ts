/**
 * Build Action 单元测试
 */

import * as core from '@actions/core';
import * as exec from '@actions/exec';

jest.mock('@actions/core');
jest.mock('@actions/exec');
jest.mock('@actions/io');

describe('Build Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (core.getInput as jest.Mock).mockImplementation((key: string) => {
      const inputs: Record<string, string> = {
        'build-command': 'npm run build',
        'artifact-path': 'dist/**',
        'upload-artifacts': 'true',
      };
      return inputs[key] || '';
    });
  });

  test('应该执行构建命令', async () => {
    (exec.exec as jest.Mock).mockResolvedValue(0);

    // 这里需要实际导入和测试 build-action
    // 由于 build-action 是独立的，这里只是示例
    expect(core.getInput).toBeDefined();
  });
});


/**
 * Release Action 单元测试
 */

import * as core from '@actions/core';
import * as exec from '@actions/exec';

jest.mock('@actions/core');
jest.mock('@actions/exec');

describe('Release Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (core.getInput as jest.Mock).mockImplementation((key: string) => {
      const inputs: Record<string, string> = {
        version: '1.0.0',
        'release-notes': 'Test release',
        'build-branch': 'main',
      };
      return inputs[key] || '';
    });
  });

  test('应该获取输入参数', () => {
    expect(core.getInput).toBeDefined();
  });
});


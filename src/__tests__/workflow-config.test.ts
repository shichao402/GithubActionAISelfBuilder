/**
 * WorkflowConfig 单元测试
 */

import { WorkflowConfig, createWorkflowConfig } from '../workflow-config';

describe('WorkflowConfig', () => {
  let config: WorkflowConfig;

  beforeEach(() => {
    config = createWorkflowConfig();
  });

  describe('输入参数', () => {
    test('addInput 应该添加输入参数', () => {
      config.addInput('test-input', 'Test description', true, 'default-value');
      const dict = config.toDict();

      expect(dict.inputs).toHaveProperty('test-input');
      expect(dict.inputs!['test-input']).toEqual({
        description: 'Test description',
        required: true,
        default: 'default-value',
      });
    });

    test('addInput 应该支持链式调用', () => {
      config
        .addInput('input1', 'Input 1')
        .addInput('input2', 'Input 2');

      const dict = config.toDict();
      expect(dict.inputs).toHaveProperty('input1');
      expect(dict.inputs).toHaveProperty('input2');
    });
  });

  describe('环境设置', () => {
    test('setupPython 应该添加 Python 设置', () => {
      config.setupPython('3.9', 'pip');
      const dict = config.toDict();

      expect(dict.setup?.actions).toHaveLength(1);
      expect(dict.setup?.actions![0]).toMatchObject({
        name: 'Set up Python',
        uses: 'actions/setup-python@v4',
        with: {
          'python-version': '3.9',
          cache: 'pip',
        },
      });
    });

    test('setupNode 应该添加 Node.js 设置', () => {
      config.setupNode('18', 'npm');
      const dict = config.toDict();

      expect(dict.setup?.actions).toHaveLength(1);
      expect(dict.setup?.actions![0]).toMatchObject({
        name: 'Set up Node.js',
        uses: 'actions/setup-node@v3',
      });
    });

    test('setupFlutter 应该添加 Flutter 设置', () => {
      config.setupFlutter('3.16.0', 'stable', true);
      const dict = config.toDict();

      expect(dict.setup?.actions).toHaveLength(1);
      expect(dict.setup?.actions![0]).toMatchObject({
        name: 'Set up Flutter',
        uses: 'subosito/flutter-action@v2',
      });
    });

    test('addSetupStep 应该添加自定义步骤', () => {
      config.addSetupStep('Install dependencies', 'npm install');
      const dict = config.toDict();

      expect(dict.setup?.steps).toHaveLength(1);
      expect(dict.setup?.steps![0]).toEqual({
        name: 'Install dependencies',
        run: 'npm install',
      });
    });
  });

  describe('触发条件', () => {
    test('onPush 应该添加 push 触发', () => {
      config.onPush(['main', 'develop']);
      const dict = config.toDict();

      expect(dict.triggers?.push).toEqual({
        branches: ['main', 'develop'],
      });
    });

    test('onPullRequest 应该添加 pull_request 触发', () => {
      config.onPullRequest(['main']);
      const dict = config.toDict();

      expect(dict.triggers?.pull_request).toEqual({
        branches: ['main'],
      });
    });

    test('onWorkflowDispatch 应该添加 workflow_dispatch 触发', () => {
      config.onWorkflowDispatch({
        version: {
          description: 'Version',
          required: true,
        },
      });
      const dict = config.toDict();

      expect(dict.triggers?.workflow_dispatch).toHaveProperty('inputs');
    });

    test('onSchedule 应该添加 schedule 触发', () => {
      config.onSchedule('0 0 * * *');
      const dict = config.toDict();

      expect(dict.triggers?.schedule).toHaveLength(1);
      expect(dict.triggers?.schedule![0]).toEqual({
        cron: '0 0 * * *',
      });
    });
  });

  describe('环境变量', () => {
    test('setEnv 应该设置环境变量', () => {
      config.setEnv('NODE_ENV', 'production');
      const dict = config.toDict();

      expect(dict.env).toHaveProperty('NODE_ENV', 'production');
    });

    test('setRunsOn 应该设置运行环境', () => {
      config.setRunsOn('windows-latest');
      const dict = config.toDict();

      expect(dict.runsOn).toBe('windows-latest');
    });
  });

  describe('缓存', () => {
    test('cachePip 应该添加 pip 缓存', () => {
      config.cachePip();
      const dict = config.toDict();

      expect(dict.setup?.caches).toHaveLength(1);
      expect(dict.setup?.caches![0]).toHaveProperty('name', 'pip-cache');
    });

    test('cacheNpm 应该添加 npm 缓存', () => {
      config.cacheNpm();
      const dict = config.toDict();

      expect(dict.setup?.caches).toHaveLength(1);
      expect(dict.setup?.caches![0]).toHaveProperty('name', 'npm-cache');
    });
  });

  describe('toDict', () => {
    test('应该返回完整的配置字典', () => {
      config
        .addInput('version', 'Version')
        .setupNode('18')
        .onPush(['main'])
        .setEnv('NODE_ENV', 'production')
        .setRunsOn('windows-latest'); // 使用非默认值，确保 runsOn 被包含

      const dict = config.toDict();

      expect(dict).toHaveProperty('inputs');
      expect(dict).toHaveProperty('setup');
      expect(dict).toHaveProperty('triggers');
      expect(dict).toHaveProperty('env');
      expect(dict).toHaveProperty('runsOn');
      expect(dict.runsOn).toBe('windows-latest');
    });

    test('空配置应该返回空字典', () => {
      const dict = config.toDict();
      expect(Object.keys(dict)).toHaveLength(0);
    });
  });
});


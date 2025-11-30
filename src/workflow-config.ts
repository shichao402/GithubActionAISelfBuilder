/**
 * 工作流配置构建器
 *
 * 提供简化的 API 来定义工作流配置，避免直接使用原始 JSON。
 */

import type {
  InputConfig,
  SetupAction,
  CacheConfig,
  SetupStep,
  SetupConfig,
  TriggerConfig,
  JobConfig,
  WorkflowConfigDict,
} from './types/workflow-types';
import { SetupBuilder } from './workflow-config/setup-builder';
import { TriggerBuilder } from './workflow-config/trigger-builder';

// 重新导出类型，保持向后兼容
export type {
  InputConfig,
  SetupAction,
  CacheConfig,
  SetupStep,
  SetupConfig,
  TriggerConfig,
  JobConfig,
  WorkflowConfigDict,
};

// 导出子构建器
export { SetupBuilder } from './workflow-config/setup-builder';
export { TriggerBuilder } from './workflow-config/trigger-builder';

/**
 * 工作流配置构建器
 *
 * 使用组合模式，内部使用子构建器（SetupBuilder、TriggerBuilder），
 * 但对外保持向后兼容的 API。
 */
export class WorkflowConfig {
  private _inputs: Record<string, InputConfig> = {};
  private _setupBuilder: SetupBuilder;
  private _triggerBuilder: TriggerBuilder;
  private _env: Record<string, string> = {};
  private _runsOn: string = 'ubuntu-latest';
  private _pythonVersion: string = '3.9';
  private _dependencies: string[] = [];
  private _jobs: Record<string, JobConfig> = {};

  constructor() {
    this._setupBuilder = new SetupBuilder();
    this._triggerBuilder = new TriggerBuilder();
  }

  // ========== 输入参数 ==========

  addInput(
    name: string,
    description: string,
    required: boolean = false,
    defaultValue?: any
  ): this {
    this._inputs[name] = {
      description,
      required,
      default: defaultValue,
    };
    return this;
  }

  // ========== 环境设置 ==========

  setupPython(version: string = '3.9', cache?: string): this {
    this._setupBuilder.setupPython(version, cache);
    this._pythonVersion = version;
    return this;
  }

  setupNode(version: string = '18', cache?: string): this {
    this._setupBuilder.setupNode(version, cache);
    return this;
  }

  setupJava(
    version: string = '17',
    distribution: string = 'temurin',
    cache?: string
  ): this {
    this._setupBuilder.setupJava(version, distribution, cache);
    return this;
  }

  setupFlutter(
    version: string = '3.16.0',
    channel: string = 'stable',
    cache: boolean = true
  ): this {
    this._setupBuilder.setupFlutter(version, channel, cache);
    return this;
  }

  addSetupAction(name: string, uses: string, withParams?: Record<string, any>): this {
    this._setupBuilder.addAction(name, uses, withParams);
    return this;
  }

  addSetupStep(name: string, run: string): this {
    this._setupBuilder.addStep(name, run);
    return this;
  }

  // ========== 缓存 ==========

  cachePip(keyFile: string = '**/requirements.txt'): this {
    this._setupBuilder.cachePip(keyFile);
    return this;
  }

  cacheNpm(keyFile: string = '**/package-lock.json'): this {
    this._setupBuilder.cacheNpm(keyFile);
    return this;
  }

  cacheGradle(keyFiles: string[] = ['**/*.gradle*', '**/gradle-wrapper.properties']): this {
    this._setupBuilder.cacheGradle(keyFiles);
    return this;
  }

  addCache(
    name: string,
    cachePath: string,
    key: string,
    restoreKeys?: string[]
  ): this {
    this._setupBuilder.addCache(name, cachePath, key, restoreKeys);
    return this;
  }

  // ========== 触发条件 ==========

  onPush(branches: string[] | string = ['main', 'master']): this {
    this._triggerBuilder.onPush(branches);
    return this;
  }

  onPullRequest(branches: string[] | string = ['main', 'master']): this {
    this._triggerBuilder.onPullRequest(branches);
    return this;
  }

  onRelease(types: string[] | string = ['published']): this {
    this._triggerBuilder.onRelease(types);
    return this;
  }

  onWorkflowDispatch(inputs?: Record<string, InputConfig>): this {
    this._triggerBuilder.onWorkflowDispatch(inputs);
    return this;
  }

  onSchedule(cron: string): this {
    this._triggerBuilder.onSchedule(cron);
    return this;
  }

  // ========== 环境变量 ==========

  setEnv(key: string, value: string): this {
    this._env[key] = value;
    return this;
  }

  setRunsOn(runsOn: string): this {
    this._runsOn = runsOn;
    return this;
  }

  // ========== 依赖关系 ==========

  dependsOn(...pipelineClasses: string[]): this {
    this._dependencies.push(...pipelineClasses);
    return this;
  }

  // ========== 组合工作流 ==========

  addBuildJob(
    name: string,
    pipelineClass: string,
    inputs?: Record<string, any>,
    needs?: string[],
    runsOn?: string
  ): this {
    return this.addJob(name, pipelineClass, inputs, needs, runsOn);
  }

  addTestJob(
    name: string,
    pipelineClass: string,
    inputs?: Record<string, any>,
    needs?: string[],
    runsOn?: string
  ): this {
    return this.addJob(name, pipelineClass, inputs, needs, runsOn);
  }

  addReleaseJob(
    name: string,
    pipelineClass: string,
    inputs?: Record<string, any>,
    needs?: string[],
    runsOn?: string
  ): this {
    return this.addJob(name, pipelineClass, inputs, needs, runsOn);
  }

  addJob(
    name: string,
    pipelineClass: string,
    inputs?: Record<string, any>,
    needs?: string[],
    runsOn?: string,
    ifCondition?: string
  ): this {
    const job: JobConfig = {
      pipeline: pipelineClass,
    };
    if (inputs) {
      job.inputs = inputs;
    }
    if (needs) {
      job.needs = needs;
    }
    if (runsOn) {
      job.runsOn = runsOn;
    }
    if (ifCondition) {
      job.if = ifCondition;
    }
    this._jobs[name] = job;
    return this;
  }

  // ========== 转换为配置字典 ==========

  toDict(): WorkflowConfigDict {
    const config: WorkflowConfigDict = {};

    if (Object.keys(this._inputs).length > 0) {
      config.inputs = this._inputs;
    }

    // 使用 SetupBuilder 构建 setup 配置
    const setup = this._setupBuilder.build();
    if (Object.keys(setup).length > 0) {
      config.setup = setup;
    }

    // 使用 TriggerBuilder 构建 triggers 配置
    const triggers = this._triggerBuilder.build();
    if (Object.keys(triggers).length > 0) {
      config.triggers = triggers;
    }

    if (Object.keys(this._env).length > 0) {
      config.env = this._env;
    }

    if (this._runsOn !== 'ubuntu-latest') {
      config.runsOn = this._runsOn;
    }

    // 从 SetupBuilder 获取 Python 版本
    const pythonVersion = this._setupBuilder.getPythonVersion();
    if (pythonVersion && pythonVersion !== '3.9') {
      config.pythonVersion = pythonVersion;
    } else if (this._pythonVersion !== '3.9') {
      config.pythonVersion = this._pythonVersion;
    }

    if (this._dependencies.length > 0) {
      config.dependencies = this._dependencies;
    }

    if (Object.keys(this._jobs).length > 0) {
      config.jobs = this._jobs;
    }

    return config;
  }
}

/**
 * 创建新的工作流配置构建器
 */
export function createWorkflowConfig(): WorkflowConfig {
  return new WorkflowConfig();
}


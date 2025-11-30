/**
 * 工作流相关类型定义
 *
 * 统一管理所有工作流配置相关的类型接口，避免重复定义。
 */

/**
 * 流水线执行结果
 */
export interface PipelineResult {
  success: boolean;
  message: string;
  data?: Record<string, any>;
  exitCode: number;
}

/**
 * 输入参数配置
 */
export interface InputConfig {
  description: string;
  required?: boolean;
  default?: any;
}

/**
 * 设置 Action 配置
 */
export interface SetupAction {
  name: string;
  uses: string;
  with?: Record<string, any>;
}

/**
 * 缓存配置
 */
export interface CacheConfig {
  name: string;
  path: string;
  key: string;
  restoreKeys?: string[];
}

/**
 * 设置步骤配置
 */
export interface SetupStep {
  name: string;
  run: string;
}

/**
 * 设置配置
 */
export interface SetupConfig {
  actions?: SetupAction[];
  caches?: CacheConfig[];
  steps?: SetupStep[];
}

/**
 * 触发条件配置
 */
export interface TriggerConfig {
  push?: { branches?: string[] | string; paths?: string[] };
  pull_request?: { branches?: string[] | string; paths?: string[] };
  workflow_dispatch?: {
    inputs?: Record<string, InputConfig>;
  };
  release?: { types?: string[] };
  schedule?: Array<{ cron: string }>;
}

/**
 * Job 配置
 */
export interface JobConfig {
  pipeline: string;
  inputs?: Record<string, any>;
  needs?: string[];
  runsOn?: string;
  if?: string;
}

/**
 * 工作流配置字典（用于序列化）
 */
export interface WorkflowConfigDict {
  inputs?: Record<string, InputConfig>;
  setup?: SetupConfig;
  triggers?: TriggerConfig;
  env?: Record<string, string>;
  runsOn?: string;
  pythonVersion?: string;
  dependencies?: string[];
  jobs?: Record<string, JobConfig>;
}

/**
 * 工作流配置接口（用于 BasePipeline 静态方法）
 */
export interface WorkflowConfig {
  inputs?: Record<string, InputConfig>;
  setup?: SetupConfig;
  triggers?: TriggerConfig;
  env?: Record<string, string>;
  runsOn?: string;
  pythonVersion?: string;
  dependencies?: string[];
  jobs?: Record<string, JobConfig>;
}


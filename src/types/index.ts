/**
 * 统一类型导出
 *
 * 导出所有可能被外部使用的类型，提供统一的导入入口。
 */

// 工作流相关类型
export type {
  PipelineResult,
  InputConfig,
  SetupAction,
  CacheConfig,
  SetupStep,
  SetupConfig,
  TriggerConfig,
  JobConfig,
  WorkflowConfigDict,
  WorkflowConfig,
} from './workflow-types';

// Pipeline Registry 相关类型
export type { PipelineMetadata } from '../pipeline-registry';

// Scaffold 相关类型
export type { ScaffoldPipelineMetadata } from '../scaffold';

// Workflow Manager 相关类型
export type {
  WorkflowRunInfo,
  WorkflowJob,
  WorkflowInputs,
} from '../workflow-manager';


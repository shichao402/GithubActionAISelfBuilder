/**
 * 流水线脚本基类
 *
 * 提供标准化的输入输出接口，使 GitHub Action 可以统一调用脚本并获取结果。
 * 所有流水线脚本必须继承自此类，并实现 execute() 方法。
 */

import * as core from '@actions/core';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import type {
  PipelineResult,
  WorkflowConfig,
  InputConfig,
  SetupConfig,
  TriggerConfig,
  JobConfig,
} from './types/workflow-types';

// 重新导出类型，保持向后兼容
export type {
  PipelineResult,
  WorkflowConfig,
  InputConfig,
  SetupConfig,
  TriggerConfig,
  JobConfig,
};

/**
 * 流水线脚本基类
 *
 * 所有流水线脚本必须继承自此类，并实现 execute() 方法。
 * 派生类可以通过静态方法定义配置信息，用于生成 GitHub Action 工作流：
 * - getWorkflowInputs(): 定义工作流的输入参数
 * - getWorkflowSetup(): 定义准备阶段（环境设置、缓存等）
 * - getWorkflowTriggers(): 定义触发条件
 * - getWorkflowEnv(): 定义环境变量
 */
export abstract class BasePipeline {
  protected projectRoot: string;
  protected inputs: Record<string, any>;
  protected config: Record<string, any>;
  protected name: string;
  protected description: string;
  protected result?: PipelineResult;

  constructor(
    inputs: Record<string, any> = {},
    configFile?: string,
    projectRoot?: string
  ) {
    // 确定项目根目录
    this.projectRoot = this.getProjectRoot(projectRoot);

    // 标准化输入：合并环境变量和传入的 inputs
    this.inputs = this.standardizeInputs(inputs);

    // 加载配置
    this.config = configFile ? this.loadConfig(configFile) : {};

    // 流水线元信息
    this.name = this.constructor.name;
    this.description = this.getDescription();

    // 执行结果
    this.result = undefined;
  }

  /**
   * 获取项目根目录
   */
  protected getProjectRoot(projectRoot?: string): string {
    if (projectRoot) {
      return path.resolve(projectRoot);
    }

    // 尝试从配置文件读取
    const possibleConfigPaths = [
      path.join(process.cwd(), 'config.yaml'),
      path.join(process.cwd(), '..', 'config.yaml'),
      path.join(process.cwd(), '..', '..', 'config.yaml'),
    ];

    for (const configPath of possibleConfigPaths) {
      if (fs.existsSync(configPath)) {
        try {
          const yaml = require('js-yaml');
          const config = yaml.load(fs.readFileSync(configPath, 'utf8')) || {};
          const rootPath = config?.project?.root || '.';

          if (path.isAbsolute(rootPath)) {
            return path.resolve(rootPath);
          } else {
            return path.resolve(path.dirname(configPath), rootPath);
          }
        } catch (e) {
          // 忽略错误，继续尝试下一个路径
        }
      }
    }

    // 默认使用当前工作目录
    return process.cwd();
  }

  /**
   * 标准化输入参数
   */
  protected standardizeInputs(inputs: Record<string, any>): Record<string, any> {
    const standardized: Record<string, any> = { ...inputs };

    // 从环境变量读取（GitHub Actions 格式：INPUT_<NAME>）
    for (const key in process.env) {
      if (key.startsWith('INPUT_')) {
        const inputKey = key.substring(6).toLowerCase().replace(/_/g, '-');
        standardized[inputKey] = process.env[key];
      }
    }

    return standardized;
  }

  /**
   * 加载配置文件
   */
  protected loadConfig(configFile: string): Record<string, any> {
    try {
      const yaml = require('js-yaml');
      return yaml.load(fs.readFileSync(configFile, 'utf8')) || {};
    } catch (e) {
      core.warning(`加载配置文件失败: ${e}`);
      return {};
    }
  }

  /**
   * 获取描述
   */
  protected getDescription(): string {
    // 尝试从类的 JSDoc 注释中提取
    // 这里简化处理，实际可以使用 AST 解析
    return `${this.name} pipeline`;
  }

  /**
   * 获取输入参数
   */
  protected getInput(key: string, defaultValue?: any): any {
    // 支持多种命名格式
    const keys = [
      key,
      key.replace(/-/g, '_'),
      key.replace(/_/g, '-'),
      key.toUpperCase(),
      key.toLowerCase(),
    ];

    for (const k of keys) {
      if (k in this.inputs) {
        return this.inputs[k];
      }
    }

    // 尝试从 GitHub Actions 输入获取
    try {
      return core.getInput(key, { required: false }) || defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * 设置输出变量
   */
  protected setOutput(key: string, value: any): void {
    core.setOutput(key, value);
  }

  /**
   * 记录日志（GitHub Action 格式）
   */
  protected log(level: 'info' | 'warning' | 'error' | 'debug', message: string): void {
    switch (level) {
      case 'info':
        core.info(message);
        break;
      case 'warning':
        core.warning(message);
        break;
      case 'error':
        core.error(message);
        break;
      case 'debug':
        core.debug(message);
        break;
    }
  }

  /**
   * 执行命令
   */
  protected async runCommand(
    command: string,
    options: { cwd?: string; silent?: boolean } = {}
  ): Promise<boolean> {
    const cwd = options.cwd || this.projectRoot;
    const silent = options.silent || false;

    return new Promise((resolve) => {
      this.log('info', `执行命令: ${command}`);
      exec(command, { cwd, encoding: 'utf8' }, (error, stdout, stderr) => {
        if (error) {
          this.log('error', `命令执行失败: ${command}`);
          if (stderr) {
            this.log('error', `错误输出: ${stderr}`);
          }
          resolve(false);
        } else {
          if (!silent && stdout) {
            this.log('debug', stdout);
          }
          resolve(true);
        }
      });
    });
  }

  /**
   * 验证输入和前置条件
   *
   * 派生类可以重写此方法以实现自定义验证逻辑。
   * 默认实现总是返回 true。
   */
  protected validate(): boolean {
    return true;
  }

  /**
   * 执行流水线逻辑
   *
   * 派生类必须实现此方法来完成具体的流水线功能。
   */
  abstract execute(): Promise<PipelineResult>;

  /**
   * 运行流水线
   */
  async run(): Promise<PipelineResult> {
    try {
      // 验证
      if (!this.validate()) {
        this.result = {
          success: false,
          message: '验证失败',
          exitCode: 1,
        };
        return this.result;
      }

      // 执行
      this.result = await this.execute();

      // 设置输出
      if (this.result.data) {
        for (const [key, value] of Object.entries(this.result.data)) {
          this.setOutput(key, value);
        }
      }

      return this.result;
    } catch (error: any) {
      const errorMsg = `流水线执行失败: ${error.message}`;
      this.log('error', errorMsg);
      this.result = {
        success: false,
        message: errorMsg,
        exitCode: 1,
      };
      return this.result;
    }
  }

  // ========== 工作流配置方法（静态方法） ==========

  /**
   * 定义工作流输入参数
   */
  static getWorkflowInputs(): Record<string, InputConfig> {
    return {};
  }

  /**
   * 定义准备阶段配置
   */
  static getWorkflowSetup(): SetupConfig {
    return {};
  }

  /**
   * 定义触发条件
   */
  static getWorkflowTriggers(): TriggerConfig {
    return {
      push: { branches: ['main', 'master'] },
      pull_request: { branches: ['main', 'master'] },
    };
  }

  /**
   * 定义环境变量
   */
  static getWorkflowEnv(): Record<string, string> {
    return {};
  }

  /**
   * 定义运行环境
   */
  static getWorkflowRunsOn(): string {
    return 'ubuntu-latest';
  }

  /**
   * 定义 Python 版本
   */
  static getWorkflowPythonVersion(): string {
    return '3.9';
  }

  /**
   * 定义依赖的其他流水线
   */
  static getWorkflowDependencies(): string[] {
    return [];
  }

  /**
   * 定义工作流 jobs（用于组合工作流）
   */
  static getWorkflowJobs(): Record<string, JobConfig> {
    return {};
  }
}


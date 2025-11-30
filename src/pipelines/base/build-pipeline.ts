/**
 * 通用构建流水线基类
 *
 * 提供通用的构建流程：
 * 1. 环境设置（可选）
 * 2. 执行构建命令
 * 3. 处理构建产物
 * 4. 上传产物（可选）
 *
 * 项目特定的 Pipeline 可以继承此类，只需实现特定的构建逻辑。
 */

import { BasePipeline, PipelineResult } from '../../base-pipeline';
import { createWorkflowConfig } from '../../workflow-config';
import * as fs from 'fs';
import * as path from 'path';

export class BuildPipeline extends BasePipeline {
  /**
   * 定义工作流输入参数
   */
  static getWorkflowInputs() {
    const config = createWorkflowConfig();
    config.addInput('setup-command', '环境设置命令（如安装依赖）', false, '');
    config.addInput('build-command', '构建命令', false, '');
    config.addInput('artifact-path', '构建产物路径', false, 'artifacts/**');
    config.addInput('build-type', '构建类型（debug/release）', false, 'release');
    config.addInput('upload-artifacts', '是否上传构建产物', false, 'true');
    return config.toDict().inputs || {};
  }

  /**
   * 定义准备阶段配置
   */
  static getWorkflowSetup() {
    const config = createWorkflowConfig();
    config.setupNode('18', 'npm');
    return config.toDict().setup || {};
  }

  /**
   * 定义触发条件
   */
  static getWorkflowTriggers() {
    const config = createWorkflowConfig();
    config.onPush(['main', 'develop']);
    config.onPullRequest(['main', 'develop']);
    config.onWorkflowDispatch();
    return config.toDict().triggers || {};
  }

  /**
   * 定义运行环境
   */
  static getWorkflowRunsOn(): string {
    return 'ubuntu-latest';
  }

  /**
   * 执行环境设置（可被子类覆盖）
   */
  protected async setupEnvironment(): Promise<boolean> {
    const setupCommand = this.getInput('setup-command', '');
    if (setupCommand) {
      this.log('info', `执行环境设置: ${setupCommand}`);
      return await this.runCommand(setupCommand);
    }
    return true;
  }

  /**
   * 执行构建（可被子类覆盖）
   */
  protected async performBuild(): Promise<boolean> {
    const buildCommand = this.getInput('build-command', '');
    if (buildCommand) {
      this.log('info', `执行构建命令: ${buildCommand}`);
      return await this.runCommand(buildCommand);
    }
    return true;
  }

  /**
   * 处理构建产物（可被子类覆盖）
   */
  protected async processArtifacts(): Promise<string | null> {
    const artifactPath = this.getInput('artifact-path', 'artifacts/**');
    
    // 如果指定了具体路径，检查是否存在
    if (artifactPath && !artifactPath.includes('**')) {
      const fullPath = path.join(this.projectRoot, artifactPath);
      if (fs.existsSync(fullPath)) {
        this.log('info', `构建产物路径: ${fullPath}`);
        return fullPath;
      }
    }
    
    // 默认检查 artifacts 目录
    const artifactsDir = path.join(this.projectRoot, 'artifacts');
    if (fs.existsSync(artifactsDir)) {
      this.log('info', `构建产物目录: ${artifactsDir}`);
      return artifactsDir;
    }
    
    return null;
  }

  /**
   * 上传构建产物（可被子类覆盖）
   * 
   * 注意：实际的上传由脚手架生成的 workflow 中的 actions/upload-artifact@v4 处理
   * 这里只负责准备产物路径，设置输出供 workflow 使用
   */
  protected async uploadArtifacts(artifactPath: string | null): Promise<boolean> {
    const uploadArtifacts = this.getInput('upload-artifacts', 'true') === 'true';
    if (!uploadArtifacts || !artifactPath) {
      return true;
    }

    // Pipeline 类不直接上传，而是设置输出
    // 脚手架生成的 workflow 会自动添加上传步骤
    this.log('info', `构建产物已准备: ${artifactPath}`);
    this.log('info', '产物上传将由 workflow 中的 actions/upload-artifact@v4 处理');
    
    return true;
  }

  /**
   * 执行通用构建流程
   */
  async execute(): Promise<PipelineResult> {
    this.log('info', '='.repeat(60));
    this.log('info', '开始执行构建流程');
    this.log('info', '='.repeat(60));

    try {
      // 1. 环境设置
      if (!(await this.setupEnvironment())) {
        return {
          success: false,
          message: '环境设置失败',
          exitCode: 1,
        };
      }

      // 2. 执行构建
      if (!(await this.performBuild())) {
        return {
          success: false,
          message: '构建失败',
          exitCode: 1,
        };
      }

      // 3. 处理产物
      const artifactPath = await this.processArtifacts();
      if (!artifactPath) {
        this.log('warning', '未找到构建产物，但构建可能已成功');
      }

      // 4. 上传产物
      await this.uploadArtifacts(artifactPath);

      // 5. 设置输出
      this.setOutput('build-status', 'success');
      this.setOutput('artifact-path', artifactPath || '');
      this.setOutput('build-type', this.getInput('build-type', 'release'));

      this.log('info', '='.repeat(60));
      this.log('info', '✅ 构建流程完成');
      this.log('info', '='.repeat(60));

      return {
        success: true,
        message: '构建成功',
        data: {
          'artifact-path': artifactPath || '',
          'build-type': this.getInput('build-type', 'release'),
        },
        exitCode: 0,
      };
    } catch (error: any) {
      const errorMsg = `构建过程中发生错误: ${error.message}`;
      this.log('error', errorMsg);
      return {
        success: false,
        message: errorMsg,
        exitCode: 1,
      };
    }
  }
}


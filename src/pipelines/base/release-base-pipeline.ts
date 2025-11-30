/**
 * 通用发布流水线基类
 *
 * 提供通用的发布流程：
 * 1. 检查 GitHub CLI
 * 2. 查询构建工作流运行（可选）
 * 3. 下载构建产物（可选）
 * 4. 创建 GitHub Release
 *
 * 项目特定的 Pipeline 可以继承此类，只需实现特定的发布逻辑。
 */

import { BasePipeline, PipelineResult } from '../../base-pipeline';
import { createWorkflowConfig } from '../../workflow-config';
import * as fs from 'fs';
import * as path from 'path';

export class ReleaseBasePipeline extends BasePipeline {
  /**
   * 定义工作流输入参数
   */
  static getWorkflowInputs() {
    const config = createWorkflowConfig();
    config.addInput('version', '发布版本号', true);
    config.addInput('release-notes', '发布说明', false, '');
    config.addInput('artifact-name', '构建产物名称', false, 'build-artifacts');
    config.addInput('build-branch', '构建分支（用于查询工作流运行）', false, 'build');
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
    config.onWorkflowDispatch({
      version: {
        description: '发布版本号',
        required: true,
      },
      'release-notes': {
        description: '发布说明',
        required: false,
        default: '',
      },
      'build-branch': {
        description: '构建分支',
        required: false,
        default: 'build',
      },
    });
    return config.toDict().triggers || {};
  }

  /**
   * 定义运行环境
   */
  static getWorkflowRunsOn(): string {
    return 'ubuntu-latest';
  }

  /**
   * 检查 GitHub CLI 是否可用
   */
  protected async checkGhCli(): Promise<boolean> {
    this.log('info', '检查 GitHub CLI...');
    const hasGhCli = await this.runCommand('gh --version', { silent: true });
    if (!hasGhCli) {
      this.log('error', '未安装 GitHub CLI (gh)，请先安装：https://cli.github.com/');
      return false;
    }
    this.log('info', '✅ GitHub CLI 已就绪');
    return true;
  }

  /**
   * 查询构建分支的工作流运行 ID（可被子类覆盖）
   */
  protected async getBuildRunId(buildBranch: string): Promise<string | null> {
    if (!buildBranch) {
      return null;
    }

    this.log('info', `查询分支 ${buildBranch} 的工作流运行...`);
    
    // 使用 gh CLI 查询
    // 注意：这里简化处理，实际应该解析输出
    // 子类可以覆盖此方法实现更复杂的逻辑
    const queryCommand = `gh run list --branch ${buildBranch} --status success --limit 1 --json databaseId --jq ".[0].databaseId"`;
    
    // 暂时返回 null，子类可以实现具体逻辑
    return null;
  }

  /**
   * 下载构建产物（可被子类覆盖）
   */
  protected async downloadArtifacts(runId: string | null): Promise<string | null> {
    if (!runId) {
      // 如果没有 runId，尝试从当前 artifacts 目录读取
      const artifactsDir = path.join(this.projectRoot, 'artifacts');
      if (fs.existsSync(artifactsDir)) {
        this.log('info', `使用本地产物目录: ${artifactsDir}`);
        return artifactsDir;
      }
      return null;
    }

    this.log('info', `下载工作流运行 ${runId} 的产物...`);
    
    // 使用 gh CLI 下载
    const artifactsDir = path.join(this.projectRoot, 'artifacts', `run-${runId}`);
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }

    const downloadSuccess = await this.runCommand(
      `gh run download ${runId} --dir ${artifactsDir}`
    );

    if (downloadSuccess) {
      this.log('info', `✅ 产物下载完成: ${artifactsDir}`);
      return artifactsDir;
    }

    return null;
  }

  /**
   * 创建 GitHub Release（可被子类覆盖）
   */
  protected async createRelease(
    version: string,
    releaseNotes: string,
    artifactPath: string | null
  ): Promise<boolean> {
    this.log('info', `创建 GitHub Release v${version}...`);

    // 构建 gh release create 命令
    const releaseCommand = `gh release create v${version} --notes "${releaseNotes}"`;
    
    // 如果有产物路径，添加文件（简化处理，实际应该收集文件列表）
    // 子类可以覆盖此方法实现更复杂的逻辑

    const success = await this.runCommand(releaseCommand);
    if (success) {
      this.log('info', `✅ Release v${version} 创建成功！`);
      return true;
    }

    return false;
  }

  /**
   * 执行通用发布流程
   */
  async execute(): Promise<PipelineResult> {
    try {
      const version = this.getInput('version');
      if (!version) {
        return {
          success: false,
          message: '版本号是必需的',
          exitCode: 1,
        };
      }

      const releaseNotes = this.getInput('release-notes') || `Release ${version}`;
      const buildBranch = this.getInput('build-branch') || 'build';
      const artifactName = this.getInput('artifact-name') || 'build-artifacts';

      this.log('info', `开始发布流程 v${version}...`);

      // 1. 检查 gh CLI
      if (!(await this.checkGhCli())) {
        return {
          success: false,
          message: '未安装 GitHub CLI (gh)，请先安装：https://cli.github.com/',
          exitCode: 1,
        };
      }

      // 2. 查询构建工作流运行
      const runId = await this.getBuildRunId(buildBranch);

      // 3. 下载产物
      const artifactPath = await this.downloadArtifacts(runId);

      // 4. 创建 Release
      const releaseSuccess = await this.createRelease(version, releaseNotes, artifactPath);
      
      if (!releaseSuccess) {
        return {
          success: false,
          message: '创建 Release 失败',
          exitCode: 1,
        };
      }

      this.setOutput('version', version);
      this.setOutput('release-status', 'success');

      return {
        success: true,
        message: `Release v${version} 创建成功`,
        data: {
          version,
          'artifact-path': artifactPath || '',
        },
        exitCode: 0,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `发布流程失败: ${error.message}`,
        exitCode: 1,
      };
    }
  }
}


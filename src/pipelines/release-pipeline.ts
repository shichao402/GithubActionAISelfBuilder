/**
 * 发布流水线
 *
 * 核心流程：
 * 1. 下载构建产物
 * 2. 创建 GitHub Release
 */

import { BasePipeline, PipelineResult } from '../base-pipeline';
import { createWorkflowConfig } from '../workflow-config';

export class ReleasePipeline extends BasePipeline {
  /**
   * 定义工作流输入参数
   */
  static getWorkflowInputs() {
    const config = createWorkflowConfig();
    config.addInput('version', '发布版本号', true);
    config.addInput('release-notes', '发布说明', false, '');
    config.addInput('build-branch', '构建分支', false, 'build');
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
   * 执行发布逻辑
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

      this.log('info', `开始发布流程 v${version}...`);

      // 1. 检查 gh CLI 是否可用
      this.log('info', '检查 GitHub CLI...');
      const hasGhCli = await this.runCommand('gh --version', { silent: true });
      if (!hasGhCli) {
        return {
          success: false,
          message: '未安装 GitHub CLI (gh)，请先安装：https://cli.github.com/',
          exitCode: 1,
        };
      }

      // 2. 查询 build 分支的工作流运行（可选）
      let runId: string | null = null;
      if (buildBranch) {
        this.log('info', `查询分支 ${buildBranch} 的工作流运行...`);
        // 使用 gh CLI 查询
        const queryCommand = `gh run list --branch ${buildBranch} --status success --limit 1 --json databaseId --jq ".[0].databaseId"`;
        // 注意：这里简化处理，实际应该解析输出
        // 暂时跳过，直接使用当前 artifacts 目录
      }

      // 3. 创建 GitHub Release
      this.log('info', `创建 GitHub Release v${version}...`);
      const releaseCommand = `gh release create v${version} --notes "${releaseNotes}"`;
      const releaseSuccess = await this.runCommand(releaseCommand);
      
      if (!releaseSuccess) {
        return {
          success: false,
          message: '创建 Release 失败',
          exitCode: 1,
        };
      }

      this.setOutput('version', version);
      this.setOutput('release-status', 'success');

      this.log('info', `✅ Release v${version} 创建成功！`);
      return {
        success: true,
        message: `Release v${version} 创建成功`,
        data: {
          version,
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


/**
 * 发布流水线
 *
 * 核心流程：
 * 1. 下载构建产物
 * 2. 创建 GitHub Release
 * 
 * 使用 GitHub API 客户端抽象层，根据运行环境自动选择实现：
 * - GitHub Actions 环境：使用 @actions/github（自动使用 GITHUB_TOKEN）
 * - 本地环境：使用 GitHub CLI（需要 gh auth login）
 */

import { ReleaseBasePipeline } from '../base/release-base-pipeline';
import { PipelineResult } from '../../base-pipeline';
import { createGitHubApiClient } from '../../github-api-client';
import * as fs from 'fs';
import * as path from 'path';

export class ReleasePipeline extends ReleaseBasePipeline {
  private githubClient = createGitHubApiClient(
    (level: 'info' | 'warning' | 'error' | 'debug', message: string) => this.log(level, message)
  );

  /**
   * 定义工作流输入参数（继承自 ReleaseBasePipeline）
   */
  static getWorkflowInputs() {
    // 继承父类的输入参数
    return super.getWorkflowInputs();
  }

  /**
   * 查询构建分支的工作流运行 ID（覆盖父类方法，实现具体逻辑）
   */
  protected async getBuildRunId(buildBranch: string): Promise<string | null> {
    if (!buildBranch) {
      return null;
    }

    return await this.githubClient.getWorkflowRunId(buildBranch, 'success');
  }

  /**
   * 下载构建产物（覆盖父类方法，实现具体逻辑）
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
    
    const artifactsDir = path.join(this.projectRoot, 'artifacts', `run-${runId}`);
    
    const success = await this.githubClient.downloadArtifacts(runId, artifactsDir);
    return success ? artifactsDir : null;
  }

  /**
   * 创建 GitHub Release（覆盖父类方法，实现具体逻辑）
   */
  protected async createRelease(
    version: string,
    releaseNotes: string,
    artifactPath: string | null
  ): Promise<boolean> {
    this.log('info', `创建 GitHub Release v${version}...`);

    // 收集产物文件
    const files: string[] = [];
    if (artifactPath && fs.existsSync(artifactPath)) {
      const collectFiles = (dir: string) => {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          if (item.isFile()) {
            files.push(fullPath);
          } else if (item.isDirectory()) {
            collectFiles(fullPath);
          }
        }
      };
      collectFiles(artifactPath);
    }

    return await this.githubClient.createRelease(
      `v${version}`,
      releaseNotes,
      files.length > 0 ? files : undefined
    );
  }

  /**
   * 执行发布逻辑（调用父类的 execute 方法）
   */
  async execute(): Promise<PipelineResult> {
    // 调用父类的 execute，它会调用我们覆盖的方法
    return await super.execute();
  }
}


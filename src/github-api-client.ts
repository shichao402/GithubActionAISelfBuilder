/**
 * GitHub API 客户端抽象层
 * 
 * 根据运行环境自动选择实现：
 * - GitHub Actions 环境：使用 @actions/github（自动使用 GITHUB_TOKEN）
 * - 本地环境：使用 GitHub CLI（需要 gh auth login）
 * 
 * 保持流水线设计一致性，无需关心底层实现
 */

import * as exec from '@actions/exec';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 日志函数类型
 */
type LogFunction = (level: 'info' | 'warning' | 'error' | 'debug', message: string) => void;

/**
 * GitHub API 客户端接口
 */
export interface GitHubApiClient {
  /**
   * 查询工作流运行 ID
   */
  getWorkflowRunId(branch: string, status?: string): Promise<string | null>;

  /**
   * 下载工作流运行产物
   */
  downloadArtifacts(runId: string, targetDir: string): Promise<boolean>;

  /**
   * 创建 GitHub Release
   */
  createRelease(
    tag: string,
    notes: string,
    files?: string[]
  ): Promise<boolean>;
}

/**
 * 检测是否在 GitHub Actions 环境中
 */
function isGitHubActions(): boolean {
  return process.env.GITHUB_ACTIONS === 'true';
}

/**
 * 使用 GitHub CLI 的实现（本地环境）
 */
class GitHubCliClient implements GitHubApiClient {
  private log: LogFunction;

  constructor(log: LogFunction) {
    this.log = log;
  }

  async getWorkflowRunId(branch: string, status: string = 'success'): Promise<string | null> {
    try {
      let output = '';
      const options = {
        listeners: {
          stdout: (data: Buffer) => {
            output += data.toString();
          },
        },
        silent: true,
      };

      await exec.exec(
        'gh',
        [
          'run',
          'list',
          '--branch',
          branch,
          '--status',
          status,
          '--limit',
          '1',
          '--json',
          'databaseId',
          '--jq',
          '.[0].databaseId',
        ],
        options
      );

      const runId = output.trim();
      return runId && runId !== 'null' ? runId : null;
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      
      // 检查是否是认证错误
      if (errorMessage.includes('authentication') || 
          errorMessage.includes('GH_TOKEN') || 
          errorMessage.includes('not logged in')) {
        this.log('error' as const, `❌ GitHub CLI 认证失败`);
        this.log('error' as const, `   请运行以下命令进行认证：`);
        this.log('error' as const, `   gh auth login`);
      } else {
        this.log('warning' as const, `查询工作流运行失败: ${errorMessage}`);
      }
      return null;
    }
  }

  async downloadArtifacts(runId: string, targetDir: string): Promise<boolean> {
    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      await exec.exec('gh', ['run', 'download', runId, '--dir', targetDir]);
      this.log('info' as const, `✅ 产物下载完成: ${targetDir}`);
      return true;
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      
      // 检查是否是认证错误
      if (errorMessage.includes('authentication') || 
          errorMessage.includes('GH_TOKEN') || 
          errorMessage.includes('not logged in')) {
        this.log('error' as const, `❌ GitHub CLI 认证失败`);
        this.log('error' as const, `   请运行以下命令进行认证：`);
        this.log('error' as const, `   gh auth login`);
      } else {
        this.log('warning' as const, `下载产物失败: ${errorMessage}`);
      }
      return false;
    }
  }

  async createRelease(
    tag: string,
    notes: string,
    files?: string[]
  ): Promise<boolean> {
    try {
      const args = ['release', 'create', tag, '--notes', notes];
      if (files && files.length > 0) {
        args.push(...files);
      }

      await exec.exec('gh', args);
      this.log('info' as const, `✅ Release ${tag} 创建成功！`);
      return true;
    } catch (error: any) {
      const errorMessage = error.message || String(error);
      
      // 检查是否是认证错误
      if (errorMessage.includes('authentication') || 
          errorMessage.includes('GH_TOKEN') || 
          errorMessage.includes('not logged in')) {
        this.log('error' as const, `❌ GitHub CLI 认证失败`);
        this.log('error' as const, `   请运行以下命令进行认证：`);
        this.log('error' as const, `   gh auth login`);
        this.log('error' as const, `   详细说明：https://cli.github.com/manual/gh_auth_login`);
      } else {
        this.log('error' as const, `创建 Release 失败: ${errorMessage}`);
      }
      return false;
    }
  }
}

/**
 * 使用 @actions/github 的实现（GitHub Actions 环境）
 */
class GitHubActionsClient implements GitHubApiClient {
  private log: LogFunction;
  private octokit: any;

  constructor(log: LogFunction) {
    this.log = log;
    
    // 动态导入 @actions/github（仅在 GitHub Actions 环境中需要）
    try {
      const github = require('@actions/github');
      
      // 在 GitHub Actions 环境中，GITHUB_TOKEN 应该自动可用作为环境变量
      // @actions/github 的 getOctokit() 需要显式传入 token
      // GitHub Actions 会自动设置 process.env.GITHUB_TOKEN
      const token = process.env.GITHUB_TOKEN;
      
      if (!token) {
        // 如果 GITHUB_TOKEN 不可用，说明不在 GitHub Actions 环境中，或者环境配置有问题
        // 这不应该发生，因为只有在检测到 GITHUB_ACTIONS=true 时才会使用这个客户端
        throw new Error('GITHUB_TOKEN 环境变量未设置。在 GitHub Actions 中，GITHUB_TOKEN 应该自动可用。');
      }
      
      // 使用 @actions/github 创建 octokit 实例
      this.octokit = github.getOctokit(token);
    } catch (error: any) {
      this.log('error', `初始化 GitHub API 客户端失败: ${error.message}`);
      this.log('error', `   提示：在 GitHub Actions 中，GITHUB_TOKEN 应该自动可用`);
      this.log('error', `   如果问题持续，请检查是否在 GitHub Actions 环境中运行`);
      throw error;
    }
  }

  async getWorkflowRunId(branch: string, status: string = 'success'): Promise<string | null> {
    try {
      const github = require('@actions/github');
      const context = github.context;

      const response = await this.octokit.rest.actions.listWorkflowRunsForRepo({
        owner: context.repo.owner,
        repo: context.repo.repo,
        branch: branch,
        status: status,
        per_page: 1,
      });

      const runs = response.data.workflow_runs;
      if (runs && runs.length > 0) {
        return runs[0].id.toString();
      }
      return null;
    } catch (error: any) {
      this.log('warning', `查询工作流运行失败: ${error.message}`);
      return null;
    }
  }

  async downloadArtifacts(runId: string, targetDir: string): Promise<boolean> {
    try {
      const github = require('@actions/github');
      const context = github.context;

      // 获取工作流运行的 artifacts
      const response = await this.octokit.rest.actions.listWorkflowRunArtifacts({
        owner: context.repo.owner,
        repo: context.repo.repo,
        run_id: parseInt(runId, 10),
      });

      const artifacts = response.data.artifacts;
      if (!artifacts || artifacts.length === 0) {
        this.log('warning', '未找到工作流运行产物');
        return false;
      }

      // 下载每个 artifact
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      for (const artifact of artifacts) {
        const downloadResponse = await this.octokit.rest.actions.downloadWorkflowRunArtifact({
          owner: context.repo.owner,
          repo: context.repo.repo,
          artifact_id: artifact.id,
          archive_format: 'zip',
        });

        // 保存到文件
        const zipPath = path.join(targetDir, `${artifact.name}.zip`);
        fs.writeFileSync(zipPath, Buffer.from(downloadResponse.data as any));

        // 解压（需要 unzip 工具，或使用 Node.js 解压库）
        // 这里简化处理，实际应该解压文件
        this.log('info', `下载产物: ${artifact.name} (${artifact.size_in_bytes} bytes)`);
      }

      this.log('info', `✅ 产物下载完成: ${targetDir}`);
      return true;
    } catch (error: any) {
      this.log('warning', `下载产物失败: ${error.message}`);
      return false;
    }
  }

  async createRelease(
    tag: string,
    notes: string,
    files?: string[]
  ): Promise<boolean> {
    try {
      const github = require('@actions/github');
      const context = github.context;

      // 创建 Release
      const releaseResponse = await this.octokit.rest.repos.createRelease({
        owner: context.repo.owner,
        repo: context.repo.repo,
        tag_name: tag,
        body: notes,
        draft: false,
        prerelease: false,
      });

      const releaseId = releaseResponse.data.id;

      // 上传文件（如果有）
      if (files && files.length > 0) {
        for (const filePath of files) {
          if (!fs.existsSync(filePath)) {
            this.log('warning', `文件不存在: ${filePath}`);
            continue;
          }

          const fileName = path.basename(filePath);
          const fileContent = fs.readFileSync(filePath);

          await this.octokit.rest.repos.uploadReleaseAsset({
            owner: context.repo.owner,
            repo: context.repo.repo,
            release_id: releaseId,
            name: fileName,
            data: fileContent as any,
          });

          this.log('info', `上传文件: ${fileName}`);
        }
      }

      this.log('info', `✅ Release ${tag} 创建成功！`);
      return true;
    } catch (error: any) {
      this.log('error', `创建 Release 失败: ${error.message}`);
      return false;
    }
  }
}

/**
 * 创建 GitHub API 客户端（根据环境自动选择实现）
 */
export function createGitHubApiClient(
  log: LogFunction
): GitHubApiClient {
  if (isGitHubActions()) {
    log('info' as const, '检测到 GitHub Actions 环境，使用 @actions/github');
    return new GitHubActionsClient(log);
  } else {
    log('info' as const, '检测到本地环境，使用 GitHub CLI');
    return new GitHubCliClient(log);
  }
}


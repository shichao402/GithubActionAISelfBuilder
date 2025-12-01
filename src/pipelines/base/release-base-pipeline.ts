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
import { createGitHubApiClient } from '../../github-api-client';
import * as fs from 'fs';
import * as path from 'path';

export class ReleaseBasePipeline extends BasePipeline {
  protected githubClient: ReturnType<typeof createGitHubApiClient>;

  constructor(
    inputs: Record<string, any> = {},
    configFile?: string,
    projectRoot?: string
  ) {
    super(inputs, configFile, projectRoot);
    // 延迟初始化，确保在构造函数完成后才初始化（此时环境变量已设置）
    this.githubClient = createGitHubApiClient(
      (level: 'info' | 'warning' | 'error' | 'debug', message: string) => this.log(level, message)
    );
  }

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
   * 检查认证状态
   * 
   * - GitHub Actions 环境：自动使用 GITHUB_TOKEN，无需检查
   * - 本地环境：检查 GitHub CLI 是否已认证
   */
  protected async checkAuthentication(): Promise<boolean> {
    // 如果在 GitHub Actions 环境中，自动使用 GITHUB_TOKEN
    if (process.env.GITHUB_ACTIONS === 'true') {
      this.log('info', '检测到 GitHub Actions 环境，自动使用 GITHUB_TOKEN');
      return true;
    }

    // 本地环境：检查 GitHub CLI 是否已安装和认证
    this.log('info', '检测到本地环境，检查 GitHub CLI 认证状态...');
    
    // 检查是否安装
    const hasGhCli = await this.runCommand('gh --version', { silent: true });
    if (!hasGhCli) {
      this.log('error', '❌ 未安装 GitHub CLI (gh)');
      this.log('error', '   请先安装：https://cli.github.com/');
      this.log('error', '   macOS: brew install gh');
      this.log('error', '   Linux: 参考 https://cli.github.com/manual/installation');
      return false;
    }

    // 检查是否已认证
    const authStatus = await this.runCommand('gh auth status', { silent: true });
    if (!authStatus) {
      this.log('error', '❌ GitHub CLI 未认证');
      this.log('error', '   请运行以下命令进行认证：');
      this.log('error', '   gh auth login');
      this.log('error', '   详细说明：https://cli.github.com/manual/gh_auth_login');
      return false;
    }

    this.log('info', '✅ GitHub CLI 已就绪并已认证');
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
    
    try {
      // 使用 GitHub API 客户端（自动根据环境选择实现）
      const runId = await this.githubClient.getWorkflowRunId(buildBranch, 'success');
      if (runId) {
        this.log('info', `✅ 找到工作流运行: ${runId}`);
      } else {
        this.log('warning', `未找到分支 ${buildBranch} 的成功工作流运行`);
      }
      return runId;
    } catch (error: any) {
      this.log('warning', `查询工作流运行失败: ${error.message}`);
      return null;
    }
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
    
    // 使用 GitHub API 客户端（自动根据环境选择实现）
    const artifactsDir = path.join(this.projectRoot, 'artifacts', `run-${runId}`);
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }

    try {
      const success = await this.githubClient.downloadArtifacts(runId, artifactsDir);
      if (success) {
        return artifactsDir;
      }
      return null;
    } catch (error: any) {
      this.log('warning', `下载产物失败: ${error.message}`);
      return null;
    }
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

    try {
      // 收集要上传的文件（如果有产物路径）
      const files: string[] = [];
      if (artifactPath && fs.existsSync(artifactPath)) {
        // 简化处理：如果是目录，收集所有文件
        // 子类可以覆盖此方法实现更复杂的逻辑
        const collectFiles = (dir: string): void => {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isFile()) {
              files.push(fullPath);
            } else if (entry.isDirectory()) {
              collectFiles(fullPath);
            }
          }
        };
        collectFiles(artifactPath);
      }

      // 使用 GitHub API 客户端（自动根据环境选择实现）
      const success = await this.githubClient.createRelease(
        `v${version}`,
        releaseNotes || `Release ${version}`,
        files.length > 0 ? files : undefined
      );

      if (success) {
        return true;
      }

      return false;
    } catch (error: any) {
      this.log('error', `创建 Release 失败: ${error.message}`);
      
      // 如果是认证错误，给出更清晰的提示
      if (error.message.includes('authentication') || error.message.includes('token')) {
        if (process.env.GITHUB_ACTIONS === 'true') {
          this.log('error', '❌ GitHub Actions 环境中 GITHUB_TOKEN 不可用');
          this.log('error', '   这通常不应该发生，请检查 workflow 配置');
        } else {
          this.log('error', '❌ GitHub CLI 认证失败');
          this.log('error', '   请运行以下命令重新认证：');
          this.log('error', '   gh auth login');
        }
      }
      
      return false;
    }
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

      // 1. 检查认证状态
      if (!(await this.checkAuthentication())) {
        return {
          success: false,
          message: '认证检查失败，请根据上述提示进行修复',
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


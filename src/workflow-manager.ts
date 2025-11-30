/**
 * GitHub Actions Workflow 管理工具
 *
 * 用于触发、监控和调试 GitHub Actions workflow
 * 提供 AI 自我调试能力：自动收集失败日志、分析错误等
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';

const execAsync = promisify(exec);

export interface WorkflowRunInfo {
  id: number;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'cancelled' | 'skipped' | 'neutral';
  url?: string;
  workflowName?: string;
  headBranch?: string;
  event?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkflowJob {
  id: number;
  name: string;
  status: string;
  conclusion?: string;
}

export interface WorkflowInputs {
  [key: string]: string;
}

/**
 * GitHub Actions Workflow 管理器
 */
export class WorkflowManager {
  private projectRoot: string;
  private runIdFile: string;
  private logDir: string;
  private isGitHubActions: boolean;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd();
    this.runIdFile = path.join(this.projectRoot, '.github', '.github_run_id.txt');
    this.logDir = path.join(this.projectRoot, '.github', 'workflow_logs');
    
    // 检测是否在 GitHub Actions 环境中
    this.isGitHubActions = process.env.GITHUB_ACTIONS === 'true';

    // 确保日志目录存在
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * 日志输出（自动适配本地和 CI 环境）
   */
  private logInfo(message: string): void {
    if (this.isGitHubActions) {
      core.info(message);
    } else {
      console.log(message);
    }
  }

  /**
   * 错误输出（自动适配本地和 CI 环境）
   */
  private logError(message: string): void {
    if (this.isGitHubActions) {
      core.error(message);
    } else {
      console.error(message);
    }
  }

  /**
   * 检查 GitHub CLI 是否安装
   */
  async checkGhCli(): Promise<boolean> {
    try {
      await execAsync('gh --version');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 检查 GitHub CLI 是否已登录
   */
  async checkGhAuth(): Promise<boolean> {
    try {
      await execAsync('gh auth status');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取仓库信息
   */
  async getRepoInfo(): Promise<string | null> {
    try {
      const { stdout } = await execAsync(
        'gh repo view --json nameWithOwner -q .nameWithOwner'
      );
      return stdout.trim();
    } catch {
      return null;
    }
  }

  /**
   * 触发 GitHub Actions workflow
   */
  async triggerWorkflow(
    workflowFile: string,
    options: {
      ref?: string;
      inputs?: WorkflowInputs;
    } = {}
  ): Promise<{ success: boolean; runId?: number; message: string }> {
    // 检查 GitHub CLI
    if (!(await this.checkGhCli())) {
      return {
        success: false,
        message: '错误：未找到 GitHub CLI (gh)\n请安装 GitHub CLI: https://cli.github.com/',
      };
    }

    if (!(await this.checkGhAuth())) {
      return {
        success: false,
        message: '错误：GitHub CLI 未登录\n请运行: gh auth login',
      };
    }

    // 检查 workflow 文件
    const workflowPath = path.join(this.projectRoot, workflowFile);
    if (!fs.existsSync(workflowPath)) {
      return {
        success: false,
        message: `错误：workflow 文件不存在: ${workflowFile}`,
      };
    }

    // 获取 workflow ID（文件名）
    const workflowId = path.basename(workflowFile);

    // 获取仓库信息
    const repo = await this.getRepoInfo();
    if (!repo) {
      return {
        success: false,
        message:
          '错误：无法获取仓库信息\n请确保当前目录是一个 Git 仓库，并且已配置 GitHub remote',
      };
    }

    // 确定 ref
    let ref = options.ref;
    if (!ref) {
      try {
        const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', {
          cwd: this.projectRoot,
        });
        ref = stdout.trim() || 'main';
      } catch {
        ref = 'main';
      }
    }

    // 构建命令
    const cmd = ['gh', 'workflow', 'run', workflowId, '--ref', ref];

    // 添加输入参数
    if (options.inputs) {
      for (const [key, value] of Object.entries(options.inputs)) {
        cmd.push('-f', `${key}=${value}`);
      }
    }

    // 触发 workflow
    try {
      await execAsync(cmd.join(' '), { cwd: this.projectRoot });
    } catch (error: any) {
      return {
        success: false,
        message: `错误：触发 workflow 失败\n${error.message}`,
      };
    }

    // 等待几秒让 workflow 启动
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 获取最新的 run ID
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const { stdout } = await execAsync(
          `gh run list --workflow ${workflowId} --limit 1 --json databaseId -q .[0].databaseId`,
          { cwd: this.projectRoot }
        );
        const runIdStr = stdout.trim();
        if (runIdStr && runIdStr !== 'null') {
          const runId = parseInt(runIdStr, 10);
          // 保存 run ID 到文件
          fs.writeFileSync(this.runIdFile, runId.toString(), 'utf8');
          return {
            success: true,
            runId,
            message: `✓ Workflow 已触发\nRun ID: ${runId}`,
          };
        }
      } catch {
        // 忽略错误，继续尝试
      }

      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return {
      success: false,
      message: '警告：无法获取 run ID\n请手动查看 GitHub Actions 页面获取 run ID',
    };
  }

  /**
   * 获取 workflow run 信息
   */
  async getRunInfo(runId: number): Promise<WorkflowRunInfo | null> {
    try {
      const { stdout } = await execAsync(
        `gh run view ${runId} --json status,conclusion,url,workflowName,headBranch,event,createdAt,updatedAt,databaseId`
      );
      const info = JSON.parse(stdout);
      return {
        id: info.databaseId || runId,
        status: info.status,
        conclusion: info.conclusion,
        url: info.url,
        workflowName: info.workflowName,
        headBranch: info.headBranch,
        event: info.event,
        createdAt: info.createdAt,
        updatedAt: info.updatedAt,
      };
    } catch {
      return null;
    }
  }

  /**
   * 监控 workflow 执行状态
   */
  async monitorWorkflow(
    runId?: number,
    options: {
      pollInterval?: number;
      onStatusChange?: (info: WorkflowRunInfo) => void;
    } = {}
  ): Promise<{ success: boolean; exitCode: number }> {
    // 检查 GitHub CLI
    if (!(await this.checkGhCli())) {
      this.logError('错误：未找到 GitHub CLI (gh)');
      return { success: false, exitCode: 1 };
    }

    if (!(await this.checkGhAuth())) {
      this.logError('错误：GitHub CLI 未登录');
      return { success: false, exitCode: 1 };
    }

    // 获取 run ID
    if (!runId) {
      if (fs.existsSync(this.runIdFile)) {
        try {
          runId = parseInt(fs.readFileSync(this.runIdFile, 'utf8').trim(), 10);
        } catch {
          this.logError('错误：无法从文件读取 run ID');
          return { success: false, exitCode: 1 };
        }
      } else {
        this.logError('错误：必须提供 run ID');
        return { success: false, exitCode: 1 };
      }
    }

    // 获取 run 信息
    const runInfo = await this.getRunInfo(runId);
    if (!runInfo) {
      this.logError(`错误：无法获取 run 信息\n请检查 run ID 是否正确: ${runId}`);
      return { success: false, exitCode: 1 };
    }

    this.logInfo(`Workflow: ${runInfo.workflowName || 'Unknown'}`);
    this.logInfo(`分支: ${runInfo.headBranch || 'Unknown'}`);
    this.logInfo(`事件: ${runInfo.event || 'Unknown'}`);
    if (runInfo.url) {
      this.logInfo(`URL: ${runInfo.url}`);
    }

    const pollInterval = options.pollInterval || 5;
    let iteration = 0;

    this.logInfo(`开始监控 workflow 状态（每 ${pollInterval} 秒查询一次）...`);

    // 监控循环
    while (true) {
      iteration++;

      const statusInfo = await this.getRunInfo(runId);
      if (!statusInfo) {
        const timestamp = new Date().toISOString();
        this.logInfo(`[${timestamp}] [${iteration}] 无法获取状态信息`);
        await new Promise((resolve) => setTimeout(resolve, pollInterval * 1000));
        continue;
      }

      // 触发状态变化回调
      if (options.onStatusChange) {
        options.onStatusChange(statusInfo);
      }

      const timestamp = new Date().toISOString();

      if (statusInfo.status === 'queued') {
        this.logInfo(`[${timestamp}] [${iteration}] 状态: 排队中...`);
      } else if (statusInfo.status === 'in_progress') {
        this.logInfo(`[${timestamp}] [${iteration}] 状态: 运行中...`);
      } else if (statusInfo.status === 'completed') {
        if (statusInfo.conclusion === 'success') {
          this.logInfo(`[${timestamp}] [${iteration}] 状态: 完成 - 成功！`);
          this.logInfo('========================================');
          this.logInfo('  Workflow 执行成功！');
          this.logInfo('========================================');
          return { success: true, exitCode: 0 };
        } else {
          this.logError(`[${timestamp}] [${iteration}] 状态: 完成 - 失败！`);
          this.logError('========================================');
          this.logError('  Workflow 执行失败！');
          this.logError('========================================');

          // 自动收集失败日志
          const logFile = await this.collectWorkflowLogs(runId);
          if (logFile) {
            this.logInfo(`✓ 错误日志已保存到: ${logFile}`);
          }

          return { success: false, exitCode: 1 };
        }
      } else {
        this.logInfo(`[${timestamp}] [${iteration}] 状态: ${statusInfo.status}`);
      }

      // 等待下一次查询
      await new Promise((resolve) => setTimeout(resolve, pollInterval * 1000));
    }
  }

  /**
   * 收集 workflow 日志（用于 AI 分析）
   */
  async collectWorkflowLogs(runId: number): Promise<string | null> {
    this.logInfo('正在收集 workflow 日志...');
    const logFile = path.join(this.logDir, `workflow_${runId}_error.log`);

    try {
      // 获取 run 的详细信息
      const { stdout } = await execAsync(
        `gh run view ${runId} --json jobs,status,conclusion,workflowName,headBranch,event,url`
      );
      const runData = JSON.parse(stdout);

      const logContent: string[] = [];

      // 写入 run 基本信息
      logContent.push('='.repeat(80));
      logContent.push('GitHub Actions Workflow 错误日志');
      logContent.push('='.repeat(80));
      logContent.push('');
      logContent.push(`Run ID: ${runId}`);
      logContent.push(`Workflow: ${runData.workflowName || 'Unknown'}`);
      logContent.push(`分支: ${runData.headBranch || 'Unknown'}`);
      logContent.push(`事件: ${runData.event || 'Unknown'}`);
      logContent.push(`状态: ${runData.status || 'Unknown'}`);
      logContent.push(`结论: ${runData.conclusion || 'Unknown'}`);
      logContent.push(`收集时间: ${new Date().toISOString()}`);
      logContent.push('');
      logContent.push('='.repeat(80));
      logContent.push('');

      // 获取所有 jobs
      const jobs: WorkflowJob[] = runData.jobs || [];
      if (jobs.length === 0) {
        logContent.push('未找到 jobs 信息\n');
        fs.writeFileSync(logFile, logContent.join('\n'), 'utf8');
        return logFile;
      }

      // 写入 jobs 摘要
      logContent.push('Jobs 摘要:');
      logContent.push('-'.repeat(80));
      for (const job of jobs) {
        logContent.push(
          `  ${job.name}: ${job.status} / ${job.conclusion || 'Unknown'} (ID: ${job.id})`
        );
      }
      logContent.push('');
      logContent.push('='.repeat(80));
      logContent.push('');

      // 获取失败的 jobs
      const failedJobs = jobs.filter(
        (job) => job.conclusion === 'failure' || job.conclusion === 'cancelled'
      );

      if (failedJobs.length > 0) {
        logContent.push(`失败的 Jobs (${failedJobs.length} 个):`);
        logContent.push('-'.repeat(80));
        for (const job of failedJobs) {
          logContent.push(`  - ${job.name} (ID: ${job.id})`);
        }
        logContent.push('');
        logContent.push('='.repeat(80));
        logContent.push('');

        // 获取每个失败 job 的日志
        for (const job of failedJobs) {
          this.logInfo(`正在获取 Job '${job.name}' (ID: ${job.id}) 的日志...`);

          logContent.push('');
          logContent.push('='.repeat(80));
          logContent.push(`Job: ${job.name} (ID: ${job.id})`);
          logContent.push('='.repeat(80));
          logContent.push('');

          // 尝试多种方式获取日志
          let logObtained = false;

          // 方式1: 使用 job ID 获取日志
          if (job.id) {
            try {
              const { stdout: jobLog } = await execAsync(
                `gh run view ${runId} --log --job ${job.id}`,
                { timeout: 60000 }
              );
              if (jobLog && jobLog.trim()) {
                logContent.push(jobLog);
                logObtained = true;
              }
            } catch {
              // 忽略错误，尝试其他方式
            }
          }

          // 方式2: 使用 --log-failed 获取失败日志
          if (!logObtained) {
            try {
              const { stdout: failedLog } = await execAsync(
                `gh run view ${runId} --log-failed`,
                { timeout: 60000 }
              );
              if (failedLog && failedLog.trim()) {
                logContent.push('完整失败日志:');
                logContent.push('-'.repeat(80));
                logContent.push(failedLog);
                logObtained = true;
              }
            } catch {
              // 忽略错误，尝试其他方式
            }
          }

          // 方式3: 获取完整日志
          if (!logObtained) {
            try {
              const { stdout: fullLog } = await execAsync(
                `gh run view ${runId} --log`,
                { timeout: 120000 }
              );
              if (fullLog && fullLog.trim()) {
                logContent.push('完整日志:');
                logContent.push('-'.repeat(80));
                logContent.push(fullLog);
                logObtained = true;
              }
            } catch {
              // 忽略错误
            }
          }

          if (!logObtained) {
            logContent.push(`无法获取 Job '${job.name}' 的日志`);
            logContent.push('请访问以下 URL 查看详细日志:');
            logContent.push(`  ${runData.url || ''}`);
          }

          logContent.push('');
        }
      } else {
        // 如果没有失败的 jobs，尝试获取完整日志
        logContent.push('未找到失败的 Jobs，获取完整日志...');
        logContent.push('-'.repeat(80));
        logContent.push('');
        try {
          const { stdout: fullLog } = await execAsync(`gh run view ${runId} --log`, {
            timeout: 120000,
          });
          if (fullLog && fullLog.trim()) {
            logContent.push(fullLog);
          }
        } catch (error: any) {
          logContent.push(`无法获取完整日志: ${error.message}`);
          logContent.push('请访问以下 URL 查看详细日志:');
          logContent.push(`  ${runData.url || ''}`);
        }
      }

      // 写入日志文件
      fs.writeFileSync(logFile, logContent.join('\n'), 'utf8');
      return logFile;
    } catch (error: any) {
      this.logError(`收集日志失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 运行 workflow（触发 + 监控）
   */
  async runWorkflow(
    workflowFile: string,
    options: {
      ref?: string;
      inputs?: WorkflowInputs;
      pollInterval?: number;
    } = {}
  ): Promise<{ success: boolean; exitCode: number }> {
    // 步骤 1: 触发 workflow
    this.logInfo('==========================================');
    this.logInfo('  步骤 1: 触发 Workflow');
    this.logInfo('==========================================');
    this.logInfo('');

    const triggerResult = await this.triggerWorkflow(workflowFile, {
      ref: options.ref,
      inputs: options.inputs,
    });

    if (!triggerResult.success) {
      this.logError(triggerResult.message);
      return { success: false, exitCode: 1 };
    }

    this.logInfo(triggerResult.message);
    this.logInfo('');

    // 步骤 2: 监控 workflow
    this.logInfo('==========================================');
    this.logInfo('  步骤 2: 监控 Workflow');
    this.logInfo('==========================================');
    this.logInfo('');

    return this.monitorWorkflow(triggerResult.runId, {
      pollInterval: options.pollInterval,
    });
  }
}


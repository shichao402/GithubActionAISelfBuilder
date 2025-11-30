/**
 * Debug Action - AI 自我调试 GitHub Actions workflow
 *
 * 功能：
 * - 触发 workflow
 * - 监控 workflow 状态
 * - 收集失败日志（用于 AI 分析）
 * - 自动运行（触发 + 监控）
 */

import * as core from '@actions/core';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// 内联 WorkflowManager 的核心功能（简化版，用于 Action）
class WorkflowManager {
  private projectRoot: string;
  private runIdFile: string;
  private logDir: string;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd();
    this.runIdFile = path.join(this.projectRoot, '.github_run_id.txt');
    this.logDir = path.join(this.projectRoot, 'workflow_logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  async checkGhCli(): Promise<boolean> {
    try {
      await execAsync('gh --version');
      return true;
    } catch {
      return false;
    }
  }

  async checkGhAuth(): Promise<boolean> {
    try {
      await execAsync('gh auth status');
      return true;
    } catch {
      return false;
    }
  }

  async triggerWorkflow(
    workflowFile: string,
    options: { ref?: string; inputs?: Record<string, string> } = {}
  ): Promise<{ success: boolean; runId?: number; message: string }> {
    if (!(await this.checkGhCli())) {
      return { success: false, message: '错误：未找到 GitHub CLI (gh)' };
    }
    if (!(await this.checkGhAuth())) {
      return { success: false, message: '错误：GitHub CLI 未登录' };
    }

    const workflowPath = path.join(this.projectRoot, workflowFile);
    if (!fs.existsSync(workflowPath)) {
      return { success: false, message: `错误：workflow 文件不存在: ${workflowFile}` };
    }

    const workflowId = path.basename(workflowFile);
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

    const cmd = ['gh', 'workflow', 'run', workflowId, '--ref', ref];
    if (options.inputs) {
      for (const [key, value] of Object.entries(options.inputs)) {
        cmd.push('-f', `${key}=${value}`);
      }
    }

    try {
      await execAsync(cmd.join(' '), { cwd: this.projectRoot });
    } catch (error: any) {
      return { success: false, message: `错误：触发 workflow 失败\n${error.message}` };
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));

    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        const { stdout } = await execAsync(
          `gh run list --workflow ${workflowId} --limit 1 --json databaseId -q .[0].databaseId`,
          { cwd: this.projectRoot }
        );
        const runIdStr = stdout.trim();
        if (runIdStr && runIdStr !== 'null') {
          const runId = parseInt(runIdStr, 10);
          fs.writeFileSync(this.runIdFile, runId.toString(), 'utf8');
          return { success: true, runId, message: `✓ Workflow 已触发\nRun ID: ${runId}` };
        }
      } catch {
        // 继续尝试
      }
      if (attempt < 9) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return { success: false, message: '警告：无法获取 run ID' };
  }

  async getRunInfo(runId: number): Promise<any> {
    try {
      const { stdout } = await execAsync(
        `gh run view ${runId} --json status,conclusion,url,workflowName,headBranch,event,createdAt,updatedAt,databaseId`
      );
      return JSON.parse(stdout);
    } catch {
      return null;
    }
  }

  async monitorWorkflow(
    runId?: number,
    options: { pollInterval?: number } = {}
  ): Promise<{ success: boolean; exitCode: number }> {
    if (!(await this.checkGhCli()) || !(await this.checkGhAuth())) {
      return { success: false, exitCode: 1 };
    }

    if (!runId) {
      if (fs.existsSync(this.runIdFile)) {
        try {
          runId = parseInt(fs.readFileSync(this.runIdFile, 'utf8').trim(), 10);
        } catch {
          return { success: false, exitCode: 1 };
        }
      } else {
        return { success: false, exitCode: 1 };
      }
    }

    const pollInterval = options.pollInterval || 5;
    let iteration = 0;

    while (true) {
      iteration++;
      const statusInfo = await this.getRunInfo(runId);
      if (!statusInfo) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval * 1000));
        continue;
      }

      const timestamp = new Date().toISOString();
      if (statusInfo.status === 'queued') {
        core.info(`[${timestamp}] [${iteration}] 状态: 排队中...`);
      } else if (statusInfo.status === 'in_progress') {
        core.info(`[${timestamp}] [${iteration}] 状态: 运行中...`);
      } else if (statusInfo.status === 'completed') {
        if (statusInfo.conclusion === 'success') {
          core.info(`[${timestamp}] [${iteration}] 状态: 完成 - 成功！`);
          return { success: true, exitCode: 0 };
        } else {
          core.error(`[${timestamp}] [${iteration}] 状态: 完成 - 失败！`);
          await this.collectWorkflowLogs(runId);
          return { success: false, exitCode: 1 };
        }
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval * 1000));
    }
  }

  async collectWorkflowLogs(runId: number): Promise<string | null> {
    const logFile = path.join(this.logDir, `workflow_${runId}_error.log`);
    try {
      const { stdout } = await execAsync(
        `gh run view ${runId} --json jobs,status,conclusion,workflowName,headBranch,event,url`
      );
      const runData = JSON.parse(stdout);
      const logContent: string[] = [];
      logContent.push('='.repeat(80));
      logContent.push('GitHub Actions Workflow 错误日志');
      logContent.push('='.repeat(80));
      logContent.push(`Run ID: ${runId}`);
      logContent.push(`Workflow: ${runData.workflowName || 'Unknown'}`);
      logContent.push(`收集时间: ${new Date().toISOString()}`);
      logContent.push('');

      const jobs = runData.jobs || [];
      const failedJobs = jobs.filter(
        (job: any) => job.conclusion === 'failure' || job.conclusion === 'cancelled'
      );

      for (const job of failedJobs) {
        try {
          const { stdout: jobLog } = await execAsync(
            `gh run view ${runId} --log-failed --job ${job.id}`,
            { timeout: 60000 }
          );
          logContent.push(`Job: ${job.name}`);
          logContent.push('-'.repeat(80));
          logContent.push(jobLog);
          logContent.push('');
        } catch {
          // 忽略错误
        }
      }

      fs.writeFileSync(logFile, logContent.join('\n'), 'utf8');
      return logFile;
    } catch {
      return null;
    }
  }

  async runWorkflow(
    workflowFile: string,
    options: { ref?: string; inputs?: Record<string, string>; pollInterval?: number } = {}
  ): Promise<{ success: boolean; exitCode: number }> {
    const triggerResult = await this.triggerWorkflow(workflowFile, {
      ref: options.ref,
      inputs: options.inputs,
    });

    if (!triggerResult.success) {
      return { success: false, exitCode: 1 };
    }

    return this.monitorWorkflow(triggerResult.runId, {
      pollInterval: options.pollInterval,
    });
  }
}

async function run() {
  try {
    const action = core.getInput('action') || 'monitor';
    const runIdInput = core.getInput('run-id');
    const workflowFile = core.getInput('workflow-file');
    const ref = core.getInput('ref');
    const pollInterval = parseInt(core.getInput('poll-interval') || '5', 10);

    const manager = new WorkflowManager();

    switch (action) {
      case 'trigger':
        if (!workflowFile) {
          core.setFailed('错误：trigger 操作需要 workflow-file 参数');
          return;
        }

        // 解析输入参数
        const inputs: Record<string, string> = {};
        const inputKeys = Object.keys(process.env)
          .filter((key) => key.startsWith('INPUT_') && key !== 'INPUT_ACTION')
          .map((key) => key.substring(6).toLowerCase().replace(/_/g, '-'));

        for (const key of inputKeys) {
          const value = core.getInput(key, { required: false });
          if (value) {
            inputs[key] = value;
          }
        }

        const triggerResult = await manager.triggerWorkflow(workflowFile, {
          ref,
          inputs: Object.keys(inputs).length > 0 ? inputs : undefined,
        });

        if (triggerResult.success && triggerResult.runId) {
          core.setOutput('run-id', triggerResult.runId.toString());
          core.info(triggerResult.message);
        } else {
          core.setFailed(triggerResult.message);
        }
        break;

      case 'monitor':
        const runId = runIdInput ? parseInt(runIdInput, 10) : undefined;
        const monitorResult = await manager.monitorWorkflow(runId, {
          pollInterval,
        });

        core.setOutput('success', monitorResult.success.toString());
        if (!monitorResult.success) {
          core.setFailed('Workflow 执行失败');
        }
        break;

      case 'collect-logs':
        const collectRunId = runIdInput
          ? parseInt(runIdInput, 10)
          : undefined;
        if (!collectRunId) {
          core.setFailed('错误：collect-logs 操作需要 run-id 参数');
          return;
        }

        const logFile = await manager.collectWorkflowLogs(collectRunId);
        if (logFile) {
          core.setOutput('log-file', logFile);
          core.info(`✓ 日志已保存到: ${logFile}`);
        } else {
          core.setFailed('无法收集日志');
        }
        break;

      case 'run':
        if (!workflowFile) {
          core.setFailed('错误：run 操作需要 workflow-file 参数');
          return;
        }

        // 解析输入参数
        const runInputs: Record<string, string> = {};
        const runInputKeys = Object.keys(process.env)
          .filter((key) => key.startsWith('INPUT_') && key !== 'INPUT_ACTION')
          .map((key) => key.substring(6).toLowerCase().replace(/_/g, '-'));

        for (const key of runInputKeys) {
          const value = core.getInput(key, { required: false });
          if (value) {
            runInputs[key] = value;
          }
        }

        const runResult = await manager.runWorkflow(workflowFile, {
          ref,
          inputs: Object.keys(runInputs).length > 0 ? runInputs : undefined,
          pollInterval,
        });

        core.setOutput('success', runResult.success.toString());
        if (!runResult.success) {
          core.setFailed('Workflow 执行失败');
        }
        break;

      default:
        core.setFailed(`未知的操作类型: ${action}`);
    }
  } catch (error: any) {
    core.setFailed(`Debug Action 执行失败: ${error.message}`);
  }
}

run();


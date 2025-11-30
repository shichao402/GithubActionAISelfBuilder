/**
 * 发布流水线
 *
 * 核心流程：
 * 1. 下载构建产物
 * 2. 创建 GitHub Release
 */

import { ReleaseBasePipeline } from '../base/release-base-pipeline';
import { PipelineResult } from '../../base-pipeline';
import * as exec from '@actions/exec';
import * as fs from 'fs';
import * as path from 'path';

export class ReleasePipeline extends ReleaseBasePipeline {
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
          buildBranch,
          '--status',
          'success',
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
      this.log('warning', `查询工作流运行失败: ${error.message}`);
      return null;
    }
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
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }

    try {
      await exec.exec('gh', ['run', 'download', runId, '--dir', artifactsDir]);
      this.log('info', `✅ 产物下载完成: ${artifactsDir}`);
      return artifactsDir;
    } catch (error: any) {
      this.log('warning', `下载产物失败: ${error.message}`);
      return null;
    }
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

    // 构建 gh release create 命令
    const args = ['release', 'create', `v${version}`, '--notes', releaseNotes];
    if (files.length > 0) {
      args.push(...files);
    }

    try {
      await exec.exec('gh', args);
      this.log('info', `✅ Release v${version} 创建成功！`);
      return true;
    } catch (error: any) {
      this.log('error', `创建 Release 失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 执行发布逻辑（调用父类的 execute 方法）
   */
  async execute(): Promise<PipelineResult> {
    // 调用父类的 execute，它会调用我们覆盖的方法
    return await super.execute();
  }
}


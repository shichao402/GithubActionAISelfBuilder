/**
 * 版本号递增流水线
 *
 * 从 JSON 文件中读取当前版本号，递增版本号，并保存回文件
 */

import { BasePipeline, PipelineResult } from '../../base-pipeline';
import { createWorkflowConfig } from '../../workflow-config';
import * as fs from 'fs';
import * as path from 'path';

export class VersionBumpPipeline extends BasePipeline {
  /**
   * 定义工作流输入参数
   */
  static getWorkflowInputs() {
    const config = createWorkflowConfig();
    config.addInput('version-file', '版本号文件路径', false, 'package.json');
    config.addInput('version-type', '版本号类型 (major|minor|patch)', false, 'patch');
    config.addInput('commit-changes', '是否提交更改', false, 'true');
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
      'version-file': {
        description: '版本号文件路径',
        required: false,
        default: 'package.json',
      },
      'version-type': {
        description: '版本号类型 (major|minor|patch)',
        required: false,
        default: 'patch',
      },
      'commit-changes': {
        description: '是否提交更改',
        required: false,
        default: 'true',
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
   * 递增版本号
   */
  private bumpVersion(version: string, type: 'major' | 'minor' | 'patch'): string {
    const parts = version.split('.').map(Number);
    if (parts.length !== 3) {
      throw new Error(`无效的版本号格式: ${version}`);
    }

    switch (type) {
      case 'major':
        parts[0]++;
        parts[1] = 0;
        parts[2] = 0;
        break;
      case 'minor':
        parts[1]++;
        parts[2] = 0;
        break;
      case 'patch':
        parts[2]++;
        break;
      default:
        throw new Error(`无效的版本号类型: ${type}`);
    }

    return parts.join('.');
  }

  /**
   * 执行流水线逻辑
   */
  async execute(): Promise<PipelineResult> {
    try {
      // 获取输入参数
      const versionFile = this.getInput('version-file', 'package.json');
      const versionType = this.getInput('version-type', 'patch') as 'major' | 'minor' | 'patch';
      const commitChanges = this.getInput('commit-changes', 'true') === 'true';

      // 验证版本号类型
      if (!['major', 'minor', 'patch'].includes(versionType)) {
        return {
          success: false,
          message: `无效的版本号类型: ${versionType}。必须是 major、minor 或 patch`,
          exitCode: 1,
        };
      }

      // 读取版本号文件
      const filePath = path.join(this.projectRoot, versionFile);
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          message: `版本号文件不存在: ${filePath}`,
          exitCode: 1,
        };
      }

      this.log('info', `读取版本号文件: ${filePath}`);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const jsonData = JSON.parse(fileContent);

      // 获取当前版本号
      let currentVersion: string;
      if (jsonData.version) {
        currentVersion = jsonData.version;
      } else {
        return {
          success: false,
          message: `文件中未找到 version 字段: ${filePath}`,
          exitCode: 1,
        };
      }

      this.log('info', `当前版本号: ${currentVersion}`);

      // 递增版本号
      const newVersion = this.bumpVersion(currentVersion, versionType);
      this.log('info', `新版本号: ${newVersion}`);

      // 更新版本号
      jsonData.version = newVersion;

      // 保存文件
      fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2) + '\n', 'utf8');
      this.log('info', `版本号已更新: ${currentVersion} -> ${newVersion}`);

      // 设置输出
      this.setOutput('old-version', currentVersion);
      this.setOutput('new-version', newVersion);
      this.setOutput('version-file', versionFile);

      // 提交更改（如果需要）
      if (commitChanges) {
        this.log('info', '提交版本号更改...');
        const gitAddSuccess = await this.runCommand(`git add ${versionFile}`);
        if (!gitAddSuccess) {
          this.log('warning', 'git add 失败，但版本号已更新');
        } else {
          const gitCommitSuccess = await this.runCommand(
            `git commit -m "chore: bump version to ${newVersion}"`
          );
          if (!gitCommitSuccess) {
            this.log('warning', 'git commit 失败，但版本号已更新');
          } else {
            this.log('info', '版本号更改已提交');
            this.setOutput('committed', 'true');
          }
        }
      } else {
        this.setOutput('committed', 'false');
      }

      return {
        success: true,
        message: `版本号已从 ${currentVersion} 更新为 ${newVersion}`,
        data: {
          'old-version': currentVersion,
          'new-version': newVersion,
          'version-file': versionFile,
          'version-type': versionType,
        },
        exitCode: 0,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `执行失败: ${error.message}`,
        exitCode: 1,
      };
    }
  }
}


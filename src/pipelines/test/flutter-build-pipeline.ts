/**
 * Flutter Windows 构建流水线
 *
 * 核心流程：
 * 1. 设置 Flutter 环境
 * 2. 构建 flutter-demo 样例工程
 * 3. 保存构建产物
 */

import { BuildPipeline } from '../base/build-pipeline';
import { PipelineResult } from '../../base-pipeline';
import { createWorkflowConfig } from '../../workflow-config';
import * as fs from 'fs';
import * as path from 'path';

export class FlutterBuildPipeline extends BuildPipeline {
  // Flutter 样例工程路径（相对于项目根目录）
  private readonly flutterDemoPath: string;

  constructor(
    inputs: Record<string, any> = {},
    configFile?: string,
    projectRoot?: string
  ) {
    super(inputs, configFile, projectRoot);
    // 确定 Flutter 样例工程路径
    this.flutterDemoPath = path.join(this.projectRoot, 'flutter-demo');
  }

  /**
   * 定义工作流输入参数（继承自 BuildPipeline，无需额外参数）
   */
  static getWorkflowInputs() {
    // 可以覆盖或扩展父类的输入
    return super.getWorkflowInputs();
  }

  /**
   * 定义准备阶段配置
   */
  static getWorkflowSetup() {
    const config = createWorkflowConfig();
    // 设置 Flutter
    config.setupFlutter('3.16.0', 'stable', true);
    config.addSetupStep('Flutter doctor', 'flutter doctor -v');
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
   * 定义运行环境 - Windows
   */
  static getWorkflowRunsOn(): string {
    return 'windows-latest';
  }

  /**
   * 验证输入和前置条件
   */
  protected validate(): boolean {
    // 检查 Flutter 样例工程是否存在
    if (!fs.existsSync(this.flutterDemoPath)) {
      this.log('error', `Flutter 样例工程不存在: ${this.flutterDemoPath}`);
      return false;
    }

    const pubspecPath = path.join(this.flutterDemoPath, 'pubspec.yaml');
    if (!fs.existsSync(pubspecPath)) {
      this.log('error', `pubspec.yaml 文件不存在: ${pubspecPath}`);
      return false;
    }

    return true;
  }

  /**
   * 执行环境设置（覆盖父类方法，添加 Flutter 特定设置）
   */
  protected async setupEnvironment(): Promise<boolean> {
    // Flutter 环境已在 workflow setup 中配置，这里可以添加额外设置
    return true;
  }

  /**
   * 执行构建（覆盖父类方法，实现 Flutter 特定构建）
   */
  protected async performBuild(): Promise<boolean> {
    this.log('info', '='.repeat(60));
    this.log('info', '开始执行 Flutter Windows 构建');
    this.log('info', `构建项目: ${this.flutterDemoPath}`);
    this.log('info', '='.repeat(60));

    const buildMode = 'release';

    // 1. 验证 Flutter 环境
    this.log('info', '验证 Flutter 环境...');
    if (!(await this.runCommand('flutter --version', { cwd: this.flutterDemoPath }))) {
      return false;
    }

    // 2. 获取 Flutter 依赖
    this.log('info', '获取 Flutter 依赖...');
    if (!(await this.runCommand('flutter pub get', { cwd: this.flutterDemoPath }))) {
      return false;
    }

    // 3. 清理之前的构建
    this.log('info', '清理之前的构建...');
    await this.runCommand('flutter clean', { cwd: this.flutterDemoPath });

    // 4. 构建 Windows 应用
    this.log('info', `构建 Windows 应用（模式: ${buildMode}）...`);
    const buildCommand = `flutter build windows --${buildMode}`;
    if (!(await this.runCommand(buildCommand, { cwd: this.flutterDemoPath }))) {
      return false;
    }

    return true;
  }

  /**
   * 处理构建产物（覆盖父类方法，实现 Flutter 特定产物处理）
   */
  protected async processArtifacts(): Promise<string | null> {
    const buildMode = 'release';

    // 查找构建产物
    const buildDirs = [
      path.join(this.flutterDemoPath, 'build', 'windows', 'runner', 'Release'),
      path.join(this.flutterDemoPath, 'build', 'windows', 'x64', 'runner', 'Release'),
    ];

    let buildOutputDir: string | null = null;
    for (const buildDir of buildDirs) {
      if (fs.existsSync(buildDir)) {
        buildOutputDir = buildDir;
        break;
      }
    }

    if (!buildOutputDir) {
      this.log('error', '未找到构建产物目录');
      return null;
    }

    this.log('info', `构建产物目录: ${buildOutputDir}`);

    // 复制产物到 artifacts 目录
    const artifactsDir = path.join(this.projectRoot, 'artifacts', 'flutter-windows');
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }

    // 复制文件
    const copyRecursive = (src: string, dest: string) => {
      const stat = fs.statSync(src);
      if (stat.isDirectory()) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        const files = fs.readdirSync(src);
        for (const file of files) {
          copyRecursive(path.join(src, file), path.join(dest, file));
        }
      } else {
        fs.copyFileSync(src, dest);
        this.log('info', `复制产物: ${path.basename(src)}`);
      }
    };

    const items = fs.readdirSync(buildOutputDir);
    for (const item of items) {
      const srcPath = path.join(buildOutputDir, item);
      const destPath = path.join(artifactsDir, item);
      copyRecursive(srcPath, destPath);
    }

    // 创建构建信息文件
    const infoFile = path.join(artifactsDir, 'build-info.txt');
    fs.writeFileSync(
      infoFile,
      `Project: flutter-demo\nBuild Mode: ${buildMode}\nBuild Time: ${new Date().toISOString()}\n`,
      'utf8'
    );

    this.log('info', `构建产物已保存到: ${artifactsDir}`);
    return artifactsDir;
  }

  /**
   * 执行 Flutter Windows 构建逻辑（调用父类的 execute 方法）
   */
  async execute(): Promise<PipelineResult> {
    // 调用父类的 execute，它会调用我们覆盖的方法
    return await super.execute();
  }
}


/**
 * 脚手架工具
 *
 * 根据流水线脚本类及其配置，自动生成或更新 GitHub Action 工作流 YAML 文件。
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { BasePipeline } from './base-pipeline';
import { WorkflowConfig, WorkflowConfigDict } from './workflow-config';
import { getPipelineRegistry, type PipelineMetadata } from './pipeline-registry';

/**
 * 扩展的 Pipeline 元数据（用于脚手架生成）
 */
export interface ScaffoldPipelineMetadata {
  name: string;
  description: string;
  module: string;
  config: WorkflowConfigDict;
}

interface ScaffoldOptions {
  projectRoot?: string;
  configFile?: string;
  workflowsDir?: string;
  pipelinesDir?: string;
}

/**
 * 脚手架生成器
 */
export class ScaffoldGenerator {
  private projectRoot: string;
  private workflowsDir: string;
  private pipelinesDir: string;
  private config: any;

  constructor(options: ScaffoldOptions = {}) {
    // 确定项目根目录
    this.projectRoot = options.projectRoot || this.detectProjectRoot();

    // 加载项目配置
    this.config = this.loadProjectConfig(options.configFile);

    // 确定目录
    this.workflowsDir = path.join(
      this.projectRoot,
      this.config?.scaffold?.workflows_dir || '.github/workflows'
    );
    this.pipelinesDir = path.join(
      this.projectRoot,
      this.config?.pipelines?.scripts_dir || 'src/pipelines'
    );

    // 确保目录存在
    this.ensureDirectoryExists(this.workflowsDir);
  }

  /**
   * 检测项目根目录
   */
  private detectProjectRoot(): string {
    let current = process.cwd();
    while (current !== path.dirname(current)) {
      if (fs.existsSync(path.join(current, 'package.json'))) {
        return current;
      }
      current = path.dirname(current);
    }
    return process.cwd();
  }

  /**
   * 加载项目配置
   * 
   * 配置加载优先级：
   * 1. 如果指定了 configFile，直接使用
   * 2. 如果是本项目（存在 config/ProjectOnly/config.yaml），优先使用 ProjectOnly 配置
   * 3. 否则使用根目录的 config.yaml（父项目使用）
   */
  private loadProjectConfig(configFile?: string): any {
    let config: any = {};
    
    // 如果指定了配置文件，直接使用
    if (configFile) {
      const configPath = path.resolve(configFile);
      if (fs.existsSync(configPath)) {
        try {
          return yaml.load(fs.readFileSync(configPath, 'utf8')) || {};
        } catch (e) {
          console.warn(`加载指定配置文件失败: ${e}`);
          return {};
        }
      }
      return {};
    }

    // 检查是否是本项目（存在 config/ProjectOnly/config.yaml）
    const projectOnlyConfigPath = path.join(this.projectRoot, 'config', 'ProjectOnly', 'config.yaml');
    const isThisProject = fs.existsSync(projectOnlyConfigPath);

    if (isThisProject) {
      // 本项目：优先使用 ProjectOnly 配置
      try {
        const projectOnlyConfig = yaml.load(fs.readFileSync(projectOnlyConfigPath, 'utf8')) || {};
        config = { ...config, ...projectOnlyConfig };
      } catch (e) {
        console.warn(`加载 ProjectOnly 配置文件失败: ${e}`);
      }
    } else {
      // 父项目：使用根目录的 config.yaml
      const mainConfigPath = path.join(this.projectRoot, 'config.yaml');
      if (fs.existsSync(mainConfigPath)) {
        try {
          const mainConfig = yaml.load(fs.readFileSync(mainConfigPath, 'utf8')) || {};
          config = { ...config, ...mainConfig };
        } catch (e) {
          console.warn(`加载主配置文件失败: ${e}`);
        }
      }
    }

    return config;
  }

  /**
   * 深度合并配置对象
   */
  private mergeConfig(base: any, override: any): any {
    const result = { ...base };
    for (const key in override) {
      if (override.hasOwnProperty(key)) {
        if (
          typeof override[key] === 'object' &&
          override[key] !== null &&
          !Array.isArray(override[key]) &&
          typeof base[key] === 'object' &&
          base[key] !== null &&
          !Array.isArray(base[key])
        ) {
          result[key] = this.mergeConfig(base[key], override[key]);
        } else {
          result[key] = override[key];
        }
      }
    }
    return result;
  }

  /**
   * 确保目录存在
   */
  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 加载 Pipeline 类
   *
   * 优先从 PipelineRegistry 查找，如果未找到则回退到文件系统查找（保持向后兼容）。
   */
  async loadPipelineClass(className: string): Promise<typeof BasePipeline> {
    const registry = getPipelineRegistry();

    // 优先从 Registry 查找
    const PipelineClass = registry.get(className);
    if (PipelineClass) {
      return PipelineClass;
    }

    // 如果 Registry 中没有，回退到文件系统查找（向后兼容）
    const includeProjectOnly = this.shouldIncludeProjectOnly();
    const pipelineFiles = this.findPipelineFiles(includeProjectOnly);

    for (const file of pipelineFiles) {
      try {
        // 转换为绝对路径
        const absolutePath = path.isAbsolute(file)
          ? file
          : path.join(this.projectRoot, file);
        
        // 对于 TypeScript 文件，需要编译后导入
        // 由于我们使用 ts-node，可以直接导入 .ts 文件
        const modulePath = absolutePath.endsWith('.ts') 
          ? absolutePath 
          : `${absolutePath}.ts`;
        
        // 动态导入模块
        const module = await import(modulePath);
        if (module[className]) {
          const PipelineClass = module[className];
          // 验证是否是 BasePipeline 的子类
          if (
            typeof PipelineClass === 'function' &&
            (PipelineClass.prototype instanceof BasePipeline || 
             BasePipeline.isPrototypeOf(PipelineClass))
          ) {
            // 自动注册到 Registry，以便下次使用
            const relativeModulePath = path.relative(
              path.join(this.projectRoot, 'src', 'pipelines'),
              file.replace(/\.ts$/, '')
            ).replace(/\\/g, '/');
            registry.register(className, PipelineClass, relativeModulePath);
            return PipelineClass;
          }
        }
      } catch (e: any) {
        // 输出错误信息以便调试
        console.debug(`加载 ${file} 失败: ${e.message}`);
        // 忽略错误，继续尝试下一个文件
        continue;
      }
    }

    throw new Error(`未找到流水线类: ${className}`);
  }

  /**
   * 判断是否应该包含 ProjectOnly 目录
   * 从配置文件读取 pipelines.include_project_only 配置
   */
  private shouldIncludeProjectOnly(): boolean {
    // 从配置读取
    if (this.config?.pipelines?.include_project_only !== undefined) {
      return this.config.pipelines.include_project_only === true;
    }
    
    // 默认：如果在本项目目录中，包含 ProjectOnly
    const isInProjectRoot = this.projectRoot === process.cwd() || 
                            this.projectRoot.includes('GithubActionAISelfBuilder');
    return isInProjectRoot;
  }

  /**
   * 查找 Pipeline 文件（递归查找所有子目录）
   * @param includeProjectOnly 是否包含 ProjectOnly 目录（仅用于本项目）
   */
  private findPipelineFiles(includeProjectOnly: boolean = false): string[] {
    const files: string[] = [];
    const pipelinesPath = this.pipelinesDir;

    if (!fs.existsSync(pipelinesPath)) {
      return files;
    }

    const findFilesRecursive = (dir: string): void => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          // 跳过 ProjectOnly 目录（除非明确指定包含）
          if (entry.name === 'ProjectOnly' && !includeProjectOnly) {
            continue;
          }
          // 递归查找子目录
          findFilesRecursive(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.startsWith('_')) {
          // 保留完整路径，包括 .ts 扩展名，以便 ts-node 可以处理
          files.push(fullPath);
        }
      }
    };

    findFilesRecursive(pipelinesPath);
    return files;
  }

  /**
   * 检查 Pipeline 类是否继承自指定的基类（通过原型链检查）
   */
  private isSubclassOf(PipelineClass: typeof BasePipeline, baseClassName: string): boolean {
    let current: any = PipelineClass;
    while (current && current !== BasePipeline) {
      if (current.name === baseClassName) {
        return true;
      }
      current = Object.getPrototypeOf(current);
    }
    return false;
  }

  /**
   * 分析 Pipeline 类
   */
  analyzePipeline(PipelineClass: typeof BasePipeline): ScaffoldPipelineMetadata {
    const className = PipelineClass.name;
    const description = PipelineClass.prototype.constructor.toString().match(/\/\*\*([\s\S]*?)\*\//)?.[1] || `${className} pipeline`;

    // 从静态方法获取配置
    const inputs = PipelineClass.getWorkflowInputs();
    const setup = PipelineClass.getWorkflowSetup();
    const triggers = PipelineClass.getWorkflowTriggers();
    const env = PipelineClass.getWorkflowEnv();
    const runsOn = PipelineClass.getWorkflowRunsOn();
    const pythonVersion = PipelineClass.getWorkflowPythonVersion();
    const dependencies = PipelineClass.getWorkflowDependencies();
    const jobs = PipelineClass.getWorkflowJobs();

    const config: WorkflowConfigDict = {};
    if (Object.keys(inputs).length > 0) {
      config.inputs = inputs;
    }
    if (Object.keys(setup).length > 0) {
      config.setup = setup;
    }
    if (Object.keys(triggers).length > 0) {
      config.triggers = triggers;
    }
    if (Object.keys(env).length > 0) {
      config.env = env;
    }
    if (runsOn !== 'ubuntu-latest') {
      config.runsOn = runsOn;
    }
    if (pythonVersion !== '3.9') {
      config.pythonVersion = pythonVersion;
    }
    if (dependencies.length > 0) {
      config.dependencies = dependencies;
    }
    if (Object.keys(jobs).length > 0) {
      config.jobs = jobs;
    }

    // 优先从 Registry 获取模块路径
    const registry = getPipelineRegistry();
    const registryMetadata = registry.getMetadata(className);
    let modulePath: string;
    
    if (registryMetadata?.modulePath) {
      // 使用 Registry 中保存的模块路径
      modulePath = registryMetadata.modulePath;
    } else {
      // 如果 Registry 中没有，从文件路径推断
      const includeProjectOnly = this.shouldIncludeProjectOnly();
      const pipelineFiles = this.findPipelineFiles(includeProjectOnly);
      modulePath = className.toLowerCase().replace('pipeline', '');
      
      // 尝试从文件路径找到匹配的文件
      for (const file of pipelineFiles) {
        const fileName = path.basename(file, '.ts');
        // 更精确的匹配：检查文件名是否包含类名（去掉 Pipeline 后缀）
        const classNameBase = className.replace(/Pipeline$/i, '').toLowerCase();
        const fileNameBase = fileName.replace(/-/g, '').toLowerCase();
        
        if (fileNameBase.includes(classNameBase) || classNameBase.includes(fileNameBase.replace(/-/g, ''))) {
          // 获取相对于 src/pipelines 的路径，保留原始文件名
          const relativePath = path.relative(
            path.join(this.projectRoot, 'src', 'pipelines'),
            file.replace(/\.ts$/, '')
          );
          modulePath = relativePath.replace(/\\/g, '/');
          break;
        }
      }
    }

    return {
      name: className,
      description,
      module: modulePath,
      config,
    };
  }

  /**
   * 生成工作流 YAML
   */
  generateWorkflowYAML(
    metadata: ScaffoldPipelineMetadata,
    config: WorkflowConfigDict
  ): any {
    // 确定工作流名称
    const workflowName = metadata.name
      .replace('Pipeline', '')
      .replace(/([A-Z])/g, ' $1')
      .trim();

    // 合并配置
    const pipelineConfig = { ...metadata.config, ...config };

    // 确定触发条件
    const triggers = pipelineConfig.triggers || {
      push: { branches: ['main', 'master'] },
      pull_request: { branches: ['main', 'master'] },
    };

    // 确定运行环境
    const runsOn = pipelineConfig.runsOn || 'ubuntu-latest';

    // 构建工作流
    const workflow: any = {
      name: workflowName,
      on: triggers,
      jobs: {},
    };

    // 如果配置了多个 jobs，生成多个 jobs
    if (pipelineConfig.jobs && Object.keys(pipelineConfig.jobs).length > 0) {
      // 生成多个 jobs
      for (const [jobName, jobConfig] of Object.entries(pipelineConfig.jobs)) {
        const job = jobConfig as any;
        const jobPipelineClass = job.pipeline;
        
        // 为每个 job 生成步骤（简化处理，使用相同的 Pipeline 类）
        const jobSteps = this.generateSteps(metadata, pipelineConfig);
        
        const jobDef: any = {
          'runs-on': job.runsOn || runsOn,
          steps: jobSteps,
        };
        
        if (job.needs && job.needs.length > 0) {
          jobDef.needs = job.needs;
        }
        
        if (job.if) {
          jobDef.if = job.if;
        }
        
        workflow.jobs[jobName] = jobDef;
      }
    } else {
      // 单个 job（默认行为）
      const steps = this.generateSteps(metadata, pipelineConfig);
      workflow.jobs[this.getJobName(metadata.name)] = {
        'runs-on': runsOn,
        steps,
      };
    }

    return workflow;
  }

  /**
   * 生成步骤
   * 
   * @param metadata Pipeline 元数据
   * @param config 工作流配置
   * @param PipelineClass Pipeline 类（用于检查继承关系）
   */
  private generateSteps(
    metadata: ScaffoldPipelineMetadata,
    config: WorkflowConfigDict,
    PipelineClass?: typeof BasePipeline
  ): any[] {
    const steps: any[] = [];

    // 1. Checkout
    steps.push({
      name: 'Checkout code',
      uses: 'actions/checkout@v3',
    });

    // 2. 设置 Node.js（TypeScript 需要）
    steps.push({
      name: 'Set up Node.js',
      uses: 'actions/setup-node@v3',
      with: {
        'node-version': '18',
        cache: 'npm',
      },
    });

    // 3. 安装依赖
    steps.push({
      name: 'Install dependencies',
      run: 'npm ci',
    });

    // 4. 构建 TypeScript
    steps.push({
      name: 'Build TypeScript',
      run: 'npm run build',
    });

    // 5. 环境设置步骤（避免重复添加 Node.js setup）
    if (config.setup) {
      // 添加 setup actions（过滤掉已添加的 Node.js setup）
      if (config.setup.actions) {
        const setupActions = config.setup.actions.filter(
          (action: any) => !action.uses?.includes('setup-node')
        );
        steps.push(...setupActions);
      }

      // 添加 setup steps
      if (config.setup.steps) {
        steps.push(...config.setup.steps);
      }
    }

    // 6. 运行 Pipeline（直接使用 node 运行编译后的代码）
    // 构建模块路径 - metadata.module 已经是相对于 src/pipelines 的路径（不含 .ts 扩展名）
    const modulePath = `./dist/src/pipelines/${metadata.module}`;
    
    // 构建环境变量 - Pipeline 会从环境变量读取输入（通过 BasePipeline 的 getInput 方法）
    const envVars: Record<string, string> = {};
    if (config.inputs) {
      for (const [key, inputConfig] of Object.entries(config.inputs)) {
        const envKey = `INPUT_${key.toUpperCase().replace(/-/g, '_')}`;
        const defaultValue = (inputConfig as any).default !== undefined 
          ? String((inputConfig as any).default)
          : '';
        // 使用 GitHub Actions 的 inputs 上下文
        envVars[envKey] = `\${{ inputs.${key} || '${defaultValue}' }}`;
      }
    }

    // Pipeline 构造函数不传参数，会自动从环境变量读取（通过 @actions/core 的 getInput）
    const pipelineStep: any = {
      name: `Run ${metadata.name}`,
      id: 'pipeline',
      run: `node -e "const { ${metadata.name} } = require('${modulePath}'); const pipeline = new ${metadata.name}(); pipeline.run().then(result => { if (!result.success) { process.exit(result.exitCode || 1); } }).catch(err => { console.error(err); process.exit(1); });"`,
      env: envVars,
    };

    steps.push(pipelineStep);

    // 7. 上传产物（如果需要）
    // 检查条件：
    // 1. setup.steps 中包含 'artifact' 关键字
    // 2. Pipeline 名称包含 'build'（构建类 Pipeline 通常需要上传产物）
    // 3. Pipeline 继承自 BuildPipeline（通过检查原型链）
    // 4. 或者 Pipeline 设置了 artifact-path 输出
    const hasArtifactStep = config.setup?.steps?.some((s: any) => s.name?.includes('artifact'));
    
    // 检查是否继承自 BuildPipeline（需要在 analyzePipeline 中检查）
    // 这里通过类名简单判断，实际应该在 analyzePipeline 中检查
    const isBuildPipeline = metadata.name.toLowerCase().includes('build');
    const hasArtifactOutput = config.inputs && Object.keys(config.inputs).some(key => 
      key.toLowerCase().includes('artifact') || key.toLowerCase().includes('output')
    );
    
    if (hasArtifactStep || isBuildPipeline || hasArtifactOutput) {
      // 确定产物路径和名称
      const artifactName = metadata.name.toLowerCase().replace('pipeline', '').replace(/\s+/g, '-') + '-artifacts';
      const artifactPath = 'artifacts/**';
      
      steps.push({
        name: 'Upload artifacts',
        uses: 'actions/upload-artifact@v4',
        if: 'success()',
        with: {
          name: artifactName,
          path: artifactPath,
          'retention-days': 30,
        },
      });
    }

    return steps;
  }

  /**
   * 获取 Job 名称
   */
  private getJobName(className: string): string {
    return className
      .replace('Pipeline', '')
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .substring(1);
  }

  /**
   * 生成或更新工作流文件
   */
  async generate(
    pipelineClassName: string,
    outputPath?: string,
    update: boolean = false
  ): Promise<string> {
    // 加载 Pipeline 类
    const PipelineClass = await this.loadPipelineClass(pipelineClassName);

    // 分析 Pipeline
    const metadata = this.analyzePipeline(PipelineClass);

    // 生成 YAML
    const workflow = this.generateWorkflowYAML(metadata, metadata.config);

    // 确定输出路径
    const outputFilePath = outputPath
      ? path.resolve(outputPath)
      : path.join(
          this.workflowsDir,
          `${metadata.name.toLowerCase().replace('pipeline', '')}.yml`
        );

    // 检查文件是否存在
    if (fs.existsSync(outputFilePath) && !update) {
      throw new Error(
        `文件已存在: ${outputFilePath}。使用 --update 参数来更新文件。`
      );
    }

    // 写入文件
    this.ensureDirectoryExists(path.dirname(outputFilePath));
    let yamlContent = yaml.dump(workflow, {
      lineWidth: 1000,
      noRefs: true,
      quotingType: '"',
      skipInvalid: false,
      sortKeys: false,
    });

    // 修复 YAML 格式问题：移除 "on" 关键字的引号
    yamlContent = yamlContent.replace(/^"on":/gm, 'on:');

    fs.writeFileSync(outputFilePath, yamlContent, 'utf8');

    return outputFilePath;
  }
}

/**
 * 命令行入口
 */
export async function main() {
  const args = process.argv.slice(2);
  const pipelineIndex = args.indexOf('--pipeline');
  const outputIndex = args.indexOf('--output');
  const updateIndex = args.indexOf('--update');

  if (pipelineIndex === -1 || !args[pipelineIndex + 1]) {
    console.error('错误: 必须指定 --pipeline 参数');
    process.exit(1);
  }

  const pipelineClassName = args[pipelineIndex + 1];
  const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : undefined;
  const update = updateIndex !== -1;

  try {
    const generator = new ScaffoldGenerator();
    const outputFilePath = await generator.generate(
      pipelineClassName,
      outputPath,
      update
    );
    console.log(`✓ 成功生成工作流文件: ${outputFilePath}`);
  } catch (error: any) {
    console.error(`✗ 错误: ${error.message}`);
    process.exit(1);
  }
}

// 如果直接运行
if (require.main === module) {
  main();
}


/**
 * Pipeline 注册表
 *
 * 管理 Pipeline 类的注册和查找，解耦 ScaffoldGenerator 与文件系统操作。
 * 提供统一的 Pipeline 类管理接口，提高可测试性和可维护性。
 */

import { BasePipeline } from './base-pipeline';

/**
 * Pipeline 元数据
 */
export interface PipelineMetadata {
  name: string;
  className: string;
  PipelineClass: typeof BasePipeline;
  modulePath?: string;
}

/**
 * Pipeline 注册表
 */
export class PipelineRegistry {
  private static instance: PipelineRegistry;
  private pipelines: Map<string, PipelineMetadata> = new Map();

  private constructor() {
    // 单例模式
  }

  /**
   * 获取注册表实例（单例）
   */
  static getInstance(): PipelineRegistry {
    if (!PipelineRegistry.instance) {
      PipelineRegistry.instance = new PipelineRegistry();
    }
    return PipelineRegistry.instance;
  }

  /**
   * 注册 Pipeline 类
   *
   * @param className Pipeline 类名
   * @param PipelineClass Pipeline 类
   * @param modulePath 模块路径（可选）
   */
  register(
    className: string,
    PipelineClass: typeof BasePipeline,
    modulePath?: string
  ): void {
    // 验证是否是 BasePipeline 的子类
    if (
      typeof PipelineClass !== 'function' ||
      !(PipelineClass.prototype instanceof BasePipeline)
    ) {
      throw new Error(
        `Pipeline 类 ${className} 必须继承自 BasePipeline`
      );
    }

    const metadata: PipelineMetadata = {
      name: className,
      className,
      PipelineClass,
      modulePath,
    };

    this.pipelines.set(className, metadata);
  }

  /**
   * 根据类名获取 Pipeline 类
   *
   * @param className Pipeline 类名
   * @returns Pipeline 类，如果不存在则返回 undefined
   */
  get(className: string): typeof BasePipeline | undefined {
    const metadata = this.pipelines.get(className);
    return metadata?.PipelineClass;
  }

  /**
   * 根据类名获取 Pipeline 元数据
   *
   * @param className Pipeline 类名
   * @returns Pipeline 元数据，如果不存在则返回 undefined
   */
  getMetadata(className: string): PipelineMetadata | undefined {
    return this.pipelines.get(className);
  }

  /**
   * 检查 Pipeline 是否已注册
   *
   * @param className Pipeline 类名
   * @returns 是否已注册
   */
  has(className: string): boolean {
    return this.pipelines.has(className);
  }

  /**
   * 获取所有已注册的 Pipeline 类名
   *
   * @returns Pipeline 类名数组
   */
  getAllNames(): string[] {
    return Array.from(this.pipelines.keys());
  }

  /**
   * 获取所有已注册的 Pipeline 元数据
   *
   * @returns Pipeline 元数据数组
   */
  getAllMetadata(): PipelineMetadata[] {
    return Array.from(this.pipelines.values());
  }

  /**
   * 清空注册表（主要用于测试）
   */
  clear(): void {
    this.pipelines.clear();
  }

  /**
   * 批量注册 Pipeline 类
   *
   * @param registrations 注册信息数组
   */
  registerBatch(
    registrations: Array<{
      className: string;
      PipelineClass: typeof BasePipeline;
      modulePath?: string;
    }>
  ): void {
    for (const { className, PipelineClass, modulePath } of registrations) {
      this.register(className, PipelineClass, modulePath);
    }
  }
}

/**
 * 获取全局 Pipeline 注册表实例
 */
export function getPipelineRegistry(): PipelineRegistry {
  return PipelineRegistry.getInstance();
}


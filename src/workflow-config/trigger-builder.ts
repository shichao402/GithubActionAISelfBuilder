/**
 * 触发条件构建器
 *
 * 负责构建工作流的触发条件配置。
 */

import type { TriggerConfig, InputConfig } from '../types/workflow-types';

export class TriggerBuilder {
  private _triggers: TriggerConfig = {};

  /**
   * 添加 push 触发条件
   */
  onPush(branches: string[] | string = ['main', 'master']): this {
    this._triggers.push = {
      branches: Array.isArray(branches) ? branches : [branches],
    };
    return this;
  }

  /**
   * 添加 pull_request 触发条件
   */
  onPullRequest(branches: string[] | string = ['main', 'master']): this {
    this._triggers.pull_request = {
      branches: Array.isArray(branches) ? branches : [branches],
    };
    return this;
  }

  /**
   * 添加 release 触发条件
   */
  onRelease(types: string[] | string = ['published']): this {
    this._triggers.release = {
      types: Array.isArray(types) ? types : [types],
    };
    return this;
  }

  /**
   * 添加 workflow_dispatch 触发条件
   */
  onWorkflowDispatch(inputs?: Record<string, InputConfig>): this {
    this._triggers.workflow_dispatch = {};
    if (inputs) {
      this._triggers.workflow_dispatch.inputs = inputs;
    }
    return this;
  }

  /**
   * 添加 schedule 触发条件
   */
  onSchedule(cron: string): this {
    if (!this._triggers.schedule) {
      this._triggers.schedule = [];
    }
    this._triggers.schedule.push({ cron });
    return this;
  }

  /**
   * 构建 TriggerConfig
   */
  build(): TriggerConfig {
    return Object.keys(this._triggers).length > 0 ? { ...this._triggers } : {};
  }

  /**
   * 获取当前触发配置
   */
  getTriggers(): TriggerConfig {
    return { ...this._triggers };
  }
}


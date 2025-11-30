/**
 * 环境设置构建器
 *
 * 负责构建工作流的环境设置配置，包括 Actions、Steps 和缓存。
 */

import type { SetupAction, SetupStep, CacheConfig, SetupConfig } from '../types/workflow-types';

export class SetupBuilder {
  private _actions: SetupAction[] = [];
  private _steps: SetupStep[] = [];
  private _caches: CacheConfig[] = [];
  private _pythonVersion?: string;

  /**
   * 设置 Python 环境
   */
  setupPython(version: string = '3.9', cache?: string): this {
    const action: SetupAction = {
      name: 'Set up Python',
      uses: 'actions/setup-python@v4',
      with: {
        'python-version': version,
      },
    };
    if (cache) {
      action.with = action.with || {};
      action.with.cache = cache;
    }
    this._actions.push(action);
    this._pythonVersion = version;
    return this;
  }

  /**
   * 设置 Node.js 环境
   */
  setupNode(version: string = '18', cache?: string): this {
    const action: SetupAction = {
      name: 'Set up Node.js',
      uses: 'actions/setup-node@v3',
      with: {
        'node-version': version,
      },
    };
    if (cache) {
      action.with = action.with || {};
      action.with.cache = cache;
    }
    this._actions.push(action);
    return this;
  }

  /**
   * 设置 Java 环境
   */
  setupJava(
    version: string = '17',
    distribution: string = 'temurin',
    cache?: string
  ): this {
    const action: SetupAction = {
      name: 'Set up Java',
      uses: 'actions/setup-java@v3',
      with: {
        distribution,
        'java-version': version,
      },
    };
    if (cache) {
      action.with = action.with || {};
      action.with.cache = cache;
    }
    this._actions.push(action);
    return this;
  }

  /**
   * 设置 Flutter 环境
   */
  setupFlutter(
    version: string = '3.16.0',
    channel: string = 'stable',
    cache: boolean = true
  ): this {
    this._actions.push({
      name: 'Set up Flutter',
      uses: 'subosito/flutter-action@v2',
      with: {
        'flutter-version': version,
        channel,
        cache,
      },
    });
    return this;
  }

  /**
   * 添加自定义设置 Action
   */
  addAction(name: string, uses: string, withParams?: Record<string, any>): this {
    const action: SetupAction = {
      name,
      uses,
    };
    if (withParams) {
      action.with = withParams;
    }
    this._actions.push(action);
    return this;
  }

  /**
   * 添加设置步骤
   */
  addStep(name: string, run: string): this {
    this._steps.push({ name, run });
    return this;
  }

  /**
   * 添加 pip 缓存
   */
  cachePip(keyFile: string = '**/requirements.txt'): this {
    this._caches.push({
      name: 'pip-cache',
      path: '~/.cache/pip',
      key: `\${{\${ runner.os }}}}-pip-\${{\${ hashFiles('${keyFile}') }}}`,
      restoreKeys: ['${{\${ runner.os }}}}-pip-'],
    });
    return this;
  }

  /**
   * 添加 npm 缓存
   */
  cacheNpm(keyFile: string = '**/package-lock.json'): this {
    this._caches.push({
      name: 'npm-cache',
      path: '~/.npm',
      key: `\${{\${ runner.os }}}}-npm-\${{\${ hashFiles('${keyFile}') }}}`,
      restoreKeys: ['${{\${ runner.os }}}}-npm-'],
    });
    return this;
  }

  /**
   * 添加 Gradle 缓存
   */
  cacheGradle(keyFiles: string[] = ['**/*.gradle*', '**/gradle-wrapper.properties']): this {
    const keyFilesStr = keyFiles.map(f => `'${f}'`).join(', ');
    this._caches.push({
      name: 'gradle-cache',
      path: '~/.gradle/caches',
      key: `\${{\${ runner.os }}}}-gradle-\${{\${ hashFiles(${keyFilesStr}) }}}`,
      restoreKeys: ['${{\${ runner.os }}}}-gradle-'],
    });
    return this;
  }

  /**
   * 添加自定义缓存
   */
  addCache(
    name: string,
    cachePath: string,
    key: string,
    restoreKeys?: string[]
  ): this {
    const cache: CacheConfig = {
      name,
      path: cachePath,
      key,
    };
    if (restoreKeys) {
      cache.restoreKeys = restoreKeys;
    }
    this._caches.push(cache);
    return this;
  }

  /**
   * 构建 SetupConfig
   */
  build(): SetupConfig {
    const config: SetupConfig = {};
    
    if (this._actions.length > 0) {
      config.actions = this._actions;
    }
    if (this._caches.length > 0) {
      config.caches = this._caches;
    }
    if (this._steps.length > 0) {
      config.steps = this._steps;
    }

    return Object.keys(config).length > 0 ? config : {};
  }

  /**
   * 获取 Python 版本（如果设置了）
   */
  getPythonVersion(): string | undefined {
    return this._pythonVersion;
  }

  /**
   * 获取所有 Actions
   */
  getActions(): SetupAction[] {
    return [...this._actions];
  }

  /**
   * 获取所有 Caches
   */
  getCaches(): CacheConfig[] {
    return [...this._caches];
  }

  /**
   * 获取所有 Steps
   */
  getSteps(): SetupStep[] {
    return [...this._steps];
  }
}


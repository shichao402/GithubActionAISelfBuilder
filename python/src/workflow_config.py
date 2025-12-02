"""
工作流配置构建器

提供简化的 API 来定义工作流配置，避免直接使用原始字典。
"""

from typing import Dict, Optional, Any, List, Union
# 使用绝对导入避免与目录名冲突
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from workflow_config.setup_builder import SetupBuilder
from workflow_config.trigger_builder import TriggerBuilder


class WorkflowConfig:
    """工作流配置构建器
    
    使用组合模式，内部使用子构建器（SetupBuilder、TriggerBuilder），
    但对外保持向后兼容的 API。
    """
    
    def __init__(self) -> None:
        self._inputs: Dict[str, Any] = {}
        self._setup_builder: SetupBuilder = SetupBuilder()
        self._trigger_builder: TriggerBuilder = TriggerBuilder()
        self._env: Dict[str, str] = {}
        self._runs_on: str = "ubuntu-latest"
        self._python_version: str = "3.11"
        self._dependencies: List[str] = []
        self._jobs: Dict[str, Any] = {}
    
    # ========== 输入参数 ==========
    
    def add_input(
        self,
        name: str,
        description: str,
        required: bool = False,
        default_value: Any = None
    ) -> "WorkflowConfig":
        """添加输入参数"""
        self._inputs[name] = {
            "description": description,
            "required": required,
            "default": default_value,
        }
        return self
    
    # ========== 环境设置 ==========
    
    def setup_python(self, version: str = "3.11", cache: Optional[str] = None) -> "WorkflowConfig":
        """设置 Python 环境"""
        self._setup_builder.setup_python(version, cache)
        self._python_version = version
        return self
    
    def setup_node(self, version: str = "18", cache: Optional[str] = None) -> "WorkflowConfig":
        """设置 Node.js 环境"""
        self._setup_builder.setup_node(version, cache)
        return self
    
    def setup_java(
        self,
        version: str = "17",
        distribution: str = "temurin",
        cache: Optional[str] = None
    ) -> "WorkflowConfig":
        """设置 Java 环境"""
        self._setup_builder.setup_java(version, distribution, cache)
        return self
    
    def setup_flutter(
        self,
        version: str = "3.16.0",
        channel: str = "stable",
        cache: bool = True
    ) -> "WorkflowConfig":
        """设置 Flutter 环境"""
        self._setup_builder.setup_flutter(version, channel, cache)
        return self
    
    def add_setup_action(
        self,
        name: str,
        uses: str,
        with_params: Optional[Dict[str, Any]] = None
    ) -> "WorkflowConfig":
        """添加自定义设置 Action"""
        self._setup_builder.add_action(name, uses, with_params)
        return self
    
    def add_setup_step(self, name: str, run: str) -> "WorkflowConfig":
        """添加自定义设置步骤"""
        self._setup_builder.add_step(name, run)
        return self
    
    # ========== 缓存 ==========
    
    def cache_pip(self, key_file: str = "**/requirements.txt") -> "WorkflowConfig":
        """添加 pip 缓存"""
        self._setup_builder.cache_pip(key_file)
        return self
    
    def cache_npm(self, key_file: str = "**/package-lock.json") -> "WorkflowConfig":
        """添加 npm 缓存"""
        self._setup_builder.cache_npm(key_file)
        return self
    
    def cache_gradle(
        self,
        key_files: List[str] = None
    ) -> "WorkflowConfig":
        """添加 Gradle 缓存"""
        if key_files is None:
            key_files = ["**/*.gradle*", "**/gradle-wrapper.properties"]
        self._setup_builder.cache_gradle(key_files)
        return self
    
    def add_cache(
        self,
        name: str,
        cache_path: str,
        key: str,
        restore_keys: Optional[List[str]] = None
    ) -> "WorkflowConfig":
        """添加自定义缓存"""
        self._setup_builder.add_cache(name, cache_path, key, restore_keys)
        return self
    
    # ========== 触发条件 ==========
    
    def on_push(
        self,
        branches: Union[List[str], str] = None
    ) -> "WorkflowConfig":
        """添加 push 触发条件"""
        if branches is None:
            branches = ["main", "master"]
        self._trigger_builder.on_push(branches)
        return self
    
    def on_pull_request(
        self,
        branches: Union[List[str], str] = None
    ) -> "WorkflowConfig":
        """添加 pull_request 触发条件"""
        if branches is None:
            branches = ["main", "master"]
        self._trigger_builder.on_pull_request(branches)
        return self
    
    def on_release(
        self,
        types: Union[List[str], str] = None
    ) -> "WorkflowConfig":
        """添加 release 触发条件"""
        if types is None:
            types = ["published"]
        self._trigger_builder.on_release(types)
        return self
    
    def on_workflow_dispatch(
        self,
        inputs: Optional[Dict[str, Any]] = None
    ) -> "WorkflowConfig":
        """添加 workflow_dispatch 触发条件"""
        self._trigger_builder.on_workflow_dispatch(inputs)
        return self
    
    def on_schedule(self, cron: str) -> "WorkflowConfig":
        """添加 schedule 触发条件"""
        self._trigger_builder.on_schedule(cron)
        return self
    
    # ========== 环境变量 ==========
    
    def set_env(self, key: str, value: str) -> "WorkflowConfig":
        """设置环境变量"""
        self._env[key] = value
        return self
    
    def set_runs_on(self, runs_on: str) -> "WorkflowConfig":
        """设置运行环境"""
        self._runs_on = runs_on
        return self
    
    # ========== 依赖关系 ==========
    
    def depends_on(self, *pipeline_classes: str) -> "WorkflowConfig":
        """添加依赖的其他流水线"""
        self._dependencies.extend(pipeline_classes)
        return self
    
    # ========== 组合工作流 ==========
    
    def add_job(
        self,
        name: str,
        pipeline_class: str,
        inputs: Optional[Dict[str, Any]] = None,
        needs: Optional[List[str]] = None,
        runs_on: Optional[str] = None,
        if_condition: Optional[str] = None
    ) -> "WorkflowConfig":
        """添加工作流 job"""
        job: Dict[str, Any] = {
            "pipeline": pipeline_class,
        }
        if inputs:
            job["inputs"] = inputs
        if needs:
            job["needs"] = needs
        if runs_on:
            job["runsOn"] = runs_on
        if if_condition:
            job["if"] = if_condition
        self._jobs[name] = job
        return self
    
    def add_build_job(
        self,
        name: str,
        pipeline_class: str,
        inputs: Optional[Dict[str, Any]] = None,
        needs: Optional[List[str]] = None,
        runs_on: Optional[str] = None
    ) -> "WorkflowConfig":
        """添加构建 job"""
        return self.add_job(name, pipeline_class, inputs, needs, runs_on)
    
    def add_test_job(
        self,
        name: str,
        pipeline_class: str,
        inputs: Optional[Dict[str, Any]] = None,
        needs: Optional[List[str]] = None,
        runs_on: Optional[str] = None
    ) -> "WorkflowConfig":
        """添加测试 job"""
        return self.add_job(name, pipeline_class, inputs, needs, runs_on)
    
    def add_release_job(
        self,
        name: str,
        pipeline_class: str,
        inputs: Optional[Dict[str, Any]] = None,
        needs: Optional[List[str]] = None,
        runs_on: Optional[str] = None
    ) -> "WorkflowConfig":
        """添加发布 job"""
        return self.add_job(name, pipeline_class, inputs, needs, runs_on)
    
    # ========== 转换为配置字典 ==========
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为配置字典"""
        config: Dict[str, Any] = {}
        
        if self._inputs:
            config["inputs"] = self._inputs
        
        # 使用 SetupBuilder 构建 setup 配置
        setup = self._setup_builder.build()
        if setup:
            config["setup"] = setup
        
        # 使用 TriggerBuilder 构建 triggers 配置
        triggers = self._trigger_builder.build()
        if triggers:
            config["triggers"] = triggers
        
        if self._env:
            config["env"] = self._env
        
        if self._runs_on != "ubuntu-latest":
            config["runsOn"] = self._runs_on
        
        # 从 SetupBuilder 获取 Python 版本
        python_version = self._setup_builder.get_python_version()
        if python_version and python_version != "3.11":
            config["pythonVersion"] = python_version
        elif self._python_version != "3.11":
            config["pythonVersion"] = self._python_version
        
        if self._dependencies:
            config["dependencies"] = self._dependencies
        
        if self._jobs:
            config["jobs"] = self._jobs
        
        return config


def create_workflow_config() -> WorkflowConfig:
    """创建新的工作流配置构建器"""
    return WorkflowConfig()


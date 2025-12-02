"""
流水线脚本基类

提供标准化的输入输出接口，使 GitHub Action 可以统一调用脚本并获取结果。
所有流水线脚本必须继承自此类，并实现 execute() 方法。
"""

from typing import Dict, Optional, Any
from dataclasses import dataclass
from abc import ABC, abstractmethod
import os
import subprocess
import asyncio
import yaml
from pathlib import Path

# 尝试导入 GitHub Actions Python SDK
try:
    from actions_core import core
except ImportError:
    # 本地开发时使用 mock
    class MockCore:
        @staticmethod
        def get_input(name: str, required: bool = False) -> str:
            env_key = f"INPUT_{name.upper().replace('-', '_')}"
            return os.environ.get(env_key, "")
        
        @staticmethod
        def info(message: str) -> None:
            print(f"::notice::{message}")
        
        @staticmethod
        def warning(message: str) -> None:
            print(f"::warning::{message}")
        
        @staticmethod
        def error(message: str) -> None:
            print(f"::error::{message}")
        
        @staticmethod
        def debug(message: str) -> None:
            print(f"::debug::{message}")
        
        @staticmethod
        def set_output(name: str, value: Any) -> None:
            print(f"::set-output name={name}::{value}")
    
    core = MockCore()


@dataclass
class PipelineResult:
    """Pipeline 执行结果"""
    success: bool
    message: str
    exit_code: int = 0
    data: Optional[Dict[str, Any]] = None


class BasePipeline(ABC):
    """流水线脚本基类
    
    所有流水线脚本必须继承自此类，并实现 execute() 方法。
    派生类可以通过静态方法定义配置信息，用于生成 GitHub Action 工作流：
    - get_workflow_inputs(): 定义工作流的输入参数
    - get_workflow_setup(): 定义准备阶段（环境设置、缓存等）
    - get_workflow_triggers(): 定义触发条件
    - get_workflow_env(): 定义环境变量
    """
    
    def __init__(
        self,
        inputs: Optional[Dict[str, Any]] = None,
        config_file: Optional[str] = None,
        project_root: Optional[str] = None
    ) -> None:
        """初始化 Pipeline
        
        Args:
            inputs: 输入参数（字典）
            config_file: 配置文件路径
            project_root: 项目根目录
        """
        # 确定项目根目录
        self.project_root: str = self._get_project_root(project_root)
        
        # 标准化输入：合并环境变量和传入的 inputs
        self.inputs: Dict[str, Any] = self._standardize_inputs(inputs or {})
        
        # 加载配置
        self.config: Dict[str, Any] = {}
        if config_file:
            self.config = self._load_config(config_file)
        
        # 流水线元信息
        self.name: str = self.__class__.__name__
        self.description: str = self._get_description()
        
        # 执行结果
        self.result: Optional[PipelineResult] = None
    
    def _get_project_root(self, project_root: Optional[str] = None) -> str:
        """获取项目根目录"""
        if project_root:
            return str(Path(project_root).resolve())
        
        # 尝试从配置文件读取
        possible_config_paths = [
            Path.cwd() / "config.yaml",
            Path.cwd().parent / "config.yaml",
            Path.cwd().parent.parent / "config.yaml",
        ]
        
        for config_path in possible_config_paths:
            if config_path.exists():
                try:
                    with open(config_path, 'r', encoding='utf-8') as f:
                        config = yaml.safe_load(f) or {}
                    root_path = config.get("project", {}).get("root", ".")
                    if Path(root_path).is_absolute():
                        return str(Path(root_path))
                    else:
                        return str(config_path.parent / root_path)
                except Exception:
                    continue
        
        # 默认使用当前工作目录
        return str(Path.cwd())
    
    def _standardize_inputs(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """标准化输入参数"""
        standardized = dict(inputs)
        
        # 从环境变量读取（GitHub Actions 格式：INPUT_<NAME>）
        for key, value in os.environ.items():
            if key.startswith("INPUT_"):
                input_key = key[6:].lower().replace("_", "-")
                standardized[input_key] = value
        
        return standardized
    
    def _load_config(self, config_file: str) -> Dict[str, Any]:
        """加载配置文件"""
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f) or {}
        except Exception as e:
            core.warning(f"加载配置文件失败: {e}")
            return {}
    
    def _get_description(self) -> str:
        """获取描述"""
        # 尝试从类的 docstring 中提取
        doc = self.__class__.__doc__
        if doc:
            # 提取第一行作为描述
            return doc.strip().split('\n')[0]
        return f"{self.name} pipeline"
    
    def get_input(self, key: str, default: Any = None) -> Any:
        """获取输入参数
        
        支持多种命名格式：
        - 原始 key
        - 下划线格式（key-name -> key_name）
        - 连字符格式（key_name -> key-name）
        - 大小写变体
        """
        # 支持多种命名格式
        keys = [
            key,
            key.replace("-", "_"),
            key.replace("_", "-"),
            key.upper(),
            key.lower(),
        ]
        
        for k in keys:
            if k in self.inputs:
                return self.inputs[k]
        
        # 尝试从 GitHub Actions 输入获取
        try:
            value = core.get_input(key, required=False)
            if value:
                return value
        except Exception:
            pass
        
        return default
    
    def set_output(self, key: str, value: Any) -> None:
        """设置输出变量"""
        core.set_output(key, value)
    
    def log(self, level: str, message: str) -> None:
        """记录日志（GitHub Action 格式）
        
        Args:
            level: 日志级别（info, warning, error, debug）
            message: 日志消息
        """
        if level == "info":
            core.info(message)
        elif level == "warning":
            core.warning(message)
        elif level == "error":
            core.error(message)
        elif level == "debug":
            core.debug(message)
        else:
            print(f"[{level.upper()}] {message}")
    
    def run_command(
        self,
        command: str,
        cwd: Optional[str] = None,
        silent: bool = False
    ) -> bool:
        """执行命令
        
        Args:
            command: 要执行的命令
            cwd: 工作目录（默认使用项目根目录）
            silent: 是否静默执行（不输出 stdout）
            
        Returns:
            是否执行成功
        """
        work_dir = cwd or self.project_root
        
        try:
            self.log("info", f"执行命令: {command}")
            result = subprocess.run(
                command,
                shell=True,
                cwd=work_dir,
                capture_output=True,
                text=True,
                check=False
            )
            
            if result.returncode != 0:
                self.log("error", f"命令执行失败: {command}")
                if result.stderr:
                    self.log("error", f"错误输出: {result.stderr}")
                return False
            
            if not silent and result.stdout:
                self.log("debug", result.stdout)
            
            return True
        except Exception as e:
            self.log("error", f"执行命令时发生异常: {e}")
            return False
    
    async def run_command_async(
        self,
        command: str,
        cwd: Optional[str] = None,
        silent: bool = False
    ) -> bool:
        """异步执行命令"""
        work_dir = cwd or self.project_root
        
        try:
            self.log("info", f"执行命令: {command}")
            process = await asyncio.create_subprocess_shell(
                command,
                cwd=work_dir,
                stdout=subprocess.PIPE if silent else None,
                stderr=subprocess.PIPE,
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                self.log("error", f"命令执行失败: {command}")
                if stderr:
                    self.log("error", stderr.decode())
                return False
            
            if not silent and stdout:
                self.log("debug", stdout.decode())
            
            return True
        except Exception as e:
            self.log("error", f"执行命令时发生异常: {e}")
            return False
    
    def validate(self) -> bool:
        """验证输入和前置条件
        
        派生类可以重写此方法以实现自定义验证逻辑。
        默认实现总是返回 True。
        """
        return True
    
    @abstractmethod
    def execute(self) -> PipelineResult:
        """执行流水线逻辑
        
        派生类必须实现此方法来完成具体的流水线功能。
        
        Returns:
            PipelineResult: 执行结果
        """
        pass
    
    def run(self) -> PipelineResult:
        """运行流水线"""
        try:
            # 验证
            if not self.validate():
                self.result = PipelineResult(
                    success=False,
                    message="验证失败",
                    exit_code=1
                )
                return self.result
            
            # 执行
            self.result = self.execute()
            
            # 设置输出
            if self.result.data:
                for key, value in self.result.data.items():
                    self.set_output(key, value)
            
            return self.result
        except Exception as e:
            error_msg = f"流水线执行失败: {str(e)}"
            self.log("error", error_msg)
            self.result = PipelineResult(
                success=False,
                message=error_msg,
                exit_code=1
            )
            return self.result
    
    # ========== 工作流配置方法（静态方法） ==========
    
    @staticmethod
    def get_workflow_inputs() -> Dict[str, Any]:
        """定义工作流输入参数"""
        return {}
    
    @staticmethod
    def get_workflow_setup() -> Dict[str, Any]:
        """定义准备阶段配置"""
        return {}
    
    @staticmethod
    def get_workflow_triggers() -> Dict[str, Any]:
        """定义触发条件"""
        return {
            "push": {"branches": ["main", "master"]},
            "pull_request": {"branches": ["main", "master"]}
        }
    
    @staticmethod
    def get_workflow_env() -> Dict[str, str]:
        """定义环境变量"""
        return {}
    
    @staticmethod
    def get_workflow_runs_on() -> str:
        """定义运行环境"""
        return "ubuntu-latest"
    
    @staticmethod
    def get_workflow_python_version() -> str:
        """定义 Python 版本"""
        return "3.11"
    
    @staticmethod
    def get_workflow_dependencies() -> list:
        """定义依赖的其他流水线"""
        return []
    
    @staticmethod
    def get_workflow_jobs() -> Dict[str, Any]:
        """定义工作流 jobs（用于组合工作流）"""
        return {}


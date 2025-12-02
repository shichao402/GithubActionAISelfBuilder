"""
Python 版本的 BasePipeline 示例

展示如何使用 Python + 类型注解实现 Pipeline
"""

from typing import Dict, Optional, Any, List
from dataclasses import dataclass
from abc import ABC, abstractmethod
import os
import subprocess
import yaml
from pathlib import Path

# 使用 actions-core（GitHub Actions Python SDK）
try:
    from actions_core import core
except ImportError:
    # 本地开发时可以使用 mock
    class MockCore:
        def get_input(self, name: str, required: bool = False) -> str:
            return os.environ.get(f"INPUT_{name.upper().replace('-', '_')}", "")
        def info(self, message: str) -> None:
            print(f"[INFO] {message}")
        def warning(self, message: str) -> None:
            print(f"[WARNING] {message}")
        def error(self, message: str) -> None:
            print(f"[ERROR] {message}")
    core = MockCore()


@dataclass
class PipelineResult:
    """Pipeline 执行结果"""
    success: bool
    message: str
    exit_code: int = 0
    data: Optional[Dict[str, Any]] = None


class BasePipeline(ABC):
    """Pipeline 基类
    
    所有 Pipeline 必须继承此类并实现 execute() 方法。
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
        self.project_root: str = project_root or self._get_project_root()
        self.inputs: Dict[str, Any] = inputs or {}
        self.config: Dict[str, Any] = {}
        self.name: str = self.__class__.__name__
        
        # 标准化输入：合并环境变量和传入的 inputs
        self.inputs = self._standardize_inputs(self.inputs)
        
        # 加载配置
        if config_file:
            self.config = self._load_config(config_file)
    
    def _get_project_root(self) -> str:
        """获取项目根目录"""
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
    
    def get_input(self, key: str, default: Any = None) -> Any:
        """获取输入参数"""
        return self.inputs.get(key, default)
    
    def log(self, level: str, message: str) -> None:
        """记录日志"""
        if level == "info":
            core.info(message)
        elif level == "warning":
            core.warning(message)
        elif level == "error":
            core.error(message)
        else:
            print(f"[{level.upper()}] {message}")
    
    def run_command(self, command: str, cwd: Optional[str] = None) -> bool:
        """运行命令
        
        Args:
            command: 要执行的命令
            cwd: 工作目录（默认使用项目根目录）
            
        Returns:
            是否执行成功
        """
        try:
            result = subprocess.run(
                command,
                shell=True,
                cwd=cwd or self.project_root,
                capture_output=True,
                text=True,
                check=False
            )
            
            if result.stdout:
                print(result.stdout)
            if result.stderr:
                print(result.stderr)
            
            return result.returncode == 0
        except Exception as e:
            core.error(f"执行命令失败: {e}")
            return False
    
    @abstractmethod
    def execute(self) -> PipelineResult:
        """执行 Pipeline（子类必须实现）"""
        pass
    
    # 静态方法：定义工作流配置
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
            "push": {"branches": ["main", "develop"]},
            "pull_request": {"branches": ["main"]}
        }
    
    @staticmethod
    def get_workflow_runs_on() -> str:
        """定义运行环境"""
        return "ubuntu-latest"


# 示例：简单的构建 Pipeline
class MyBuildPipeline(BasePipeline):
    """示例构建 Pipeline"""
    
    @staticmethod
    def get_workflow_inputs() -> Dict[str, Any]:
        """定义工作流输入参数"""
        return {
            "build-command": {
                "description": "构建命令",
                "required": False,
                "default": "npm run build"
            }
        }
    
    @staticmethod
    def get_workflow_setup() -> Dict[str, Any]:
        """定义准备阶段配置"""
        return {
            "actions": [
                {
                    "name": "Set up Node.js",
                    "uses": "actions/setup-node@v3",
                    "with": {
                        "node-version": "18"
                    }
                }
            ]
        }
    
    def execute(self) -> PipelineResult:
        """执行构建"""
        build_command = self.get_input("build-command", "npm run build")
        
        self.log("info", f"开始执行构建: {build_command}")
        
        success = self.run_command(build_command)
        
        if not success:
            return PipelineResult(
                success=False,
                message="构建失败",
                exit_code=1
            )
        
        return PipelineResult(
            success=True,
            message="构建成功",
            exit_code=0
        )


# 使用示例
if __name__ == "__main__":
    pipeline = MyBuildPipeline()
    result = pipeline.execute()
    
    if not result.success:
        exit(result.exit_code)


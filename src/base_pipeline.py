"""
流水线脚本基类

提供标准化的输入输出接口，使 GitHub Action 可以统一调用脚本并获取结果。
所有流水线脚本必须继承自此类，并实现 execute() 方法。
"""

import argparse
import json
import logging
import os
import sys
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, List, Optional, Union


class PipelineResult:
    """流水线执行结果"""
    
    def __init__(
        self,
        success: bool,
        message: str = "",
        data: Optional[Dict[str, Any]] = None,
        exit_code: int = 0
    ):
        """
        初始化执行结果
        
        Args:
            success: 是否成功
            message: 结果消息
            data: 额外的结果数据
            exit_code: 退出码（0 表示成功，非 0 表示失败）
        """
        self.success = success
        self.message = message
        self.data = data or {}
        self.exit_code = exit_code if not success else 0
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "success": self.success,
            "message": self.message,
            "data": self.data,
            "exit_code": self.exit_code
        }
    
    def to_json(self) -> str:
        """转换为 JSON 字符串"""
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=2)


class BasePipeline(ABC):
    """
    流水线脚本基类
    
    所有流水线脚本必须继承自此类，并实现 execute() 方法。
    基类提供标准化的输入输出接口，使 GitHub Action 可以统一调用。
    """
    
    def __init__(
        self,
        inputs: Optional[Dict[str, Any]] = None,
        config_file: Optional[str] = None
    ):
        """
        初始化流水线
        
        Args:
            inputs: 输入参数字典（从 GitHub Action 传入）
            config_file: 配置文件路径（可选）
        """
        # 标准化输入：合并命令行参数、环境变量和传入的 inputs
        self.inputs = self._standardize_inputs(inputs or {})
        
        # 加载配置
        self.config = self._load_config(config_file) if config_file else {}
        
        # 设置日志（支持 GitHub Action 格式）
        self.logger = self._setup_logger()
        
        # 流水线元信息
        self.name = self.__class__.__name__
        self.description = self.__doc__ or f"{self.name} pipeline"
        
        # 执行结果
        self.result: Optional[PipelineResult] = None
    
    def _standardize_inputs(self, provided_inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        标准化输入：合并多种输入源
        
        优先级：provided_inputs > 环境变量 > 默认值
        
        Args:
            provided_inputs: 直接提供的输入
            
        Returns:
            标准化后的输入字典
        """
        standardized = {}
        
        # 1. 从环境变量读取（GitHub Action 会设置 INPUT_* 环境变量）
        for key, value in os.environ.items():
            if key.startswith("INPUT_"):
                # GitHub Action 输入：INPUT_<NAME> -> <name>
                input_name = key[6:].lower().replace("_", "-")
                standardized[input_name] = value
        
        # 2. 合并直接提供的输入（优先级更高）
        standardized.update(provided_inputs)
        
        # 3. 从命令行参数读取（如果通过命令行调用）
        # 这部分在 main() 方法中处理
        
        return standardized
    
    def _load_config(self, config_file: str) -> Dict[str, Any]:
        """
        加载配置文件（支持 JSON 和 YAML）
        
        Args:
            config_file: 配置文件路径
            
        Returns:
            配置字典
        """
        config_path = Path(config_file)
        
        if not config_path.exists():
            self.logger.warning(f"配置文件不存在: {config_path}")
            return {}
        
        suffix = config_path.suffix.lower()
        
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                if suffix == ".json":
                    return json.load(f)
                elif suffix in [".yaml", ".yml"]:
                    try:
                        import yaml
                        return yaml.safe_load(f) or {}
                    except ImportError:
                        self.logger.error(
                            "YAML 配置文件需要 PyYAML 库，请安装: pip install pyyaml"
                        )
                        return {}
                else:
                    self.logger.warning(f"不支持的配置文件格式: {suffix}")
                    return {}
        except Exception as e:
            self.logger.error(f"加载配置文件失败: {e}")
            return {}
    
    def _setup_logger(self) -> logging.Logger:
        """
        设置日志记录器（支持 GitHub Action 格式）
        
        Returns:
            配置好的日志记录器
        """
        logger = logging.getLogger(self.__class__.__name__)
        
        if not logger.handlers:
            # 创建控制台处理器
            console_handler = logging.StreamHandler()
            console_handler.setLevel(logging.INFO)
            
            # 创建格式化器
            formatter = logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S"
            )
            console_handler.setFormatter(formatter)
            
            logger.addHandler(console_handler)
            logger.setLevel(logging.INFO)
        
        return logger
    
    def log_github_action(
        self,
        level: str,
        message: str,
        file: Optional[str] = None,
        line: Optional[int] = None,
        col: Optional[int] = None
    ):
        """
        输出 GitHub Action 格式的日志
        
        GitHub Action 支持的特殊格式：
        - ::notice:: 通知
        - ::warning:: 警告
        - ::error:: 错误
        - ::debug:: 调试
        
        Args:
            level: 日志级别（notice, warning, error, debug）
            message: 日志消息
            file: 文件名（可选）
            line: 行号（可选）
            col: 列号（可选）
        """
        parts = [f"::{level}::"]
        
        if file:
            parts.append(f"file={file}")
        if line:
            parts.append(f"line={line}")
        if col:
            parts.append(f"col={col}")
        
        parts.append(message)
        print(" ".join(parts))
    
    def get_input(self, key: str, default: Any = None) -> Any:
        """
        获取输入参数（标准化接口）
        
        Args:
            key: 参数名（支持 kebab-case 和 snake_case）
            default: 默认值
            
        Returns:
            参数值
        """
        # 支持多种命名格式
        keys = [
            key,
            key.replace("-", "_"),
            key.replace("_", "-"),
            key.upper(),
            key.lower()
        ]
        
        for k in keys:
            if k in self.inputs:
                return self.inputs[k]
        
        return default
    
    def set_output(self, key: str, value: Any):
        """
        设置输出变量（GitHub Action 格式）
        
        GitHub Action 通过 GITHUB_OUTPUT 环境变量设置输出
        
        Args:
            key: 输出变量名
            value: 变量值
        """
        output_file = os.environ.get("GITHUB_OUTPUT")
        if output_file:
            with open(output_file, "a", encoding="utf-8") as f:
                f.write(f"{key}={value}\n")
        else:
            # 如果不在 GitHub Action 环境中，输出到日志
            self.logger.info(f"Output {key}={value}")
    
    def validate(self) -> bool:
        """
        验证输入和前置条件
        
        派生类可以重写此方法以实现自定义验证逻辑。
        默认实现总是返回 True。
        
        Returns:
            验证是否通过
        """
        return True
    
    @abstractmethod
    def execute(self) -> PipelineResult:
        """
        执行流水线逻辑
        
        派生类必须实现此方法来完成具体的流水线功能。
        
        Returns:
            PipelineResult 对象，包含执行结果
        """
        pass
    
    def run(self) -> PipelineResult:
        """
        运行流水线（包含验证和执行）
        
        这是流水线的入口方法，会先执行验证，然后执行流水线逻辑。
        
        Returns:
            PipelineResult 对象
        """
        try:
            # 验证输入和前置条件
            if not self.validate():
                self.log_github_action("error", "流水线验证失败")
                self.result = PipelineResult(
                    success=False,
                    message="流水线验证失败",
                    exit_code=1
                )
                return self.result
            
            self.logger.info(f"开始执行流水线: {self.name}")
            self.log_github_action("notice", f"开始执行流水线: {self.name}")
            
            # 执行流水线逻辑
            self.result = self.execute()
            
            if self.result.success:
                self.logger.info(f"流水线执行成功: {self.name}")
                self.log_github_action("notice", f"流水线执行成功: {self.name}")
            else:
                self.logger.warning(f"流水线执行失败: {self.name}")
                self.log_github_action("error", f"流水线执行失败: {self.result.message}")
            
            return self.result
            
        except Exception as e:
            error_msg = f"流水线执行过程中发生错误: {e}"
            self.logger.error(error_msg, exc_info=True)
            self.log_github_action("error", error_msg)
            self.result = PipelineResult(
                success=False,
                message=str(e),
                exit_code=1
            )
            return self.result
    
    @classmethod
    def create_argument_parser(cls) -> argparse.ArgumentParser:
        """
        创建命令行参数解析器
        
        派生类可以重写此方法以添加自定义参数。
        
        Returns:
            ArgumentParser 对象
        """
        parser = argparse.ArgumentParser(
            description=cls.__doc__ or f"{cls.__name__} pipeline"
        )
        parser.add_argument(
            "--config",
            type=str,
            help="配置文件路径"
        )
        parser.add_argument(
            "--input",
            type=str,
            action="append",
            metavar="KEY=VALUE",
            help="输入参数（可多次使用）"
        )
        parser.add_argument(
            "--output-json",
            action="store_true",
            help="以 JSON 格式输出结果"
        )
        return parser
    
    @classmethod
    def main(cls):
        """
        命令行入口点
        
        从命令行调用脚本时使用此方法。
        """
        parser = cls.create_argument_parser()
        args = parser.parse_args()
        
        # 解析输入参数
        inputs = {}
        if args.input:
            for item in args.input:
                if "=" in item:
                    key, value = item.split("=", 1)
                    inputs[key] = value
        
        # 创建流水线实例
        pipeline = cls(inputs=inputs, config_file=args.config)
        
        # 运行流水线
        result = pipeline.run()
        
        # 输出结果
        if args.output_json:
            print(result.to_json())
        else:
            if result.success:
                print(f"✓ {result.message}")
            else:
                print(f"✗ {result.message}", file=sys.stderr)
        
        # 设置输出变量（如果支持）
        for key, value in result.data.items():
            pipeline.set_output(key, value)
        
        # 退出
        sys.exit(result.exit_code)
    
    def __repr__(self) -> str:
        """返回流水线的字符串表示"""
        return f"<{self.__class__.__name__}(name='{self.name}')>"

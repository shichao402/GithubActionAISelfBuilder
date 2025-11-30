"""
脚手架工具

根据流水线脚本类及其配置，自动生成或更新 GitHub Action 工作流 YAML 文件。
"""

import argparse
import importlib
import importlib.util
import inspect
import json
import logging
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    import yaml
    YAML_AVAILABLE = True
except ImportError:
    YAML_AVAILABLE = False
    print("警告: PyYAML 未安装，将无法处理 YAML 配置文件。请运行: pip install pyyaml")


class ScaffoldGenerator:
    """脚手架生成器"""
    
    def __init__(self, project_root: Optional[Path] = None):
        """
        初始化脚手架生成器
        
        Args:
            project_root: 项目根目录，如果为 None 则自动检测
        """
        if project_root is None:
            # 自动检测项目根目录（假设 scaffold.py 在 src/ 目录下）
            current_file = Path(__file__).resolve()
            project_root = current_file.parent.parent
        
        self.project_root = project_root
        self.config_dir = project_root / "config"
        self.workflows_dir = project_root / ".github" / "workflows"
        self.pipelines_dir = project_root / "src" / "pipelines"
        
        # 确保目录存在
        self.workflows_dir.mkdir(parents=True, exist_ok=True)
        self.config_dir.mkdir(parents=True, exist_ok=True)
        
        # 添加项目路径到 sys.path 以便导入
        import sys
        src_path = str(project_root / "src")
        if src_path not in sys.path:
            sys.path.insert(0, src_path)
        
        self.logger = self._setup_logger()
    
    def _setup_logger(self) -> logging.Logger:
        """设置日志记录器"""
        logger = logging.getLogger(__name__)
        if not logger.handlers:
            handler = logging.StreamHandler()
            handler.setFormatter(
                logging.Formatter("%(levelname)s - %(message)s")
            )
            logger.addHandler(handler)
            logger.setLevel(logging.INFO)
        return logger
    
    def load_pipeline_class(self, class_name: str) -> type:
        """
        动态加载流水线类
        
        Args:
            class_name: 类名（如 "ExamplePipeline"）
            
        Returns:
            类对象
            
        Raises:
            ImportError: 无法导入类
            AttributeError: 类不存在
        """
        # 确保可以导入 base_pipeline
        import sys
        src_path = str(self.project_root / "src")
        if src_path not in sys.path:
            sys.path.insert(0, src_path)
        
        # 先导入 BasePipeline 以便验证
        try:
            from src.base_pipeline import BasePipeline
        except ImportError:
            from base_pipeline import BasePipeline
        
        # 查找包含该类的模块
        pipeline_files = list(self.pipelines_dir.glob("*.py"))
        pipeline_files = [f for f in pipeline_files if f.name != "__init__.py"]
        
        self.logger.debug(f"找到 {len(pipeline_files)} 个流水线文件: {[f.name for f in pipeline_files]}")
        self.logger.debug(f"sys.path: {sys.path[:3]}")
        
        for pipeline_file in pipeline_files:
            # 尝试多种导入方式（按优先级）
            module_names = [
                f"pipelines.{pipeline_file.stem}",  # 优先：从 src 目录导入
                f"src.pipelines.{pipeline_file.stem}",
            ]
            
            for module_name in module_names:
                try:
                    # 清除模块缓存（如果存在）
                    if module_name in sys.modules:
                        del sys.modules[module_name]
                    
                    module = importlib.import_module(module_name)
                    if hasattr(module, class_name):
                        cls = getattr(module, class_name)
                        # 验证是否是 BasePipeline 的子类
                        if inspect.isclass(cls) and issubclass(cls, BasePipeline):
                            self.logger.info(f"成功加载类 {class_name} 从模块 {module_name}")
                            return cls
                except Exception as e:
                    self.logger.debug(f"尝试导入 {module_name} 失败: {e}")
                    continue
        
        # 如果都失败了，尝试直接读取文件并解析
        for pipeline_file in pipeline_files:
            try:
                with open(pipeline_file, "r", encoding="utf-8") as f:
                    content = f.read()
                    if f"class {class_name}" in content:
                        # 文件包含该类，尝试直接导入
                        module_name = f"src.pipelines.{pipeline_file.stem}"
                        spec = importlib.util.spec_from_file_location(
                            module_name, pipeline_file
                        )
                        if spec and spec.loader:
                            module = importlib.util.module_from_spec(spec)
                            spec.loader.exec_module(module)
                            if hasattr(module, class_name):
                                cls = getattr(module, class_name)
                                if inspect.isclass(cls) and issubclass(cls, BasePipeline):
                                    return cls
            except Exception as e:
                self.logger.debug(f"尝试从文件 {pipeline_file} 加载失败: {e}")
                continue
        
        raise AttributeError(
            f"未找到流水线类 '{class_name}'。"
            f"请确保类存在于 {self.pipelines_dir} 目录下的某个文件中。"
        )
    
    def analyze_pipeline(self, pipeline_class: type) -> Dict[str, Any]:
        """
        分析流水线类，提取元数据
        
        Args:
            pipeline_class: 流水线类
            
        Returns:
            包含元数据的字典
        """
        # 创建临时实例以获取元数据
        try:
            instance = pipeline_class()
        except Exception as e:
            self.logger.warning(f"无法创建实例，使用类信息: {e}")
            instance = None
        
        metadata = {
            "name": pipeline_class.__name__,
            "description": pipeline_class.__doc__ or f"{pipeline_class.__name__} pipeline",
            "module": pipeline_class.__module__,
            "file": inspect.getfile(pipeline_class),
        }
        
        # 从实例获取配置（如果有）
        if instance:
            metadata["config"] = getattr(instance, "config", {})
            metadata["inputs"] = getattr(instance, "inputs", {})
        
        return metadata
    
    def load_config(self, pipeline_name: str) -> Dict[str, Any]:
        """
        加载配置文件
        
        Args:
            pipeline_name: 流水线名称（用于查找配置文件）
            
        Returns:
            配置字典
        """
        # 尝试查找配置文件
        config_name = pipeline_name.lower().replace("pipeline", "")
        config_files = [
            self.config_dir / f"{config_name}-config.json",
            self.config_dir / f"{config_name}-config.yaml",
            self.config_dir / f"{config_name}-config.yml",
        ]
        
        for config_file in config_files:
            if config_file.exists():
                self.logger.info(f"找到配置文件: {config_file}")
                return self._load_config_file(config_file)
        
        self.logger.info(f"未找到配置文件，使用默认配置")
        return {}
    
    def _load_config_file(self, config_file: Path) -> Dict[str, Any]:
        """加载配置文件"""
        suffix = config_file.suffix.lower()
        try:
            with open(config_file, "r", encoding="utf-8") as f:
                if suffix == ".json":
                    return json.load(f)
                elif suffix in [".yaml", ".yml"]:
                    if not YAML_AVAILABLE:
                        raise ValueError("需要 PyYAML 库来处理 YAML 配置文件")
                    return yaml.safe_load(f) or {}
        except Exception as e:
            self.logger.error(f"加载配置文件失败: {e}")
            return {}
    
    def generate_workflow_yaml(
        self,
        pipeline_class: type,
        metadata: Dict[str, Any],
        config: Dict[str, Any],
        triggers: Optional[Dict[str, Any]] = None,
        runs_on: str = "ubuntu-latest",
        python_version: str = "3.9"
    ) -> Dict[str, Any]:
        """
        生成 GitHub Action 工作流 YAML 结构
        
        Args:
            pipeline_class: 流水线类
            metadata: 流水线元数据
            config: 配置字典
            triggers: 触发条件（如果为 None，从配置读取或使用默认值）
            runs_on: 运行环境
            python_version: Python 版本
            
        Returns:
            YAML 字典结构
        """
        # 确定工作流名称
        workflow_name = metadata["name"].replace("Pipeline", "").replace("_", " ").title()
        
        # 确定触发条件
        if triggers is None:
            pipeline_config = config.get("pipeline", {})
            triggers = pipeline_config.get("triggers", {
                "push": {"branches": ["main", "master"]},
                "pull_request": {"branches": ["main", "master"]}
            })
        
        # 确定模块路径（确保使用正确的模块路径）
        module_path = metadata["module"]
        # 如果模块路径是 pipelines.xxx，改为 src.pipelines.xxx
        if module_path.startswith("pipelines."):
            module_path = f"src.{module_path}"
        script_command = f"python -m {module_path}"
        
        # 构建输入参数（从配置中读取）
        input_args = []
        pipeline_config = config.get("pipeline", {})
        inputs_config = pipeline_config.get("inputs", {})
        
        # 检查是否有 workflow_dispatch 输入
        has_workflow_dispatch = False
        workflow_inputs = {}
        if isinstance(triggers, dict) and "workflow_dispatch" in triggers:
            has_workflow_dispatch = True
            workflow_inputs = triggers.get("workflow_dispatch", {}).get("inputs", {})
        
        for key, value_config in inputs_config.items():
            # 如果是 workflow_dispatch 输入，使用 GitHub Actions 变量
            if has_workflow_dispatch and key in workflow_inputs:
                input_args.append(f'--input {key}="${{{{ inputs.{key} }}}}"')
            elif isinstance(value_config, dict):
                default_value = value_config.get("default", "")
                # 处理 GitHub Actions 表达式
                if default_value and "${{" not in str(default_value):
                    input_args.append(f'--input {key}="{default_value}"')
                elif "${{" in str(default_value):
                    # 直接使用 GitHub Actions 表达式
                    input_args.append(f'--input {key}={default_value}')
            else:
                if "${{" in str(value_config):
                    input_args.append(f'--input {key}={value_config}')
                else:
                    input_args.append(f'--input {key}="{value_config}"')
        
        # 构建环境变量
        env_vars = {}
        env_config = pipeline_config.get("env", {})
        env_vars.update(env_config)
        
        # 添加 GitHub Action 输出文件
        env_vars["GITHUB_OUTPUT"] = "${{ github.output }}"
        
        # 构建步骤
        steps = [
            {
                "name": "Checkout code",
                "uses": "actions/checkout@v3"
            },
            {
                "name": "Set up Python",
                "uses": "actions/setup-python@v4",
                "with": {
                    "python-version": python_version
                }
            },
            {
                "name": "Install dependencies",
                "run": "python -m pip install --upgrade pip\npip install -r requirements.txt"
            }
        ]
        
        # 添加自定义步骤（从配置中读取）
        custom_steps = pipeline_config.get("steps", [])
        steps.extend(custom_steps)
        
        # 添加运行流水线脚本的步骤
        run_command = script_command
        if input_args:
            run_command += " " + " ".join(input_args)
        
        steps.append({
            "name": f"Run {workflow_name}",
            "id": "pipeline",
            "env": env_vars,
            "run": run_command
        })
        
        # 构建工作流结构
        workflow = {
            "name": workflow_name,
            "on": triggers,
            "jobs": {
                workflow_name.lower().replace(" ", "_"): {
                    "runs-on": runs_on,
                    "steps": steps
                }
            }
        }
        
        # 添加依赖关系（如果有）
        dependencies = pipeline_config.get("dependencies", [])
        if dependencies:
            workflow["jobs"][workflow_name.lower().replace(" ", "_")]["needs"] = dependencies
        
        return workflow
    
    def generate(
        self,
        pipeline_class_name: str,
        output_path: Optional[str] = None,
        config_file: Optional[str] = None,
        triggers: Optional[Dict[str, Any]] = None,
        update: bool = False
    ) -> Path:
        """
        生成或更新 GitHub Action 工作流文件
        
        Args:
            pipeline_class_name: 流水线类名
            output_path: 输出文件路径（如果为 None，自动生成）
            config_file: 配置文件路径（可选）
            triggers: 触发条件（可选）
            update: 是否更新已存在的文件
            
        Returns:
            生成的文件路径
        """
        # 加载流水线类
        self.logger.info(f"加载流水线类: {pipeline_class_name}")
        pipeline_class = self.load_pipeline_class(pipeline_class_name)
        
        # 分析流水线
        metadata = self.analyze_pipeline(pipeline_class)
        self.logger.info(f"流水线: {metadata['name']} - {metadata['description']}")
        
        # 加载配置
        if config_file:
            config = self._load_config_file(Path(config_file))
        else:
            config = self.load_config(metadata["name"])
        
        # 生成工作流 YAML
        workflow = self.generate_workflow_yaml(
            pipeline_class,
            metadata,
            config,
            triggers=triggers
        )
        
        # 确定输出路径
        if output_path is None:
            workflow_name = metadata["name"].lower().replace("pipeline", "")
            output_path = self.workflows_dir / f"{workflow_name}.yml"
        else:
            output_path = Path(output_path)
            if not output_path.is_absolute():
                # 如果路径已经包含 .github/workflows，直接使用
                if ".github/workflows" in str(output_path) or "workflows" in str(output_path):
                    output_path = self.project_root / output_path
                else:
                    output_path = self.workflows_dir / output_path
        
        # 检查文件是否存在
        if output_path.exists() and not update:
            raise FileExistsError(
                f"文件已存在: {output_path}。使用 --update 参数来更新文件。"
            )
        
        # 写入文件
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # 手动格式化 YAML 以避免 'on' 被引号包裹
        yaml_str = yaml.dump(
            workflow,
            default_flow_style=False,
            allow_unicode=True,
            sort_keys=False,
            width=1000,
            indent=2
        )
        # 替换 'on': 为 on:
        yaml_str = yaml_str.replace("'on':", "on:")
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(yaml_str)
        
        self.logger.info(f"✓ 工作流文件已生成: {output_path}")
        return output_path


def main():
    """命令行入口"""
    parser = argparse.ArgumentParser(
        description="根据流水线脚本生成 GitHub Action 工作流"
    )
    parser.add_argument(
        "--pipeline",
        type=str,
        required=True,
        help="流水线类名（如 ExamplePipeline）"
    )
    parser.add_argument(
        "--output",
        type=str,
        help="输出文件路径（默认为 .github/workflows/<pipeline-name>.yml）"
    )
    parser.add_argument(
        "--config",
        type=str,
        help="配置文件路径（可选）"
    )
    parser.add_argument(
        "--update",
        action="store_true",
        help="更新已存在的文件"
    )
    parser.add_argument(
        "--trigger",
        type=str,
        help="触发条件（JSON 格式，如 '{\"push\":{\"branches\":[\"main\"]}}'）"
    )
    
    args = parser.parse_args()
    
    # 解析触发条件
    triggers = None
    if args.trigger:
        try:
            triggers = json.loads(args.trigger)
        except json.JSONDecodeError as e:
            print(f"错误: 触发条件 JSON 格式无效: {e}", file=sys.stderr)
            sys.exit(1)
    
    # 创建生成器
    generator = ScaffoldGenerator()
    
    try:
        # 生成工作流
        output_path = generator.generate(
            pipeline_class_name=args.pipeline,
            output_path=args.output,
            config_file=args.config,
            triggers=triggers,
            update=args.update
        )
        print(f"✓ 成功生成工作流文件: {output_path}")
    except Exception as e:
        print(f"✗ 错误: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()


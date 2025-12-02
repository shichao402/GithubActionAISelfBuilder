"""
脚手架工具

根据流水线脚本类及其配置，自动生成或更新 GitHub Action 工作流 YAML 文件。
"""

import yaml
import argparse
import importlib.util
import sys
from pathlib import Path
from typing import Optional, Dict, Any, List
from .base_pipeline import BasePipeline
# 注意：workflow_config.py 和 workflow_config/ 目录是不同的
# workflow_config.py 包含 WorkflowConfig 类和 create_workflow_config 函数
# workflow_config/ 目录包含子模块（SetupBuilder, TriggerBuilder）
# 使用 importlib 来避免命名冲突
import importlib.util
from pathlib import Path

# 加载 workflow_config.py 模块
workflow_config_path = Path(__file__).parent / "workflow_config.py"
spec = importlib.util.spec_from_file_location("workflow_config_module", workflow_config_path)
workflow_config_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(workflow_config_module)

WorkflowConfig = workflow_config_module.WorkflowConfig
create_workflow_config = workflow_config_module.create_workflow_config


class ScaffoldGenerator:
    """脚手架生成器"""
    
    def __init__(self, project_root: Optional[str] = None) -> None:
        """初始化脚手架生成器"""
        self.project_root = Path(project_root or self._detect_project_root())
        self.config = self._load_project_config()
        
        # 确定目录
        self.workflows_dir = self.project_root / (
            self.config.get("scaffold", {}).get("workflows_dir", ".github/workflows")
        )
        self.pipelines_dir = self.project_root / (
            self.config.get("pipelines", {}).get("scripts_dir", "src/pipelines")
        )
        
        # 确保目录存在
        self.workflows_dir.mkdir(parents=True, exist_ok=True)
    
    def _detect_project_root(self) -> Path:
        """检测项目根目录"""
        current = Path.cwd()
        while current != current.parent:
            if (current / "package.json").exists() or (current / "environment.yml").exists():
                return current
            current = current.parent
        return Path.cwd()
    
    def _load_project_config(self) -> Dict[str, Any]:
        """加载项目配置"""
        config_path = self.project_root / "config.yaml"
        if config_path.exists():
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    return yaml.safe_load(f) or {}
            except Exception as e:
                print(f"警告: 加载配置文件失败: {e}")
        return {}
    
    def _find_pipeline_files(self) -> List[Path]:
        """查找 Pipeline 文件"""
        files: List[Path] = []
        if not self.pipelines_dir.exists():
            return files
        
        # 检查是否包含 test 目录
        include_test = self.config.get("pipelines", {}).get("include_test_pipelines", False)
        
        for file_path in self.pipelines_dir.rglob("*.py"):
            if file_path.name.startswith("_"):
                continue
            
            # 如果不在 test 目录，或者配置了包含 test，则添加
            if "test" not in str(file_path.relative_to(self.pipelines_dir)) or include_test:
                files.append(file_path)
        
        return files
    
    def _load_pipeline_class(self, class_name: str) -> type:
        """加载 Pipeline 类"""
        pipeline_files = self._find_pipeline_files()
        
        # 添加项目根目录到路径
        if str(self.project_root) not in sys.path:
            sys.path.insert(0, str(self.project_root))
        
        for file_path in pipeline_files:
            try:
                # 计算模块路径（相对于项目根目录）
                relative_path = file_path.relative_to(self.project_root)
                module_path = str(relative_path.with_suffix("")).replace("/", ".").replace("\\", ".")
                
                # 动态导入模块
                spec = importlib.util.spec_from_file_location(module_path, file_path)
                if spec is None or spec.loader is None:
                    continue
                
                module = importlib.util.module_from_spec(spec)
                sys.modules[module_path] = module
                spec.loader.exec_module(module)
                
                # 查找 Pipeline 类
                if hasattr(module, class_name):
                    pipeline_class = getattr(module, class_name)
                    if (isinstance(pipeline_class, type) and
                        issubclass(pipeline_class, BasePipeline) and
                        pipeline_class != BasePipeline):
                        return pipeline_class
            except Exception as e:
                print(f"调试: 加载 {file_path} 失败: {e}")
                import traceback
                traceback.print_exc()
                continue
        
        raise ValueError(f"未找到流水线类: {class_name}")
    
    def _analyze_pipeline(self, pipeline_class: type) -> Dict[str, Any]:
        """分析 Pipeline 类"""
        class_name = pipeline_class.__name__
        description = pipeline_class.__doc__ or f"{class_name} pipeline"
        
        # 从静态方法获取配置
        inputs = pipeline_class.get_workflow_inputs()
        setup = pipeline_class.get_workflow_setup()
        triggers = pipeline_class.get_workflow_triggers()
        env = pipeline_class.get_workflow_env()
        runs_on = pipeline_class.get_workflow_runs_on()
        python_version = pipeline_class.get_workflow_python_version()
        dependencies = pipeline_class.get_workflow_dependencies()
        jobs = pipeline_class.get_workflow_jobs()
        
        config: Dict[str, Any] = {}
        if inputs:
            config["inputs"] = inputs
        if setup:
            config["setup"] = setup
        if triggers:
            config["triggers"] = triggers
        if env:
            config["env"] = env
        if runs_on != "ubuntu-latest":
            config["runsOn"] = runs_on
        if python_version != "3.11":
            config["pythonVersion"] = python_version
        if dependencies:
            config["dependencies"] = dependencies
        if jobs:
            config["jobs"] = jobs
        
        # 获取模块路径（从文件路径推断）
        # 尝试从 Pipeline 注册表获取模块路径
        module_path = None
        try:
            from .pipeline_registry import get_pipeline_registry
            registry = get_pipeline_registry()
            metadata = registry.get_metadata(class_name)
            if metadata and metadata.module_path:
                # 提取相对路径部分（去掉 src. 前缀）
                full_path = metadata.module_path
                if full_path.startswith("src.pipelines."):
                    module_path = full_path.replace("src.pipelines.", "")
        except Exception:
            pass
        
        # 如果注册表中没有，使用默认规则
        if not module_path:
            # 默认规则：类名转小写，去掉 Pipeline 后缀
            module_path = class_name.lower().replace("pipeline", "").replace("_", "")
            # 尝试推断路径
            if "build" in class_name.lower():
                module_path = f"build.{module_path.replace('build', '')}"
            elif "release" in class_name.lower():
                module_path = f"test.{module_path.replace('release', '')}"
            elif "version" in class_name.lower():
                module_path = f"test.{module_path.replace('version', '')}"
            else:
                module_path = f"base.{module_path}"
        
        return {
            "name": class_name,
            "description": description,
            "module": module_path,
            "config": config,
        }
    
    def _generate_steps(
        self,
        metadata: Dict[str, Any],
        config: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """生成工作流步骤"""
        steps: List[Dict[str, Any]] = []
        
        # 1. Checkout
        steps.append({
            "name": "Checkout code",
            "uses": "actions/checkout@v3",
        })
        
        # 2. 设置 Conda
        # 检测项目根目录，确定 environment.yml 的相对路径
        env_file_path = "python/environment.yml"
        # 如果是在子模块中，可能需要调整路径
        if Path(self.project_root / "python" / "environment.yml").exists():
            env_file_path = "python/environment.yml"
        elif Path(self.project_root.parent / "python" / "environment.yml").exists():
            # 可能是子模块路径
            env_file_path = str(Path(self.project_root).relative_to(Path.cwd()) / "python" / "environment.yml")
        
        steps.append({
            "name": "Set up Conda",
            "uses": "conda-incubator/setup-miniconda@v2",
            "with": {
                "environment-file": env_file_path,
                "activate-environment": "github-action-builder",
                "auto-activate-base": "false",
            },
        })
        
        # 3. 环境设置步骤
        if config.get("setup"):
            setup = config["setup"]
            if setup.get("actions"):
                steps.extend(setup["actions"])
            if setup.get("steps"):
                steps.extend(setup["steps"])
        
        # 4. 运行 Pipeline
        # 构建环境变量
        env_vars: Dict[str, str] = {}
        if config.get("inputs"):
            for key, input_config in config["inputs"].items():
                env_key = f"INPUT_{key.upper().replace('-', '_')}"
                default_value = input_config.get("default", "")
                env_vars[env_key] = f"${{{{ inputs.{key} || '{default_value}' }}}}"
        
        # 构建运行命令
        # 计算模块路径（从 metadata['module'] 构建完整导入路径）
        # metadata['module'] 是相对于 pipelines 目录的路径（如 "base.build_pipeline"）
        module_import_path = f"src.pipelines.{metadata['module']}"
        
        # 确定 Python 路径（可能是 python/ 目录或项目根目录）
        python_path = "python"
        if Path(self.project_root / "python" / "src").exists():
            python_path = "python"
        elif Path(self.project_root / "src").exists():
            python_path = "."
        
        pipeline_step = {
            "name": f"Run {metadata['name']}",
            "id": "pipeline",
            "run": f"""cd {python_path} && python -c "
import sys
sys.path.insert(0, '.')
from {module_import_path} import {metadata['name']}
pipeline = {metadata['name']}()
result = pipeline.run()
if not result.success:
    sys.exit(result.exit_code)
" """,
            "env": env_vars,
        }
        steps.append(pipeline_step)
        
        return steps
    
    def _generate_workflow_yaml(
        self,
        metadata: Dict[str, Any],
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """生成工作流 YAML"""
        # 确定工作流名称
        workflow_name = (
            metadata["name"]
            .replace("Pipeline", "")
            .replace("_", " ")
            .title()
        )
        
        # 合并配置
        pipeline_config = {**metadata["config"], **config}
        
        # 确定触发条件
        triggers = pipeline_config.get("triggers", {
            "push": {"branches": ["main", "master"]},
            "pull_request": {"branches": ["main", "master"]},
        })
        
        # 确定运行环境
        runs_on = pipeline_config.get("runsOn", "ubuntu-latest")
        
        # 生成步骤
        steps = self._generate_steps(metadata, pipeline_config)
        
        # 构建工作流
        workflow: Dict[str, Any] = {
            "name": workflow_name,
            "on": triggers,
            "jobs": {
                metadata["name"].lower().replace("pipeline", ""): {
                    "runs-on": runs_on,
                    "steps": steps,
                }
            },
        }
        
        return workflow
    
    def generate(
        self,
        pipeline_class_name: str,
        output_path: Optional[str] = None,
        update: bool = False
    ) -> Path:
        """生成或更新工作流文件"""
        # 加载 Pipeline 类
        pipeline_class = self._load_pipeline_class(pipeline_class_name)
        
        # 分析 Pipeline
        metadata = self._analyze_pipeline(pipeline_class)
        
        # 生成 YAML
        workflow = self._generate_workflow_yaml(metadata, metadata["config"])
        
        # 确定输出路径
        if output_path:
            output_file = Path(output_path)
        else:
            workflow_name = (
                metadata["name"]
                .lower()
                .replace("pipeline", "")
                .replace("_", "-")
            )
            output_file = self.workflows_dir / f"{workflow_name}.yml"
        
        # 检查文件是否存在
        if output_file.exists() and not update:
            raise FileExistsError(
                f"文件已存在: {output_file}。使用 --update 参数来更新文件。"
            )
        
        # 写入文件
        output_file.parent.mkdir(parents=True, exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            yaml.dump(workflow, f, default_flow_style=False, sort_keys=False)
        
        return output_file


def main() -> None:
    """命令行入口"""
    parser = argparse.ArgumentParser(description='生成 GitHub Action workflow')
    parser.add_argument('--pipeline', required=True, help='Pipeline 类名')
    parser.add_argument('--output', help='输出文件路径')
    parser.add_argument('--update', action='store_true', help='更新已存在的文件')
    
    args = parser.parse_args()
    
    try:
        generator = ScaffoldGenerator()
        output_file = generator.generate(
            args.pipeline,
            args.output,
            args.update
        )
        print(f"✓ 成功生成工作流文件: {output_file}")
    except Exception as e:
        print(f"✗ 错误: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()


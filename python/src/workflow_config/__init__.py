"""工作流配置子模块"""

from .setup_builder import SetupBuilder
from .trigger_builder import TriggerBuilder

# 重新导出父目录 workflow_config.py 中的内容
# 使用 importlib 避免循环导入
import importlib.util
from pathlib import Path

# 加载父目录的 workflow_config.py
parent_dir = Path(__file__).parent.parent
workflow_config_file = parent_dir / "workflow_config.py"
if workflow_config_file.exists():
    spec = importlib.util.spec_from_file_location("workflow_config_module", workflow_config_file)
    workflow_config_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(workflow_config_module)
    
    # 重新导出
    WorkflowConfig = workflow_config_module.WorkflowConfig
    create_workflow_config = workflow_config_module.create_workflow_config
else:
    # 如果文件不存在，定义占位符
    WorkflowConfig = None
    create_workflow_config = None

__all__ = ["SetupBuilder", "TriggerBuilder", "WorkflowConfig", "create_workflow_config"]


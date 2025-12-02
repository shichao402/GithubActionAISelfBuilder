"""
触发条件构建器

负责构建工作流的触发条件配置。
"""

from typing import Dict, Optional, Any, List, Union


class TriggerBuilder:
    """触发条件构建器"""
    
    def __init__(self) -> None:
        self._triggers: Dict[str, Any] = {}
    
    def on_push(
        self,
        branches: Union[List[str], str] = None
    ) -> "TriggerBuilder":
        """添加 push 触发条件"""
        if branches is None:
            branches = ["main", "master"]
        self._triggers["push"] = {
            "branches": branches if isinstance(branches, list) else [branches],
        }
        return self
    
    def on_pull_request(
        self,
        branches: Union[List[str], str] = None
    ) -> "TriggerBuilder":
        """添加 pull_request 触发条件"""
        if branches is None:
            branches = ["main", "master"]
        self._triggers["pull_request"] = {
            "branches": branches if isinstance(branches, list) else [branches],
        }
        return self
    
    def on_release(
        self,
        types: Union[List[str], str] = None
    ) -> "TriggerBuilder":
        """添加 release 触发条件"""
        if types is None:
            types = ["published"]
        self._triggers["release"] = {
            "types": types if isinstance(types, list) else [types],
        }
        return self
    
    def on_workflow_dispatch(
        self,
        inputs: Optional[Dict[str, Any]] = None
    ) -> "TriggerBuilder":
        """添加 workflow_dispatch 触发条件"""
        self._triggers["workflow_dispatch"] = {}
        if inputs:
            self._triggers["workflow_dispatch"]["inputs"] = inputs
        return self
    
    def on_schedule(self, cron: str) -> "TriggerBuilder":
        """添加 schedule 触发条件"""
        if "schedule" not in self._triggers:
            self._triggers["schedule"] = []
        self._triggers["schedule"].append({"cron": cron})
        return self
    
    def build(self) -> Dict[str, Any]:
        """构建 TriggerConfig"""
        return dict(self._triggers) if self._triggers else {}
    
    def get_triggers(self) -> Dict[str, Any]:
        """获取当前触发配置"""
        return dict(self._triggers)


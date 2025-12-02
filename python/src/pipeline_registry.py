"""
Pipeline 注册表

管理 Pipeline 类的注册和查找，解耦 ScaffoldGenerator 与文件系统操作。
提供统一的 Pipeline 类管理接口，提高可测试性和可维护性。
"""

from typing import Dict, Optional, Type
from .base_pipeline import BasePipeline


class PipelineMetadata:
    """Pipeline 元数据"""
    
    def __init__(
        self,
        name: str,
        pipeline_class: Type[BasePipeline],
        module_path: Optional[str] = None
    ):
        self.name = name
        self.class_name = name
        self.pipeline_class = pipeline_class
        self.module_path = module_path


class PipelineRegistry:
    """Pipeline 注册表（单例模式）"""
    
    _instance: Optional["PipelineRegistry"] = None
    
    def __init__(self):
        if PipelineRegistry._instance is not None:
            raise RuntimeError("PipelineRegistry 是单例，请使用 get_instance()")
        self._pipelines: Dict[str, PipelineMetadata] = {}
    
    @classmethod
    def get_instance(cls) -> "PipelineRegistry":
        """获取注册表实例（单例）"""
        if cls._instance is None:
            cls._instance = cls.__new__(cls)
            cls._instance.__init__()
        return cls._instance
    
    def register(
        self,
        class_name: str,
        pipeline_class: Type[BasePipeline],
        module_path: Optional[str] = None
    ) -> None:
        """注册 Pipeline 类"""
        # 验证是否是 BasePipeline 的子类
        if not isinstance(pipeline_class, type) or not issubclass(pipeline_class, BasePipeline):
            raise ValueError(f"Pipeline 类 {class_name} 必须继承自 BasePipeline")
        
        metadata = PipelineMetadata(class_name, pipeline_class, module_path)
        self._pipelines[class_name] = metadata
    
    def get(self, class_name: str) -> Optional[Type[BasePipeline]]:
        """根据类名获取 Pipeline 类"""
        metadata = self._pipelines.get(class_name)
        return metadata.pipeline_class if metadata else None
    
    def get_metadata(self, class_name: str) -> Optional[PipelineMetadata]:
        """根据类名获取 Pipeline 元数据"""
        return self._pipelines.get(class_name)
    
    def has(self, class_name: str) -> bool:
        """检查 Pipeline 是否已注册"""
        return class_name in self._pipelines
    
    def get_all_names(self) -> list:
        """获取所有已注册的 Pipeline 类名"""
        return list(self._pipelines.keys())
    
    def get_all_metadata(self) -> list:
        """获取所有已注册的 Pipeline 元数据"""
        return list(self._pipelines.values())
    
    def clear(self) -> None:
        """清空注册表（主要用于测试）"""
        self._pipelines.clear()
    
    def register_batch(
        self,
        registrations: list
    ) -> None:
        """批量注册 Pipeline 类"""
        for reg in registrations:
            self.register(
                reg["class_name"],
                reg["pipeline_class"],
                reg.get("module_path")
            )


def get_pipeline_registry() -> PipelineRegistry:
    """获取全局 Pipeline 注册表实例"""
    return PipelineRegistry.get_instance()


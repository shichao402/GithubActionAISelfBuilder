"""
发布流水线

核心流程：
1. 下载构建产物
2. 创建 GitHub Release

使用 GitHub API 客户端抽象层，根据运行环境自动选择实现。
"""

from typing import Dict, Any, Optional
from pathlib import Path
from ...base_pipeline import PipelineResult
from ..base.release_base_pipeline import ReleaseBasePipeline


class ReleasePipeline(ReleaseBasePipeline):
    """发布流水线"""
    
    @staticmethod
    def get_workflow_inputs() -> Dict[str, Any]:
        """定义工作流输入参数（继承自 ReleaseBasePipeline）"""
        return super().get_workflow_inputs()
    
    def get_build_run_id(self, build_branch: str) -> Optional[str]:
        """查询构建分支的工作流运行 ID（覆盖父类方法）"""
        if not build_branch:
            return None
        return self.github_client.get_workflow_run_id(build_branch, "success")
    
    def download_artifacts(self, run_id: Optional[str]) -> Optional[str]:
        """下载构建产物（覆盖父类方法）"""
        if not run_id:
            # 如果没有 runId，尝试从当前 artifacts 目录读取
            artifacts_dir = Path(self.project_root) / "artifacts"
            if artifacts_dir.exists():
                self.log("info", f"使用本地产物目录: {artifacts_dir}")
                return str(artifacts_dir)
            return None
        
        self.log("info", f"下载工作流运行 {run_id} 的产物...")
        
        artifacts_dir = Path(self.project_root) / "artifacts" / f"run-{run_id}"
        artifacts_dir.mkdir(parents=True, exist_ok=True)
        
        success = self.github_client.download_artifacts(run_id, str(artifacts_dir))
        return str(artifacts_dir) if success else None
    
    def create_release(
        self,
        version: str,
        release_notes: str,
        artifact_path: Optional[str]
    ) -> bool:
        """创建 GitHub Release（覆盖父类方法）"""
        self.log("info", f"创建 GitHub Release v{version}...")
        
        # 收集产物文件
        files: list = []
        if artifact_path and Path(artifact_path).exists():
            def collect_files(dir_path: Path) -> None:
                for item in dir_path.iterdir():
                    if item.is_file():
                        files.append(str(item))
                    elif item.is_dir():
                        collect_files(item)
            
            collect_files(Path(artifact_path))
        
        return self.github_client.create_release(
            f"v{version}",
            release_notes,
            files if files else None
        )
    
    def execute(self) -> PipelineResult:
        """执行发布逻辑（调用父类的 execute 方法）"""
        return super().execute()


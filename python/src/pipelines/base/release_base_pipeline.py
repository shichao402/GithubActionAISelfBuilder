"""
通用发布流水线基类

提供通用的发布流程：
1. 检查 GitHub CLI
2. 查询构建工作流运行（可选）
3. 下载构建产物（可选）
4. 创建 GitHub Release

项目特定的 Pipeline 可以继承此类，只需实现特定的发布逻辑。
"""

from typing import Dict, Any, Optional
from pathlib import Path
import shutil
import subprocess
from ...base_pipeline import BasePipeline, PipelineResult
from ...workflow_config import create_workflow_config
from ...github_api_client import create_github_api_client


class ReleaseBasePipeline(BasePipeline):
    """通用发布流水线基类"""
    
    def __init__(
        self,
        inputs: Optional[Dict[str, Any]] = None,
        config_file: Optional[str] = None,
        project_root: Optional[str] = None
    ):
        super().__init__(inputs, config_file, project_root)
        # 延迟初始化，确保在构造函数完成后才初始化（此时环境变量已设置）
        self.github_client = create_github_api_client(
            lambda level, msg: self.log(level, msg)
        )
    
    @staticmethod
    def get_workflow_inputs() -> Dict[str, Any]:
        """定义工作流输入参数"""
        config = create_workflow_config()
        config.add_input("version", "发布版本号", True)
        config.add_input("release-notes", "发布说明", False, "")
        config.add_input("artifact-name", "构建产物名称", False, "build-artifacts")
        config.add_input("build-branch", "构建分支（用于查询工作流运行）", False, "build")
        return config.to_dict().get("inputs", {})
    
    @staticmethod
    def get_workflow_setup() -> Dict[str, Any]:
        """定义准备阶段配置"""
        config = create_workflow_config()
        config.setup_node("18", "npm")
        return config.to_dict().get("setup", {})
    
    @staticmethod
    def get_workflow_triggers() -> Dict[str, Any]:
        """定义触发条件"""
        config = create_workflow_config()
        config.on_workflow_dispatch({
            "version": {
                "description": "发布版本号",
                "required": True,
            },
            "release-notes": {
                "description": "发布说明",
                "required": False,
                "default": "",
            },
            "build-branch": {
                "description": "构建分支",
                "required": False,
                "default": "build",
            },
        })
        return config.to_dict().get("triggers", {})
    
    @staticmethod
    def get_workflow_runs_on() -> str:
        """定义运行环境"""
        return "ubuntu-latest"
    
    def check_authentication(self) -> bool:
        """检查认证状态"""
        import os
        
        # 如果在 GitHub Actions 环境中，自动使用 GITHUB_TOKEN
        if os.environ.get("GITHUB_ACTIONS") == "true":
            self.log("info", "检测到 GitHub Actions 环境，自动使用 GITHUB_TOKEN")
            return True
        
        # 本地环境：检查 GitHub CLI 是否已安装和认证
        self.log("info", "检测到本地环境，检查 GitHub CLI 认证状态...")
        
        # 检查是否安装
        if not shutil.which("gh"):
            self.log("error", "❌ 未安装 GitHub CLI (gh)")
            self.log("error", "   请先安装：https://cli.github.com/")
            return False
        
        # 检查是否已认证
        import subprocess
        result = subprocess.run(
            ["gh", "auth", "status"],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            self.log("error", "❌ GitHub CLI 未认证")
            self.log("error", "   请运行以下命令进行认证：")
            self.log("error", "   gh auth login")
            return False
        
        self.log("info", "✅ GitHub CLI 已就绪并已认证")
        return True
    
    def get_build_run_id(self, build_branch: str) -> Optional[str]:
        """查询构建分支的工作流运行 ID（可被子类覆盖）"""
        if not build_branch:
            return None
        
        self.log("info", f"查询分支 {build_branch} 的工作流运行...")
        
        try:
            run_id = self.github_client.get_workflow_run_id(build_branch, "success")
            if run_id:
                self.log("info", f"✅ 找到工作流运行: {run_id}")
            else:
                self.log("warning", f"未找到分支 {build_branch} 的成功工作流运行")
            return run_id
        except Exception as e:
            self.log("warning", f"查询工作流运行失败: {str(e)}")
            return None
    
    def download_artifacts(self, run_id: Optional[str]) -> Optional[str]:
        """下载构建产物（可被子类覆盖）"""
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
        
        try:
            success = self.github_client.download_artifacts(str(run_id), str(artifacts_dir))
            if success:
                return str(artifacts_dir)
            return None
        except Exception as e:
            self.log("warning", f"下载产物失败: {str(e)}")
            return None
    
    def create_release(
        self,
        version: str,
        release_notes: str,
        artifact_path: Optional[str]
    ) -> bool:
        """创建 GitHub Release（可被子类覆盖）"""
        self.log("info", f"创建 GitHub Release v{version}...")
        
        try:
            # 收集要上传的文件（如果有产物路径）
            files: list = []
            if artifact_path and Path(artifact_path).exists():
                # 简化处理：如果是目录，收集所有文件
                def collect_files(dir_path: Path) -> None:
                    for item in dir_path.iterdir():
                        if item.is_file():
                            files.append(str(item))
                        elif item.is_dir():
                            collect_files(item)
                
                collect_files(Path(artifact_path))
            
            # 使用 GitHub API 客户端
            success = self.github_client.create_release(
                f"v{version}",
                release_notes or f"Release {version}",
                files if files else None
            )
            
            return success
        except Exception as e:
            self.log("error", f"创建 Release 失败: {str(e)}")
            return False
    
    def execute(self) -> PipelineResult:
        """执行通用发布流程"""
        try:
            version = self.get_input("version")
            if not version:
                return PipelineResult(
                    success=False,
                    message="版本号是必需的",
                    exit_code=1
                )
            
            release_notes = self.get_input("release-notes") or f"Release {version}"
            build_branch = self.get_input("build-branch") or "build"
            artifact_name = self.get_input("artifact-name") or "build-artifacts"
            
            self.log("info", f"开始发布流程 v{version}...")
            
            # 1. 检查认证状态
            if not self.check_authentication():
                return PipelineResult(
                    success=False,
                    message="认证检查失败，请根据上述提示进行修复",
                    exit_code=1
                )
            
            # 2. 查询构建工作流运行
            run_id = self.get_build_run_id(build_branch)
            
            # 3. 下载产物
            artifact_path = self.download_artifacts(run_id)
            
            # 4. 创建 Release
            release_success = self.create_release(version, release_notes, artifact_path)
            
            if not release_success:
                return PipelineResult(
                    success=False,
                    message="创建 Release 失败",
                    exit_code=1
                )
            
            self.set_output("version", version)
            self.set_output("release-status", "success")
            
            return PipelineResult(
                success=True,
                message=f"Release v{version} 创建成功",
                data={
                    "version": version,
                    "artifact-path": artifact_path or "",
                },
                exit_code=0
            )
        except Exception as e:
            return PipelineResult(
                success=False,
                message=f"发布流程失败: {str(e)}",
                exit_code=1
            )


"""
通用构建流水线基类

提供通用的构建流程：
1. 环境设置（可选）
2. 执行构建命令
3. 处理构建产物
4. 上传产物（可选）

项目特定的 Pipeline 可以继承此类，只需实现特定的构建逻辑。
"""

from typing import Dict, Any, Optional
from pathlib import Path
from ...base_pipeline import BasePipeline, PipelineResult
from ...workflow_config import create_workflow_config


class BuildPipeline(BasePipeline):
    """通用构建流水线基类"""
    
    @staticmethod
    def get_workflow_inputs() -> Dict[str, Any]:
        """定义工作流输入参数"""
        config = create_workflow_config()
        config.add_input("setup-command", "环境设置命令（如安装依赖）", False, "")
        config.add_input("build-command", "构建命令", False, "")
        config.add_input("artifact-path", "构建产物路径", False, "artifacts/**")
        config.add_input("build-type", "构建类型（debug/release）", False, "release")
        config.add_input("upload-artifacts", "是否上传构建产物", False, "true")
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
        config.on_push(["main", "develop"])
        config.on_pull_request(["main", "develop"])
        config.on_workflow_dispatch()
        return config.to_dict().get("triggers", {})
    
    @staticmethod
    def get_workflow_runs_on() -> str:
        """定义运行环境"""
        return "ubuntu-latest"
    
    def setup_environment(self) -> bool:
        """执行环境设置（可被子类覆盖）"""
        setup_command = self.get_input("setup-command", "")
        if setup_command:
            self.log("info", f"执行环境设置: {setup_command}")
            return self.run_command(setup_command)
        return True
    
    def perform_build(self) -> bool:
        """执行构建（可被子类覆盖）"""
        build_command = self.get_input("build-command", "")
        if build_command:
            self.log("info", f"执行构建命令: {build_command}")
            return self.run_command(build_command)
        return True
    
    def process_artifacts(self) -> Optional[str]:
        """处理构建产物（可被子类覆盖）"""
        artifact_path = self.get_input("artifact-path", "artifacts/**")
        
        # 如果指定了具体路径，检查是否存在
        if artifact_path and "**" not in artifact_path:
            full_path = Path(self.project_root) / artifact_path
            if full_path.exists():
                self.log("info", f"构建产物路径: {full_path}")
                return str(full_path)
        
        # 默认检查 artifacts 目录
        artifacts_dir = Path(self.project_root) / "artifacts"
        if artifacts_dir.exists():
            self.log("info", f"构建产物目录: {artifacts_dir}")
            return str(artifacts_dir)
        
        return None
    
    def upload_artifacts(self, artifact_path: Optional[str]) -> bool:
        """上传构建产物（可被子类覆盖）
        
        注意：实际的上传由脚手架生成的 workflow 中的 actions/upload-artifact@v4 处理
        这里只负责准备产物路径，设置输出供 workflow 使用
        """
        upload_artifacts = self.get_input("upload-artifacts", "true") == "true"
        if not upload_artifacts or not artifact_path:
            return True
        
        # Pipeline 类不直接上传，而是设置输出
        # 脚手架生成的 workflow 会自动添加上传步骤
        self.log("info", f"构建产物已准备: {artifact_path}")
        self.log("info", "产物上传将由 workflow 中的 actions/upload-artifact@v4 处理")
        
        return True
    
    def execute(self) -> PipelineResult:
        """执行通用构建流程"""
        self.log("info", "=" * 60)
        self.log("info", "开始执行构建流程")
        self.log("info", "=" * 60)
        
        try:
            # 1. 环境设置
            if not self.setup_environment():
                return PipelineResult(
                    success=False,
                    message="环境设置失败",
                    exit_code=1
                )
            
            # 2. 执行构建
            if not self.perform_build():
                return PipelineResult(
                    success=False,
                    message="构建失败",
                    exit_code=1
                )
            
            # 3. 处理产物
            artifact_path = self.process_artifacts()
            if not artifact_path:
                self.log("warning", "未找到构建产物，但构建可能已成功")
            
            # 4. 上传产物
            self.upload_artifacts(artifact_path)
            
            # 5. 设置输出
            self.set_output("build-status", "success")
            self.set_output("artifact-path", artifact_path or "")
            self.set_output("build-type", self.get_input("build-type", "release"))
            
            self.log("info", "=" * 60)
            self.log("info", "✅ 构建流程完成")
            self.log("info", "=" * 60)
            
            return PipelineResult(
                success=True,
                message="构建成功",
                data={
                    "artifact-path": artifact_path or "",
                    "build-type": self.get_input("build-type", "release"),
                },
                exit_code=0
            )
        except Exception as e:
            error_msg = f"构建过程中发生错误: {str(e)}"
            self.log("error", error_msg)
            return PipelineResult(
                success=False,
                message=error_msg,
                exit_code=1
            )


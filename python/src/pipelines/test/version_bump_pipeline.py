"""
版本号递增流水线

从 JSON 文件中读取当前版本号，递增版本号，并保存回文件
"""

import json
from typing import Dict, Any, Literal
from pathlib import Path
from ...base_pipeline import BasePipeline, PipelineResult
from ...workflow_config import create_workflow_config


class VersionBumpPipeline(BasePipeline):
    """版本号递增流水线"""
    
    @staticmethod
    def get_workflow_inputs() -> Dict[str, Any]:
        """定义工作流输入参数"""
        config = create_workflow_config()
        config.add_input("version-file", "版本号文件路径", False, "package.json")
        config.add_input("version-type", "版本号类型 (major|minor|patch)", False, "patch")
        config.add_input("commit-changes", "是否提交更改", False, "true")
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
            "version-file": {
                "description": "版本号文件路径",
                "required": False,
                "default": "package.json",
            },
            "version-type": {
                "description": "版本号类型 (major|minor|patch)",
                "required": False,
                "default": "patch",
            },
            "commit-changes": {
                "description": "是否提交更改",
                "required": False,
                "default": "true",
            },
        })
        return config.to_dict().get("triggers", {})
    
    @staticmethod
    def get_workflow_runs_on() -> str:
        """定义运行环境"""
        return "ubuntu-latest"
    
    def bump_version(
        self,
        version: str,
        version_type: Literal["major", "minor", "patch"]
    ) -> str:
        """递增版本号"""
        parts = [int(x) for x in version.split(".")]
        if len(parts) != 3:
            raise ValueError(f"无效的版本号格式: {version}")
        
        if version_type == "major":
            parts[0] += 1
            parts[1] = 0
            parts[2] = 0
        elif version_type == "minor":
            parts[1] += 1
            parts[2] = 0
        elif version_type == "patch":
            parts[2] += 1
        else:
            raise ValueError(f"无效的版本号类型: {version_type}")
        
        return ".".join(map(str, parts))
    
    def execute(self) -> PipelineResult:
        """执行流水线逻辑"""
        try:
            # 获取输入参数
            version_file = self.get_input("version-file", "package.json")
            version_type = self.get_input("version-type", "patch")
            commit_changes = self.get_input("commit-changes", "true") == "true"
            
            # 验证版本号类型
            if version_type not in ["major", "minor", "patch"]:
                return PipelineResult(
                    success=False,
                    message=f"无效的版本号类型: {version_type}。必须是 major、minor 或 patch",
                    exit_code=1
                )
            
            # 读取版本号文件
            file_path = Path(self.project_root) / version_file
            if not file_path.exists():
                return PipelineResult(
                    success=False,
                    message=f"版本号文件不存在: {file_path}",
                    exit_code=1
                )
            
            self.log("info", f"读取版本号文件: {file_path}")
            with open(file_path, "r", encoding="utf-8") as f:
                json_data = json.load(f)
            
            # 获取当前版本号
            if "version" not in json_data:
                return PipelineResult(
                    success=False,
                    message=f"文件中未找到 version 字段: {file_path}",
                    exit_code=1
                )
            
            current_version = json_data["version"]
            self.log("info", f"当前版本号: {current_version}")
            
            # 递增版本号
            new_version = self.bump_version(current_version, version_type)
            self.log("info", f"新版本号: {new_version}")
            
            # 更新版本号
            json_data["version"] = new_version
            
            # 保存文件
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(json_data, f, indent=2, ensure_ascii=False)
                f.write("\n")
            
            self.log("info", f"版本号已更新: {current_version} -> {new_version}")
            
            # 设置输出
            self.set_output("old-version", current_version)
            self.set_output("new-version", new_version)
            self.set_output("version-file", version_file)
            
            # 提交更改（如果需要）
            if commit_changes:
                self.log("info", "提交版本号更改...")
                git_add_success = self.run_command(f"git add {version_file}")
                if not git_add_success:
                    self.log("warning", "git add 失败，但版本号已更新")
                else:
                    git_commit_success = self.run_command(
                        f'git commit -m "chore: bump version to {new_version}"'
                    )
                    if not git_commit_success:
                        self.log("warning", "git commit 失败，但版本号已更新")
                    else:
                        self.log("info", "版本号更改已提交")
                        self.set_output("committed", "true")
            else:
                self.set_output("committed", "false")
            
            return PipelineResult(
                success=True,
                message=f"版本号已从 {current_version} 更新为 {new_version}",
                data={
                    "old-version": current_version,
                    "new-version": new_version,
                    "version-file": version_file,
                    "version-type": version_type,
                },
                exit_code=0
            )
        except Exception as e:
            return PipelineResult(
                success=False,
                message=f"执行失败: {str(e)}",
                exit_code=1
            )


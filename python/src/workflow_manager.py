"""
GitHub Actions Workflow 管理器

提供触发、监控和管理 GitHub Actions workflow 的功能
"""

import os
import subprocess
import time
import json
from pathlib import Path
from typing import Optional, Dict, Any, List
import shutil


class WorkflowManager:
    """GitHub Actions Workflow 管理器"""
    
    def __init__(self, project_root: Optional[str] = None):
        self.project_root = Path(project_root or self._detect_project_root())
    
    def _detect_project_root(self) -> Path:
        """检测项目根目录"""
        current = Path.cwd()
        while current != current.parent:
            if (current / ".git").exists():
                return current
            current = current.parent
        return Path.cwd()
    
    def check_gh_cli(self) -> bool:
        """检查 GitHub CLI 是否已安装"""
        return shutil.which("gh") is not None
    
    def check_gh_auth(self) -> bool:
        """检查 GitHub CLI 是否已认证"""
        if not self.check_gh_cli():
            return False
        
        try:
            result = subprocess.run(
                ["gh", "auth", "status"],
                capture_output=True,
                text=True,
                check=False
            )
            return result.returncode == 0
        except Exception:
            return False
    
    def get_repo_info(self) -> Optional[str]:
        """获取仓库信息（owner/repo）"""
        try:
            result = subprocess.run(
                ["gh", "repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"],
                capture_output=True,
                text=True,
                check=False
            )
            if result.returncode == 0:
                return result.stdout.strip()
        except Exception:
            pass
        return None
    
    def trigger_workflow(
        self,
        workflow_file: str,
        ref: str = "main",
        inputs: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """触发 GitHub Actions workflow"""
        if not self.check_gh_cli():
            return {
                "success": False,
                "message": "错误：未找到 GitHub CLI (gh)"
            }
        
        if not self.check_gh_auth():
            return {
                "success": False,
                "message": "错误：GitHub CLI 未登录"
            }
        
        workflow_path = self.project_root / workflow_file
        if not workflow_path.exists():
            return {
                "success": False,
                "message": f"错误：workflow 文件不存在: {workflow_file}"
            }
        
        workflow_id = workflow_path.name
        
        # 构建命令
        cmd = ["gh", "workflow", "run", workflow_id, "--ref", ref]
        
        # 添加输入参数
        if inputs:
            for key, value in inputs.items():
                cmd.extend(["-f", f"{key}={value}"])
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=False
            )
            
            if result.returncode == 0:
                # 从输出中提取 run ID
                output = result.stdout + result.stderr
                run_id = None
                # 尝试从输出中提取 run ID
                import re
                match = re.search(r"run ID: (\d+)", output)
                if match:
                    run_id = int(match.group(1))
                
                return {
                    "success": True,
                    "run_id": run_id,
                    "message": "Workflow 触发成功"
                }
            else:
                return {
                    "success": False,
                    "message": f"触发失败: {result.stderr}"
                }
        except Exception as e:
            return {
                "success": False,
                "message": f"触发失败: {str(e)}"
            }
    
    def monitor_workflow(
        self,
        run_id: int,
        poll_interval: int = 5,
        timeout: int = 3600
    ) -> Dict[str, Any]:
        """监控 workflow 执行状态"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                result = subprocess.run(
                    ["gh", "run", "view", str(run_id), "--json", "status,conclusion"],
                    capture_output=True,
                    text=True,
                    check=False
                )
                
                if result.returncode == 0:
                    data = json.loads(result.stdout)
                    status = data.get("status")
                    conclusion = data.get("conclusion")
                    
                    if status == "completed":
                        return {
                            "success": conclusion == "success",
                            "status": status,
                            "conclusion": conclusion,
                            "run_id": run_id
                        }
                    
                    print(f"⏳ Workflow 状态: {status}...")
                else:
                    print(f"⚠️  查询状态失败: {result.stderr}")
                
                time.sleep(poll_interval)
            except Exception as e:
                print(f"⚠️  监控错误: {str(e)}")
                time.sleep(poll_interval)
        
        return {
            "success": False,
            "status": "timeout",
            "message": "监控超时"
        }
    
    def collect_workflow_logs(self, run_id: int) -> Optional[Path]:
        """收集 workflow 失败日志"""
        try:
            logs_dir = self.project_root / "workflow-logs"
            logs_dir.mkdir(exist_ok=True)
            
            log_file = logs_dir / f"run-{run_id}.log"
            
            result = subprocess.run(
                ["gh", "run", "view", str(run_id), "--log-failed"],
                capture_output=True,
                text=True,
                check=False
            )
            
            if result.returncode == 0:
                log_file.write_text(result.stdout, encoding="utf-8")
                return log_file
        except Exception as e:
            print(f"收集日志失败: {str(e)}")
        
        return None
    
    def run_workflow(
        self,
        workflow_file: str,
        ref: str = "main",
        inputs: Optional[Dict[str, str]] = None,
        poll_interval: int = 5,
        timeout: int = 3600
    ) -> Dict[str, Any]:
        """触发并监控 workflow"""
        # 触发 workflow
        trigger_result = self.trigger_workflow(workflow_file, ref, inputs)
        if not trigger_result.get("success"):
            return trigger_result
        
        run_id = trigger_result.get("run_id")
        if not run_id:
            return {
                "success": False,
                "message": "无法获取 run ID"
            }
        
        print(f"✅ Workflow 已触发，run ID: {run_id}")
        print("⏳ 监控执行状态...")
        
        # 监控 workflow
        monitor_result = self.monitor_workflow(run_id, poll_interval, timeout)
        
        # 如果失败，收集日志
        if not monitor_result.get("success"):
            print("📋 收集失败日志...")
            log_file = self.collect_workflow_logs(run_id)
            if log_file:
                monitor_result["log_file"] = str(log_file)
        
        return monitor_result


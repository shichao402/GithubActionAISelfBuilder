"""
GitHub API 客户端抽象层

根据运行环境自动选择实现：
- GitHub Actions 环境：使用 PyGithub（自动使用 GITHUB_TOKEN）
- 本地环境：使用 GitHub CLI（需要 gh auth login）

保持流水线设计一致性，无需关心底层实现
"""

import os
import subprocess
import shutil
from pathlib import Path
from typing import Optional, List, Callable, Any
from zipfile import ZipFile

# 日志函数类型
LogFunction = Callable[[str, str], None]


class GitHubApiClient:
    """GitHub API 客户端接口"""
    
    def get_workflow_run_id(self, branch: str, status: str = "success") -> Optional[str]:
        """查询工作流运行 ID"""
        raise NotImplementedError
    
    def download_artifacts(self, run_id: str, target_dir: str) -> bool:
        """下载工作流运行产物"""
        raise NotImplementedError
    
    def create_release(
        self,
        tag: str,
        notes: str,
        files: Optional[List[str]] = None
    ) -> bool:
        """创建 GitHub Release"""
        raise NotImplementedError


def is_github_actions() -> bool:
    """检测是否在 GitHub Actions 环境中"""
    return os.environ.get("GITHUB_ACTIONS") == "true"


class GitHubCliClient(GitHubApiClient):
    """使用 GitHub CLI 的实现（本地环境）"""
    
    def __init__(self, log: LogFunction):
        self.log = log
    
    def get_workflow_run_id(self, branch: str, status: str = "success") -> Optional[str]:
        """查询工作流运行 ID"""
        try:
            result = subprocess.run(
                [
                    "gh", "run", "list",
                    "--branch", branch,
                    "--status", status,
                    "--limit", "1",
                    "--json", "databaseId",
                    "--jq", ".[0].databaseId"
                ],
                capture_output=True,
                text=True,
                check=False
            )
            
            if result.returncode != 0:
                error_msg = result.stderr
                if "authentication" in error_msg.lower() or "not logged in" in error_msg.lower():
                    self.log("error", "❌ GitHub CLI 认证失败")
                    self.log("error", "   请运行以下命令进行认证：")
                    self.log("error", "   gh auth login")
                else:
                    self.log("warning", f"查询工作流运行失败: {error_msg}")
                return None
            
            run_id = result.stdout.strip()
            return run_id if run_id and run_id != "null" else None
        except Exception as e:
            self.log("warning", f"查询工作流运行失败: {str(e)}")
            return None
    
    def download_artifacts(self, run_id: str, target_dir: str) -> bool:
        """下载工作流运行产物"""
        try:
            Path(target_dir).mkdir(parents=True, exist_ok=True)
            
            result = subprocess.run(
                ["gh", "run", "download", run_id, "--dir", target_dir],
                capture_output=True,
                text=True,
                check=False
            )
            
            if result.returncode != 0:
                error_msg = result.stderr
                if "authentication" in error_msg.lower() or "not logged in" in error_msg.lower():
                    self.log("error", "❌ GitHub CLI 认证失败")
                    self.log("error", "   请运行以下命令进行认证：")
                    self.log("error", "   gh auth login")
                else:
                    self.log("warning", f"下载产物失败: {error_msg}")
                return False
            
            self.log("info", f"✅ 产物下载完成: {target_dir}")
            return True
        except Exception as e:
            self.log("warning", f"下载产物失败: {str(e)}")
            return False
    
    def create_release(
        self,
        tag: str,
        notes: str,
        files: Optional[List[str]] = None
    ) -> bool:
        """创建 GitHub Release"""
        try:
            args = ["gh", "release", "create", tag, "--notes", notes]
            if files:
                args.extend(files)
            
            result = subprocess.run(
                args,
                capture_output=True,
                text=True,
                check=False
            )
            
            if result.returncode != 0:
                error_msg = result.stderr
                if "authentication" in error_msg.lower() or "not logged in" in error_msg.lower():
                    self.log("error", "❌ GitHub CLI 认证失败")
                    self.log("error", "   请运行以下命令进行认证：")
                    self.log("error", "   gh auth login")
                else:
                    self.log("error", f"创建 Release 失败: {error_msg}")
                return False
            
            self.log("info", f"✅ Release {tag} 创建成功！")
            return True
        except Exception as e:
            self.log("error", f"创建 Release 失败: {str(e)}")
            return False


class GitHubActionsClient(GitHubApiClient):
    """使用 PyGithub 的实现（GitHub Actions 环境）"""
    
    def __init__(self, log: LogFunction):
        self.log = log
        
        try:
            from github import Github
            
            token = os.environ.get("GITHUB_TOKEN")
            if not token:
                raise ValueError(
                    "GITHUB_TOKEN 环境变量未设置。"
                    "在 GitHub Actions 中，GITHUB_TOKEN 应该自动可用。"
                )
            
            self.github = Github(token)
            
            # 获取仓库信息
            repo_name = os.environ.get("GITHUB_REPOSITORY", "")
            if repo_name:
                self.repo = self.github.get_repo(repo_name)
            else:
                raise ValueError("GITHUB_REPOSITORY 环境变量未设置")
        except ImportError:
            self.log("error", "❌ 未安装 PyGithub")
            self.log("error", "   请运行: pip install PyGithub")
            raise
        except Exception as e:
            self.log("error", f"初始化 GitHub API 客户端失败: {str(e)}")
            raise
    
    def get_workflow_run_id(self, branch: str, status: str = "success") -> Optional[str]:
        """查询工作流运行 ID"""
        try:
            # 获取工作流运行
            runs = self.repo.get_workflow_runs(branch=branch, status=status)
            for run in runs[:1]:  # 只取第一个
                return str(run.id)
            return None
        except Exception as e:
            self.log("warning", f"查询工作流运行失败: {str(e)}")
            return None
    
    def download_artifacts(self, run_id: str, target_dir: str) -> bool:
        """下载工作流运行产物"""
        try:
            Path(target_dir).mkdir(parents=True, exist_ok=True)
            
            # 获取工作流运行
            run = self.repo.get_workflow_run(int(run_id))
            
            # 获取 artifacts
            artifacts = run.get_artifacts()
            if not artifacts:
                self.log("warning", "未找到工作流运行产物")
                return False
            
            # 下载每个 artifact
            for artifact in artifacts:
                # 下载 artifact
                download_url = artifact.archive_download_url
                # 这里需要实现下载逻辑
                # 简化处理：使用 requests 下载
                try:
                    import requests
                    response = requests.get(
                        download_url,
                        headers={"Authorization": f"token {os.environ.get('GITHUB_TOKEN')}"},
                        stream=True
                    )
                    
                    zip_path = Path(target_dir) / f"{artifact.name}.zip"
                    with open(zip_path, "wb") as f:
                        for chunk in response.iter_content(chunk_size=8192):
                            f.write(chunk)
                    
                    # 解压
                    with ZipFile(zip_path) as zip_file:
                        zip_file.extractall(target_dir)
                    
                    zip_path.unlink()  # 删除 zip 文件
                    self.log("info", f"下载产物: {artifact.name}")
                except Exception as e:
                    self.log("warning", f"下载产物 {artifact.name} 失败: {str(e)}")
            
            self.log("info", f"✅ 产物下载完成: {target_dir}")
            return True
        except Exception as e:
            self.log("warning", f"下载产物失败: {str(e)}")
            return False
    
    def create_release(
        self,
        tag: str,
        notes: str,
        files: Optional[List[str]] = None
    ) -> bool:
        """创建 GitHub Release"""
        try:
            # 创建 Release
            release = self.repo.create_git_release(
                tag=tag,
                name=tag,
                message=notes,
                draft=False,
                prerelease=False
            )
            
            # 上传文件（如果有）
            if files:
                for file_path in files:
                    if not Path(file_path).exists():
                        self.log("warning", f"文件不存在: {file_path}")
                        continue
                    
                    release.upload_asset(
                        path=file_path,
                        label=Path(file_path).name
                    )
                    self.log("info", f"上传文件: {Path(file_path).name}")
            
            self.log("info", f"✅ Release {tag} 创建成功！")
            return True
        except Exception as e:
            self.log("error", f"创建 Release 失败: {str(e)}")
            return False


def create_github_api_client(log: LogFunction) -> GitHubApiClient:
    """创建 GitHub API 客户端（根据环境自动选择实现）"""
    if is_github_actions():
        log("info", "检测到 GitHub Actions 环境，使用 PyGithub")
        return GitHubActionsClient(log)
    else:
        log("info", "检测到本地环境，使用 GitHub CLI")
        return GitHubCliClient(log)


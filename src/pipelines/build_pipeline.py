"""
构建流水线脚本

这是一个完整的示例，展示如何创建一个功能完整的流水线脚本。
该脚本会被 GitHub Action 调用，执行项目的构建、测试和打包等操作。
"""

try:
    from src.base_pipeline import BasePipeline, PipelineResult
except ImportError:
    # 如果从 src 导入失败，尝试相对导入
    import sys
    from pathlib import Path
    base_path = Path(__file__).parent.parent
    if str(base_path) not in sys.path:
        sys.path.insert(0, str(base_path))
    from base_pipeline import BasePipeline, PipelineResult

import subprocess
import os
from pathlib import Path


class BuildPipeline(BasePipeline):
    """
    构建流水线
    
    功能：
    - 安装项目依赖
    - 运行代码检查（lint）
    - 运行单元测试
    - 构建项目
    - 生成构建产物
    - 上传构建产物（可选）
    """
    
    def validate(self) -> bool:
        """
        验证输入和前置条件
        
        Returns:
            验证是否通过
        """
        # 检查必需的输入参数
        required_inputs = ["project-name"]
        
        for key in required_inputs:
            if not self.get_input(key):
                self.log_github_action(
                    "error",
                    f"缺少必需的输入参数: {key}",
                    file=__file__
                )
                return False
        
        # 检查项目根目录是否存在
        project_root = Path.cwd()
        if not (project_root / "requirements.txt").exists():
            self.logger.warning("未找到 requirements.txt，某些步骤可能失败")
        
        return True
    
    def execute(self) -> PipelineResult:
        """
        执行构建流水线逻辑
        
        Returns:
            PipelineResult 对象，包含执行结果
        """
        self.logger.info("=" * 60)
        self.logger.info("开始执行构建流水线")
        self.logger.info("=" * 60)
        
        try:
            # 1. 获取输入参数
            project_name = self.get_input("project-name", "unknown")
            build_type = self.get_input("build-type", "release")
            run_tests = self.get_input("run-tests", "true").lower() == "true"
            run_lint = self.get_input("run-lint", "true").lower() == "true"
            upload_artifacts = self.get_input("upload-artifacts", "false").lower() == "true"
            
            self.logger.info(f"项目名称: {project_name}")
            self.logger.info(f"构建类型: {build_type}")
            self.logger.info(f"运行测试: {run_tests}")
            self.logger.info(f"运行代码检查: {run_lint}")
            self.logger.info(f"上传构建产物: {upload_artifacts}")
            
            # 2. 准备环境
            self.logger.info("\n[步骤 1/5] 准备构建环境...")
            if not self._prepare_environment():
                return PipelineResult(
                    success=False,
                    message="环境准备失败",
                    exit_code=1
                )
            
            # 3. 安装依赖
            self.logger.info("\n[步骤 2/5] 安装项目依赖...")
            if not self._install_dependencies():
                return PipelineResult(
                    success=False,
                    message="依赖安装失败",
                    exit_code=1
                )
            
            # 4. 运行代码检查（可选）
            if run_lint:
                self.logger.info("\n[步骤 3/5] 运行代码检查...")
                lint_result = self._run_lint()
                if not lint_result:
                    self.log_github_action(
                        "warning",
                        "代码检查发现问题，但继续执行"
                    )
            
            # 5. 运行测试（可选）
            if run_tests:
                self.logger.info("\n[步骤 4/5] 运行单元测试...")
                test_result = self._run_tests()
                if not test_result:
                    return PipelineResult(
                        success=False,
                        message="单元测试失败",
                        exit_code=1
                    )
            
            # 6. 构建项目
            self.logger.info("\n[步骤 5/5] 构建项目...")
            build_result = self._build_project(build_type)
            if not build_result:
                return PipelineResult(
                    success=False,
                    message="项目构建失败",
                    exit_code=1
                )
            
            # 7. 收集构建信息
            build_info = self._collect_build_info()
            
            # 8. 设置输出变量
            self.set_output("build-status", "success")
            self.set_output("build-version", build_info.get("version", "unknown"))
            self.set_output("build-type", build_type)
            self.set_output("build-artifacts", build_info.get("artifacts", ""))
            
            # 9. 上传构建产物（可选）
            if upload_artifacts:
                self.logger.info("\n上传构建产物...")
                self._upload_artifacts(build_info.get("artifacts", ""))
            
            self.logger.info("\n" + "=" * 60)
            self.logger.info("构建流水线执行成功！")
            self.logger.info("=" * 60)
            
            return PipelineResult(
                success=True,
                message=f"构建成功: {project_name} ({build_type})",
                data={
                    "project_name": project_name,
                    "build_type": build_type,
                    "version": build_info.get("version", "unknown"),
                    "artifacts": build_info.get("artifacts", ""),
                    "test_passed": run_tests,
                    "lint_passed": run_lint
                }
            )
            
        except Exception as e:
            error_msg = f"构建过程中发生错误: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            self.log_github_action("error", error_msg, file=__file__)
            return PipelineResult(
                success=False,
                message=error_msg,
                exit_code=1
            )
    
    def _prepare_environment(self) -> bool:
        """准备构建环境"""
        try:
            # 创建必要的目录
            artifacts_dir = Path("artifacts")
            artifacts_dir.mkdir(exist_ok=True)
            
            self.logger.info("✓ 构建环境准备完成")
            return True
        except Exception as e:
            self.logger.error(f"环境准备失败: {e}")
            return False
    
    def _install_dependencies(self) -> bool:
        """安装项目依赖"""
        try:
            # 检查是否有 requirements.txt
            if Path("requirements.txt").exists():
                result = subprocess.run(
                    ["pip", "install", "-r", "requirements.txt"],
                    capture_output=True,
                    text=True,
                    check=False
                )
                if result.returncode != 0:
                    self.logger.warning(f"依赖安装警告: {result.stderr}")
                else:
                    self.logger.info("✓ 依赖安装完成")
                return True
            else:
                self.logger.info("未找到 requirements.txt，跳过依赖安装")
                return True
        except Exception as e:
            self.logger.error(f"依赖安装失败: {e}")
            return False
    
    def _run_lint(self) -> bool:
        """运行代码检查"""
        try:
            # 示例：检查是否有 lint 工具
            # 这里只是示例，实际应该调用具体的 lint 工具
            self.logger.info("运行代码检查...")
            
            # 示例：检查 Python 文件
            python_files = list(Path("src").rglob("*.py")) if Path("src").exists() else []
            if python_files:
                self.logger.info(f"检查 {len(python_files)} 个 Python 文件")
                # 这里可以调用 flake8, pylint 等工具
                self.logger.info("✓ 代码检查完成（示例）")
            else:
                self.logger.info("未找到 Python 文件，跳过代码检查")
            
            return True
        except Exception as e:
            self.logger.warning(f"代码检查失败: {e}")
            return False
    
    def _run_tests(self) -> bool:
        """运行单元测试"""
        try:
            # 检查是否有测试目录
            test_dirs = ["tests", "test", "src/tests"]
            test_dir = None
            
            for td in test_dirs:
                if Path(td).exists():
                    test_dir = td
                    break
            
            if test_dir:
                self.logger.info(f"在 {test_dir} 目录中查找测试...")
                # 这里可以调用 pytest, unittest 等工具
                # result = subprocess.run(["pytest", test_dir], check=False)
                self.logger.info("✓ 测试执行完成（示例）")
                return True
            else:
                self.logger.info("未找到测试目录，跳过测试")
                return True
        except Exception as e:
            self.logger.error(f"测试执行失败: {e}")
            return False
    
    def _build_project(self, build_type: str) -> bool:
        """构建项目"""
        try:
            self.logger.info(f"构建类型: {build_type}")
            
            # 示例：创建构建产物
            artifacts_dir = Path("artifacts")
            build_file = artifacts_dir / f"build-{build_type}.txt"
            
            with open(build_file, "w", encoding="utf-8") as f:
                f.write(f"Build Type: {build_type}\n")
                f.write(f"Project: {self.get_input('project-name', 'unknown')}\n")
                f.write("Build completed successfully!\n")
            
            self.logger.info(f"✓ 构建完成，产物: {build_file}")
            return True
        except Exception as e:
            self.logger.error(f"构建失败: {e}")
            return False
    
    def _collect_build_info(self) -> dict:
        """收集构建信息"""
        artifacts_dir = Path("artifacts")
        artifacts = []
        
        if artifacts_dir.exists():
            for file in artifacts_dir.glob("*"):
                if file.is_file():
                    artifacts.append(str(file))
        
        return {
            "version": self.get_input("build-version", "1.0.0"),
            "artifacts": ";".join(artifacts) if artifacts else ""
        }
    
    def _upload_artifacts(self, artifacts: str):
        """上传构建产物（示例）"""
        if not artifacts:
            self.logger.info("没有构建产物需要上传")
            return
        
        artifact_list = artifacts.split(";")
        self.logger.info(f"准备上传 {len(artifact_list)} 个构建产物...")
        
        # 在 GitHub Action 中，可以使用 actions/upload-artifact
        # 这里只是示例
        for artifact in artifact_list:
            if Path(artifact).exists():
                self.logger.info(f"  - {artifact}")
        
        self.logger.info("✓ 构建产物上传完成（示例）")


if __name__ == "__main__":
    # 命令行入口：可以直接运行脚本
    BuildPipeline.main()


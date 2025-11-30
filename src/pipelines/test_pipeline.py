"""
测试流水线脚本

这是一个完整的测试流水线示例，展示如何创建专门的测试流水线。
该脚本会被 GitHub Action 调用，执行项目的测试、代码覆盖率检查等操作。
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
import json
from pathlib import Path


class TestPipeline(BasePipeline):
    """
    测试流水线
    
    功能：
    - 运行单元测试
    - 运行集成测试
    - 生成代码覆盖率报告
    - 检查测试覆盖率阈值
    - 上传测试报告（可选）
    """
    
    def validate(self) -> bool:
        """
        验证输入和前置条件
        
        Returns:
            验证是否通过
        """
        # 检查项目根目录是否存在
        project_root = Path.cwd()
        
        # 检查是否有测试目录
        test_dirs = ["tests", "test", "src/tests"]
        has_test_dir = any(Path(td).exists() for td in test_dirs)
        
        if not has_test_dir:
            self.log_github_action(
                "warning",
                "未找到测试目录，某些测试步骤可能被跳过",
                file=__file__
            )
        
        return True
    
    def execute(self) -> PipelineResult:
        """
        执行测试流水线逻辑
        
        Returns:
            PipelineResult 对象，包含执行结果
        """
        self.logger.info("=" * 60)
        self.logger.info("开始执行测试流水线")
        self.logger.info("=" * 60)
        
        try:
            # 1. 获取输入参数
            test_type = self.get_input("test-type", "all")
            coverage_threshold = float(self.get_input("coverage-threshold", "80"))
            run_unit_tests = self.get_input("run-unit-tests", "true").lower() == "true"
            run_integration_tests = self.get_input("run-integration-tests", "false").lower() == "true"
            upload_reports = self.get_input("upload-reports", "true").lower() == "true"
            
            self.logger.info(f"测试类型: {test_type}")
            self.logger.info(f"覆盖率阈值: {coverage_threshold}%")
            self.logger.info(f"运行单元测试: {run_unit_tests}")
            self.logger.info(f"运行集成测试: {run_integration_tests}")
            self.logger.info(f"上传测试报告: {upload_reports}")
            
            test_results = {
                "unit_tests": None,
                "integration_tests": None,
                "coverage": None
            }
            
            # 2. 准备测试环境
            self.logger.info("\n[步骤 1/4] 准备测试环境...")
            if not self._prepare_test_environment():
                return PipelineResult(
                    success=False,
                    message="测试环境准备失败",
                    exit_code=1
                )
            
            # 3. 运行单元测试
            if run_unit_tests:
                self.logger.info("\n[步骤 2/4] 运行单元测试...")
                unit_result = self._run_unit_tests()
                test_results["unit_tests"] = unit_result
                if not unit_result.get("success", False):
                    return PipelineResult(
                        success=False,
                        message="单元测试失败",
                        exit_code=1,
                        data=test_results
                    )
            
            # 4. 运行集成测试
            if run_integration_tests:
                self.logger.info("\n[步骤 3/4] 运行集成测试...")
                integration_result = self._run_integration_tests()
                test_results["integration_tests"] = integration_result
                if not integration_result.get("success", False):
                    return PipelineResult(
                        success=False,
                        message="集成测试失败",
                        exit_code=1,
                        data=test_results
                    )
            
            # 5. 生成覆盖率报告
            self.logger.info("\n[步骤 4/4] 生成代码覆盖率报告...")
            coverage_result = self._generate_coverage_report(coverage_threshold)
            test_results["coverage"] = coverage_result
            
            # 检查覆盖率阈值
            if coverage_result.get("coverage_percent", 0) < coverage_threshold:
                self.log_github_action(
                    "warning",
                    f"代码覆盖率 {coverage_result.get('coverage_percent', 0)}% 低于阈值 {coverage_threshold}%"
                )
            
            # 6. 设置输出变量
            self.set_output("test-status", "success")
            self.set_output("coverage-percent", str(coverage_result.get("coverage_percent", 0)))
            self.set_output("unit-tests-passed", str(test_results["unit_tests"].get("passed", 0) if test_results["unit_tests"] else 0))
            self.set_output("integration-tests-passed", str(test_results["integration_tests"].get("passed", 0) if test_results["integration_tests"] else 0))
            
            # 7. 上传测试报告（可选）
            if upload_reports:
                self.logger.info("\n上传测试报告...")
                self._upload_test_reports(coverage_result)
            
            self.logger.info("\n" + "=" * 60)
            self.logger.info("测试流水线执行成功！")
            self.logger.info("=" * 60)
            
            return PipelineResult(
                success=True,
                message=f"测试通过: 覆盖率 {coverage_result.get('coverage_percent', 0)}%",
                data={
                    "test_type": test_type,
                    "coverage_percent": coverage_result.get("coverage_percent", 0),
                    "coverage_threshold": coverage_threshold,
                    "unit_tests": test_results["unit_tests"],
                    "integration_tests": test_results["integration_tests"],
                    "reports_uploaded": upload_reports
                }
            )
            
        except Exception as e:
            error_msg = f"测试过程中发生错误: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            self.log_github_action("error", error_msg, file=__file__)
            return PipelineResult(
                success=False,
                message=error_msg,
                exit_code=1
            )
    
    def _prepare_test_environment(self) -> bool:
        """准备测试环境"""
        try:
            # 创建测试报告目录
            reports_dir = Path("test-reports")
            reports_dir.mkdir(exist_ok=True)
            
            # 创建覆盖率报告目录
            coverage_dir = Path("coverage-reports")
            coverage_dir.mkdir(exist_ok=True)
            
            self.logger.info("✓ 测试环境准备完成")
            return True
        except Exception as e:
            self.logger.error(f"测试环境准备失败: {e}")
            return False
    
    def _run_unit_tests(self) -> dict:
        """运行单元测试"""
        try:
            # 查找测试目录
            test_dirs = ["tests", "test", "src/tests"]
            test_dir = None
            
            for td in test_dirs:
                if Path(td).exists():
                    test_dir = td
                    break
            
            if not test_dir:
                self.logger.info("未找到测试目录，跳过单元测试")
                return {"success": True, "passed": 0, "failed": 0, "skipped": 0}
            
            self.logger.info(f"在 {test_dir} 目录中查找单元测试...")
            
            # 示例：模拟测试执行
            # 实际应该调用 pytest, unittest 等工具
            # result = subprocess.run(["pytest", test_dir, "-v", "--tb=short"], capture_output=True, text=True)
            
            # 模拟测试结果
            test_result = {
                "success": True,
                "passed": 10,
                "failed": 0,
                "skipped": 2,
                "total": 12
            }
            
            self.logger.info(f"✓ 单元测试完成: {test_result['passed']} 通过, {test_result['failed']} 失败, {test_result['skipped']} 跳过")
            
            # 保存测试报告
            report_file = Path("test-reports") / "unit-tests.json"
            with open(report_file, "w", encoding="utf-8") as f:
                json.dump(test_result, f, indent=2)
            
            return test_result
        except Exception as e:
            self.logger.error(f"单元测试执行失败: {e}")
            return {"success": False, "error": str(e)}
    
    def _run_integration_tests(self) -> dict:
        """运行集成测试"""
        try:
            # 查找集成测试目录
            integration_test_dirs = ["tests/integration", "tests/integration_tests", "integration-tests"]
            test_dir = None
            
            for td in integration_test_dirs:
                if Path(td).exists():
                    test_dir = td
                    break
            
            if not test_dir:
                self.logger.info("未找到集成测试目录，跳过集成测试")
                return {"success": True, "passed": 0, "failed": 0}
            
            self.logger.info(f"在 {test_dir} 目录中查找集成测试...")
            
            # 示例：模拟集成测试执行
            test_result = {
                "success": True,
                "passed": 5,
                "failed": 0,
                "total": 5
            }
            
            self.logger.info(f"✓ 集成测试完成: {test_result['passed']} 通过, {test_result['failed']} 失败")
            
            # 保存测试报告
            report_file = Path("test-reports") / "integration-tests.json"
            with open(report_file, "w", encoding="utf-8") as f:
                json.dump(test_result, f, indent=2)
            
            return test_result
        except Exception as e:
            self.logger.error(f"集成测试执行失败: {e}")
            return {"success": False, "error": str(e)}
    
    def _generate_coverage_report(self, threshold: float) -> dict:
        """生成代码覆盖率报告"""
        try:
            # 示例：模拟覆盖率报告生成
            # 实际应该调用 coverage.py, pytest-cov 等工具
            # result = subprocess.run(["pytest", "--cov=src", "--cov-report=html", "--cov-report=json"], ...)
            
            # 模拟覆盖率结果
            coverage_percent = 85.5
            coverage_result = {
                "coverage_percent": coverage_percent,
                "lines_covered": 850,
                "lines_total": 1000,
                "branches_covered": 420,
                "branches_total": 500,
                "meets_threshold": coverage_percent >= threshold
            }
            
            self.logger.info(f"代码覆盖率: {coverage_percent}%")
            self.logger.info(f"  行覆盖率: {coverage_result['lines_covered']}/{coverage_result['lines_total']}")
            self.logger.info(f"  分支覆盖率: {coverage_result['branches_covered']}/{coverage_result['branches_total']}")
            
            if coverage_percent >= threshold:
                self.logger.info(f"✓ 覆盖率达到阈值 {threshold}%")
            else:
                self.log_github_action(
                    "warning",
                    f"覆盖率 {coverage_percent}% 低于阈值 {threshold}%"
                )
            
            # 保存覆盖率报告
            report_file = Path("coverage-reports") / "coverage.json"
            with open(report_file, "w", encoding="utf-8") as f:
                json.dump(coverage_result, f, indent=2)
            
            # 生成 HTML 报告（示例）
            html_report = Path("coverage-reports") / "index.html"
            with open(html_report, "w", encoding="utf-8") as f:
                f.write(f"<html><body><h1>Coverage Report</h1><p>Coverage: {coverage_percent}%</p></body></html>")
            
            return coverage_result
        except Exception as e:
            self.logger.error(f"覆盖率报告生成失败: {e}")
            return {"coverage_percent": 0, "error": str(e)}
    
    def _upload_test_reports(self, coverage_result: dict):
        """上传测试报告（示例）"""
        try:
            reports_dir = Path("test-reports")
            coverage_dir = Path("coverage-reports")
            
            report_files = []
            if reports_dir.exists():
                report_files.extend(list(reports_dir.glob("*.json")))
            if coverage_dir.exists():
                report_files.extend(list(coverage_dir.glob("*.json")))
                report_files.extend(list(coverage_dir.glob("*.html")))
            
            if report_files:
                self.logger.info(f"准备上传 {len(report_files)} 个测试报告...")
                for report_file in report_files:
                    self.logger.info(f"  - {report_file}")
                
                # 在 GitHub Action 中，可以使用 actions/upload-artifact
                self.logger.info("✓ 测试报告上传完成（示例）")
            else:
                self.logger.info("没有测试报告需要上传")
        except Exception as e:
            self.logger.warning(f"测试报告上传失败: {e}")


if __name__ == "__main__":
    # 命令行入口：可以直接运行脚本
    TestPipeline.main()


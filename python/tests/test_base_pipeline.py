"""
BasePipeline 测试
"""

import pytest
from src.base_pipeline import BasePipeline, PipelineResult


class TestPipeline(BasePipeline):
    """测试用的 Pipeline"""
    
    def execute(self) -> PipelineResult:
        """执行测试 Pipeline"""
        return PipelineResult(
            success=True,
            message="测试成功",
            exit_code=0
        )


def test_pipeline_execute():
    """测试 Pipeline 执行"""
    pipeline = TestPipeline()
    result = pipeline.execute()
    
    assert result.success
    assert result.exit_code == 0
    assert result.message == "测试成功"


def test_pipeline_get_input():
    """测试获取输入参数"""
    pipeline = TestPipeline(inputs={"test-key": "test-value"})
    value = pipeline.get_input("test-key")
    
    assert value == "test-value"


def test_pipeline_run_command():
    """测试运行命令"""
    pipeline = TestPipeline()
    # 注意：这个测试需要实际运行命令，可能需要 mock
    # success = pipeline.run_command("echo 'test'")
    # assert success
    pass


#!/usr/bin/env python3
"""
AI 自我调试 GitHub Actions Workflow 脚本

功能：
1. 触发指定的 GitHub Action 工作流
2. 实时监控工作流执行状态
3. 如果失败，自动收集日志
4. 分析日志并提供修正建议

用法:
  python scripts/ai_debug_workflow.py <workflow-file> [ref] [-f key=value ...]

注意：
- 此脚本可以共享给父项目使用
- 详细使用规则请参考: .cursor/rules/scripts-usage.mdc
"""

import sys
import os
import argparse
from pathlib import Path

# 添加 src 目录到路径
script_dir = Path(__file__).parent.parent.parent  # scripts/tools/ -> scripts/ -> 项目根目录
python_dir = script_dir / "python"
sys.path.insert(0, str(python_dir))

from src.workflow_manager import WorkflowManager


def analyze_log_file(log_file: Path) -> dict:
    """分析日志文件，提取错误信息"""
    errors = []
    warnings = []
    suggestions = []
    
    try:
        content = log_file.read_text(encoding="utf-8")
        
        # 提取错误信息
        import re
        error_patterns = [
            r"Error: (.+)",
            r"error: (.+)",
            r"ERROR (.+)",
            r"Failed to (.+)",
            r"失败: (.+)",
        ]
        
        for pattern in error_patterns:
            matches = re.finditer(pattern, content, re.IGNORECASE)
            for match in matches:
                if match.group(1) and match.group(1) not in errors:
                    errors.append(match.group(1))
        
        # 提取警告信息
        warning_patterns = [
            r"Warning: (.+)",
            r"warning: (.+)",
            r"WARNING (.+)",
        ]
        
        for pattern in warning_patterns:
            matches = re.finditer(pattern, content, re.IGNORECASE)
            for match in matches:
                if match.group(1) and match.group(1) not in warnings:
                    warnings.append(match.group(1))
        
        # 生成修正建议
        if errors:
            error_text = " ".join(errors).lower()
            
            if "not found" in error_text or "不存在" in error_text:
                suggestions.append("检查文件路径是否正确，确保文件存在")
            
            if "permission" in error_text or "权限" in error_text:
                suggestions.append("检查文件权限，确保有执行权限")
            
            if "syntax" in error_text or "语法" in error_text:
                suggestions.append("检查 YAML 或代码语法错误")
            
            if "dependency" in error_text or "依赖" in error_text:
                suggestions.append("检查依赖是否正确安装，运行 pip install 或类似命令")
            
            if "timeout" in error_text or "超时" in error_text:
                suggestions.append("考虑增加超时时间或优化执行步骤")
        
        return {
            "errors": errors,
            "warnings": warnings,
            "suggestions": suggestions
        }
    except Exception as e:
        return {
            "errors": [f"分析日志失败: {str(e)}"],
            "warnings": [],
            "suggestions": []
        }


def main():
    parser = argparse.ArgumentParser(description="AI 自我调试 GitHub Actions Workflow")
    parser.add_argument("workflow_file", help="工作流文件路径")
    parser.add_argument("ref", nargs="?", default="main", help="分支/引用（默认: main）")
    parser.add_argument("-f", "--field", action="append", help="输入参数（格式: key=value）")
    
    args = parser.parse_args()
    
    # 解析 inputs
    inputs = {}
    if args.field:
        for field in args.field:
            if "=" in field:
                key, value = field.split("=", 1)
                inputs[key] = value
    
    print("🤖 AI 自我调试 GitHub Actions Workflow")
    print("=" * 50)
    print(f"📋 工作流文件: {args.workflow_file}")
    print(f"🌿 分支/引用: {args.ref}")
    if inputs:
        print("📥 输入参数:")
        for key, value in inputs.items():
            print(f"   {key}: {value}")
    print()
    
    # 检查工作流文件
    workflow_path = Path(args.workflow_file)
    if not workflow_path.is_absolute():
        workflow_path = Path.cwd() / workflow_path
    
    if not workflow_path.exists():
        print(f"❌ 错误: 工作流文件不存在: {workflow_path}")
        sys.exit(1)
    
    # 创建 WorkflowManager
    manager = WorkflowManager()
    
    # 检查 GitHub CLI
    if not manager.check_gh_cli():
        print("❌ 错误: 未找到 GitHub CLI (gh)")
        print("   请安装 GitHub CLI: https://cli.github.com/")
        sys.exit(1)
    
    if not manager.check_gh_auth():
        print("❌ 错误: GitHub CLI 未登录")
        print("   请运行: gh auth login")
        sys.exit(1)
    
    # 触发并监控 workflow
    print("🚀 触发 workflow...")
    result = manager.run_workflow(
        str(workflow_path.relative_to(manager.project_root)),
        args.ref,
        inputs if inputs else None
    )
    
    print()
    if result.get("success"):
        print("✅ Workflow 执行成功！")
        sys.exit(0)
    else:
        print("❌ Workflow 执行失败")
        
        # 分析日志
        log_file = result.get("log_file")
        if log_file:
            print(f"\n📋 分析日志文件: {log_file}")
            analysis = analyze_log_file(Path(log_file))
            
            if analysis["errors"]:
                print("\n🔴 错误信息:")
                for error in analysis["errors"][:10]:  # 只显示前10个
                    print(f"   - {error}")
            
            if analysis["warnings"]:
                print("\n⚠️  警告信息:")
                for warning in analysis["warnings"][:5]:  # 只显示前5个
                    print(f"   - {warning}")
            
            if analysis["suggestions"]:
                print("\n💡 修正建议:")
                for suggestion in analysis["suggestions"]:
                    print(f"   - {suggestion}")
        
        sys.exit(1)


if __name__ == "__main__":
    main()


#!/usr/bin/env python3
"""
Pipeline 验证和调试脚本

功能：
1. 删除旧的 workflow 文件
2. 使用脚手架工具重新生成 workflow
3. 验证生成的 workflow 文件
4. 可选：触发 workflow 进行在线测试
5. 监控 workflow 执行状态
6. 分析失败原因

用法:
  python scripts/test_pipelines.py [options]

选项:
  --pipeline <name>    指定要测试的 Pipeline 类名（可多次指定）
  --all                测试所有 Pipeline
  --trigger            触发 workflow 进行在线测试
  --watch              监控 workflow 执行状态
  --clean              删除旧的 workflow 文件
  --verify             仅验证生成的 workflow 文件，不触发测试
"""

import sys
import os
import argparse
import subprocess
import yaml
import time
from pathlib import Path
import importlib.util
import re


def detect_project_root() -> Path:
    """检测项目根目录"""
    current = Path.cwd()
    while current != current.parent:
        if (current / "package.json").exists() or (current / "environment.yml").exists():
            return current
        current = current.parent
    return Path.cwd()


def find_pipeline_files(project_root: Path) -> list:
    """查找所有 Pipeline 文件"""
    # Pipeline 文件在 python/src/pipelines/ 目录
    python_dir = project_root / "python"
    pipelines_dir = python_dir / "src" / "pipelines"
    if not pipelines_dir.exists():
        return []
    
    files = []
    for file_path in pipelines_dir.rglob("*.py"):
        if not file_path.name.startswith("_"):
            files.append(file_path)
    
    return files


def extract_class_name(file_path: Path) -> str:
    """从文件内容中提取 Pipeline 类名"""
    try:
        content = file_path.read_text(encoding="utf-8")
        # 查找 class XxxPipeline 模式
        match = re.search(r"class\s+(\w+Pipeline)\s*[\(:]", content)
        if match:
            return match.group(1)
    except Exception:
        pass
    return None


def clean_workflows(workflows_dir: Path) -> None:
    """删除旧的 workflow 文件"""
    print("🧹 清理旧的 workflow 文件...")
    for file_path in workflows_dir.glob("*.yml"):
        file_path.unlink()
        print(f"   ✓ 删除: {file_path.name}")
    for file_path in workflows_dir.glob("*.yaml"):
        file_path.unlink()
        print(f"   ✓ 删除: {file_path.name}")


def generate_workflow(
    project_root: Path,
    pipeline_name: str,
    workflows_dir: Path
) -> Path:
    """生成 workflow 文件"""
    print(f"📝 生成 workflow: {pipeline_name}...")
    
    # 生成 workflow 文件名
    workflow_name = (
        pipeline_name.replace("Pipeline", "")
        .replace("_", "-")
        .lower()
    )
    output_path = workflows_dir / f"{workflow_name}.yml"
    
    # 使用脚手架工具生成
    # 需要从 python/ 目录运行脚手架工具
    python_dir = project_root / "python"
    scaffold_cmd = [
        sys.executable,
        "-m", "src.scaffold",
        "--pipeline", pipeline_name,
        "--output", str(output_path.relative_to(project_root)),
    ]
    
    if output_path.exists():
        scaffold_cmd.append("--update")
    
    try:
        result = subprocess.run(
            scaffold_cmd,
            cwd=python_dir,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0 and output_path.exists():
            print(f"   ✓ 成功: {output_path.relative_to(project_root)}")
            return output_path
        else:
            print(f"   ❌ 生成失败: {result.stderr}")
            return None
    except Exception as e:
        print(f"   ❌ 生成失败: {str(e)}")
        return None


def verify_workflow(workflow_path: Path) -> tuple:
    """验证 workflow 文件"""
    errors = []
    
    try:
        with open(workflow_path, "r", encoding="utf-8") as f:
            workflow = yaml.safe_load(f)
        
        # 检查基本结构
        if not workflow.get("name"):
            errors.append("缺少 workflow 名称")
        if not workflow.get("on"):
            errors.append("缺少触发条件")
        if not workflow.get("jobs"):
            errors.append("缺少 jobs 定义")
        
        # 检查 Pipeline 执行步骤
        content = workflow_path.read_text(encoding="utf-8")
        if "python -c" not in content and "Run " not in content:
            errors.append("缺少 Pipeline 执行步骤")
        
        return len(errors) == 0, errors
    except Exception as e:
        return False, [f"YAML 解析错误: {str(e)}"]


def main():
    parser = argparse.ArgumentParser(description="Pipeline 验证和调试脚本")
    parser.add_argument("--pipeline", action="append", help="Pipeline 类名（可多次指定）")
    parser.add_argument("--all", action="store_true", help="测试所有 Pipeline")
    parser.add_argument("--trigger", action="store_true", help="触发 workflow 进行在线测试")
    parser.add_argument("--watch", action="store_true", help="监控 workflow 执行状态")
    parser.add_argument("--clean", action="store_true", help="删除旧的 workflow 文件")
    parser.add_argument("--verify", action="store_true", help="仅验证生成的 workflow 文件")
    
    args = parser.parse_args()
    
    project_root = detect_project_root()
    workflows_dir = project_root / ".github" / "workflows"
    workflows_dir.mkdir(parents=True, exist_ok=True)
    
    # 清理旧的 workflow 文件
    if args.clean:
        clean_workflows(workflows_dir)
    
    # 确定要测试的 Pipeline
    pipelines = []
    if args.all:
        pipeline_files = find_pipeline_files(project_root)
        for file_path in pipeline_files:
            class_name = extract_class_name(file_path)
            if class_name:
                pipelines.append(class_name)
    elif args.pipeline:
        pipelines = args.pipeline
    else:
        print("❌ 错误: 请指定 --pipeline 或 --all")
        sys.exit(1)
    
    if not pipelines:
        print("❌ 未找到 Pipeline")
        sys.exit(1)
    
    print(f"📋 找到 {len(pipelines)} 个 Pipeline:")
    for pipeline in pipelines:
        print(f"   - {pipeline}")
    print()
    
    # 生成 workflow
    generated_workflows = []
    for pipeline_name in pipelines:
        workflow_path = generate_workflow(project_root, pipeline_name, workflows_dir)
        if workflow_path:
            generated_workflows.append(workflow_path)
    
    if not generated_workflows:
        print("❌ 没有成功生成任何 workflow")
        sys.exit(1)
    
    print(f"\n✅ 成功生成 {len(generated_workflows)} 个 workflow\n")
    
    # 验证 workflow
    if args.verify or not args.trigger:
        print("🔍 验证 workflow 文件...")
        all_valid = True
        for workflow_path in generated_workflows:
            valid, errors = verify_workflow(workflow_path)
            if valid:
                print(f"   ✓ {workflow_path.name}: 验证通过")
            else:
                print(f"   ❌ {workflow_path.name}: 验证失败")
                for error in errors:
                    print(f"      - {error}")
                all_valid = False
        
        if not all_valid:
            print("\n❌ 部分 workflow 验证失败")
            sys.exit(1)
        
        print("\n✅ 所有 workflow 验证通过")
    
    # 触发和监控（如果需要）
    if args.trigger:
        print("\n🚀 触发 workflow 进行在线测试...")
        print("   注意: 此功能需要 GitHub CLI (gh) 和推送代码到远程仓库")
        # 这里可以添加触发逻辑
        # 由于需要 GitHub CLI，这里简化处理
        print("   ⚠️  触发功能需要手动实现或使用 GitHub CLI")


if __name__ == "__main__":
    main()


#!/usr/bin/env python3
"""
本地运行 Pipeline 脚本

简化本地运行 Pipeline 的流程，支持通过命令行参数传递输入

用法:
  python scripts/run_pipeline.py BuildPipeline
  python scripts/run_pipeline.py FlutterBuildPipeline --build-command "flutter build"
  python scripts/run_pipeline.py BuildPipeline --setup-command "npm install" --build-command "npm run build"

选项:
  <PipelineName>           Pipeline 类名（必需）
  --<input-key> <value>    设置输入参数（如 --build-command "npm run build"）
  --help                   显示帮助信息
"""

import sys
import os
import argparse
import importlib.util
from pathlib import Path


def load_pipeline(pipeline_name: str):
    """动态加载 Pipeline 类"""
    # 添加项目根目录到路径
    project_root = Path(__file__).parent.parent
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))
    
    # 尝试从可能的路径加载
    possible_paths = [
        project_root / "src" / "pipelines" / "base" / f"{pipeline_name.lower().replace('pipeline', '')}_pipeline.py",
        project_root / "src" / "pipelines" / "build" / f"{pipeline_name.lower().replace('pipeline', '')}_pipeline.py",
        project_root / "src" / "pipelines" / "test" / f"{pipeline_name.lower().replace('pipeline', '')}_pipeline.py",
    ]
    
    # 也尝试直接按类名查找
    all_pipeline_files = []
    pipelines_dir = project_root / "src" / "pipelines"
    if pipelines_dir.exists():
        for file_path in pipelines_dir.rglob("*.py"):
            if not file_path.name.startswith("_") and "pipeline" in file_path.name.lower():
                all_pipeline_files.append(file_path)
    
    # 尝试加载
    for file_path in [*possible_paths, *all_pipeline_files]:
        if file_path.exists():
            try:
                # 计算模块路径（相对于项目根目录）
                relative_path = file_path.relative_to(project_root)
                module_path = str(relative_path.with_suffix("")).replace("/", ".").replace("\\", ".")
                
                spec = importlib.util.spec_from_file_location(module_path, file_path)
                if spec is None or spec.loader is None:
                    continue
                
                module = importlib.util.module_from_spec(spec)
                sys.modules[module_path] = module
                spec.loader.exec_module(module)
                
                if hasattr(module, pipeline_name):
                    return getattr(module, pipeline_name)
            except Exception as e:
                continue
    
    raise ValueError(f"无法找到 Pipeline 类: {pipeline_name}")


def main():
    parser = argparse.ArgumentParser(description="本地运行 Pipeline")
    parser.add_argument("pipeline", help="Pipeline 类名")
    
    # 解析已知参数，剩余的参数作为输入参数
    args, remaining = parser.parse_known_args()
    
    # 解析输入参数
    input_args = {}
    i = 0
    while i < len(remaining):
        arg = remaining[i]
        if arg.startswith("--") and i + 1 < len(remaining):
            key = arg[2:].replace("-", "-")
            value = remaining[i + 1]
            input_args[key] = value
            i += 2
        else:
            i += 1
    
    # 设置环境变量（GitHub Actions 格式）
    for key, value in input_args.items():
        env_key = f"INPUT_{key.upper().replace('-', '_')}"
        os.environ[env_key] = value
    
    try:
        print(f"🚀 运行 Pipeline: {args.pipeline}\n")
        
        if input_args:
            print("📋 输入参数:")
            for key, value in input_args.items():
                print(f"   {key}: {value}")
            print()
        
        # 添加项目根目录到路径
        script_dir = Path(__file__).parent.parent
        project_root = script_dir.parent  # python/ 的父目录是项目根目录
        
        if str(script_dir) not in sys.path:
            sys.path.insert(0, str(script_dir))
        
        PipelineClass = load_pipeline(args.pipeline)
        
        # 使用项目根目录创建 Pipeline
        pipeline = PipelineClass(input_args, project_root=str(project_root))
        
        print("⏳ 执行中...\n")
        result = pipeline.run()
        
        print("\n📊 执行结果:")
        print(f"   Success: {result.success}")
        print(f"   Message: {result.message}")
        print(f"   Exit Code: {result.exit_code}")
        if result.data:
            print(f"   Data: {result.data}")
        
        if result.success:
            print("\n✅ Pipeline 执行成功！")
            sys.exit(0)
        else:
            print("\n❌ Pipeline 执行失败！")
            sys.exit(result.exit_code or 1)
    except Exception as e:
        print(f"\n❌ 错误: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()


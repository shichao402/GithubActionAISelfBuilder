/**
 * 本地测试 Flutter Build Pipeline
 * 
 * 使用方法：
 *   npx ts-node scripts/test-flutter-pipeline.ts
 */

import { FlutterBuildPipeline } from '../src/pipelines/flutter-build-pipeline';
import * as path from 'path';

async function main() {
  console.log('🚀 开始测试 Flutter Build Pipeline...\n');

  try {
    // 创建 pipeline 实例（无需参数）
    const pipeline = new FlutterBuildPipeline();

    // 运行 pipeline
    const result = await pipeline.run();

    // 输出结果
    console.log('\n' + '='.repeat(60));
    if (result.success) {
      console.log('✅ Pipeline 执行成功！');
      console.log(`📝 消息: ${result.message}`);
      if (result.data) {
        console.log('📦 数据:');
        for (const [key, value] of Object.entries(result.data)) {
          console.log(`   ${key}: ${value}`);
        }
      }
    } else {
      console.log('❌ Pipeline 执行失败！');
      console.log(`📝 消息: ${result.message}`);
      console.log(`🔢 退出码: ${result.exitCode}`);
    }
    console.log('='.repeat(60));

    // 根据结果设置退出码
    process.exit(result.exitCode || (result.success ? 0 : 1));
  } catch (error: any) {
    console.error('\n❌ 发生错误:');
    console.error(error);
    process.exit(1);
  }
}

// 运行
main();


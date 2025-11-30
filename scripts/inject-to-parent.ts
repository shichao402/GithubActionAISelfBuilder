#!/usr/bin/env ts-node
/**
 * 将本项目注入到父项目的脚本
 * 
 * 功能：
 * 1. 复制共享规则文件到父项目
 * 2. 排除 ProjectOnly 目录
 * 3. 创建 .cursorignore 文件（如果不存在）
 * 
 * 使用方法：
 *   ts-node scripts/inject-to-parent.ts <父项目路径>
 */

import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SHARED_RULES = [
  'rules.mdc',
  'scripts-usage.mdc',
  'README.md',
  'PARENT_PROJECT_USAGE.md',
];

function main() {
  const parentProjectPath = process.argv[2];
  
  if (!parentProjectPath) {
    console.error('错误: 请提供父项目路径');
    console.error('使用方法: ts-node scripts/inject-to-parent.ts <父项目路径>');
    process.exit(1);
  }

  const parentPath = path.resolve(parentProjectPath);
  
  if (!fs.existsSync(parentPath)) {
    console.error(`错误: 父项目路径不存在: ${parentPath}`);
    process.exit(1);
  }

  console.log(`开始注入到父项目: ${parentPath}`);

  // 1. 计算本项目在父项目中的相对路径
  const relativePath = path.relative(parentPath, PROJECT_ROOT);
  const submodulePath = relativePath || path.basename(PROJECT_ROOT);

  // 2. 复制共享规则文件
  const sourceRulesDir = path.join(PROJECT_ROOT, '.cursor', 'rules');
  const targetRulesDir = path.join(parentPath, '.cursor', 'rules', submodulePath);

  console.log(`\n1. 复制共享规则文件...`);
  console.log(`   源目录: ${sourceRulesDir}`);
  console.log(`   目标目录: ${targetRulesDir}`);

  // 创建目标目录
  if (!fs.existsSync(targetRulesDir)) {
    fs.mkdirSync(targetRulesDir, { recursive: true });
  }

  // 复制共享规则文件
  for (const ruleFile of SHARED_RULES) {
    const sourceFile = path.join(sourceRulesDir, ruleFile);
    const targetFile = path.join(targetRulesDir, ruleFile);

    if (fs.existsSync(sourceFile)) {
      fs.copyFileSync(sourceFile, targetFile);
      console.log(`   ✓ 已复制: ${ruleFile}`);
    } else {
      console.warn(`   ⚠ 文件不存在: ${ruleFile}`);
    }
  }

  // 3. 创建或更新 .cursorignore 文件
  console.log(`\n2. 创建/更新 .cursorignore 文件...`);
  const cursorIgnorePath = path.join(parentPath, '.cursorignore');
  const ignorePattern = `${submodulePath}/.cursor/rules/ProjectOnly/`;

  let cursorIgnoreContent = '';
  if (fs.existsSync(cursorIgnorePath)) {
    cursorIgnoreContent = fs.readFileSync(cursorIgnorePath, 'utf-8');
  }

  // 检查是否已包含忽略规则
  if (!cursorIgnoreContent.includes(ignorePattern)) {
    if (cursorIgnoreContent && !cursorIgnoreContent.endsWith('\n')) {
      cursorIgnoreContent += '\n';
    }
    cursorIgnoreContent += `# 排除本项目特有的规则文件（ProjectOnly 目录）\n`;
    cursorIgnoreContent += `${ignorePattern}\n`;
    
    fs.writeFileSync(cursorIgnorePath, cursorIgnoreContent, 'utf-8');
    console.log(`   ✓ 已更新: .cursorignore`);
    console.log(`   添加的忽略规则: ${ignorePattern}`);
  } else {
    console.log(`   ✓ .cursorignore 已包含忽略规则`);
  }

  // 4. 创建使用说明文件
  console.log(`\n3. 创建使用说明...`);
  const readmePath = path.join(targetRulesDir, 'README.md');
  const readmeContent = `# 本项目规则文件

这些规则文件来自子项目：\`${submodulePath}\`

## 规则文件说明

- **rules.mdc**: 核心规则，说明如何使用本项目创建 Pipeline 和生成工作流
- **scripts-usage.mdc**: 脚本使用规则，说明如何在父项目中使用共享脚本

## 注意事项

1. **ProjectOnly 目录**: 本项目特有的规则文件位于 \`ProjectOnly/\` 目录，已在父项目的 \`.cursorignore\` 中排除
2. **路径调整**: 在父项目中使用时，需要根据实际项目结构调整导入路径
3. **规则更新**: 如果子项目更新了规则文件，需要重新运行注入脚本

## 更新规则文件

如果子项目的规则文件有更新，可以重新运行注入脚本：

\`\`\`bash
cd ${submodulePath}
ts-node scripts/inject-to-parent.ts ${path.relative(submodulePath, parentPath) || '..'}
\`\`\`
`;

  fs.writeFileSync(readmePath, readmeContent, 'utf-8');
  console.log(`   ✓ 已创建: README.md`);

  console.log(`\n✅ 注入完成！`);
  console.log(`\n下一步:`);
  console.log(`1. 检查父项目的 .cursorignore 文件，确认已排除 ProjectOnly 目录`);
  console.log(`2. 在 Cursor 中重新加载规则（可能需要重启 Cursor）`);
  console.log(`3. 验证规则是否正确应用`);
}

main();



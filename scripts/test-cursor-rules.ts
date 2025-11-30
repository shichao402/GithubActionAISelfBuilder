#!/usr/bin/env ts-node
/**
 * 测试 Cursor 规则排除功能
 * 
 * 功能：
 * 1. 检查 .cursorignore 文件是否存在
 * 2. 验证 ProjectOnly 目录是否被正确排除
 * 3. 列出所有规则文件，区分共享和项目特有
 * 
 * 使用方法：
 *   ts-node scripts/test-cursor-rules.ts [父项目路径]
 *   如果不提供路径，则测试当前项目
 */

import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(process.cwd());

interface RuleFileInfo {
  path: string;
  relativePath: string;
  isProjectOnly: boolean;
  exists: boolean;
}

function findMdcFiles(dir: string, baseDir: string = dir): RuleFileInfo[] {
  const results: RuleFileInfo[] = [];
  
  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      results.push(...findMdcFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.mdc')) {
      const isProjectOnly = fullPath.includes('ProjectOnly');
      results.push({
        path: fullPath,
        relativePath: relativePath,
        isProjectOnly: isProjectOnly,
        exists: true,
      });
    }
  }

  return results;
}

function readCursorIgnore(ignorePath: string): string[] {
  if (!fs.existsSync(ignorePath)) {
    return [];
  }

  const content = fs.readFileSync(ignorePath, 'utf-8');
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
}

function matchesIgnorePattern(filePath: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    // 简单的模式匹配（支持通配符 *）
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\//g, '\\/');
    
    const regex = new RegExp(`^${regexPattern}`);
    if (regex.test(filePath) || regex.test(filePath.replace(/\\/g, '/'))) {
      return true;
    }
  }
  return false;
}

function findRulesDirs(rootDir: string): string[] {
  const rulesDirs: string[] = [];
  
  function searchDir(dir: string, depth: number = 0) {
    if (!fs.existsSync(dir) || depth > 10) {
      return;
    }

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // 检查是否是 .cursor/rules 目录
          if (entry.name === 'rules' && path.basename(dir) === '.cursor') {
            rulesDirs.push(fullPath);
          } else {
            // 递归搜索（排除 node_modules 等，但包含 .cursor）
            if (entry.name !== 'node_modules' && 
                (entry.name.startsWith('.') || !entry.name.startsWith('.'))) {
              searchDir(fullPath, depth + 1);
            }
          }
        }
      }
    } catch (error) {
      // 忽略权限错误等
    }
  }

  searchDir(rootDir);
  return rulesDirs;
}

function main() {
  const testPath = process.argv[2] || PROJECT_ROOT;
  const testRoot = path.resolve(testPath);

  console.log('🔍 Cursor 规则排除功能测试\n');
  console.log(`测试路径: ${testRoot}\n`);

  // 1. 查找所有规则文件
  console.log('1️⃣  查找规则文件...');
  
  const rulesDirs = findRulesDirs(testRoot);
  
  if (rulesDirs.length === 0) {
    console.log(`   ⚠️  未找到任何规则目录`);
    console.log(`   💡 提示: 如果这是父项目，可能需要先运行注入脚本`);
    process.exit(1);
  }

  console.log(`   ✓ 找到 ${rulesDirs.length} 个规则目录:`);
  rulesDirs.forEach((dir, index) => {
    const relativeDir = path.relative(testRoot, dir);
    console.log(`      ${index + 1}. ${relativeDir || '.'}`);
  });
  console.log('');

  // 收集所有规则文件
  let allRules: RuleFileInfo[] = [];
  for (const rulesDir of rulesDirs) {
    const rules = findMdcFiles(rulesDir, testRoot);
    allRules.push(...rules);
  }
  const sharedRules = allRules.filter(r => !r.isProjectOnly);
  const projectOnlyRules = allRules.filter(r => r.isProjectOnly);

  console.log(`   ✓ 找到 ${allRules.length} 个规则文件`);
  console.log(`      - 共享规则: ${sharedRules.length} 个`);
  console.log(`      - 项目特有规则: ${projectOnlyRules.length} 个\n`);

  // 2. 检查 .cursorignore 文件
  const cursorIgnorePath = path.join(testRoot, '.cursorignore');
  console.log('2️⃣  检查 .cursorignore 文件...');
  
  const ignorePatterns = readCursorIgnore(cursorIgnorePath);
  
  if (ignorePatterns.length === 0) {
    console.log(`   ⚠️  .cursorignore 文件不存在或为空`);
    console.log(`   💡 提示: 如果是父项目，需要创建 .cursorignore 文件`);
    console.log(`   📝 示例内容:`);
    console.log(`      ${path.relative(testRoot, path.join(PROJECT_ROOT, '.cursor', 'rules', 'ProjectOnly'))}/`);
  } else {
    console.log(`   ✓ 找到 ${ignorePatterns.length} 个排除规则:`);
    ignorePatterns.forEach((pattern, index) => {
      console.log(`      ${index + 1}. ${pattern}`);
    });
  }
  console.log('');

  // 3. 验证排除规则
  console.log('3️⃣  验证排除规则...');
  
  let excludedCount = 0;
  let notExcludedCount = 0;
  
  if (projectOnlyRules.length === 0) {
    console.log('   ✓ 没有项目特有规则需要排除\n');
  } else {
    for (const rule of projectOnlyRules) {
      const shouldExclude = matchesIgnorePattern(rule.relativePath, ignorePatterns) ||
                            matchesIgnorePattern(rule.relativePath.replace(/\\/g, '/'), ignorePatterns);
      
      if (shouldExclude) {
        excludedCount++;
        console.log(`   ✓ 已排除: ${rule.relativePath}`);
      } else {
        notExcludedCount++;
        console.log(`   ⚠️  未排除: ${rule.relativePath}`);
      }
    }

    console.log('');
    if (notExcludedCount === 0) {
      console.log(`   ✅ 所有项目特有规则都被正确排除 (${excludedCount}/${projectOnlyRules.length})`);
    } else {
      console.log(`   ⚠️  有 ${notExcludedCount} 个规则未被排除`);
      console.log(`   💡 提示: 检查 .cursorignore 文件中的排除规则是否正确`);
    }
    console.log('');
  }

  // 4. 列出共享规则（应该被加载）
  console.log('4️⃣  共享规则列表（应该被 Cursor 加载）:');
  if (sharedRules.length === 0) {
    console.log('   ⚠️  没有找到共享规则');
  } else {
    sharedRules.forEach((rule, index) => {
      console.log(`   ${index + 1}. ${rule.relativePath}`);
    });
  }
  console.log('');

  // 5. 测试建议
  console.log('5️⃣  测试建议:');
  console.log('   1. 在 Cursor 中打开项目');
  console.log('   2. 查看规则列表（通常在 Cursor 设置中）');
  console.log('   3. 验证：');
  console.log('      ✅ 应该看到共享规则（rules.mdc, scripts-usage.mdc）');
  console.log('      ❌ 不应该看到 ProjectOnly 目录下的规则');
  console.log('   4. 测试规则是否生效：');
  console.log('      - 尝试使用共享规则中的功能');
  console.log('      - 验证项目特有规则不会干扰（如 Git 推送规范）');
  console.log('');

  // 6. 生成测试报告
  const report = {
    testPath: testRoot,
    cursorIgnoreExists: fs.existsSync(cursorIgnorePath),
    ignorePatterns: ignorePatterns,
    totalRules: allRules.length,
    sharedRules: sharedRules.length,
    projectOnlyRules: projectOnlyRules.length,
    excludedRules: projectOnlyRules.filter(r => 
      matchesIgnorePattern(r.relativePath, ignorePatterns) ||
      matchesIgnorePattern(r.relativePath.replace(/\\/g, '/'), ignorePatterns)
    ).length,
    status: notExcludedCount === 0 ? 'PASS' : 'FAIL',
  };

  console.log('📊 测试报告:');
  console.log(JSON.stringify(report, null, 2));
  console.log('');

  // 7. 退出码
  if (report.status === 'PASS') {
    console.log('✅ 测试通过！');
    process.exit(0);
  } else {
    console.log('❌ 测试失败！请检查配置。');
    process.exit(1);
  }
}

main();


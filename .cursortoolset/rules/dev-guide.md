# Github Action Toolset 开发指南

## 包结构规范

本包遵循 CursorToolset 包规范：

1. **toolset.json** - 包的元数据文件，包含：
   - name: 包名（必须与目录名一致）
   - version: 语义化版本号 (SemVer)
   - dist.tarball: 下载地址
   - dist.sha256: 校验和

2. **版本号规范** - 使用语义化版本：
   - MAJOR.MINOR.PATCH
   - 例如: 1.0.0, 1.2.3

3. **发布流程**：
   - 更新 toolset.json 中的 version
   - 创建 Git Tag (v1.0.0)
   - 打包: tar -czvf github-action-toolset-VERSION.tar.gz *
   - 计算 SHA256 并更新 toolset.json
   - 在 GitHub Release 发布

## AI 规则编写指南

在 rules/ 目录下创建 .md 文件作为 AI 规则。

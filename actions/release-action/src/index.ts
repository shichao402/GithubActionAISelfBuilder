import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import * as fs from 'fs'
import * as path from 'path'

async function run() {
  try {
    const version = core.getInput('version', { required: true })
    const releaseNotes = core.getInput('release-notes') || `Release ${version}`
    const artifactName = core.getInput('artifact-name') || 'build-artifacts'
    const buildBranch = core.getInput('build-branch') || 'build'

    core.info(`🚀 开始发布流程 v${version}...`)

    // 1. 检查 gh CLI 是否可用
    const hasGhCli = await checkGhCli()
    if (!hasGhCli) {
      core.setFailed('未安装 GitHub CLI (gh)，请先安装：https://cli.github.com/')
      return
    }

    // 2. 查询 build 分支的工作流运行
    let runId: string | null = null
    if (buildBranch) {
      core.info(`🔍 查询分支 ${buildBranch} 的工作流运行...`)
      runId = await getRunIdByBranch(buildBranch)
      if (runId) {
        core.info(`✓ 找到工作流运行 ID: ${runId}`)
      } else {
        core.warning(`未找到分支 ${buildBranch} 的成功工作流运行`)
      }
    }

    // 3. 下载产物（如果找到工作流运行）
    if (runId) {
      core.info(`📥 下载产物...`)
      const artifactsDir = path.join(process.cwd(), 'artifacts', `run-${runId}`)
      if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir, { recursive: true })
      }

      await exec.exec('gh', ['run', 'download', runId, '--dir', artifactsDir])
      core.info(`✓ 产物下载完成: ${artifactsDir}`)
    } else {
      // 如果没有找到工作流运行，尝试从当前 artifacts 目录读取
      const artifactsDir = path.join(process.cwd(), 'artifacts')
      if (!fs.existsSync(artifactsDir)) {
        core.warning('未找到产物目录，将创建不带文件的 Release')
      }
    }

    // 4. 创建 GitHub Release
    core.info(`📦 创建 GitHub Release v${version}...`)
    const releaseUrl = await createRelease(version, releaseNotes, artifactName)

    if (releaseUrl) {
      core.setOutput('release-url', releaseUrl)
      core.info(`✅ Release 创建成功: ${releaseUrl}`)
    } else {
      core.setFailed('创建 Release 失败')
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('发布过程中发生未知错误')
    }
  }
}

async function checkGhCli(): Promise<boolean> {
  try {
    await exec.exec('gh', ['--version'], { silent: true })
    return true
  } catch {
    return false
  }
}

async function getRunIdByBranch(branch: string): Promise<string | null> {
  try {
    let output = ''
    const options = {
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString()
        }
      },
      silent: true
    }

    await exec.exec(
      'gh',
      [
        'run',
        'list',
        '--branch',
        branch,
        '--status',
        'success',
        '--limit',
        '1',
        '--json',
        'databaseId',
        '--jq',
        '.[0].databaseId'
      ],
      options
    )

    const runId = output.trim()
    return runId && runId !== 'null' ? runId : null
  } catch (error) {
    core.warning(`查询工作流运行失败: ${error}`)
    return null
  }
}

async function createRelease(
  version: string,
  notes: string,
  artifactName: string
): Promise<string | null> {
  try {
    const artifactsDir = path.join(process.cwd(), 'artifacts')
    const files: string[] = []

    // 查找产物文件
    if (fs.existsSync(artifactsDir)) {
      const items = fs.readdirSync(artifactsDir, { withFileTypes: true })
      for (const item of items) {
        const fullPath = path.join(artifactsDir, item.name)
        if (item.isFile()) {
          files.push(fullPath)
        }
      }
    }

    // 构建 gh release create 命令
    const args = ['release', 'create', `v${version}`, '--notes', notes]

    // 添加产物文件
    if (files.length > 0) {
      args.push(...files)
    }

    let releaseUrl = ''
    const options = {
      listeners: {
        stdout: (data: Buffer) => {
          releaseUrl += data.toString()
        }
      }
    }

    await exec.exec('gh', args, options)

    // 从 GitHub API 获取 Release URL
    const context = github.context
    const repo = context.repo
    return `https://github.com/${repo.owner}/${repo.repo}/releases/tag/v${version}`
  } catch (error) {
    core.error(`创建 Release 失败: ${error}`)
    return null
  }
}

run()



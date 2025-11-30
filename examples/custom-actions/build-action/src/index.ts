import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as artifact from '@actions/artifact'
import * as path from 'path'

async function run() {
  try {
    // 获取输入参数
    const buildCommand = core.getInput('build-command', { required: true })
    const setupCommand = core.getInput('setup-command')
    const artifactPath = core.getInput('artifact-path') || 'artifacts/**'
    const buildType = core.getInput('build-type') || 'release'
    const uploadArtifacts = core.getInput('upload-artifacts') === 'true'

    core.info('🚀 开始执行构建流程...')

    // 1. 环境设置
    if (setupCommand) {
      core.info(`📦 执行环境设置: ${setupCommand}`)
      await exec.exec(setupCommand, [], {
        failOnStdErr: false,
        ignoreReturnCode: false
      })
    }

    // 2. 执行构建
    core.info(`🔨 执行构建命令: ${buildCommand}`)
    const buildExitCode = await exec.exec(buildCommand, [], {
      failOnStdErr: false,
      ignoreReturnCode: false
    })

    if (buildExitCode !== 0) {
      core.setFailed(`构建失败，退出码: ${buildExitCode}`)
      return
    }

    // 3. 上传产物
    if (uploadArtifacts) {
      core.info(`📤 上传构建产物: ${artifactPath}`)
      try {
        const artifactClient = artifact.create()
        await artifactClient.uploadArtifact(
          'build-artifacts',
          [artifactPath],
          '.',
          {
            retentionDays: 30
          }
        )
        core.info('✅ 产物上传成功')
      } catch (error) {
        core.warning(`产物上传失败: ${error}`)
        // 不阻止流程继续
      }
    }

    // 4. 设置输出
    core.setOutput('build-status', 'success')
    core.setOutput('artifact-path', artifactPath)
    core.setOutput('build-type', buildType)

    core.info('✅ 构建流程完成')
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('构建过程中发生未知错误')
    }
  }
}

run()



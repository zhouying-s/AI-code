<template>
  <div class="setup">
    <div class="setup__card">
      <h1>🌱 AI 笔记库</h1>
      <p class="setup__subtitle">填入你的 GitHub 凭据，开始使用。</p>

      <el-form :model="form" label-position="top" @submit.prevent="onSubmit">
        <el-form-item label="GitHub Personal Access Token (PAT)" required>
          <el-input v-model="form.githubPat" type="password" show-password placeholder="ghp_..." />
          <p class="setup__hint">需要 repo 权限（私有仓库读写）</p>
        </el-form-item>

        <el-form-item label="GitHub 用户名 (owner)" required>
          <el-input v-model="form.owner" placeholder="your-github-username" />
        </el-form-item>

        <el-form-item label="仓库名 (repo)" required>
          <el-input v-model="form.repo" placeholder="notes-db" />
        </el-form-item>

        <el-divider>可选 · 后续阶段才会用</el-divider>

        <el-form-item label="Cloudflare Worker URL">
          <el-input v-model="form.workerUrl" placeholder="https://notes-api.you.workers.dev" />
        </el-form-item>
        <el-form-item label="Master Token">
          <el-input v-model="form.masterToken" type="password" show-password />
        </el-form-item>

        <el-button
          type="primary"
          :loading="saving"
          native-type="submit"
          :disabled="!canSubmit"
          style="width: 100%"
        >
          保存并进入笔记库
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const auth = useAuthStore()
const saving = ref(false)

const form = reactive({
  githubPat: auth.githubPat,
  owner: auth.owner,
  repo: auth.repo,
  workerUrl: auth.workerUrl,
  masterToken: auth.masterToken,
})

const canSubmit = computed(() => !!(form.githubPat && form.owner && form.repo))

async function onSubmit() {
  if (!canSubmit.value) return
  saving.value = true
  auth.setConfig({ ...form })
  saving.value = false
  ElMessage.success('已保存')
  router.push({ name: 'home' })
}
</script>

<style scoped>
.setup {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-sidebar);
}
.setup__card {
  width: 420px;
  background: #fff;
  padding: 36px 32px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}
.setup__card h1 {
  margin: 0 0 8px;
  color: var(--color-primary);
}
.setup__subtitle {
  color: var(--color-text-secondary);
  margin: 0 0 24px;
}
.setup__hint {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin: 4px 0 0;
}
</style>

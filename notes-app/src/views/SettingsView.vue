<template>
  <AppShell>
    <template #primary><PrimarySidebar /></template>
    <template #tree>
      <div class="settings-tree">
        <h4>设置</h4>
        <nav>
          <a href="#auth">凭据</a>
          <a href="#sync">同步</a>
          <a href="#migration">云端迁移</a>
          <a href="#export">导出配置码</a>
          <a href="#danger">危险操作</a>
        </nav>
      </div>
    </template>
    <template #main>
      <div class="settings-main">
        <section id="auth">
          <h2>凭据</h2>
          <el-form :model="form" label-width="120px">
            <el-form-item label="GitHub PAT">
              <el-input v-model="form.githubPat" type="password" show-password />
            </el-form-item>
            <el-form-item label="Owner">
              <el-input v-model="form.owner" />
            </el-form-item>
            <el-form-item label="Repo">
              <el-input v-model="form.repo" />
            </el-form-item>
          </el-form>
        </section>

        <section id="sync">
          <h2>Worker</h2>
          <el-form :model="form" label-width="120px">
            <el-form-item label="Worker URL">
              <el-input v-model="form.workerUrl" placeholder="（Stage 3 启用）" />
            </el-form-item>
            <el-form-item label="Master Token">
              <el-input v-model="form.masterToken" type="password" show-password />
            </el-form-item>
            <el-form-item label="默认知识库">
              <el-select v-model="form.defaultBookSlug" placeholder="选一个">
                <el-option
                  v-for="b in booksStore.books"
                  :key="b.slug"
                  :label="b.name"
                  :value="b.slug"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </section>

        <section id="migration">
          <h2>云端迁移</h2>
          <p class="hint">把当前浏览器的小记 + 收藏一次性上传到 Cloudflare KV。</p>
          <el-button :loading="testingConn" @click="testConnection"> 测试 Worker 连接 </el-button>
          <el-button
            type="primary"
            :loading="migrating"
            :disabled="!form.workerUrl"
            @click="onMigrate"
          >
            上传到云端
          </el-button>
          <p v-if="migrationResult" class="result">
            上传完成：{{ migrationResult.memos }} 条小记 · 收藏笔记
            {{ migrationResult.favorites.notes }} 条 · 收藏小记
            {{ migrationResult.favorites.memos }} 条
            <span v-if="migrationResult.errors.length > 0" class="result__err">
              ({{ migrationResult.errors.length }} 条失败)
            </span>
          </p>
        </section>

        <section id="export">
          <h2>导出配置码（给浏览器插件粘）</h2>
          <p class="hint">这串 base64 字符串包含上面所有凭据。妥善保管。</p>
          <el-input type="textarea" :rows="3" :model-value="configCode" readonly />
          <el-button :icon="CopyDocument" @click="copyCode">复制</el-button>
        </section>

        <section id="danger">
          <h2 style="color: var(--color-danger)">危险操作</h2>
          <el-button type="danger" @click="onClear">清空本地凭据</el-button>
        </section>

        <el-affix position="bottom" :offset="20">
          <div class="save-bar">
            <el-button type="primary" @click="onSave">保存</el-button>
          </div>
        </el-affix>
      </div>
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/layout/AppShell.vue'
import PrimarySidebar from '@/components/layout/PrimarySidebar.vue'
import { useAuthStore } from '@/stores/auth'
import { useBooksStore } from '@/stores/books'
import { ElMessage } from 'element-plus'
import { CopyDocument } from '@element-plus/icons-vue'
import { encodeUtf8Base64 } from '@/utils/base64'
import { migrateToWorker, type MigrationResult } from '@/services/migration'
import { workerJson } from '@/services/workerClient'

const auth = useAuthStore()
const booksStore = useBooksStore()
const router = useRouter()

const form = reactive({
  githubPat: auth.githubPat,
  owner: auth.owner,
  repo: auth.repo,
  workerUrl: auth.workerUrl,
  masterToken: auth.masterToken,
  defaultBookSlug: auth.defaultBookSlug,
})

const testingConn = ref(false)
const migrating = ref(false)
const migrationResult = ref<MigrationResult | null>(null)

const configCode = computed(() =>
  encodeUtf8Base64(
    JSON.stringify({
      workerUrl: form.workerUrl,
      masterToken: form.masterToken,
      pat: form.githubPat,
      owner: form.owner,
      repo: form.repo,
      defaultBook: form.defaultBookSlug,
    }),
  ),
)

function onSave() {
  auth.setConfig({ ...form })
  ElMessage.success('已保存')
}

async function copyCode() {
  await navigator.clipboard.writeText(configCode.value)
  ElMessage.success('已复制到剪贴板')
}

function onClear() {
  auth.clear()
  ElMessage.success('已清空，将重定向到向导')
  router.push({ name: 'setup' })
}

async function testConnection() {
  // 用最新表单里的值，先保存一次，让 workerClient 能读到
  auth.setConfig({ ...form })
  testingConn.value = true
  try {
    await workerJson('/api/memos')
    ElMessage.success('Worker 连接成功')
  } catch (e) {
    ElMessage.error('连接失败：' + (e as Error).message)
  } finally {
    testingConn.value = false
  }
}

async function onMigrate() {
  auth.setConfig({ ...form })
  migrating.value = true
  migrationResult.value = null
  try {
    migrationResult.value = await migrateToWorker()
    if (migrationResult.value.errors.length === 0) {
      ElMessage.success('全部上传成功')
    } else {
      ElMessage.warning(`部分失败：${migrationResult.value.errors.length} 条`)
    }
  } catch (e) {
    ElMessage.error('上传失败：' + (e as Error).message)
  } finally {
    migrating.value = false
  }
}
</script>

<style scoped>
.settings-tree {
  padding: 24px 16px;
}
.settings-tree h4 {
  margin: 0 0 16px;
}
.settings-tree nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.settings-tree a {
  color: var(--color-text-secondary);
  font-size: 14px;
}
.settings-tree a:hover {
  color: var(--color-primary);
}
.settings-main {
  padding: 32px;
  max-width: 720px;
}
.settings-main section {
  margin-bottom: 48px;
}
.settings-main section h2 {
  margin: 0 0 16px;
}
.hint {
  color: var(--color-text-tertiary);
  font-size: 13px;
}
.result {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 8px;
}
.result__err {
  color: var(--color-danger);
}
.save-bar {
  background: #fff;
  padding: 12px 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  display: flex;
  justify-content: flex-end;
}
</style>

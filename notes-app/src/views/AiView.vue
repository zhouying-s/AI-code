<template>
  <AppShell>
    <template #primary><PrimarySidebar /></template>
    <template #tree>
      <SessionList @new="onNew" @select="onSelect" @delete="onDelete" />
    </template>
    <template #main>
      <div v-if="!auth.workerUrl || !auth.masterToken" class="needs-setup">
        <EmptyState
          icon="⚙️"
          title="需要先配置 Worker"
          hint="进设置页填 Worker URL 和 Master Token，再回来这里"
        >
          <el-button type="primary" @click="$router.push('/settings')">去设置</el-button>
        </EmptyState>
      </div>
      <ChatPanel v-else />
    </template>
  </AppShell>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import AppShell from '@/components/layout/AppShell.vue'
import PrimarySidebar from '@/components/layout/PrimarySidebar.vue'
import SessionList from '@/components/ai/SessionList.vue'
import ChatPanel from '@/components/ai/ChatPanel.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useAuthStore } from '@/stores/auth'
import { useAiStore } from '@/stores/ai'

const auth = useAuthStore()
const store = useAiStore()

onMounted(async () => {
  if (auth.workerUrl && auth.masterToken) {
    await store.refresh().catch(() => {})
  }
})

async function onNew() {
  await store.startNewSession()
}

async function onSelect(id: string) {
  await store.selectSession(id)
}

async function onDelete(id: string) {
  try {
    await ElMessageBox.confirm('删除这个会话和所有消息？', '确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  await store.removeSession(id)
}
</script>

<style scoped>
.needs-setup {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

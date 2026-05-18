<template>
  <div class="bubble" :class="`bubble--${msg.role}`">
    <div class="bubble__role">{{ roleLabel }}</div>
    <div class="bubble__content">
      {{ msg.content }}<span v-if="streaming" class="bubble__cursor">▍</span>
    </div>
    <div v-if="msg.role === 'assistant' && !streaming" class="bubble__actions">
      <el-button text size="small" :icon="CopyDocument" @click="onCopy">复制</el-button>
      <el-button text size="small" :icon="DocumentAdd" @click="$emit('insert', msg.content)">
        插入到当前文档
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CopyDocument, DocumentAdd } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { ChatMessage } from '@/types'

const props = defineProps<{ msg: ChatMessage; streaming?: boolean }>()
defineEmits<{ (e: 'insert', content: string): void }>()

const roleLabel = computed(() =>
  props.msg.role === 'user' ? '你' : props.msg.role === 'assistant' ? 'AI' : '系统',
)

async function onCopy() {
  await navigator.clipboard.writeText(props.msg.content)
  ElMessage.success('已复制')
}
</script>

<style scoped>
.bubble {
  padding: 12px 16px;
  margin-bottom: 12px;
  border-radius: var(--radius-md);
  background: #fff;
  border: 1px solid var(--color-border);
}
.bubble--user {
  background: var(--color-primary-light-bg);
  border-color: transparent;
}
.bubble--system {
  background: var(--color-bg-sidebar);
  font-size: 12px;
  color: var(--color-text-tertiary);
}
.bubble__role {
  font-size: 11px;
  color: var(--color-text-tertiary);
  margin-bottom: 4px;
}
.bubble__content {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
}
.bubble__cursor {
  animation: blink 1s steps(2, start) infinite;
}
@keyframes blink {
  to {
    visibility: hidden;
  }
}
.bubble__actions {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}
</style>

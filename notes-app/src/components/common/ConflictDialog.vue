<template>
  <el-dialog v-model="visible" title="保存冲突" width="800">
    <p class="conflict__hint">远端的笔记内容已被改动（可能你在另一台设备改过）。请选择如何处理：</p>
    <div class="conflict__split">
      <div class="conflict__pane">
        <h4>📥 本地版本（你当前编辑的）</h4>
        <pre>{{ localContent }}</pre>
      </div>
      <div class="conflict__pane">
        <h4>☁️ 远端版本（GitHub 上现在的）</h4>
        <pre>{{ remoteContent }}</pre>
      </div>
    </div>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="warning" @click="onResolve('accept')">接受远端</el-button>
      <el-button type="primary" @click="onResolve('overwrite')">覆盖远端</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  localContent: string
  remoteContent: string
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'resolve', choice: 'overwrite' | 'accept'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

function onResolve(choice: 'overwrite' | 'accept') {
  emit('resolve', choice)
  visible.value = false
}
</script>

<style scoped>
.conflict__hint {
  color: var(--color-text-secondary);
  margin-bottom: 16px;
}
.conflict__split {
  display: flex;
  gap: 16px;
}
.conflict__pane {
  flex: 1;
}
.conflict__pane h4 {
  margin: 0 0 8px;
}
.conflict__pane pre {
  max-height: 360px;
  overflow: auto;
  padding: 12px;
  background: var(--color-bg-sidebar);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 12px;
}
</style>

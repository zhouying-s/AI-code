<template>
  <div class="composer">
    <textarea
      v-model="text"
      class="composer__input"
      placeholder="记一条小记 …（Ctrl+Enter 提交）"
      rows="3"
      @keydown.ctrl.enter.prevent="onSubmit"
      @keydown.meta.enter.prevent="onSubmit"
    />
    <div class="composer__bar">
      <el-input
        v-model="tagsInput"
        placeholder="标签，用空格分隔（可选）"
        size="small"
        class="composer__tags"
      />
      <el-button type="primary" size="small" :disabled="!text.trim()" @click="onSubmit">
        添加
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useMemosStore } from '@/stores/memos'
import { ElMessage } from 'element-plus'

const memos = useMemosStore()
const text = ref('')
const tagsInput = ref('')

function onSubmit() {
  if (!text.value.trim()) return
  const tags = tagsInput.value.trim()
    ? tagsInput.value.trim().split(/\s+/).filter(Boolean)
    : undefined
  memos.create({ content: text.value.trim(), tags })
  text.value = ''
  tagsInput.value = ''
  ElMessage.success('已添加')
}
</script>

<style scoped>
.composer {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px;
  margin-bottom: 16px;
}
.composer__input {
  width: 100%;
  border: none;
  outline: none;
  resize: vertical;
  font-family: var(--font-sans);
  font-size: 14px;
}
.composer__bar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 8px;
}
.composer__tags {
  flex: 1;
}
</style>

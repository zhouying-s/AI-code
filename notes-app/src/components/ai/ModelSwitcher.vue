<template>
  <el-select
    :model-value="modelValue"
    size="small"
    style="width: 200px"
    @update:model-value="onChange"
  >
    <el-option label="DeepSeek Chat（标准）" value="deepseek-chat" />
    <el-option label="DeepSeek Reasoner（深度推理）" value="deepseek-reasoner" />
  </el-select>
</template>

<script setup lang="ts">
import type { DeepSeekModel } from '@/types'

defineProps<{ modelValue: DeepSeekModel }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: DeepSeekModel): void }>()

function onChange(v: DeepSeekModel) {
  emit('update:modelValue', v)
}
</script>

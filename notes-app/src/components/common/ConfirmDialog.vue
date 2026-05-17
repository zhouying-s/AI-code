<template>
  <el-dialog v-model="visible" :title="title" width="380">
    <p class="confirm__msg">{{ message }}</p>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button :type="danger ? 'danger' : 'primary'" @click="onConfirm">
        {{ confirmLabel }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    message: string
    confirmLabel?: string
    danger?: boolean
  }>(),
  { confirmLabel: '确认', danger: false },
)
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'confirm'): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

function onConfirm() {
  emit('confirm')
  visible.value = false
}
</script>

<style scoped>
.confirm__msg {
  color: var(--color-text-secondary);
  margin: 0;
}
</style>

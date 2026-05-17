<template>
  <div ref="container" class="vditor-container"></div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import Vditor from 'vditor'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const container = ref<HTMLElement | null>(null)
let vditor: Vditor | null = null
let suppressNextInput = false

onMounted(() => {
  if (!container.value) return
  vditor = new Vditor(container.value, {
    height: '100%',
    mode: 'ir',
    placeholder: props.placeholder ?? '开始书写…',
    cache: { enable: false },
    toolbar: [
      'headings',
      'bold',
      'italic',
      'strike',
      'line',
      'quote',
      '|',
      'list',
      'ordered-list',
      'check',
      'outdent',
      'indent',
      '|',
      'code',
      'inline-code',
      'table',
      'link',
      '|',
      'undo',
      'redo',
      '|',
      'edit-mode',
      'preview',
      'export',
    ],
    after: () => {
      if (vditor) vditor.setValue(props.modelValue ?? '')
    },
    input: (val) => {
      if (suppressNextInput) {
        suppressNextInput = false
        return
      }
      emit('update:modelValue', val)
    },
  })
})

onBeforeUnmount(() => {
  vditor?.destroy()
  vditor = null
})

watch(
  () => props.modelValue,
  (val) => {
    if (vditor && vditor.getValue() !== val) {
      suppressNextInput = true
      vditor.setValue(val ?? '')
    }
  },
)
</script>

<style scoped>
.vditor-container {
  flex: 1;
  min-height: 0;
}
:deep(.vditor) {
  border: none;
}
</style>

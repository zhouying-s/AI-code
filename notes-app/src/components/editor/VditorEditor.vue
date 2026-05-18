<template>
  <div class="vditor-wrap">
    <div ref="container" class="vditor-container"></div>
    <InlineAiMenu
      v-model:visible="menuVisible"
      :position="menuPos"
      :selected-text="selectedText"
      @replace="onReplace"
      @append="onAppend"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import Vditor from 'vditor'
import InlineAiMenu from './InlineAiMenu.vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const container = ref<HTMLElement | null>(null)
let vditor: Vditor | null = null
let suppressNextInput = false

const menuVisible = ref(false)
const menuPos = ref({ x: 0, y: 0 })
const selectedText = ref('')

function onSelectionChange() {
  if (!container.value) return
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
    menuVisible.value = false
    return
  }
  const range = sel.getRangeAt(0)
  if (!container.value.contains(range.commonAncestorContainer)) {
    menuVisible.value = false
    return
  }
  const text = sel.toString()
  if (!text.trim()) {
    menuVisible.value = false
    return
  }
  const rect = range.getBoundingClientRect()
  selectedText.value = text
  menuPos.value = {
    x: rect.left + window.scrollX,
    y: rect.bottom + window.scrollY + 8,
  }
  menuVisible.value = true
}

function onDocMouseDown(e: MouseEvent) {
  const target = e.target as HTMLElement | null
  if (!target) return
  if (target.closest('.inline-ai')) return
  if (container.value && container.value.contains(target)) return
  menuVisible.value = false
}

function replaceSelection(text: string) {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return
  const range = sel.getRangeAt(0)
  range.deleteContents()
  range.insertNode(document.createTextNode(text))
  sel.removeAllRanges()
  if (vditor) emit('update:modelValue', vditor.getValue())
}

function appendBelow(text: string) {
  if (!vditor) return
  const current = vditor.getValue()
  const next = current.endsWith('\n') ? current + text + '\n' : current + '\n\n' + text + '\n'
  suppressNextInput = true
  vditor.setValue(next)
  emit('update:modelValue', next)
}

function onReplace(text: string) {
  replaceSelection(text)
  menuVisible.value = false
}

function onAppend(text: string) {
  appendBelow(text)
  menuVisible.value = false
}

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
  document.addEventListener('selectionchange', onSelectionChange)
  document.addEventListener('mousedown', onDocMouseDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', onSelectionChange)
  document.removeEventListener('mousedown', onDocMouseDown)
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
.vditor-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.vditor-container {
  flex: 1;
  min-height: 0;
}
:deep(.vditor) {
  border: none;
}
</style>

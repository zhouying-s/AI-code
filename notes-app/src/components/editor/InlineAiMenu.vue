<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="inline-ai"
      :style="{ left: position.x + 'px', top: position.y + 'px' }"
    >
      <div v-if="!resultText" class="inline-ai__actions">
        <el-button text size="small" @click="run('rewrite')">改写</el-button>
        <el-button text size="small" @click="run('summarize')">总结</el-button>
        <el-button text size="small" @click="run('translate')">翻译</el-button>
        <el-button text size="small" @click="run('continue')">续写</el-button>
      </div>
      <div v-else class="inline-ai__result">
        <div class="inline-ai__text">
          {{ resultText }}<span v-if="streaming" class="inline-ai__cursor">▍</span>
        </div>
        <div v-if="!streaming" class="inline-ai__buttons">
          <el-button size="small" @click="$emit('replace', resultText)">替换选区</el-button>
          <el-button size="small" @click="$emit('append', resultText)">追加到下方</el-button>
          <el-button size="small" text @click="dismiss">关闭</el-button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { streamChat } from '@/services/ai'
import type { ChatMessage } from '@/types'

const props = defineProps<{
  visible: boolean
  position: { x: number; y: number }
  selectedText: string
}>()
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'replace', text: string): void
  (e: 'append', text: string): void
}>()

const resultText = ref('')
const streaming = ref(false)

watch(
  () => props.visible,
  (v) => {
    if (!v) {
      resultText.value = ''
      streaming.value = false
    }
  },
)

type ActionKind = 'rewrite' | 'summarize' | 'translate' | 'continue'

function buildMessages(kind: ActionKind, text: string): ChatMessage[] {
  const prompts: Record<ActionKind, string> = {
    rewrite: '请把下面这段文字改写得更清晰、更专业，保留原意：\n\n' + text,
    summarize: '请用一两句话总结下面这段内容：\n\n' + text,
    translate: '请把下面这段文字翻译成中文（如果已是中文则翻译成英文）：\n\n' + text,
    continue: '请基于下面这段开头，自然地续写一段：\n\n' + text,
  }
  return [{ role: 'user', content: prompts[kind] }]
}

async function run(kind: ActionKind) {
  if (!props.selectedText.trim()) return
  resultText.value = ''
  streaming.value = true
  try {
    for await (const delta of streamChat({
      model: 'deepseek-chat',
      messages: buildMessages(kind, props.selectedText),
    })) {
      resultText.value += delta
    }
  } finally {
    streaming.value = false
  }
}

function dismiss() {
  emit('update:visible', false)
}
</script>

<style scoped>
.inline-ai {
  position: absolute;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  z-index: 9999;
  padding: 8px;
  max-width: 480px;
}
.inline-ai__actions {
  display: flex;
  gap: 4px;
}
.inline-ai__result {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
}
.inline-ai__text {
  font-size: 13px;
  white-space: pre-wrap;
  max-height: 240px;
  overflow-y: auto;
}
.inline-ai__buttons {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}
.inline-ai__cursor {
  animation: blink 1s steps(2, start) infinite;
}
@keyframes blink {
  to {
    visibility: hidden;
  }
}
</style>

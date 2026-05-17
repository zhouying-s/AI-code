<template>
  <el-dialog v-model="visible" title="新建知识库" width="420">
    <el-form :model="form" label-position="top" @submit.prevent="onSubmit">
      <el-form-item label="名称" required>
        <el-input v-model="form.name" placeholder="如：React 学习" />
      </el-form-item>
      <el-form-item label="标识 (slug，英文小写)">
        <el-input v-model="form.slug" :placeholder="autoSlug" />
        <p class="hint">用于路径 books/{{ form.slug || autoSlug }}/，不能修改</p>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="onSubmit">创建</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useBooksStore } from '@/stores/books'
import { titleToSlug } from '@/utils/slug'
import { ElMessage } from 'element-plus'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'created', slug: string): void
}>()

const booksStore = useBooksStore()
const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})
const form = reactive({ name: '', slug: '' })
const autoSlug = computed(() => titleToSlug(form.name))
const saving = ref(false)

watch(visible, (v) => {
  if (v) {
    form.name = ''
    form.slug = ''
  }
})

async function onSubmit() {
  if (!form.name) return
  const slug = form.slug || autoSlug.value
  saving.value = true
  try {
    await booksStore.create({ slug, name: form.name })
    ElMessage.success('已创建')
    emit('created', slug)
  } catch (e) {
    ElMessage.error((e as Error).message)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.hint {
  font-size: 12px;
  color: var(--color-text-tertiary);
  margin: 4px 0 0;
}
</style>

<template>
  <nav class="sidebar">
    <div class="sidebar__brand">🌱 笔记库</div>

    <router-link to="/" class="sidebar__item" active-class="sidebar__item--active">
      <el-icon><HomeFilled /></el-icon><span>开始</span>
    </router-link>
    <router-link to="/ai" class="sidebar__item" active-class="sidebar__item--active">
      <el-icon><MagicStick /></el-icon><span>AI 写作</span>
    </router-link>
    <router-link to="/memos" class="sidebar__item" active-class="sidebar__item--active">
      <el-icon><EditPen /></el-icon><span>小记</span>
    </router-link>
    <router-link to="/favorites" class="sidebar__item" active-class="sidebar__item--active">
      <el-icon><Star /></el-icon><span>收藏</span>
    </router-link>
    <router-link to="/search" class="sidebar__item" active-class="sidebar__item--active">
      <el-icon><Search /></el-icon><span>搜索</span>
    </router-link>

    <div class="sidebar__section-label">
      <span>知识库</span>
      <el-button text size="small" :icon="Plus" @click="onCreateBook" />
    </div>

    <div v-if="booksStore.loading" class="sidebar__hint">加载中…</div>
    <router-link
      v-for="book in booksStore.books"
      :key="book.slug"
      :to="`/book/${book.slug}`"
      class="sidebar__item sidebar__item--book"
      active-class="sidebar__item--active"
      @click="booksStore.setCurrent(book.slug)"
    >
      <el-icon><Notebook /></el-icon><span>{{ book.name }}</span>
    </router-link>

    <div class="sidebar__footer">
      <router-link to="/settings" class="sidebar__item sidebar__item--mini">
        <el-icon><Setting /></el-icon><span>设置</span>
      </router-link>
    </div>

    <NewBookDialog v-model="showNewBook" @created="onBookCreated" />
  </nav>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBooksStore } from '@/stores/books'
import { Plus } from '@element-plus/icons-vue'
import NewBookDialog from './NewBookDialog.vue'

const booksStore = useBooksStore()
const router = useRouter()
const showNewBook = ref(false)

onMounted(() => {
  if (booksStore.books.length === 0) booksStore.refresh()
})

function onCreateBook() {
  showNewBook.value = true
}
function onBookCreated(slug: string) {
  showNewBook.value = false
  router.push(`/book/${slug}`)
}
</script>

<style scoped>
.sidebar {
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.sidebar__brand {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
  padding: 4px 8px 16px;
}
.sidebar__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  font-size: 14px;
  text-decoration: none;
}
.sidebar__item:hover {
  background: var(--color-bg-hover);
}
.sidebar__item--active {
  background: var(--color-primary-light-bg);
  color: var(--color-primary);
  font-weight: 500;
}
.sidebar__item--book {
  padding-left: 14px;
}
.sidebar__item--mini {
  font-size: 13px;
  color: var(--color-text-secondary);
}
.sidebar__section-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 16px 0 4px;
  padding: 0 10px;
  font-size: 12px;
  color: var(--color-text-tertiary);
  font-weight: 600;
}
.sidebar__hint {
  padding: 4px 10px;
  font-size: 12px;
  color: var(--color-text-tertiary);
}
.sidebar__footer {
  margin-top: auto;
  padding-top: 16px;
}
</style>

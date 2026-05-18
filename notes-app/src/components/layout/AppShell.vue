<template>
  <div
    class="shell"
    :class="{
      'shell--mobile-primary': ui.mobilePrimaryOpen,
      'shell--mobile-tree': ui.mobileTreeOpen,
    }"
  >
    <header v-if="hasTreeSlot" class="shell__mobilebar">
      <el-button text size="small" :icon="Menu" @click="ui.openMobilePrimary()" />
      <el-button text size="small" :icon="Document" @click="ui.openMobileTree()">目录</el-button>
    </header>
    <header v-else class="shell__mobilebar">
      <el-button text size="small" :icon="Menu" @click="ui.openMobilePrimary()" />
    </header>

    <aside class="shell__primary" :class="{ 'shell__primary--open': ui.mobilePrimaryOpen }">
      <slot name="primary" />
    </aside>
    <aside
      v-if="hasTreeSlot && !ui.treeCollapsed"
      class="shell__tree"
      :class="{ 'shell__tree--open': ui.mobileTreeOpen }"
    >
      <slot name="tree" />
    </aside>
    <main class="shell__main"><slot name="main" /></main>

    <div
      v-if="ui.mobilePrimaryOpen || ui.mobileTreeOpen"
      class="shell__backdrop"
      @click="ui.closeMobileDrawers()"
    />
  </div>
  <CommandPalette v-model="showPalette" />
</template>

<script setup lang="ts">
import { computed, ref, useSlots, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Menu, Document } from '@element-plus/icons-vue'
import { useUiStore } from '@/stores/ui'
import { useShortcut } from '@/composables/useShortcut'
import CommandPalette from '@/components/common/CommandPalette.vue'

const ui = useUiStore()
const showPalette = ref(false)
const slots = useSlots()
const route = useRoute()
const hasTreeSlot = computed(() => Boolean(slots.tree))

watch(
  () => route.fullPath,
  () => ui.closeMobileDrawers(),
)

useShortcut('ctrl+j', (e) => {
  e.preventDefault()
  showPalette.value = !showPalette.value
})
useShortcut('meta+j', (e) => {
  e.preventDefault()
  showPalette.value = !showPalette.value
})
</script>

<style scoped>
.shell {
  display: flex;
  height: 100vh;
  background: var(--color-bg-app);
}
.shell__mobilebar {
  display: none;
}
.shell__primary {
  width: 240px;
  flex-shrink: 0;
  background: var(--color-bg-sidebar);
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
}
.shell__tree {
  width: 260px;
  flex-shrink: 0;
  background: #fff;
  border-right: 1px solid var(--color-border);
  overflow-y: auto;
}
.shell__main {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.shell__backdrop {
  display: none;
}

@media (max-width: 768px) {
  .shell {
    flex-direction: column;
  }
  .shell__mobilebar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: #fff;
    border-bottom: 1px solid var(--color-border);
    height: 44px;
    flex-shrink: 0;
    z-index: 50;
  }
  .shell__primary,
  .shell__tree {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    transform: translateX(-100%);
    transition: transform 0.2s ease;
    z-index: 100;
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.12);
    width: 78vw;
    max-width: 320px;
  }
  .shell__primary--open,
  .shell__tree--open {
    transform: translateX(0);
  }
  .shell__main {
    width: 100%;
  }
  .shell__backdrop {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    z-index: 90;
  }
}
</style>

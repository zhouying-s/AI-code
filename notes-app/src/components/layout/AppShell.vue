<template>
  <div class="shell">
    <aside class="shell__primary"><slot name="primary" /></aside>
    <aside v-if="!ui.treeCollapsed" class="shell__tree"><slot name="tree" /></aside>
    <main class="shell__main"><slot name="main" /></main>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
const ui = useUiStore()
</script>

<style scoped>
.shell {
  display: flex;
  height: 100vh;
  background: var(--color-bg-app);
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
}
</style>

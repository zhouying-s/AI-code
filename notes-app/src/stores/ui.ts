import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(false)
  const treeCollapsed = ref(false)

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function toggleTree() {
    treeCollapsed.value = !treeCollapsed.value
  }

  return { sidebarCollapsed, treeCollapsed, toggleSidebar, toggleTree }
})

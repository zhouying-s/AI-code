import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(false)
  const treeCollapsed = ref(false)
  const mobilePrimaryOpen = ref(false)
  const mobileTreeOpen = ref(false)

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function toggleTree() {
    treeCollapsed.value = !treeCollapsed.value
  }

  function openMobilePrimary() {
    mobilePrimaryOpen.value = true
    mobileTreeOpen.value = false
  }

  function openMobileTree() {
    mobileTreeOpen.value = true
    mobilePrimaryOpen.value = false
  }

  function closeMobileDrawers() {
    mobilePrimaryOpen.value = false
    mobileTreeOpen.value = false
  }

  return {
    sidebarCollapsed,
    treeCollapsed,
    mobilePrimaryOpen,
    mobileTreeOpen,
    toggleSidebar,
    toggleTree,
    openMobilePrimary,
    openMobileTree,
    closeMobileDrawers,
  }
})

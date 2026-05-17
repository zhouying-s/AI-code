<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
onMounted(() => {
  window.addEventListener('unhandledrejection', (e) => {
    const err = e.reason as { authExpired?: boolean; message?: string }
    if (err?.authExpired) {
      ElMessage.error('凭据失效，请重新配置')
      router.push({ name: 'setup' })
    }
  })
})
</script>

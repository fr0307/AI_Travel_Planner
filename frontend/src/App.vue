<template>
  <n-config-provider :theme="naiveTheme" :theme-overrides="themeOverrides">
    <n-loading-bar-provider>
      <n-dialog-provider>
        <n-notification-provider>
          <n-message-provider>
            <router-view />
          </n-message-provider>
        </n-notification-provider>
      </n-dialog-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { darkTheme } from 'naive-ui'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

const naiveTheme = computed(() => themeStore.isDark ? darkTheme : null)

const themeOverrides = {
  common: {
    primaryColor: '#0ea5e9',
    primaryColorHover: '#0284c7',
    primaryColorPressed: '#0369a1',
  },
}
</script>

<style>
#app {
  min-height: 100vh;
}
</style>
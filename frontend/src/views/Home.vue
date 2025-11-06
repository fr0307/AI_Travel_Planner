<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <!-- 导航栏 -->
    <nav class="bg-white shadow-sm">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center space-x-2">
            <n-icon size="28" class="text-blue-600">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
              </svg>
            </n-icon>
            <span class="text-xl font-bold text-gray-900">AI旅行规划师</span>
          </div>
          <div class="flex items-center space-x-4">
            <n-button text @click="$router.push('/login')">登录</n-button>
            <n-button type="primary" @click="$router.push('/register')">注册</n-button>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主内容区域 -->
    <main class="container mx-auto px-4 py-12">
      <!-- 英雄区域 -->
      <section class="text-center mb-16">
        <h1 class="text-5xl font-bold text-gray-900 mb-6">
          智能规划您的
          <span class="text-blue-600">完美旅程</span>
        </h1>
        <p class="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          基于人工智能的旅行规划平台，通过语音输入快速生成个性化行程，
          智能预算管理，让您的旅行更加轻松愉快
        </p>
        <div class="flex justify-center space-x-4">
          <n-button size="large" type="primary" @click="startPlanning">
            开始规划
          </n-button>
          <n-button size="large" @click="learnMore">
            了解更多
          </n-button>
        </div>
      </section>

      <!-- 功能特性 -->
      <section class="grid md:grid-cols-3 gap-8 mb-16">
        <div class="text-center p-6 bg-white rounded-lg shadow-sm">
          <n-icon size="48" class="text-blue-500 mb-4">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </n-icon>
          <h3 class="text-xl font-semibold mb-2">智能语音输入</h3>
          <p class="text-gray-600">支持语音识别输入旅行需求，操作更便捷</p>
        </div>
        
        <div class="text-center p-6 bg-white rounded-lg shadow-sm">
          <n-icon size="48" class="text-green-500 mb-4">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/>
            </svg>
          </n-icon>
          <h3 class="text-xl font-semibold mb-2">AI行程规划</h3>
          <p class="text-gray-600">基于大语言模型生成个性化旅行路线</p>
        </div>
        
        <div class="text-center p-6 bg-white rounded-lg shadow-sm">
          <n-icon size="48" class="text-purple-500 mb-4">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </n-icon>
          <h3 class="text-xl font-semibold mb-2">费用预算管理</h3>
          <p class="text-gray-600">智能预算分析和实时费用记录</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { NButton, NIcon } from 'naive-ui'

const startPlanning = () => {
  // 跳转到登录页面或直接开始规划
  console.log('开始规划旅程')
}

const learnMore = () => {
  // 显示更多信息
  console.log('了解更多功能')
}
</script>
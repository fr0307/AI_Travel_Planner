<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <h1 class="error-code">404</h1>
      <h2 class="error-title">页面未找到</h2>
      <p class="error-description">
        抱歉，您访问的页面不存在或已被移动。
      </p>
      <div class="action-buttons">
        <router-link to="/" class="home-button">
          返回首页
        </router-link>
        <button @click="goBack" class="back-button">
          返回上页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.not-found-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.not-found-content {
  text-align: center;
  color: white;
  max-width: 500px;
}

.error-code {
  font-size: 8rem;
  font-weight: bold;
  margin: 0;
  line-height: 1;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.error-title {
  font-size: 2rem;
  margin: 1rem 0 0.5rem;
  font-weight: 600;
}

.error-description {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  line-height: 1.6;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.home-button,
.back-button {
  padding: 12px 24px;
  border: 2px solid white;
  border-radius: 8px;
  text-decoration: none;
  color: white;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.home-button:hover,
.back-button:hover {
  background: white;
  color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .error-code {
    font-size: 6rem;
  }
  
  .error-title {
    font-size: 1.5rem;
  }
  
  .action-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .home-button,
  .back-button {
    width: 200px;
  }
}
</style>
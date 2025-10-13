<script setup lang="ts">
import { ref } from 'vue'
// 游戏模块配置接口
interface GameModule {
  id: string
  name: string
  icon: string
  color: string
  modules: {
    name: string
    icon: string
    route?: string
  }[]
}
const router = useRouter()
// 游戏列表配置
const games = ref<GameModule[]>([
  {
    id: 'banner-manage',
    name: '前台配置',
    icon: 'i-carbon-settings',
    color: '#1890ff',
    modules: [
      {
        name: '轮播图管理',
        icon: 'i-carbon-image',
        route: '/banner-manage',
      },
    ],
  },
  {
    id: 'honor-of-kings',
    name: '使命召唤',
    icon: 'i-carbon-game-wireless',
    color: '#1890ff',
    modules: [
      {
        name: '邮箱管理',
        icon: 'i-carbon-email',
        route: '/codm-email',
      },
      {
        name: '账号管理',
        icon: 'i-carbon-user-multiple',
        route: '/codm-account',
      },
      {
        name: '筛选条件',
        icon: 'i-carbon-filter',
        route: '/honor-of-kings/filter',
      },
    ],
  },
  // 可以在这里添加更多游戏
  // {
  //   id: 'another-game',
  //   name: '其他游戏',
  //   icon: 'i-carbon-game-console',
  //   color: '#52c41a',
  //   modules: [...]
  // }
])

// 点击模块按钮
function handleModuleClick(moduleRoute: string) {
  if (moduleRoute) {
    router.push(moduleRoute)
  }
}
</script>

<template>
  <div class="dashboard-container">
    <div class="games-grid">
      <div
        v-for="game in games"
        :key="game.id"
        class="game-card"
      >
        <!-- 游戏卡片头部 -->
        <div class="game-card-header" :style="{ backgroundColor: game.color }">
          <div :class="game.icon" class="game-icon" />
          <h2 class="game-name">
            {{ game.name }}
          </h2>
        </div>

        <!-- 游戏模块列表 -->
        <div class="game-modules">
          <div
            v-for="module in game.modules"
            :key="module.name"
            class="module-item"
            @click="handleModuleClick(module.route)"
          >
            <div class="module-icon-wrapper" :style="{ borderColor: game.color }">
              <div :class="module.icon" class="module-icon" :style="{ color: game.color }" />
            </div>
            <span class="module-name">{{ module.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.dashboard-container {
  padding-bottom: 20px;
}

.dashboard-header {
  margin-bottom: 24px;
}

.dashboard-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--van-text-color);
}

.dashboard-subtitle {
  font-size: 14px;
  color: var(--van-text-color-2);
  margin: 0;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.game-card {
  background: var(--van-background-2);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.game-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.game-card-header {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, var(--header-color, #1890ff) 0%, var(--header-color-light, #40a9ff) 100%);
}

.game-icon {
  font-size: 32px;
  color: white;
}

.game-name {
  font-size: 20px;
  font-weight: 600;
  color: white;
  margin: 0;
}

.game-modules {
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.module-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--van-background);
}

.module-item:hover {
  background: var(--van-gray-2);
  transform: scale(1.05);
}

.module-item:active {
  transform: scale(0.98);
}

.module-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--van-background-2);
  transition: all 0.2s ease;
}

.module-item:hover .module-icon-wrapper {
  transform: rotate(10deg);
}

.module-icon {
  font-size: 24px;
}

.module-name {
  font-size: 13px;
  color: var(--van-text-color);
  text-align: center;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .games-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-title {
    font-size: 24px;
  }

  .game-modules {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .module-item {
    padding: 12px 4px;
  }

  .module-icon-wrapper {
    width: 40px;
    height: 40px;
  }

  .module-icon {
    font-size: 20px;
  }

  .module-name {
    font-size: 12px;
  }
}

/* 深色模式适配 */
html.dark .game-card {
  background: #2a2a2a;
}

html.dark .module-item {
  background: #1a1a1a;
}

html.dark .module-item:hover {
  background: #333;
}

html.dark .module-icon-wrapper {
  background: #2a2a2a;
}
</style>

<route lang="json5">
{
  name: 'Home'
}
</route>

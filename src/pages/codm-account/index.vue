<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { deleteCodmAccount, getCodmAccountList, patchCodmAccount } from '@/api/codm-account'
import type { CodmAccount } from '@/api/codm-account'
import { closeToast, showConfirmDialog, showLoadingToast, showToast } from 'vant'
import { useRouter } from 'vue-router'
import ProductCard from '@/components/ProductCard/index.vue'
import AddButton from '@/components/AddButton/index.vue'
import { debounce } from 'lodash-es'

interface Product {
  id: number
  name: string
  price: number
  image: string
  status: number
}

interface ActionItem {
  name: string
  icon: string
  color?: string
}
defineOptions({
  name: 'CodmAccount',
})
const loading = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const accountList = ref<CodmAccount[]>([])
const products = ref<Product[]>([])
const page = ref(1)
const limit = 20
const searchValue = ref('')
const activeCategory = ref(0)
const router = useRouter()
// 分类列表
const categories = ['全部', '上架', '下架']

// ActionSheet 相关
const showActionSheet = ref(false)
const selectedAccount = ref<CodmAccount | null>(null)
const actions = computed<ActionItem[]>(() => {
  const baseActions: ActionItem[] = [
    { name: '修改账号', icon: 'edit' },
  ]

  // 根据当前状态添加上架/下架
  if (selectedAccount.value) {
    if (selectedAccount.value.status === 1) {
      baseActions.push({ name: '下架', icon: 'warning-o', color: '#ff976a' })
    }
    else {
      baseActions.push({ name: '上架', icon: 'success', color: '#07c160' })
    }
  }

  baseActions.push({ name: '删除账号', icon: 'delete-o', color: '#ee0a24' })

  return baseActions
})

async function onLoad() {
  try {
    loading.value = true
    const params: any = { page: page.value, limit }
    if (searchValue.value)
      params.keyword = searchValue.value
    if (activeCategory.value !== 0)
      params.status = activeCategory.value

    const res = await getCodmAccountList(params)
    if (res.data && res.data.list && res.data.list.length > 0) {
      accountList.value.push(...res.data.list)
      // 转换为产品格式
      const newProducts = res.data.list.map((account: CodmAccount) => ({
        id: account.id,
        name: `[${account.serial_number}]${account.title}`,
        price: account.price,
        image: account.images[0] || '',
        status: account.status,
      }))
      products.value.push(...newProducts)
      page.value++
    }
    else {
      finished.value = true
    }
  }
  catch {
    showToast('加载失败')
    finished.value = true
  }
  finally {
    loading.value = false
  }
}

async function onRefresh() {
  try {
    page.value = 1
    finished.value = false
    accountList.value = []
    products.value = []
    await onLoad()
  }
  finally {
    refreshing.value = false
  }
}

const onSearch = debounce(() => {
  page.value = 1
  finished.value = false
  accountList.value = []
  products.value = []
  onLoad()
}, 500)

const onTabChange = debounce(() => {
  page.value = 1
  finished.value = false
  accountList.value = []
  products.value = []
  onLoad()
}, 500)

function onAddAccount() {
  router.push('/codm-account-operation')
}

function onEditAccount(accountId: number) {
  router.push({
    path: '/codm-account-operation',
    query: {
      id: accountId,
    },
  })
}

// 产品点击
function onProductClick(product: Product) {
  // 找到对应的账号
  const account = accountList.value.find(acc => acc.id === product.id)
  if (account) {
    selectedAccount.value = account
    showActionSheet.value = true
  }
}

// ActionSheet 选择
function onActionSelect(action: any) {
  if (!selectedAccount.value)
    return

  if (action.name === '修改账号') {
    onEditAccount(selectedAccount.value.id)
    showActionSheet.value = false
  }
  else if (action.name === '删除账号') {
    showActionSheet.value = false
    confirmDelete(selectedAccount.value)
  }
  else if (action.name === '上架' || action.name === '下架') {
    toggleAccountStatus()
  }
}

// 确认删除
async function confirmDelete(account: CodmAccount) {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定要删除账号 ${account.serial_number} 吗？`,
      confirmButtonText: '删除',
      confirmButtonColor: '#ee0a24',
      cancelButtonText: '取消',
    })

    // 用户确认删除
    await deleteAccount(account)
  }
  catch {
    // 用户取消删除，不做任何操作
  }
}

// 删除账号
async function deleteAccount(account: CodmAccount) {
  try {
    showLoadingToast({
      message: '删除中...',
      forbidClick: true,
      duration: 0,
    })

    await deleteCodmAccount(account.id)
    closeToast()
    showToast('删除成功')

    // 从列表中移除
    const accountIndex = accountList.value.findIndex(item => item.id === account.id)
    if (accountIndex > -1) {
      accountList.value.splice(accountIndex, 1)
    }
    const productIndex = products.value.findIndex(item => item.id === account.id)
    if (productIndex > -1) {
      products.value.splice(productIndex, 1)
    }
  }
  catch (error: any) {
    closeToast()
    console.error(error)
  }
}

// 切换账号状态（上架/下架）
async function toggleAccountStatus() {
  if (!selectedAccount.value)
    return

  const currentStatus = selectedAccount.value.status
  const newStatus = currentStatus === 1 ? 2 : 1
  const statusText = newStatus === 1 ? '上架' : '下架'

  try {
    showLoadingToast({
      message: `${statusText}中...`,
      forbidClick: true,
      duration: 0,
    })

    await patchCodmAccount(selectedAccount.value.id, { status: newStatus })
    closeToast()
    showToast(`${statusText}成功`)

    await onRefresh()

    showActionSheet.value = false
  }
  catch (error: any) {
    closeToast()
    console.error(error)
  }
}

onMounted(() => {
  onLoad()
})
</script>

<template>
  <div class="home-page">
    <!-- 搜索框 -->
    <div class="header-section">
      <van-search
        v-model="searchValue"
        placeholder="搜索账号"
        shape="round"
        background="transparent"
        @search="onSearch"
        @update:model-value="onSearch"
      />
    </div>

    <!-- 分类标签 -->
    <van-tabs
      v-model:active="activeCategory"
      animated
      swipeable
      class="filter-tabs"
      @change="onTabChange"
    >
      <van-tab v-for="(category, index) in categories" :key="index" :title="category" :name="index" />
    </van-tabs>

    <!-- 产品列表 -->
    <div class="products-section">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="loading"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <div class="products-grid">
            <ProductCard
              v-for="product in products"
              :key="product.id"
              :product="product"
              @click="onProductClick"
            />
          </div>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 添加账号按钮 -->
    <AddButton @click="onAddAccount" />
    <van-back-top right="10vw" bottom="10vh" />

    <!-- 操作面板 -->
    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="actions"
      cancel-text="取消"
      close-on-click-action
      :description="`${selectedAccount?.serial_number} - ${selectedAccount?.title}`"
      @select="onActionSelect"
    />
  </div>
</template>

<style scoped lang="less">
.home-page {
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: 100px;

  .header-section {
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border-radius: 12px 12px 0 0;
  }

  .filter-tabs {
    margin-bottom: 10px;

    :deep(.van-tabs__wrap) {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      border-radius: 0 0 12px 12px;
    }

    :deep(.van-tabs__nav) {
      background: #fff;
    }

    :deep(.van-tab) {
      font-weight: 500;
      color: #646566;
      font-size: 15px;
    }

    :deep(.van-tab--active) {
      color: #1989fa;
      font-weight: 600;
    }
  }

  .products-section {
    background: #f7f8fa;

    .products-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
  }
}
</style>

<route lang="json5">
{
  name: 'CodmAccount'
}
</route>

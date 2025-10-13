<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { deleteCodmEmail, getCodmEmailList } from '@/api/codm-email'
import type { CodmEmail } from '@/api/codm-email'
import { closeToast, showConfirmDialog, showLoadingToast, showToast } from 'vant'
import { useRouter } from 'vue-router'
import AddButton from '@/components/AddButton/index.vue'

const loading = ref(false)
const refreshing = ref(false)
const finished = ref(false)
const emailList = ref<CodmEmail[]>([])
const page = ref(1)
const limit = 20
const searchKeyword = ref('')
const activeTab = ref(0)
const router = useRouter()

// ActionSheet 相关
const showActionSheet = ref(false)
const selectedEmail = ref<CodmEmail | null>(null)
const actions = [
  { name: '修改邮箱', icon: 'edit' },
  { name: '删除邮箱', icon: 'delete-o', color: '#ee0a24' },
]
async function onLoad() {
  try {
    loading.value = true
    const params: any = { page: page.value, limit }
    if (searchKeyword.value)
      params.keyword = searchKeyword.value
    if (activeTab.value !== 0)
      params.bind_status = activeTab.value

    const res = await getCodmEmailList(params)
    if (res.data && res.data.list && res.data.list.length > 0) {
      emailList.value.push(...res.data.list)
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
    emailList.value = []
    await onLoad()
  }
  finally {
    refreshing.value = false
  }
}

function onSearch() {
  page.value = 1
  finished.value = false
  emailList.value = []
  onLoad()
}

function onTabChange() {
  page.value = 1
  finished.value = false
  emailList.value = []
  onLoad()
}

function getBindStatusText(status: number) {
  return status === 1 ? '已绑定' : '未绑定'
}

function getBindStatusType(status: number) {
  return status === 1 ? 'success' : 'default'
}

function onAddEmail() {
  router.push('/codm-email-operation')
}

function onEditEmail(email: CodmEmail) {
  router.push({
    path: '/codm-email-operation',
    query: {
      id: email.id,
      prefix: email.prefix,
      postfix: email.postfix,
      bind_status: email.bind_status,
    },
  })
}

// 点击邮箱卡片
function onEmailClick(email: CodmEmail) {
  selectedEmail.value = email
  showActionSheet.value = true
}

// ActionSheet 选择
function onActionSelect(action: any) {
  if (!selectedEmail.value)
    return

  if (action.name === '修改邮箱') {
    onEditEmail(selectedEmail.value)
  }
  else if (action.name === '删除邮箱') {
    confirmDelete(selectedEmail.value)
  }
  showActionSheet.value = false
}

// 确认删除
async function confirmDelete(email: CodmEmail) {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定要删除邮箱 ${email.prefix}${email.postfix} 吗？`,
      confirmButtonText: '删除',
      confirmButtonColor: '#ee0a24',
      cancelButtonText: '取消',
    })

    // 用户确认删除
    await deleteEmail(email)
  }
  catch {
    // 用户取消删除，不做任何操作
  }
}

// 删除邮箱
async function deleteEmail(email: CodmEmail) {
  try {
    showLoadingToast({
      message: '删除中...',
      forbidClick: true,
      duration: 0,
    })

    await deleteCodmEmail(email.id)
    closeToast()
    showToast('删除成功')

    // 从列表中移除
    const index = emailList.value.findIndex(item => item.id === email.id)
    if (index > -1) {
      emailList.value.splice(index, 1)
    }
  }
  catch (error: any) {
    closeToast()
    showToast(error?.message || '删除失败')
  }
}

onMounted(() => {
  onLoad()
})
</script>

<template>
  <div class="codm-email-page">
    <div class="header-section">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索邮箱"
        shape="round"
        background="transparent"
        @search="onSearch"
      />
    </div>

    <van-tabs
      v-model:active="activeTab"
      animated
      swipeable
      class="filter-tabs"
      @change="onTabChange"
    >
      <van-tab title="全部" :name="0" />
      <van-tab title="已绑定" :name="1" />
      <van-tab title="未绑定" :name="2" />
    </van-tabs>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div class="email-list">
          <van-card
            v-for="email in emailList"
            :key="email.id"
            class="email-card"
            @click="onEmailClick(email)"
          >
            <template #title>
              <div class="email-title">
                {{ `${email.prefix}${email.postfix}` }}
              </div>
            </template>
            <template #tags>
              <van-tag
                :type="getBindStatusType(email.bind_status)"
                round
                size="medium"
              >
                {{ getBindStatusText(email.bind_status) }}
              </van-tag>
            </template>
          </van-card>
        </div>
      </van-list>
    </van-pull-refresh>

    <!-- 回到顶部按钮 -->
    <van-back-top right="10vw" bottom="10vh" />

    <!-- 添加邮箱按钮 -->
    <AddButton @click="onAddEmail" />

    <!-- 操作面板 -->
    <van-action-sheet
      v-model:show="showActionSheet"
      :actions="actions"
      cancel-text="取消"
      close-on-click-action
      @select="onActionSelect"
    >
      <template #description>
        <div class="action-sheet-description">
          <div class="email-info">
            {{ selectedEmail?.prefix }}{{ selectedEmail?.postfix }}
          </div>
        </div>
      </template>
    </van-action-sheet>
  </div>
</template>

<style scoped lang="less">
.codm-email-page {
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

  .email-card {
    background: #fff;
    border-radius: 12px;
    margin-bottom: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
    overflow: hidden;

    &:active {
      transform: scale(0.98);
      box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
    }

    :deep(.van-card__content) {
      min-height: auto;
    }

    .email-title {
      font-size: 16px;
      font-weight: 600;
      color: #323233;
      margin-bottom: 6px;
      word-break: break-all;
    }

    .email-id {
      font-size: 13px;
      color: #969799;
      margin-top: 4px;
    }

    :deep(.van-card__tags) {
      margin-top: 8px;
    }
  }

  :deep(.van-list__finished-text) {
    color: #969799;
    font-size: 13px;
    padding: 16px 0;
  }

  :deep(.van-list__loading) {
    padding: 16px 0;
  }

  .action-sheet-description {
    padding: 16px;
    text-align: center;

    .email-info {
      font-size: 16px;
      font-weight: 600;
      color: #323233;
      word-break: break-all;
    }
  }
}
</style>

<route lang="json5">
{
  meta: {
    keepAlive: true
  },
  name: 'CodmEmail'
}
</route>

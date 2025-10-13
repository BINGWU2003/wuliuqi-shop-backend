<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getCodmEmailList } from '@/api/codm-email'
import type { CodmEmail } from '@/api/codm-email'
import { showToast } from 'vant'
import { useEmailSelectStore } from '@/stores'
import { debounce } from 'lodash-es'

const router = useRouter()
const emailSelectStore = useEmailSelectStore()
const loading = ref(false)
const finished = ref(false)
const emailList = ref<CodmEmail[]>([])
const page = ref(1)
const limit = 20
const searchKeyword = ref('')
const activeTab = ref(0)

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

const onSearch = debounce(() => {
  page.value = 1
  finished.value = false
  emailList.value = []
  onLoad()
}, 500)

const onTabChange = debounce(() => {
  page.value = 1
  finished.value = false
  emailList.value = []
  onLoad()
}, 500)

function getBindStatusText(status: number) {
  return status === 1 ? '已绑定' : '未绑定'
}

function getBindStatusType(status: number) {
  return status === 1 ? 'success' : 'default'
}

// 选择邮箱
function onSelectEmail(email: CodmEmail) {
  if (email.bind_status === 1) {
    showToast('该邮箱已绑定')
    return
  }
  const fullEmail = `${email.prefix}${email.postfix}`
  // 使用 Pinia store 保存选中的邮箱
  emailSelectStore.setSelectedEmail(fullEmail, email)
  // 返回上一页
  router.back()
}

onMounted(() => {
  onLoad()
  window.scrollTo(0, 0)
})
</script>

<template>
  <div class="email-select-page">
    <div class="header-section">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索邮箱"
        shape="round"
        background="transparent"
        @search="onSearch"
        @update:model-value="onSearch"
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

    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="onLoad"
    >
      <div class="email-list">
        <van-cell
          v-for="email in emailList"
          :key="email.id"
          class="email-item"
          :title="`${email.prefix}${email.postfix}`"
          is-link
          @click="onSelectEmail(email)"
        >
          <template #label>
            <van-tag
              :type="getBindStatusType(email.bind_status)"
              round
              size="medium"
              class="status-tag"
            >
              {{ getBindStatusText(email.bind_status) }}
            </van-tag>
          </template>
        </van-cell>
      </div>
    </van-list>
    <van-back-top right="10vw" bottom="10vh" />
  </div>
</template>

<style scoped lang="less">
.email-select-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);
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

  .email-item {
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

    :deep(.van-cell__title) {
      font-size: 16px;
      font-weight: 600;
      color: #323233;
    }

    .status-tag {
      margin-top: 6px;
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
}
</style>

<route lang="json5">
{
  name: 'EmailSelect'
}
</route>

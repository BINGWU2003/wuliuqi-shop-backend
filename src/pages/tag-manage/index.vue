<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getSequenceCounterList } from '@/api/sequence-counters'
import type { SequenceCounter } from '@/api/sequence-counters'
import { showToast } from 'vant'

const loading = ref(false)
const counterList = ref<SequenceCounter[]>([])

// 加载计数器列表
async function loadCounters() {
  try {
    loading.value = true
    const res = await getSequenceCounterList()
    if (res.data && Array.isArray(res.data)) {
      counterList.value = res.data
    }
    else if (res.data && res.data.list) {
      counterList.value = res.data.list
    }
  }
  catch {
    showToast('加载失败')
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCounters()
})
</script>

<template>
  <div class="tag-manage-page">
    <div class="content">
      <van-pull-refresh v-model="loading" @refresh="loadCounters">
        <van-list>
          <van-cell-group v-if="counterList.length > 0" inset>
            <van-cell
              v-for="counter in counterList"
              :key="counter.id"
              :title="counter.counter_name"
              :value="`标签索引：${String(counter.current_value)}`"
            />
          </van-cell-group>
          <van-empty v-else description="暂无数据" />
        </van-list>
      </van-pull-refresh>
    </div>
  </div>
</template>

<style scoped lang="less">
.tag-manage-page {
  min-height: 80vh;
  background-color: #f7f8fa;
}
</style>

<route lang="json5">
{
  name: 'TagManage'
}
</route>

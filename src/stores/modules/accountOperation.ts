import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CreateCodmAccountData } from '@/api/codm-account'

const useAccountOperationStore = defineStore('accountOperation', () => {
  // 表单数据（直接使用，不再用局部 formData）
  const formData = ref<CreateCodmAccountData>({
    images: [],
    price: 0,
    title: '',
    describe: '',
    xianyu_url: '',
    email: '',
    status: 1, // 默认上架
  })

  // 是否需要重新加载数据
  const shouldReloadData = ref<boolean>(true)

  // 设置表单数据
  const setFormData = (data: CreateCodmAccountData) => {
    formData.value = data
  }

  // 重置表单数据
  const resetFormData = () => {
    formData.value = {
      images: [],
      price: 0,
      title: '',
      describe: '',
      xianyu_url: '',
      email: '',
      status: 1,
    }
    shouldReloadData.value = true
  }

  // 设置是否需要重新加载数据
  const setShouldReloadData = (value: boolean) => {
    shouldReloadData.value = value
  }

  return {
    formData,
    shouldReloadData,
    setFormData,
    resetFormData,
    setShouldReloadData,
  }
})

export default useAccountOperationStore

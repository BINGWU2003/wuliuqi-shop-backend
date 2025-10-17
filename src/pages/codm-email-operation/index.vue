<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { closeToast, showLoadingToast, showToast } from 'vant'
import { createCodmEmail, updateCodmEmail } from '@/api/codm-email'
import type { CreateCodmEmailData } from '@/api/codm-email'

const route = useRoute()
const router = useRouter()

// 判断是否为编辑模式
const isEdit = ref(false)
const emailId = ref<number | null>(null)

// 表单数据
const formData = ref<CreateCodmEmailData>({
  prefix: '',
  postfix: '@163.com',
  bind_status: 2, // 默认未绑定
})

// 后缀选项列表
const postfixOptions = [
  { text: '@163.com', value: '@163.com' },
  { text: '@gmail.com', value: '@gmail.com' },
  { text: '@outlook.com', value: '@outlook.com' },
  { text: '@hotmail.com', value: '@hotmail.com' },
  { text: '@yahoo.com', value: '@yahoo.com' },
  { text: '@qq.com', value: '@qq.com' },
  { text: '@126.com', value: '@126.com' },
]

// 显示后缀选择器
const showPostfixPicker = ref(false)

// 选择后缀
function onPostfixConfirm(value: { selectedOptions: any[] }) {
  formData.value.postfix = value.selectedOptions[0]?.value || '@163.com'
  showPostfixPicker.value = false
}

// 获取绑定状态文本
function getBindStatusText(status: number) {
  return status === 1 ? '已绑定' : '未绑定'
}

// 验证表单
function validateForm() {
  if (!formData.value.prefix.trim()) {
    showToast('请输入邮箱前缀')
    return false
  }
  if (!formData.value.postfix) {
    showToast('请选择邮箱后缀')
    return false
  }
  return true
}

// 提交表单
async function onSubmit() {
  if (!validateForm())
    return

  try {
    showLoadingToast({
      message: isEdit.value ? '修改中...' : '创建中...',
      forbidClick: true,
      duration: 0,
    })

    if (isEdit.value && emailId.value) {
      await updateCodmEmail(emailId.value, formData.value)
      showToast('修改成功')
    }
    else {
      await createCodmEmail(formData.value)
      showToast('创建成功')
    }

    closeToast()
    router.back()
  }
  catch (error: any) {
    closeToast()
    console.error(error)
  }
}

// 初始化页面
onMounted(() => {
  // 检查路由参数，判断是新增还是编辑
  const id = route.query.id
  const prefix = route.query.prefix
  const postfix = route.query.postfix
  const bindStatus = route.query.bind_status

  if (id) {
    isEdit.value = true
    emailId.value = Number(id)
    formData.value.prefix = String(prefix || '')
    formData.value.postfix = String(postfix || '@gmail.com')
    formData.value.bind_status = Number(bindStatus || 2)
  }
})
</script>

<template>
  <div class="email-operation-page">
    <div class="form-container">
      <van-form @submit="onSubmit">
        <!-- 邮箱前缀 -->
        <van-cell-group inset>
          <van-field
            v-model="formData.prefix"
            name="prefix"
            label="邮箱前缀"
            placeholder="请输入邮箱前缀"
            required
            :rules="[{ required: true, message: '请输入邮箱前缀' }]"
          />

          <!-- 邮箱后缀 -->
          <van-field
            v-model="formData.postfix"
            is-link
            readonly
            name="postfix"
            label="邮箱后缀"
            placeholder="请选择邮箱后缀"
            required
            @click="showPostfixPicker = true"
          />
        </van-cell-group>

        <!-- 编辑模式下显示绑定状态（只读） -->
        <van-cell-group v-if="isEdit" inset class="mt-16">
          <van-field
            :model-value="getBindStatusText(formData.bind_status)"
            readonly
            name="bind_status"
            label="绑定状态"
            disabled
          />
        </van-cell-group>

        <!-- 完整邮箱预览 -->
        <van-cell-group inset class="mt-16">
          <div class="email-preview-container">
            <div class="email-preview-title">
              完整邮箱
            </div>
            <div class="email-preview-value">
              {{ formData.prefix }}{{ formData.postfix }}
            </div>
          </div>
        </van-cell-group>

        <!-- 提交按钮 -->
        <div class="submit-button">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            size="large"
          >
            {{ isEdit ? '保存修改' : '创建邮箱' }}
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 后缀选择器 -->
    <van-popup v-model:show="showPostfixPicker" position="bottom">
      <van-picker
        :columns="postfixOptions"
        @confirm="onPostfixConfirm"
        @cancel="showPostfixPicker = false"
      />
    </van-popup>
  </div>
</template>

<style scoped lang="less">
.email-operation-page {
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);

  .form-container {
    .mt-16 {
      margin-top: 16px;
    }

    .email-preview-container {
      padding: 16px;

      .email-preview-title {
        font-size: 14px;
        color: #646566;
        font-weight: 500;
        margin-bottom: 12px;
      }

      .email-preview-value {
        color: #1989fa;
        font-weight: 600;
        font-size: 16px;
        word-break: break-all;
        line-height: 1.5;
      }
    }

    .submit-button {
      margin-top: 20px;
    }
  }

  :deep(.van-cell-group--inset) {
    margin: 0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }

  :deep(.van-field__label) {
    color: #646566;
    font-weight: 500;
  }

  :deep(.van-field__value) {
    color: #323233;
  }

  :deep(.van-button--primary) {
    background: linear-gradient(135deg, #1989fa 0%, #0d6efd 100%);
    border: none;
    box-shadow: 0 4px 16px rgba(25, 137, 250, 0.3);
  }
}
</style>

<route lang="json5">
  {
    name: 'CodmEmailOperation'
  }
</route>

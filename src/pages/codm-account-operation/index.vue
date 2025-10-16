<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { closeToast, showLoadingToast, showToast } from 'vant'
import { createCodmAccount, getCodmAccountDetail, updateCodmAccount } from '@/api/codm-account'
import { uploadFile } from '@/utils/upload-file'
import { useAccountOperationStore, useEmailSelectStore } from '@/stores'
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IDomEditor } from '@wangeditor/editor'

const route = useRoute()
const router = useRouter()
const emailSelectStore = useEmailSelectStore()
const accountOperationStore = useAccountOperationStore()

// 判断是否为编辑模式
const isEdit = ref(false)
const accountId = ref<number | null>(null)

// 使用计算属性拦截 formData 的修改，自动同步到 Pinia store
const formData = computed({
  get: () => accountOperationStore.formData,
  set: (value) => {
    accountOperationStore.setFormData(value)
  },
})

// 状态选项
const statusOptions = [
  { text: '上架', value: 1 },
  { text: '下架', value: 2 },
]

// 显示状态选择器
const showStatusPicker = ref(false)

// 图片上传相关
const fileList = ref<any[]>([])
const uploadingCount = ref(0)

// 富文本编辑器
const editorRef = shallowRef<IDomEditor>()
const editorHtml = ref(formData.value.describe || '')
const toolbarConfig = {
  toolbarKeys: ['numberedList', 'undo', 'redo'],
}
const editorConfig = {
  placeholder: '请输入账号描述',
}

function handleEditorCreated(editor: IDomEditor) {
  editorRef.value = editor
}

watch(
  () => formData.value.describe,
  (value) => {
    const normalized = value || ''
    if (normalized !== editorHtml.value)
      editorHtml.value = normalized
  },
)

watch(
  editorHtml,
  (value) => {
    if (value !== formData.value.describe)
      formData.value.describe = value || ''
  },
)

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor)
    editor.destroy()
})

// 选择状态
function onStatusConfirm(value: { selectedOptions: any[] }) {
  formData.value.status = value.selectedOptions[0]?.value || 1
  showStatusPicker.value = false
}

// 获取状态文本
function getStatusText(status: number) {
  return status === 1 ? '上架' : '下架'
}

// 跳转到邮箱选择页面
function goToEmailSelect() {
  // 标记不需要重新加载数据（数据已经在 store 中了）
  accountOperationStore.setShouldReloadData(false)
  // 清空之前的邮箱选择
  emailSelectStore.clearSelectedEmail()
  router.push('/email-select')
}

// 监听邮箱选择变化
watch(() => emailSelectStore.selectedEmail, (newEmail) => {
  if (newEmail) {
    formData.value.email = newEmail
  }
})

// 图片上传后
async function onAfterRead(fileInfo: any) {
  const files = Array.isArray(fileInfo) ? fileInfo : [fileInfo]

  for (const item of files) {
    try {
      uploadingCount.value++
      // 显示上传中状态
      item.status = 'uploading'
      item.message = '上传中...'

      // 上传到腾讯云 COS
      const result = await uploadFile({
        file: item.file,
        folder: 'codm-accounts/', // 指定上传到的文件夹
        onProgress: (percent) => {
          item.message = `上传中 ${percent}%`
        },
      })

      // 上传成功
      item.status = 'done'
      item.message = ''
      item.url = result.url
      formData.value.images.push(result.url)
    }
    catch (error) {
      // 上传失败
      item.status = 'failed'
      item.message = '上传失败'
      showToast(error instanceof Error ? error.message : '图片上传失败')
    }
    finally {
      uploadingCount.value--
    }
  }
}

// 删除图片
function onDelete(_file: any, detail: any) {
  const deletedUrl = fileList.value[detail.index]?.url
  if (deletedUrl) {
    const index = formData.value.images.indexOf(deletedUrl)
    if (index > -1) {
      formData.value.images.splice(index, 1)
    }
  }
}

// 验证表单
function validateForm() {
  if (formData.value.images.length === 0) {
    showToast('请至少上传一张图片')
    return false
  }
  if (!formData.value.title.trim()) {
    showToast('请输入标题')
    return false
  }
  if (formData.value.price <= 0) {
    showToast('请输入正确的价格')
    return false
  }
  const strippedDescribe = (formData.value.describe || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, '')
    .trim()
  if (!strippedDescribe) {
    showToast('请输入描述')
    return false
  }
  if (!formData.value.email.trim()) {
    showToast('请输入邮箱')
    return false
  }
  return true
}

// 提交表单
async function onSubmit() {
  // 检查是否有图片正在上传
  if (uploadingCount.value > 0) {
    showToast('请等待图片上传完成')
    return
  }

  if (!validateForm())
    return

  try {
    showLoadingToast({
      message: isEdit.value ? '修改中...' : '创建中...',
      forbidClick: true,
      duration: 0,
    })

    if (isEdit.value && accountId.value) {
      await updateCodmAccount(accountId.value, formData.value)
      showToast('修改成功')
    }
    else {
      await createCodmAccount(formData.value)
      showToast('创建成功')
    }

    closeToast()
    // 提交成功后清空 store 数据
    accountOperationStore.resetFormData()
    router.back()
  }
  catch (error: any) {
    closeToast()
    console.error(error)
  }
}

// 初始化页面
onMounted(async () => {
  // 检查路由参数，判断是新增还是编辑
  const id = route.query.id

  if (id) {
    isEdit.value = true
    accountId.value = Number(id)

    // 根据 store 状态决定是否需要重新加载数据
    if (accountOperationStore.shouldReloadData) {
      // 需要加载数据：从服务器加载账号详情
      try {
        showLoadingToast({
          message: '加载中...',
          forbidClick: true,
          duration: 0,
        })

        const res = await getCodmAccountDetail(Number(id))
        const account = res.data

        if (account) {
          // 直接更新 store 的 formData
          accountOperationStore.setFormData({
            images: account.images || [],
            price: account.price,
            title: account.title,
            describe: account.describe,
            xianyu_url: account.xianyu_url || '',
            email: account.email,
            status: account.status,
          })

          // 初始化图片列表
          fileList.value = (account.images || []).map((url: string) => ({
            url,
            isImage: true,
          }))
        }

        closeToast()
      }
      catch {
        closeToast()
        showToast('加载失败')
      }
    }
    else {
      // 不需要加载数据：数据已经在 store 中了，只需初始化图片列表
      fileList.value = (formData.value.images || []).map((url: string) => ({
        url,
        isImage: true,
      }))

      // 重置状态，下次进入时重新加载数据
      accountOperationStore.setShouldReloadData(true)
    }
  }
  else {
    // 新增模式：如果 shouldReloadData 为 true，重置表单
    if (accountOperationStore.shouldReloadData) {
      accountOperationStore.resetFormData()
    }
    else {
      // 从邮箱选择返回，保留 store 中的数据
      fileList.value = (formData.value.images || []).map((url: string) => ({
        url,
        isImage: true,
      }))
      // 重置状态
      accountOperationStore.setShouldReloadData(true)
    }
  }

  // 如果有选中的邮箱，更新邮箱字段
  if (emailSelectStore.selectedEmail) {
    formData.value.email = emailSelectStore.selectedEmail
    // 清空邮箱选择
    emailSelectStore.clearSelectedEmail()
  }
})
</script>

<template>
  <div class="account-operation-page">
    <div class="form-container">
      <van-form @submit="onSubmit">
        <!-- 图片上传 -->
        <van-cell-group inset>
          <van-field name="uploader" label="商品图片">
            <template #input>
              <van-uploader
                v-model="fileList"
                multiple
                :max-count="10"
                :after-read="onAfterRead"
                @delete="onDelete"
              >
                <template #preview-cover="{ file }">
                  <div v-if="file && file.status === 'uploading'" class="upload-mask">
                    <van-loading type="spinner" size="20" />
                    <div class="upload-text">
                      {{ file.message }}
                    </div>
                  </div>
                  <div v-else-if="file && file.status === 'failed'" class="upload-mask error">
                    <van-icon name="close" size="20" />
                    <div class="upload-text">
                      上传失败
                    </div>
                  </div>
                </template>
              </van-uploader>
            </template>
          </van-field>
        </van-cell-group>

        <!-- 基本信息 -->
        <van-cell-group inset class="mt-16">
          <van-field
            v-model="formData.title"
            name="title"
            label="标题"
            placeholder="请输入标题"
            required
            :rules="[{ required: true, message: '请输入标题' }]"
          />

          <van-field
            v-model.number="formData.price"
            type="number"
            name="price"
            label="价格"
            placeholder="请输入价格"
            required
            :rules="[{ required: true, message: '请输入价格' }]"
          >
            <template #button>
              <span>元</span>
            </template>
          </van-field>

          <van-field
            v-model="formData.email"
            is-link
            readonly
            name="email"
            label="邮箱"
            placeholder="请选择邮箱"
            required
            :rules="[{ required: true, message: '请选择邮箱' }]"
            @click="goToEmailSelect"
          />

          <van-field
            :model-value="getStatusText(formData.status)"
            is-link
            readonly
            name="status"
            label="状态"
            placeholder="请选择状态"
            @click="showStatusPicker = true"
          />
        </van-cell-group>

        <!-- 详细信息 -->
        <van-cell-group inset class="mt-16">
          <van-field
            name="describe"
            label="描述"
            required
            class="rich-editor-field"
          >
            <template #input>
              <div class="editor-wrapper">
                <Toolbar
                  class="editor-toolbar"
                  :editor="editorRef"
                  :default-config="toolbarConfig"
                  mode="default"
                />
                <Editor
                  v-model="editorHtml"
                  class="editor-content"
                  :default-config="editorConfig"
                  mode="default"
                  @on-created="handleEditorCreated"
                />
              </div>
            </template>
          </van-field>

          <van-field
            v-model="formData.xianyu_url"
            name="xianyu_url"
            label="闲鱼链接"
            placeholder="请输入闲鱼链接（可选）"
          />
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
            {{ isEdit ? '保存修改' : '创建账号' }}
          </van-button>
        </div>
      </van-form>
    </div>

    <!-- 状态选择器 -->
    <van-popup v-model:show="showStatusPicker" position="bottom">
      <van-picker
        :columns="statusOptions"
        @confirm="onStatusConfirm"
        @cancel="showStatusPicker = false"
      />
    </van-popup>
  </div>
</template>

<style scoped lang="less">
.account-operation-page {
  background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%);

  .form-container {
    .mt-16 {
      margin-top: 16px;
    }

    .submit-button {
      margin-top: 32px;
    }
  }

  .rich-editor-field {
    :deep(.van-field__value) {
      padding: 0;
    }
  }

  .editor-wrapper {
    width: 100%;
    border: 1px solid #ebedf0;
    border-radius: 8px;
    background-color: #fff;
    overflow: hidden;
  }

  .editor-toolbar {
    border-bottom: 1px solid #ebedf0;
  }

  .editor-content {
    min-height: 180px;
  }

  .editor-content :deep(.w-e-text-container) {
    min-height: 180px;
  }

  .editor-content :deep(.w-e-text) {
    padding: 12px;
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

  .upload-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;

    &.error {
      background: rgba(238, 10, 36, 0.7);
    }

    .upload-text {
      margin-top: 4px;
      font-size: 12px;
    }
  }
}
</style>

<route lang="json5">
  {
    name: 'CodmAccountOperation'
  }
</route>

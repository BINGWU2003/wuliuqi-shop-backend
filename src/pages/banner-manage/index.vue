<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { showLoadingToast, showToast } from 'vant'
import { COSUploadError, uploadFile } from '@/utils/upload-file'
import { getCarousel, updateCarousel } from '@/api/carousel'
import { useImagePreview } from '@/components/ImagePreview/useImagePreview'
import { useRouter } from 'vue-router'

interface ImageItem {
  sort_order: number
  url: string
  link_url?: string
}

const images = ref<ImageItem[]>([])
const uploadProgress = ref(0)
const isUploading = ref(false)
const isSaving = ref(false)
const router = useRouter()
const MAX_IMAGES = 6
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const CAROUSEL_NAME = 'home_ads'

function handleImageClick(index: number) {
  const imageUrls = images.value.map(item => item.url)
  const { show } = useImagePreview({
    images: imageUrls,
    startPosition: index,
  })
  show()
}

async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  // 验证文件数量
  if (images.value.length >= MAX_IMAGES) {
    showToast(`最多只能添加${MAX_IMAGES}张图片`)
    input.value = ''
    return
  }

  // 验证文件类型
  if (!ALLOWED_TYPES.includes(file.type)) {
    showToast('只支持 JPG、PNG、GIF、WebP 格式的图片')
    input.value = ''
    return
  }

  // 验证文件大小
  if (file.size > MAX_FILE_SIZE) {
    showToast('图片大小不能超过 10MB')
    input.value = ''
    return
  }

  // 开始上传
  isUploading.value = true
  uploadProgress.value = 0
  const toast = showLoadingToast({
    message: '上传中 0%',
    forbidClick: true,
    duration: 0,
  })

  try {
    const result = await uploadFile({
      file,
      folder: 'banners/',
      maxSize: MAX_FILE_SIZE,
      allowedTypes: ALLOWED_TYPES,
      onProgress: (progress) => {
        uploadProgress.value = progress
        toast.message = `上传中 ${progress}%`
      },
    })

    // 上传成功，添加到列表
    const newImage: ImageItem = {
      sort_order: images.value.length,
      url: result.url,
      link_url: '',
    }
    images.value.push(newImage)
    showToast('图片上传成功')
  }
  catch (error) {
    console.error('上传失败:', error)

    if (error instanceof COSUploadError) {
      showToast(error.message)
    }
    else {
      showToast('图片上传失败，请重试')
    }
  }
  finally {
    toast.close()
    isUploading.value = false
    uploadProgress.value = 0
    input.value = ''
  }
}

function handleAddImage() {
  if (images.value.length >= MAX_IMAGES) {
    showToast(`最多只能添加${MAX_IMAGES}张图片`)
    return
  }

  // 触发文件选择
  const input = document.getElementById('image-upload') as HTMLInputElement
  input?.click()
}

function handleDeleteImage(index: number) {
  images.value.splice(index, 1)
  showToast('图片删除成功')
}

async function handleGetCarousel() {
  try {
    const res = await getCarousel(CAROUSEL_NAME)
    if (res?.data?.items && Array.isArray(res.data.items)) {
      images.value = res.data.items.sort((a: ImageItem, b: ImageItem) => a.sort_order - b.sort_order)
    }
  }
  catch (error) {
    console.error('获取轮播图失败:', error)
  }
}

async function handleSave() {
  if (isSaving.value) {
    return
  }

  if (images.value.length === 0) {
    showToast('请至少添加一张图片')
    return
  }

  isSaving.value = true
  const toast = showLoadingToast({
    message: '保存中...',
    forbidClick: true,
    duration: 0,
  })

  try {
    // 更新 sort_order
    const items = images.value.map((item, index) => ({
      sort_order: index,
      url: item.url,
      ...(item.link_url && { link_url: item.link_url }),
    }))

    await updateCarousel(CAROUSEL_NAME, { items })
    showToast('保存成功')
    router.back()
  }
  catch (error) {
    console.error('保存失败:', error)
    showToast('保存失败，请重试')
  }
  finally {
    toast.close()
    isSaving.value = false
  }
}

onMounted(() => {
  handleGetCarousel()
})
</script>

<template>
  <div class="banner-manage">
    <div class="header">
      <h2>Banner 管理</h2>
      <p class="tip">
        拖拽图片可调整顺序，最多{{ MAX_IMAGES }}张
      </p>
    </div>

    <VueDraggable
      v-model="images"
      class="image-list"
      :animation="300"
      ghost-class="ghost"
    >
      <div
        v-for="(item, index) in images"
        :key="`${item.url}-${index}`"
        class="image-item"
      >
        <img
          :src="item.url"
          :alt="`图片${index + 1}`"
          class="image"
          @click="handleImageClick(index)"
        >
        <div class="image-mask">
          <span class="image-index">{{ index + 1 }}</span>
          <van-icon
            name="cross"
            :size="16"
            class="delete-icon"
            @click.stop="handleDeleteImage(index)"
          />
        </div>
        <div v-if="item.link_url" class="link-indicator">
          <van-icon name="link" :size="12" />
        </div>
      </div>
    </VueDraggable>

    <div
      v-if="images.length < MAX_IMAGES"
      class="add-button"
      @click="handleAddImage"
    >
      <van-icon name="plus" :size="40" />
      <span>添加图片</span>
    </div>

    <!-- 隐藏的文件输入 -->
    <input
      id="image-upload"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      style="display: none"
      @change="handleFileSelect"
    >

    <!-- 保存按钮 -->
    <div class="save-button-wrapper">
      <van-button
        type="primary"
        block
        :loading="isSaving"
        :disabled="images.length === 0"
        @click="handleSave"
      >
        保存
      </van-button>
    </div>
  </div>
</template>

<style scoped lang="less">
.banner-manage {
  padding: 16px;
  background-color: #f7f8fa;
}

.header {
  margin-bottom: 20px;

  h2 {
    margin: 0 0 8px;
    font-size: 20px;
    font-weight: 600;
    color: #323233;
  }

  .tip {
    margin: 0;
    font-size: 14px;
    color: #969799;
  }
}

.image-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.image-item {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background-color: #fff;
  border-radius: 8px;
  cursor: move;

  .image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-mask {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    width: 100%;
    padding: 8px;
    background: linear-gradient(180deg, rgb(0 0 0 / 40%) 0%, transparent 100%);

    .image-index {
      padding: 2px 8px;
      font-size: 12px;
      color: #fff;
      background-color: rgb(0 0 0 / 50%);
      border-radius: 10px;
    }

    .delete-icon {
      padding: 4px;
      font-size: 16px;
      color: #fff;
      background-color: rgb(0 0 0 / 50%);
      border-radius: 50%;
    }
  }

  .link-indicator {
    position: absolute;
    right: 8px;
    bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px 8px;
    color: #fff;
    background-color: rgb(0 0 0 / 50%);
    border-radius: 10px;
  }
}

.ghost {
  opacity: 0.5;
}

.add-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 9;
  color: #969799;
  cursor: pointer;
  background-color: #fff;
  border: 2px dashed #dcdee0;
  border-radius: 8px;

  span {
    margin-top: 8px;
    font-size: 14px;
  }

  &:active {
    background-color: #f7f8fa;
  }
}

.save-button-wrapper {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 12px 16px;
  background-color: #fff;
  border-top: 1px solid #ebedf0;
  box-shadow: 0 -2px 8px rgb(0 0 0 / 8%);
}
</style>

<route lang="json5">
{
  name: 'BannerManage'
}
</route>

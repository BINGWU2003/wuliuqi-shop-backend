<script setup lang="ts">
import { ref } from 'vue'
import { uploadFile } from '@/utils/upload-file'

const uploading = ref(false)
const progress = ref(0)
const uploadResult = ref<string>('')
const errorMessage = ref<string>('')

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) {
    return
  }

  try {
    uploading.value = true
    progress.value = 0
    errorMessage.value = ''
    uploadResult.value = ''

    const result = await uploadFile({
      file,
      folder: 'test/', // 可选：指定上传到的文件夹
      onProgress: (percent) => {
        progress.value = percent
      },
    })

    uploadResult.value = result.url
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '上传失败'
    console.error('上传失败:', error)
  }
  finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="upload-test">
    <h2>文件上传测试</h2>

    <div class="upload-section">
      <input
        type="file"
        :disabled="uploading"
        @change="handleFileChange"
      >
    </div>

    <div v-if="uploading" class="progress-section">
      <p>上传中... {{ progress }}%</p>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progress}%` }" />
      </div>
    </div>

    <div v-if="errorMessage" class="error-section">
      <p>错误: {{ errorMessage }}</p>
    </div>

    <div v-if="uploadResult" class="result-section">
      <p>上传成功!</p>
      <p>文件地址: <a :href="uploadResult" target="_blank">{{ uploadResult }}</a></p>
      <img v-if="uploadResult.match(/\.(jpg|jpeg|png|gif|webp)$/i)" :src="uploadResult" alt="上传的图片">
    </div>
  </div>
</template>

<style lang="less" scoped>
.upload-test {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;

  h2 {
    margin-bottom: 20px;
  }

  .upload-section {
    margin-bottom: 20px;

    input[type='file'] {
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  .progress-section {
    margin-bottom: 20px;

    .progress-bar {
      width: 100%;
      height: 20px;
      background-color: #f0f0f0;
      border-radius: 10px;
      overflow: hidden;
      margin-top: 10px;

      .progress-fill {
        height: 100%;
        background-color: #4caf50;
        transition: width 0.3s ease;
      }
    }
  }

  .error-section {
    padding: 10px;
    background-color: #ffebee;
    color: #c62828;
    border-radius: 4px;
    margin-bottom: 20px;
  }

  .result-section {
    padding: 10px;
    background-color: #e8f5e9;
    border-radius: 4px;

    p {
      margin: 5px 0;
      word-break: break-all;
    }

    a {
      color: #1976d2;
      text-decoration: underline;
    }

    img {
      max-width: 100%;
      margin-top: 10px;
      border-radius: 4px;
    }
  }
}
</style>

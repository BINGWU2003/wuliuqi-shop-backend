<script setup lang="ts">
import { ref } from 'vue'
import { showDialog, showImagePreview } from 'vant'
import type { ImagePreviewOptions } from 'vant'

interface ImagePreviewProps {
  images: string[]
  startPosition?: number
  closeable?: boolean
  showIndex?: boolean
  enableLongPress?: boolean
  longPressActions?: Array<{
    name: string
    callback: (image: string, index: number) => void
  }>
}

const props = withDefaults(defineProps<ImagePreviewProps>(), {
  startPosition: 0,
  closeable: true,
  showIndex: true,
  enableLongPress: true,
  longPressActions: () => [
    {
      name: '保存图片',
      callback: (_image: string) => {
        // Default action
      },
    },
  ],
})

const emit = defineEmits<{
  change: [index: number]
  close: []
}>()

let longPressTimer: NodeJS.Timeout | null = null
const currentIndex = ref(props.startPosition)

function showPreview() {
  const options: ImagePreviewOptions = {
    images: props.images,
    startPosition: props.startPosition,
    closeable: props.closeable,
    showIndex: props.showIndex,
    onChange: (index: number) => {
      currentIndex.value = index
      emit('change', index)
    },
    onClose: () => {
      emit('close')
    },
  }

  const instance = showImagePreview(options)

  if (props.enableLongPress) {
    setupLongPress()
  }

  return instance
}

function setupLongPress() {
  setTimeout(() => {
    const imageElements = document.querySelectorAll('.van-image-preview__image img')

    imageElements.forEach((img, index) => {
      img.addEventListener('touchstart', e => handleTouchStart(e, index))
      img.addEventListener('touchend', handleTouchEnd)
      img.addEventListener('touchmove', handleTouchEnd)
    })
  }, 100)
}

function handleTouchStart(_: Event, index: number) {
  longPressTimer = setTimeout(() => {
    showActionSheet(index)
  }, 500)
}

function handleTouchEnd() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function showActionSheet(index: number) {
  const currentImage = props.images[index]
  const actions = props.longPressActions.map(action => ({
    name: action.name,
    callback: () => action.callback(currentImage, index),
  }))

  showDialog({
    title: '图片操作',
    message: actions.map((action, i) => `${i + 1}. ${action.name}`).join('\n'),
    showCancelButton: true,
  }).then(() => {
    if (actions.length > 0) {
      actions[0].callback()
    }
  })
}

defineExpose({
  show: showPreview,
})
</script>

<template>
  <div class="image-preview-wrapper" />
</template>

<style scoped lang="less">
.image-preview-wrapper {
  display: none;
}
</style>

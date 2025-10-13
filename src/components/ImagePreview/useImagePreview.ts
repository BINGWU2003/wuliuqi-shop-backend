import { ref } from 'vue'
import { showImagePreview } from 'vant'
import type { ImagePreviewOptions } from 'vant'

interface LongPressAction {
  name: string
  callback: (image: string, index: number) => void
}

interface UseImagePreviewOptions {
  images: string[]
  startPosition?: number
  closeable?: boolean
  showIndex?: boolean
  enableLongPress?: boolean
  longPressActions?: LongPressAction[]
  onChange?: (index: number) => void
  onClose?: () => void
}

export function useImagePreview(options: UseImagePreviewOptions) {
  const {
    images,
    startPosition = 0,
    closeable = true,
    showIndex = true,
    enableLongPress = true,
    longPressActions = [
      {
        name: '保存图片',
        callback: (_image: string) => {
          // Default action
        },
      },
    ],
    onChange,
    onClose,
  } = options

  let longPressTimer: NodeJS.Timeout | null = null
  const showActionSheet = ref(false)
  const actionSheetActions = ref<Array<{ name: string }>>([])
  let pendingImageIndex = 0

  function show() {
    const previewOptions: ImagePreviewOptions = {
      images,
      startPosition,
      closeable,
      showIndex,
      onChange: (index: number) => {
        onChange?.(index)
      },
      onClose: () => {
        onClose?.()
        cleanup()
      },
    }

    const instance = showImagePreview(previewOptions)

    if (enableLongPress) {
      setupLongPress()
    }

    return instance
  }

  function setupLongPress() {
    setTimeout(() => {
      const imageElements = document.querySelectorAll('.van-image-preview__image img')

      imageElements.forEach((img, index) => {
        const element = img as HTMLElement
        element.addEventListener('touchstart', e => handleTouchStart(e, index))
        element.addEventListener('touchend', handleTouchEnd)
        element.addEventListener('touchmove', handleTouchEnd)
        element.addEventListener('contextmenu', e => e.preventDefault())
      })
    }, 100)
  }

  function handleTouchStart(_e: Event, index: number) {
    longPressTimer = setTimeout(() => {
      showActions(index)
    }, 500)
  }

  function handleTouchEnd() {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
  }

  function showActions(index: number) {
    pendingImageIndex = index
    actionSheetActions.value = longPressActions.map(action => ({
      name: action.name,
    }))
    showActionSheet.value = true
  }

  function onActionSelect(_action: { name: string }, actionIndex: number) {
    const currentImage = images[pendingImageIndex]
    longPressActions[actionIndex].callback(currentImage, pendingImageIndex)
    showActionSheet.value = false
  }

  function cleanup() {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
  }

  return {
    show,
    showActionSheet,
    actionSheetActions,
    onActionSelect,
  }
}

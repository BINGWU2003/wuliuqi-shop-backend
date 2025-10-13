# ImagePreview 图片预览组件

基于 Vant 的 ImagePreview 组件二次封装，支持长按图片操作。

## 使用方式

### 方式一：使用 Composable (推荐)

```vue
<script setup lang="ts">
import { useImagePreview } from '@/components/ImagePreview/useImagePreview'

const images = [
  'https://example.com/image1.jpg',
  'https://example.com/image2.jpg',
]

const { show, showActionSheet, actionSheetActions, onActionSelect } = useImagePreview({
  images,
  startPosition: 0,
  enableLongPress: true,
  longPressActions: [
    {
      name: '保存图片',
      callback: (image, index) => {
        console.log('保存图片:', image, index)
      },
    },
    {
      name: '分享图片',
      callback: (image, index) => {
        console.log('分享图片:', image, index)
      },
    },
  ],
  onChange: (index) => {
    console.log('当前图片索引:', index)
  },
  onClose: () => {
    console.log('关闭预览')
  },
})

function handlePreview() {
  show()
}
</script>

<template>
  <button @click="handlePreview">
    预览图片
  </button>

  <!-- ActionSheet 组件用于显示长按操作菜单 -->
  <van-action-sheet
    v-model:show="showActionSheet"
    :actions="actionSheetActions"
    cancel-text="取消"
    @select="onActionSelect"
  />
</template>
```

### 方式二：使用组件

```vue
<script setup lang="ts">
import { ref } from 'vue'
import ImagePreview from '@/components/ImagePreview/index.vue'

const imagePreviewRef = ref()

const images = [
  'https://example.com/image1.jpg',
  'https://example.com/image2.jpg',
]

function handlePreview() {
  imagePreviewRef.value?.show()
}
</script>

<template>
  <button @click="handlePreview">
    预览图片
  </button>

  <ImagePreview
    ref="imagePreviewRef"
    :images="images"
    :start-position="0"
    :enable-long-press="true"
    :long-press-actions="[
      {
        name: '保存图片',
        callback: (image, index) => console.log('保存', image, index),
      },
    ]"
  />
</template>
```

## API

### Props

| 参数             | 说明             | 类型                | 默认值 |
| ---------------- | ---------------- | ------------------- | ------ |
| images           | 图片 URL 数组    | `string[]`          | `[]`   |
| startPosition    | 起始位置索引     | `number`            | `0`    |
| closeable        | 是否显示关闭按钮 | `boolean`           | `true` |
| showIndex        | 是否显示页码     | `boolean`           | `true` |
| enableLongPress  | 是否启用长按操作 | `boolean`           | `true` |
| longPressActions | 长按操作列表     | `LongPressAction[]` | 见下方 |

### LongPressAction

```typescript
interface LongPressAction {
  name: string
  callback: (image: string, index: number) => void
}
```

### Events

| 事件名 | 说明           | 回调参数        |
| ------ | -------------- | --------------- |
| change | 切换图片时触发 | `index: number` |
| close  | 关闭时触发     | -               |

### Composable 返回值

| 名称               | 说明                 | 类型                           |
| ------------------ | -------------------- | ------------------------------ |
| show               | 显示图片预览         | `() => void`                   |
| showActionSheet    | ActionSheet 显示状态 | `Ref<boolean>`                 |
| actionSheetActions | ActionSheet 操作列表 | `Ref<Array<{ name: string }>>` |
| onActionSelect     | ActionSheet 选择回调 | `(action, index) => void`      |

## 特性

- ✅ 支持长按图片触发操作菜单（默认 500ms）
- ✅ 使用 van-action-sheet 组件显示操作菜单
- ✅ 支持自定义长按操作
- ✅ 支持图片切换事件
- ✅ 支持关闭事件
- ✅ 防止长按时的默认右键菜单
- ✅ 支持触摸移动取消长按

## 注意事项

使用 Composable 方式时，需要在模板中添加 `van-action-sheet` 组件来显示长按操作菜单。

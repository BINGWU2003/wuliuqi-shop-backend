<script setup lang="ts">
defineProps<{
  position?: 'left' | 'right'
}>()

const emit = defineEmits<{
  click: []
}>()

function handleClick() {
  emit('click')
}
</script>

<template>
  <div
    class="add-button"
    :class="position === 'right' ? 'add-button-right' : 'add-button-left'"
    @click="handleClick"
  >
    <van-icon name="plus" size="24" color="#fff" />
  </div>
</template>

<style scoped lang="less">
.add-button {
  position: fixed;
  bottom: 10vh;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #1989fa 0%, #0d6efd 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(25, 137, 250, 0.4);
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 999;

  &:active {
    transform: scale(0.9);
    box-shadow: 0 2px 8px rgba(25, 137, 250, 0.3);
  }

  &:hover {
    box-shadow: 0 6px 20px rgba(25, 137, 250, 0.5);
  }
}

.add-button-left {
  left: 10vw;
}

.add-button-right {
  right: 10vw;
}
</style>

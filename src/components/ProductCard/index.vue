<script setup lang="ts">
interface Product {
  id: number
  name: string
  price: number
  image: string
}

defineProps<{
  product: Product
}>()

const emit = defineEmits<{
  click: [product: Product]
}>()

function handleClick(product: Product) {
  emit('click', product)
}
</script>

<template>
  <div class="product-card" @click="handleClick(product)">
    <div class="product-image">
      <van-image
        :src="product.image"
        :alt="product.name"
        lazy-load
        fit="cover"
      />
    </div>
    <div class="product-info">
      <div class="product-name">
        {{ product.name }}
      </div>
      <div class="product-price">
        <span class="price-symbol">¥</span>
        <span class="price-value">{{ product.price }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  }

  .product-image {
    width: 100%;
    aspect-ratio: 1;
    overflow: hidden;
    background: #f7f8fa;

    :deep(.van-image) {
      width: 100%;
      height: 100%;
      display: block;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .product-info {
    padding: 12px;

    .product-name {
      font-size: 14px;
      color: #323233;
      margin-bottom: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
      line-height: 1.4;
      min-height: 40px;
    }

    .product-price {
      display: flex;
      align-items: baseline;
      color: #ee0a24;
      font-weight: bold;

      .price-symbol {
        font-size: 14px;
        margin-right: 2px;
      }

      .price-value {
        font-size: 20px;
      }
    }
  }
}
</style>

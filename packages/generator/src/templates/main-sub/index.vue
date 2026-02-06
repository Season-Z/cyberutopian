<script lang="ts" setup>
import { useDragDivider } from '@enhance/material';
import { ref } from 'vue';
import Main from './components/main/index.vue';
import Sub from './components/sub/index.vue';

const container = ref();

const { paneStyle, dividerDom } = useDragDivider(container, {
  direction: 'vertical',
});
</script>

<template>
  <div ref="container" class="w-full h-full">
    <div :style="paneStyle(0)">
      <Main />
    </div>
    <dividerDom />
    <div :style="paneStyle(1)">
      <Sub />
    </div>
  </div>
</template>

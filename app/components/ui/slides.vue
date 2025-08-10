<template>
  <div id="parent" class="flex justify-center h-fit py-8">
    <div class="flex flex-row items-center justify-center lg:gap-8 gap-4 w-[140%] rounded-xl h-fit">
      <div v-for="image of images" class=" w-80 lg:aspect-[3/5] aspect-[1/3] rounded-xl overflow-clip rotate-3">
        <img :src="image" class="w-full h-full object-cover" />
      </div>
    </div>
  </div>
</template>
<script lang='ts' setup>
const images = ref([
  '/slides/porquerolle-1.jpg',
  '/slides/hyeres-1.jpg',
  '/slides/hyeres-2.jpg',
  '/slides/porquerolle-2.jpg',
  '/slides/kite-1.jpg',
])
</script>
<style scoped>
img {
  @apply saturate-[70%] brightness-110 contrast-[90%] 
}
</style>

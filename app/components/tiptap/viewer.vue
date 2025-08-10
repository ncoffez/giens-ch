<template>
  <div>
    <div v-if="codeView">
      <div class="prose p-4 min-h-48">
        <pre><code class="text-wrap">{{ content }}</code></pre>
      </div>
    </div>
    <div v-else>
      <div v-html="content" class="prose p-4 min-h-48 max-w-lg mx-auto"></div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  codeView: {
    type: Boolean,
    default: false,
  },
})


const content = useState('content')
</script>
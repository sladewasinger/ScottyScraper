<template>
  <div class="scotty" @click="nextQuote" :title="quote">
    <img src="/scotty.svg" alt="Scotty" />
    <div class="bubble">{{ quote }}</div>
  </div>
</template>

<script>
const QUOTES = [
  "That's a bloody good one!",
  "Cheers, mate!",
  "You found a corker!",
  "Top shelf choice!",
  "Sláinte!"
]

export default {
  data() { return { quote: QUOTES[0] } },
  mounted() { this.timer = setInterval(this.nextQuote, 6000) },
  beforeUnmount() { clearInterval(this.timer) },
  methods: { nextQuote() { this.quote = QUOTES[Math.floor(Math.random()*QUOTES.length)] } }
}
</script>

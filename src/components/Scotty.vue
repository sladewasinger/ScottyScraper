<template>
  <div class="scotty" :title="quote">
    <img src="/scotty.svg" alt="Scotty" />
    <div class="bubble" v-if="isShowingQuote">{{ quote }}</div>
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
  data() { 
    return { 
      quote: QUOTES[0],
      isShowingQuote: false,
      hoverDebounceTimer: null
    } 
  },
  methods: { 
    showRandomQuote() {
      this.quote = QUOTES[Math.floor(Math.random()*QUOTES.length)]
      this.isShowingQuote = true
      clearTimeout(this.hoverDebounceTimer)
    },
    onRowHover() {
      clearTimeout(this.hoverDebounceTimer)
      this.hoverDebounceTimer = setTimeout(() => {
        this.showRandomQuote()
      }, 150)
    },
    onRowLeave() {
      clearTimeout(this.hoverDebounceTimer)
      this.isShowingQuote = false
    }
  },
  mounted() {
    window.addEventListener('scotty:rowHover', this.onRowHover)
    window.addEventListener('scotty:rowLeave', this.onRowLeave)
  },
  beforeUnmount() {
    window.removeEventListener('scotty:rowHover', this.onRowHover)
    window.removeEventListener('scotty:rowLeave', this.onRowLeave)
  }
}
</script>

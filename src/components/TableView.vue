<template>
  <div class="table-view">
    <div class="toolbar">
      <input v-model="q" placeholder="Search (fuzzy)" />
      <div class="sort-controls">
        <label>Sort:</label>
        <button @click="setSort('category')">Category {{ sortKey==='category' ? (sortDir===1? '↑' : '↓') : '' }}</button>
        <button @click="setSort('item')">Item {{ sortKey==='item' ? (sortDir===1? '↑' : '↓') : '' }}</button>
        <button @click="setSort('price')">Price {{ sortKey==='price' ? (sortDir===1? '↑' : '↓') : '' }}</button>
      </div>
    </div>

    <table class="results">
      <thead>
        <tr>
          <th @click="setSort('category')" :class="{ active: sortKey==='category' }">Category <span class="sort-arrow">{{ sortKey==='category' ? (sortDir===1? '↑' : '↓') : '' }}</span></th>
          <th @click="setSort('item')" :class="{ active: sortKey==='item' }">Item <span class="sort-arrow">{{ sortKey==='item' ? (sortDir===1? '↑' : '↓') : '' }}</span></th>
          <th @click="setSort('price')" :class="{ active: sortKey==='price' }">Price <span class="sort-arrow">{{ sortKey==='price' ? (sortDir===1? '↑' : '↓') : '' }}</span></th>
          <th @click="setSort('upc')" :class="{ active: sortKey==='upc' }">UPC <span class="sort-arrow">{{ sortKey==='upc' ? (sortDir===1? '↑' : '↓') : '' }}</span></th>
          <th @click="setSort('size')" :class="{ active: sortKey==='size' }">Size <span class="sort-arrow">{{ sortKey==='size' ? (sortDir===1? '↑' : '↓') : '' }}</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(r, idx) in displayed" :key="idx">
          <td>{{ r.category }}</td>
          <td>{{ r.item }}</td>
          <td>{{ r.price }}</td>
          <td>{{ r.upc }}</td>
          <td>{{ r.size }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="displayed.length===0" class="empty">No results</div>
  </div>
</template>

<script>
// Levenshtein distance for fuzzy typo matching
function levenshtein(a, b) {
  const m = a.length, n = b.length
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[m][n]
}

// Fast substring-based scoring (no Levenshtein) — runs instantly
function scoreFastOnly(query, text, skipLev = false) {
  if (!query || !text) return 999999
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  
  if (lowerText === lowerQuery) return 0
  if (lowerText.startsWith(lowerQuery)) return 1
  const idx = lowerText.indexOf(lowerQuery)
  if (idx !== -1) return 10 + idx
  
  const queryTokens = lowerQuery.split(/[\s\-_]+/).filter(Boolean)
  const textTokens = lowerText.split(/[\s\-_]+/).filter(Boolean)
  let tokenMatches = 0
  for (const qt of queryTokens) {
    for (const tt of textTokens) {
      if (tt.includes(qt)) tokenMatches++
    }
  }
  if (tokenMatches > 0) return 100 + (queryTokens.length - tokenMatches) * 10
  
  // If skipLev=true, stop here (instant results)
  if (skipLev) return 999999
  
  // Otherwise run Levenshtein fallback (after debounce)
  let bestTokenDistance = 999999
  for (const qt of queryTokens) {
    for (const tt of textTokens) {
      const dist = levenshtein(qt, tt)
      const threshold = Math.ceil(qt.length * 0.3) + 1
      if (dist <= threshold) {
        bestTokenDistance = Math.min(bestTokenDistance, dist)
      }
    }
  }
  if (bestTokenDistance < 999999) return 200 + bestTokenDistance
  
  return 999999
}

export default {
  props: { rows: { type: Array, default: () => [] } },
  data() {
    return {
      q: '',
      qDebounced: '',
      working: [],
      sortKey: 'item',
      sortDir: 1,
      debounceTimer: null,
      levenCache: {}
    }
  },
  computed: {
    displayed() {
      const q = (this.q || '').trim()
      if (!q) return this.working
      // Use fast-only scoring immediately; debounced scoring happens in background
      const useLev = this.qDebounced === q
      const scored = this.working.map(r => {
        const itemScore = scoreFastOnly(q, r.item || '', !useLev)
        const categoryScore = scoreFastOnly(q, r.category || '', !useLev)
        return { r, score: itemScore + categoryScore * 0.01 }
      })
      scored.sort((a, b) => a.score - b.score)
      const results = scored.filter(s => s.score < 999999).map(s => s.r)
      this.$emit('search', results)
      return results
    }
  },
  watch: {
    q(newQ) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        this.qDebounced = newQ
      }, 300)
    },
    rows: { immediate: true, handler(newRows) { this.working = (newRows || []).slice(); this.applySort(); this.levenCache = {} } }
  },
  methods: {
    applySort() {
      const key = this.sortKey
      const dir = this.sortDir
      this.working = (this.working || []).slice().sort((a, b) => {
        const av = (a[key] || '').toString().toLowerCase()
        const bv = (b[key] || '').toString().toLowerCase()
        if (av === bv) return 0
        return av < bv ? -1 * dir : 1 * dir
      })
    },
    setSort(key) {
      if (this.sortKey === key) this.sortDir = this.sortDir === 1 ? -1 : 1
      else { this.sortKey = key; this.sortDir = 1 }
      this.applySort()
    }
  }
}
</script>

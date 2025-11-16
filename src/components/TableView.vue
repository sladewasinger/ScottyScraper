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
          <th @click="setSort('category')">Category</th>
          <th @click="setSort('item')">Item</th>
          <th @click="setSort('price')">Price</th>
          <th @click="setSort('upc')">UPC</th>
          <th @click="setSort('size')">Size</th>
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
// Inline Levenshtein distance calculator for fuzzy search
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

export default {
  props: { rows: { type: Array, default: () => [] } },
  data() {
    return {
      q: '',
      working: [],
      sortKey: 'item',
      sortDir: 1
    }
  },
  computed: {
    displayed() {
      const q = (this.q || '').trim().toLowerCase()
      if (!q) return this.working
      // fuzzy: score by Levenshtein distance across item+category
      const scored = this.working.map(r => {
        const text = ((r.item || '') + ' ' + (r.category || '')).toLowerCase()
        const dist = levenshtein(q, text)
        return { r, dist }
      })
      scored.sort((a, b) => a.dist - b.dist)
      const results = scored.map(s => s.r)
      this.$emit('search', results)
      return results
    }
  },
  watch: {
    rows: { immediate: true, handler(newRows) { this.working = (newRows || []).slice(); this.applySort() } }
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

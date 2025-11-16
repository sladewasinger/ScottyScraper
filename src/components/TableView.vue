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
// Fast substring-based scoring for fuzzy search (much faster than Levenshtein)
function scoreMatch(query, text) {
  if (!query || !text) return 999999
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  
  // Exact match = best score
  if (lowerText === lowerQuery) return 0
  
  // Starts with query = very good
  if (lowerText.startsWith(lowerQuery)) return 1
  
  // Contains as substring = good
  const idx = lowerText.indexOf(lowerQuery)
  if (idx !== -1) return 10 + idx
  
  // Token match (split by spaces, dashes, etc. and match individual tokens)
  const queryTokens = lowerQuery.split(/[\s\-_]+/).filter(Boolean)
  const textTokens = lowerText.split(/[\s\-_]+/).filter(Boolean)
  let tokenMatches = 0
  for (const qt of queryTokens) {
    for (const tt of textTokens) {
      if (tt.includes(qt)) tokenMatches++
    }
  }
  if (tokenMatches > 0) return 100 + (queryTokens.length - tokenMatches) * 10
  
  // No match
  return 999999
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
      const q = (this.q || '').trim()
      if (!q) return this.working
      // Fast substring + token matching on item only (primary search field)
      const scored = this.working.map(r => {
        const itemScore = scoreMatch(q, r.item || '')
        // category is secondary — only used as tiebreaker if item scores are equal
        const categoryScore = scoreMatch(q, r.category || '')
        return { r, score: itemScore + categoryScore * 0.01 }
      })
      scored.sort((a, b) => a.score - b.score)
      const results = scored.filter(s => s.score < 999999).map(s => s.r)
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

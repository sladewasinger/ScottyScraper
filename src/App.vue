<template>
  <div class="app">
    <header>
      <h1>ScottyScraper</h1>
      <div class="controls">
        <input v-model="targetUrl" placeholder="Target URL to scrape" />
        <button @click="load">Load</button>
        <label class="proxy"><input type="checkbox" v-model="useProxy" /> Use CORS proxy</label>
      </div>
    </header>

    <main>
      <TableView :rows="rows" @search="onSearch" />
    </main>

    <Scotty />
  </div>
</template>

<script>
import TableView from './components/TableView.vue'
import Scotty from './components/Scotty.vue'

export default {
  components: { TableView, Scotty },
  data() {
    return {
      defaultUrl: '',
      targetUrl: '',
      useProxy: true,
      rows: []
    }
  },
  mounted() {
    // build today's XML filename: AllLiquor_MM_DD_YY.xml
    const d = new Date()
    const mm = "11"; //String(d.getMonth() + 1).padStart(2, '0')
    const dd = "04"; // String(d.getDate()).padStart(2, '0')
    const yy = "25"; //String(d.getFullYear() % 100).padStart(2, '0')
    this.defaultUrl = `https://www.dtnfspiritsandwines.com/AllLiquor_${mm}_${dd}_${yy}.xml`
    this.targetUrl = this.defaultUrl
    this.load()
  },
  methods: {
    async load() {
      this.rows = []
      try {
        const url = this.targetUrl
        const html = await fetchHtml(url, this.useProxy)
        this.rows = parseLiquorTable(html)
      } catch (err) {
        alert('Failed to load: ' + err.message)
        console.error(err)
      }
    },
    onSearch(filteredRows) {
      // placeholder if we need to react to child
    }
  }
}

// Helper: fetch HTML with optional proxy fallback
async function fetchHtml(url, useProxy) {
  // small helper to perform a fetch and return text or throw
  const tryFetch = async (u) => {
    console.debug('Trying fetch:', u)
    const res = await fetch(u)
    if (!res.ok) throw new Error('Network error: ' + res.status)
    return await res.text()
  }

  // A list of proxy providers to try (in order). Each factory returns the proxied URL to request.
  const proxies = [
    // AllOrigins raw
    (u) => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
    // corsproxy.io (append original URL after ?)
    (u) => 'https://corsproxy.io/?' + encodeURIComponent(u),
    // codetabs proxy
    (u) => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u),
    // thingproxy
    (u) => 'https://thingproxy.freeboard.io/fetch/' + encodeURIComponent(u)
  ]

  // Attempt strategy: if useProxy true, try each proxy in list, then direct fetch as last resort.
  // If useProxy false, try direct only.
  if (useProxy) {
    const errors = []
    for (const makeProxyUrl of proxies) {
      const proxied = makeProxyUrl(url)
      try {
        const text = await tryFetch(proxied)
        console.debug('Fetch via proxy succeeded:', proxied)
        return text
      } catch (err) {
        console.warn('Proxy fetch failed for', proxied, err && err.message)
        errors.push({ proxy: proxied, error: (err && err.message) || String(err) })
        // try next proxy
      }
    }

    // All proxies failed — attempt direct fetch as last resort (may be blocked by CORS)
    try {
      console.debug('All proxies failed, trying direct fetch (may be blocked by CORS)')
      return await tryFetch(url)
    } catch (directErr) {
      // include proxy errors in thrown message to aid debugging
      const msg = 'All proxy attempts failed; direct fetch also failed: ' + (directErr && directErr.message) + ' — proxy errors: ' + JSON.stringify(errors)
      const e = new Error(msg)
      e.cause = { direct: directErr, proxyErrors: errors }
      throw e
    }
  } else {
    // user explicitly requested no proxy — perform direct fetch and bubble errors
    return await tryFetch(url)
  }
}

// Robust XML parser for the liquor feed
function parseLiquorTable(xml) {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'application/xml')

    const inventories = Array.from(doc.getElementsByTagName('Inventory'))
    if (!inventories || inventories.length === 0) {
      console.log('Parsed rows:', 0, [])
      return []
    }

    const rows = inventories.map(inv => {
      // build lowercase map of child tagName -> textContent for robust retrieval
      const map = {}
      for (const ch of Array.from(inv.children || [])) {
        if (!ch.tagName) continue
        map[ch.tagName.toLowerCase()] = (ch.textContent || '').trim()
      }

      const item = map['item'] || map['itemname'] || map['description'] || map['itemdesc'] || ''
      const category = map['category'] || map['dept'] || map['type'] || ''
      const price = map['price'] || map['retail'] || ''
      const upc = map['upc'] || map['barcode'] || ''
      const size = map['size'] || map['volume'] || ''

      return {
        item: item,
        category: category,
        price: price,
        upc: upc,
        size: size
      }
    }).filter(r => r.item || r.price || r.upc)

    console.log('Parsed rows:', rows.length, rows.slice(0, 50))
    return rows
  } catch (err) {
    console.error('parseLiquorTable XML parse error', err)
    return []
  }
}
</script>

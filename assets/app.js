(function () {
  const K = window.KaryaloDemo;
  let view = "cashier";
  let mode = "retail";
  const fnbItems = [
    { id:"FB-01", name:"Iced Palm Latte", category:"Minuman", price:32000, stock:40, color:"#9b755f" },
    { id:"FB-02", name:"Matcha Cloud", category:"Minuman", price:36000, stock:28, color:"#8ba079" },
    { id:"FB-03", name:"Butter Croissant", category:"Pastry", price:28000, stock:16, color:"#c69b64" },
    { id:"FB-04", name:"Chicken Pesto Bowl", category:"Makanan", price:52000, stock:12, color:"#7e8f72" },
    { id:"FB-05", name:"Truffle Fries", category:"Makanan", price:39000, stock:20, color:"#c7ae72" },
    { id:"FB-06", name:"Burnt Cheesecake", category:"Dessert", price:42000, stock:9, color:"#d3b79a" },
  ];
  const nav = [
    { labelOnly: "Penjualan offline" },
    { id: "cashier", label: "Kasir", icon: "scan" },
    { id: "dashboard", label: "Ringkasan Outlet", icon: "home" },
    { id: "transactions", label: "Transaksi", icon: "receipt", badge: "8" },
    { id: "customers", label: "Pelanggan", icon: "users" },
    { labelOnly: "Operasional" },
    { id: "shift", label: "Shift Kasir", icon: "calendar" },
    { id: "settings", label: "Outlet & Perangkat", icon: "settings" },
  ];
  const tour = [
    { selector: ".mode-tabs", title: "Retail atau F&B", text: "Satu product page dapat menunjukkan dua alur kasir yang berbeda. Demo Alina memakai Retail; mode F&B memperlihatkan menu dan order." },
    { selector: ".pos-products", title: "Tambah item dalam beberapa detik", text: "Klik produk atau gunakan pencarian/barcode. Stok tersedia terlihat sebelum transaksi dibuat." },
    { selector: ".pos-cart", title: "Pembayaran yang jelas", text: "Kasir dapat mengubah jumlah, memilih pelanggan, memberi diskon, lalu menerima tunai, QRIS, atau kartu." },
    { selector: ".app-switcher", title: "Stok dan uang langsung terhubung", text: "Transaksi selesai mengurangi stok di Karyalo Stock dan menambah pemasukan di Finance." },
  ];

  K.mount({ app: "pos", title: "Karyalo POS", subtitle: "Kasir Retail & F&B · Outlet Bogor", nav, active: view, tour, onNavigate: navigate });
  navigate("cashier");

  function navigate(next) {
    view = next;
    K.setActiveNav(view);
    ({ cashier: renderCashier, dashboard: renderDashboard, transactions: renderTransactions, customers: renderCustomers, shift: renderShift, settings: renderSettings }[view] || renderCashier)();
  }

  function ensureCart() { const state=K.getState(); if(!state.posCart){ state.posCart=[]; K.saveState(state); } return state; }
  function availableItems(state) { return mode === "retail" ? state.products.filter(p=>p.stock>0) : fnbItems; }

  function renderCashier() {
    const state = ensureCart();
    const items = availableItems(state);
    K.page(`<div class="page-heading"><div><p class="eyebrow">Outlet Bogor · Shift aktif</p><h1>Kasir</h1><p class="lede">Pilih item, terima pembayaran, lalu stok dan laporan akan diperbarui otomatis.</p></div><div class="tabs mode-tabs"><button class="tab ${mode === "retail" ? "active" : ""}" data-mode="retail">Retail</button><button class="tab ${mode === "fnb" ? "active" : ""}" data-mode="fnb">F&B</button></div></div>
      <div class="catalog-layout">
        <section><div class="card toolbar"><div class="search">${K.icon(mode === "retail" ? "scan" : "search")}<input class="input" id="pos-search" placeholder="${mode === "retail" ? "Scan barcode atau cari produk..." : "Cari menu..."}"></div><button class="btn btn-secondary btn-sm">${K.icon("tag")} Diskon</button><button class="btn btn-secondary btn-sm" data-hold>Tahan transaksi</button></div><div class="product-grid pos-products section-gap">${items.map(posItemCard).join("")}</div></section>
        <aside class="card cart pos-cart"><div class="card-head"><div><h2>Transaksi baru</h2><span class="muted small">${mode === "retail" ? "Walk-in customer" : "Meja 04 · Dine-in"}</span></div><button class="icon-btn" data-clear aria-label="Kosongkan keranjang">${K.icon("refresh")}</button></div><div class="card-body">${posCartMarkup(state, items)}</div></aside>
      </div>`);
    bindCashier(items);
  }

  function posItemCard(item) {
    return `<button class="product-card" data-pos-add="${item.id}" data-name="${item.name.toLowerCase()}" style="text-align:left;padding:0"><div class="product-visual ${mode === "fnb" ? "food-visual" : ""}" style="--product-color:${item.color}"><span class="product-stock status">${item.stock} tersedia</span></div><div class="product-info"><span class="muted small">${item.category} · ${item.id}</span><strong>${item.name}</strong><div class="product-price"><span>${K.money(item.price)}</span><span class="metric-icon">${K.icon("plus")}</span></div></div></button>`;
  }

  function posCartMarkup(state, items) {
    const cart = state.posCart || [];
    if (!cart.length) return `<div class="empty"><span class="empty-icon">${K.icon("scan")}</span><h3>Belum ada item</h3><p class="muted">Klik produk atau scan barcode untuk mulai transaksi.</p></div>`;
    const rows = cart.map(entry => { const item=items.find(i=>i.id===entry.id); if(!item) return ""; return `<div class="cart-row"><div><strong>${item.name}</strong><div class="cell-sub">${K.money(item.price)}</div></div><div style="text-align:right"><div class="qty"><button data-pos-qty="${item.id}" data-step="-1">−</button><span>${entry.qty}</span><button data-pos-qty="${item.id}" data-step="1">+</button></div><div class="small amount" style="margin-top:5px">${K.money(item.price*entry.qty)}</div></div></div>`; }).join("");
    const subtotal = cart.reduce((sum,entry)=>{const item=items.find(i=>i.id===entry.id);return sum+(item?item.price*entry.qty:0);},0);
    const tax = mode === "fnb" ? Math.round(subtotal*.1) : 0;
    return `${rows}<div class="list" style="margin-top:12px"><div class="list-item"><div class="list-copy"><span>Subtotal</span></div><strong>${K.money(subtotal)}</strong></div>${tax?`<div class="list-item"><div class="list-copy"><span>Pajak restoran 10%</span></div><strong>${K.money(tax)}</strong></div>`:""}</div><div class="cart-total"><span>Total</span><span>${K.money(subtotal+tax)}</span></div><button class="btn btn-primary" style="width:100%" data-pay>${K.icon("cash")} Bayar ${K.money(subtotal+tax)}</button>`;
  }

  function bindCashier(items) {
    document.querySelectorAll("[data-mode]").forEach(button=>button.addEventListener("click",()=>{ mode=button.dataset.mode; K.updateState(s=>s.posCart=[]); renderCashier(); }));
    document.querySelectorAll("[data-pos-add]").forEach(button=>button.addEventListener("click",()=>{ const id=button.dataset.posAdd; K.updateState(state=>{state.posCart ||= []; const found=state.posCart.find(i=>i.id===id); found?found.qty++:state.posCart.push({id,qty:1});}); K.toast("Item ditambahkan."); renderCashier(); }));
    document.querySelectorAll("[data-pos-qty]").forEach(button=>button.addEventListener("click",()=>{ K.updateState(state=>{const item=state.posCart.find(i=>i.id===button.dataset.posQty); item.qty+=Number(button.dataset.step); state.posCart=state.posCart.filter(i=>i.qty>0);}); renderCashier(); }));
    document.querySelector("[data-clear]").addEventListener("click",()=>{K.updateState(state=>state.posCart=[]);renderCashier();});
    document.querySelector("[data-hold]").addEventListener("click",()=>K.toast("Transaksi ditahan sebagai HOLD-07."));
    document.querySelector("[data-pay]")?.addEventListener("click",()=>openPayment(items));
    document.getElementById("pos-search").addEventListener("input",event=>{const q=event.target.value.toLowerCase();document.querySelectorAll("[data-pos-add]").forEach(card=>card.hidden=!card.dataset.name.includes(q));});
  }

  function openPayment(items) {
    const state=ensureCart(); const subtotal=state.posCart.reduce((sum,e)=>sum+(items.find(i=>i.id===e.id)?.price||0)*e.qty,0); const total=subtotal+(mode==="fnb"?Math.round(subtotal*.1):0);
    K.modal("Terima pembayaran", `<div class="card card-pad" style="background:var(--sage);text-align:center"><span class="muted">Total pembayaran</span><div class="metric-value">${K.money(total)}</div></div><div class="grid grid-3 section-gap"><button class="btn btn-secondary" data-payment="Tunai">${K.icon("cash")} Tunai</button><button class="btn btn-secondary" data-payment="QRIS">${K.icon("scan")} QRIS</button><button class="btn btn-secondary" data-payment="Kartu">${K.icon("card")} Kartu</button></div><div class="field section-gap"><label>Nominal diterima (tunai)</label><input class="input" id="cash-received" type="number" value="${Math.ceil(total/50000)*50000}"></div><div class="summary-strip section-gap"><div><span>Outlet</span><strong>Bogor</strong></div><div><span>Kasir</span><strong>Ayu</strong></div><div><span>Shift</span><strong>#S-0812</strong></div></div>`, `<button class="btn btn-secondary" data-close-modal>Batal</button><button class="btn btn-primary" data-complete-pay>Selesaikan pembayaran</button>`);
    let payment="Tunai"; document.querySelectorAll("[data-payment]").forEach(button=>button.addEventListener("click",()=>{payment=button.dataset.payment;document.querySelectorAll("[data-payment]").forEach(b=>b.classList.toggle("btn-primary",b===button));}));
    document.querySelector("[data-complete-pay]").addEventListener("click",()=>completeSale(items,total,payment));
  }

  function completeSale(items,total,payment) {
    const now=`POS-DEMO-${String(Date.now()).slice(-4)}`;
    K.updateState(state=>{
      const itemCount=(state.posCart||[]).reduce((sum,i)=>sum+i.qty,0);
      if(mode==="retail") state.posCart.forEach(entry=>{const product=state.products.find(p=>p.id===entry.id);if(product)product.stock=Math.max(0,product.stock-entry.qty);});
      state.orders.unshift({id:now,customer:"Guest",channel:"POS",total,items:itemCount,status:"Selesai",date:"Baru saja",courier:"Ambil di toko"});
      state.transactions.unshift({id:`TRX-${String(Date.now()).slice(-6)}`,type:"Pemasukan",category:"Penjualan POS",amount:total,date:"12 Agu 2026",status:"Tercatat"});
      state.posCart=[];
    });
    K.closeModal();
    K.modal("Pembayaran berhasil", `<div style="text-align:center;padding:12px"><span class="empty-icon">${K.icon("check")}</span><h2>${K.money(total)}</h2><p class="muted">${payment} · ${now}</p><div class="summary-strip"><div><span>Stok</span><strong>Diperbarui</strong></div><div><span>Finance</span><strong>Tercatat</strong></div><div><span>Struk</span><strong>Siap</strong></div></div></div>`, `<button class="btn btn-secondary" data-close-modal>Lihat struk</button><button class="btn btn-primary" data-next-sale>Transaksi berikutnya</button>`);
    document.querySelector("[data-next-sale]").addEventListener("click",()=>{K.closeModal();renderCashier();});
  }

  function renderDashboard() {
    const sales=K.getState().orders.filter(o=>o.channel==="POS");
    K.page(`${K.heading("Outlet Bogor", "Ringkasan penjualan hari ini", "Pantau hasil transaksi, metode pembayaran, dan performa shift kasir.", `<button class="btn btn-primary" data-open-cashier>${K.icon("scan")} Buka kasir</button>`)}<div class="grid metric-grid">${K.metric("Penjualan",K.money(7364000),"+12% dari Selasa lalu","cash")}${K.metric("Transaksi","31","Rata-rata 4 item","receipt")}${K.metric("Rata-rata basket",K.money(237548),"+5,6% minggu ini","bag")}${K.metric("Shift aktif","2 kasir","Tutup shift pukul 21.00","users")}</div><div class="grid grid-2"><section class="card card-pad"><h2>Penjualan per jam</h2>${K.bars([2,4,6,5,8,12,10,7],["09","10","11","12","13","14","15","16"],"terra")}<div class="legend"><span><i style="background:#d48161"></i>Jumlah transaksi</span></div></section><section class="card card-pad"><h2>Metode pembayaran</h2><div class="list"><div class="list-item"><span class="list-icon">${K.icon("scan")}</span><div class="list-copy"><strong>QRIS</strong><span>15 transaksi</span></div><strong>48%</strong></div><div class="list-item"><span class="list-icon">${K.icon("cash")}</span><div class="list-copy"><strong>Tunai</strong><span>10 transaksi</span></div><strong>32%</strong></div><div class="list-item"><span class="list-icon">${K.icon("card")}</span><div class="list-copy"><strong>Kartu</strong><span>6 transaksi</span></div><strong>20%</strong></div></div></section></div>`);
    document.querySelector("[data-open-cashier]").addEventListener("click",()=>navigate("cashier"));
  }

  function renderTransactions() {
    const rows=K.getState().orders.filter(o=>o.channel==="POS").slice(0,8);
    K.page(`${K.heading("Transaksi", "Riwayat penjualan outlet", "Telusuri transaksi, lihat struk, dan proses retur dengan hak akses yang tepat.", `<button class="btn btn-secondary">${K.icon("download")} Export</button>`)}<section class="card"><div class="toolbar"><div class="search">${K.icon("search")}<input class="input" placeholder="Cari nomor struk..."></div><select class="select"><option>Hari ini</option><option>7 hari terakhir</option></select></div><div class="table-wrap"><table><thead><tr><th>Struk</th><th>Waktu</th><th>Kasir</th><th>Item</th><th>Pembayaran</th><th>Total</th><th>Status</th></tr></thead><tbody>${rows.concat([{id:"POS-240812-018",date:"12 Agu, 08:21",items:3,total:887000,status:"Selesai"}]).map((r,i)=>`<tr><td class="cell-main">${r.id}</td><td>${r.date}</td><td>${i%2?"Dimas":"Ayu"}</td><td>${r.items}</td><td>${i%3===0?"QRIS":i%3===1?"Tunai":"Kartu"}</td><td><strong>${K.money(r.total)}</strong></td><td>${K.status(r.status)}</td></tr>`).join("")}</tbody></table></div></section>`);
  }

  function renderCustomers() {
    const customers=K.getState().customers;
    K.page(`${K.heading("Pelanggan", "Hubungkan transaksi dengan pelanggan", "Temukan histori online dan offline untuk pelayanan yang lebih personal.", `<button class="btn btn-primary">${K.icon("plus")} Tambah pelanggan</button>`)}<div class="grid grid-3">${customers.map(c=>`<article class="card card-pad"><div class="avatar" style="margin-bottom:14px">${c.name.split(" ").map(n=>n[0]).join("")}</div><h3 style="margin-bottom:2px">${c.name}</h3><span class="muted small">${c.email}</span><div class="summary-strip" style="margin-top:18px;grid-template-columns:1fr 1fr"><div><span>Order</span><strong>${c.orders}</strong></div><div><span>Belanja</span><strong>${K.money(c.spent)}</strong></div></div></article>`).join("")}</div>`);
  }

  function renderShift() {
    K.page(`${K.heading("Shift Kasir", "Kontrol kas awal dan penutupan", "Setiap shift mencatat kasir, transaksi, perbedaan kas, serta waktu buka-tutup.", `<button class="btn btn-primary" data-close-shift>Tutup shift</button>`)}<div class="grid grid-3"><article class="card card-pad"><p class="eyebrow">Shift aktif</p><h2>#S-0812 · Ayu</h2><div class="metric-value">${K.money(4287000)}</div><p class="muted">18 transaksi · mulai 08.47</p>${K.status("Aktif")}</article><article class="card card-pad"><p class="eyebrow">Shift aktif</p><h2>#S-0813 · Dimas</h2><div class="metric-value">${K.money(3077000)}</div><p class="muted">13 transaksi · mulai 09.02</p>${K.status("Aktif")}</article><article class="card card-pad" style="background:var(--sage)"><p class="eyebrow">Kas yang diharapkan</p><h2>${K.money(2350000)}</h2><p class="muted">Hitung kas fisik saat tutup shift. Selisih wajib diberi alasan.</p><button class="btn btn-secondary">Lihat panduan closing</button></article></div>`);
    document.querySelector("[data-close-shift]").addEventListener("click",()=>K.toast("Closing shift demo dimulai. Masukkan kas fisik untuk melanjutkan."));
  }

  function renderSettings() {
    K.page(`${K.heading("Outlet & Perangkat", "Konfigurasi POS", "Atur outlet, printer struk, scanner, metode pembayaran, dan sinkronisasi stok.", `<button class="btn btn-primary" data-save>${K.icon("check")} Simpan</button>`)}<div class="grid grid-2"><section class="card card-pad"><h2>Outlet Bogor</h2><div class="form-grid"><div class="field span-2"><label>Nama outlet</label><input class="input" value="Alina Store · Bogor"></div><div class="field"><label>Mode utama</label><select class="select" style="width:100%"><option>Retail</option><option>F&B</option></select></div><div class="field"><label>Lokasi stok</label><select class="select" style="width:100%"><option>Outlet Bogor</option></select></div></div></section><section class="card card-pad"><h2>Perangkat</h2><div class="list"><div class="list-item"><span class="list-icon">${K.icon("receipt")}</span><div class="list-copy"><strong>Printer Epson TM-T82</strong><span>192.168.1.14</span></div>${K.status("Aktif")}</div><div class="list-item"><span class="list-icon">${K.icon("scan")}</span><div class="list-copy"><strong>Barcode Scanner USB</strong><span>Kasir 01</span></div>${K.status("Aktif")}</div></div></section></div>`);
    document.querySelector("[data-save]").addEventListener("click",()=>K.toast("Konfigurasi POS berhasil disimpan."));
  }
})();

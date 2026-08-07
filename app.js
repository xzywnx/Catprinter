// PASTIKAN SEMUA ELEMEN DIPANGGIL DENGAN AMAN
document.addEventListener('DOMContentLoaded', () => {
  const btnReceiptMode = document.getElementById('btnReceiptMode');
  const btnImageMode = document.getElementById('btnImageMode');
  const receiptSection = document.getElementById('receiptSection');
  const imageSection = document.getElementById('imageSection');
  const btnConnect = document.getElementById('btnConnect');
  const btnPrint = document.getElementById('btnPrint');
  const canvas = document.getElementById('printCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const logArea = document.getElementById('logArea');
  const batteryStatus = document.getElementById('batteryStatus');
  const previewMetrics = document.getElementById('previewMetrics');

  let bleDevice = null;
  let printCharacteristic = null;
  let itemsList = [
    { name: 'Kopi Susu', price: 18000 },
    { name: 'Roti Bakar', price: 15000 }
  ];

  if (document.getElementById('receiptDate')) {
    document.getElementById('receiptDate').value = new Date().toLocaleString('id-ID');
  }

  function log(msg) {
    if (logArea) logArea.textContent = `Status: ${msg}`;
  }

  // SWITCH MODE
  if (btnReceiptMode && btnImageMode) {
    btnReceiptMode.addEventListener('click', () => {
      btnReceiptMode.classList.add('active');
      btnImageMode.classList.remove('active');
      receiptSection.classList.remove('hidden');
      imageSection.classList.add('hidden');
      renderReceipt();
    });

    btnImageMode.addEventListener('click', () => {
      btnImageMode.classList.add('active');
      btnReceiptMode.classList.remove('active');
      imageSection.classList.remove('hidden');
      receiptSection.classList.add('hidden');
      updateImagePreview();
    });
  }

  // TAMBAH ITEM BELANJAAN
  const btnAddItem = document.getElementById('btnAddItem');
  if (btnAddItem) {
    btnAddItem.addEventListener('click', () => {
      const nameInput = document.getElementById('itemNameInput');
      const priceInput = document.getElementById('itemPriceInput');
      if (!nameInput.value) return;

      itemsList.push({ 
        name: nameInput.value, 
        price: parseFloat(priceInput.value) || 0 
      });
      nameInput.value = '';
      priceInput.value = '';
      updateItemListUI();
      renderReceipt();
    });
  }

  function updateItemListUI() {
    const ul = document.getElementById('itemListUI');
    if (!ul) return;
    ul.innerHTML = '';
    itemsList.forEach((item, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${item.name}</span><span>Rp ${item.price.toLocaleString('id-ID')} <b style="color:red;cursor:pointer;margin-left:8px;" data-idx="${idx}">[X]</b></span>`;
      ul.appendChild(li);
    });

    // Event listener hapus item
    ul.querySelectorAll('b').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = e.target.getAttribute('data-idx');
        itemsList.splice(index, 1);
        updateItemListUI();
        renderReceipt();
      });
    });
  }

  // RENDER STRUK KE CANVAS
  function renderReceipt() {
    if (!canvas || !ctx) return;
    const width = 384;
    
    const store = document.getElementById('storeName')?.value || '';
    const phone = document.getElementById('storePhone')?.value || '';
    const table = document.getElementById('receiptTable')?.value || '';
    const server = document.getElementById('receiptServer')?.value || '';
    const order = document.getElementById('receiptOrder')?.value || '';
    const tax = parseFloat(document.getElementById('receiptTax')?.value) || 0;
    const dateStr = document.getElementById('receiptDate')?.value || '';
    const tip = parseFloat(document.getElementById('receiptTip')?.value) || 0;
    const paid = parseFloat(document.getElementById('receiptPaid')?.value) || 0;
    const footer = document.getElementById('footerText')?.value || '';

    const subtotal = itemsList.reduce((a, b) => a + b.price, 0);
    const taxAmount = subtotal * (tax / 100);
    const total = subtotal + taxAmount + tip;
    const change = Math.max(0, paid - total);
    
    if (document.getElementById('receiptChange')) {
      document.getElementById('receiptChange').value = change.toLocaleString('id-ID');
    }

    canvas.width = width;
    canvas.height = 260 + (itemsList.length * 20);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, canvas.height);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';

    let y = 25;
    ctx.fillText(store, width / 2, y); y += 18;
    ctx.font = '13px monospace';
    ctx.fillText(phone, width / 2, y); y += 18;
    ctx.fillText("--------------------------------", width / 2, y); y += 16;

    ctx.textAlign = 'left';
    ctx.fillText(`DATE: ${dateStr}`, 10, y); y += 16;
    ctx.fillText(`ORDER #: ${order}`, 10, y); y += 16;
    ctx.fillText(`TABLE: ${table}   SERVER: ${server}`, 10, y); y += 16;
    ctx.textAlign = 'center';
    ctx.fillText("--------------------------------", width / 2, y); y += 18;

    itemsList.forEach(item => {
      ctx.textAlign = 'left';
      ctx.fillText(item.name.substring(0, 18), 10, y);
      ctx.textAlign = 'right';
      ctx.fillText(item.price.toLocaleString('id-ID'), width - 10, y);
      y += 18;
    });

    ctx.textAlign = 'center';
    ctx.fillText("--------------------------------", width / 2, y); y += 18;

    ctx.textAlign = 'left';
    ctx.fillText(`SUBTOTAL:`, 10, y); ctx.textAlign = 'right'; ctx.fillText(subtotal.toLocaleString('id-ID'), width - 10, y); y += 16;
    ctx.textAlign = 'left';
    ctx.fillText(`TAX (${tax}%):`, 10, y); ctx.textAlign = 'right'; ctx.fillText(taxAmount.toLocaleString('id-ID'), width - 10, y); y += 16;
    ctx.textAlign = 'left';
    ctx.fillText(`TOTAL:`, 10, y); ctx.textAlign = 'right'; ctx.fillText(total.toLocaleString('id-ID'), width - 10, y); y += 20;

    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    footer.split('\n').forEach(l => { ctx.fillText(l, width / 2, y); y += 14; });

    if (previewMetrics) {
      previewMetrics.innerHTML = `Items: ${itemsList.length} | Subtotal: Rp ${subtotal.toLocaleString('id-ID')} | Total: Rp ${total.toLocaleString('id-ID')}`;
    }
  }

  // EVENT LISTENERS FORM STRUK
  document.querySelectorAll('#receiptSection input, #receiptSection textarea').forEach(el => {
    el.addEventListener('input', renderReceipt);
  });

  const btnReset = document.getElementById('btnResetReceipt');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      itemsList = [];
      updateItemListUI();
      renderReceipt();
    });
  }

  // IMAGE PROCESSING
  let loadedImage = null;
  const imageInput = document.getElementById('imageInput');
  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        loadedImage = new Image();
        loadedImage.onload = updateImagePreview;
        loadedImage.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const slider = document.getElementById('thresholdSlider');
  if (slider) {
    slider.addEventListener('input', (e) => {
      document.getElementById('thresholdVal').textContent = e.target.value;
      updateImagePreview();
    });
  }

  document.getElementById('invertCheckbox')?.addEventListener('change', updateImagePreview);

  function updateImagePreview() {
    if (!loadedImage || !ctx) return;
    const scale = 384 / loadedImage.width;
    canvas.width = 384;
    canvas.height = Math.floor(loadedImage.height * scale);
    ctx.drawImage(loadedImage, 0, 0, canvas.width, canvas.height);

    const threshold = parseInt(document.getElementById('thresholdSlider')?.value || 128);
    const invert = document.getElementById('invertCheckbox')?.checked || false;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < imgData.data.length; i += 4) {
      let avg = (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;
      let color = avg < threshold ? 0 : 255;
      if (invert) color = 255 - color;
      imgData.data[i] = imgData.data[i + 1] = imgData.data[i + 2] = color;
    }
    ctx.putImageData(imgData, 0, 0);

    if (previewMetrics) {
      previewMetrics.innerHTML = `Original: ${loadedImage.width}x${loadedImage.height}px | Print: ${canvas.width}x${canvas.height}px`;
    }
  }

  // BLE CONNECT & PRINT
  if (btnConnect) {
    btnConnect.addEventListener('click', async () => {
      try {
        log("Mencari Bluetooth Printer...");
        bleDevice = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['0000ae30-0000-1000-8000-00805f9b34fb', '0000af30-0000-1000-8000-00805f9b34fb']
        });
        const server = await bleDevice.gatt.connect();
        const services = await server.getPrimaryServices();
        for (let service of services) {
          const chars = await service.getCharacteristics();
          if (chars.length > 0) { printCharacteristic = chars[0]; break; }
        }
        if (batteryStatus) batteryStatus.textContent = "🔋 85%";
        log(`Terhubung ke: ${bleDevice.name}`);
      } catch (err) {
        log(`Gagal koneksi: ${err.message}`);
      }
    });
  }

  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      if (!printCharacteristic) {
        alert("Sambungkan Bluetooth Printer Terlebih Dahulu!");
        return;
      }
      log("Mengirimkan data cetak...");
    });
  }

  // INISIALISASI
  updateItemListUI();
  renderReceipt();
});

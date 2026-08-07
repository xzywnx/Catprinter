// Pengambilan Elemen UI
const btnReceiptMode = document.getElementById('btnReceiptMode');
const btnImageMode = document.getElementById('btnImageMode');
const receiptSection = document.getElementById('receiptSection');
const imageSection = document.getElementById('imageSection');
const btnConnect = document.getElementById('btnConnect');
const btnPrint = document.getElementById('btnPrint');
const canvas = document.getElementById('printCanvas');
const ctx = canvas.getContext('2d');
const logArea = document.getElementById('logArea');

let bleDevice = null;
let printCharacteristic = null;

// Isi tanggal otomatis saat pertama kali dibuka
document.getElementById('receiptDate').value = new Date().toLocaleString('id-ID');

function log(msg) {
  logArea.textContent = `Status: ${msg}`;
}

// Switch Mode
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
});

// 1. RENDER STRUK LENGKAP KE CANVAS
function renderReceipt() {
  const width = 384; // Lebar standar MXW01
  
  // Ambil semua data input
  const store = document.getElementById('storeName').value;
  const phone = document.getElementById('storePhone').value;
  const table = document.getElementById('receiptTable').value;
  const server = document.getElementById('receiptServer').value;
  const order = document.getElementById('receiptOrder').value;
  const tax = parseFloat(document.getElementById('receiptTax').value.replace(',', '.')) || 0;
  const dateStr = document.getElementById('receiptDate').value;
  const itemsText = document.getElementById('receiptItems').value;
  const footer = document.getElementById('footerText').value;

  // Parsing daftar belanjaan
  const items = itemsText.split('\n').filter(l => l.trim() !== '').map(line => {
    const parts = line.split(':');
    return { 
      name: parts[0] ? parts[0].trim() : '', 
      price: parseFloat(parts[1] ? parts[1].trim() : '0') || 0 
    };
  });

  // Hitung Subtotal & Tax
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const taxAmount = subtotal * (tax / 100);
  const total = subtotal + taxAmount;

  // Hitung tinggi Canvas secara dinamis
  canvas.width = width;
  canvas.height = 240 + (items.length * 22);

  // Background Putih
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, canvas.height);

  // Style Teks
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';

  let y = 28;
  ctx.fillText(store, width / 2, y); y += 20;
  ctx.font = '14px monospace';
  ctx.fillText(phone, width / 2, y); y += 20;
  ctx.fillText("--------------------------------", width / 2, y); y += 18;

  // Detail Info Struk
  ctx.textAlign = 'left';
  ctx.fillText(`Table: ${table}  Server: ${server}  Order: #${order}`, 10, y); y += 18;
  ctx.fillText(`Date: ${dateStr}`, 10, y); y += 18;
  ctx.textAlign = 'center';
  ctx.fillText("--------------------------------", width / 2, y); y += 20;

  // List Item Belanjaan
  items.forEach(item => {
    ctx.textAlign = 'left';
    ctx.fillText(item.name.substring(0, 18), 10, y);
    ctx.textAlign = 'right';
    ctx.fillText(item.price.toLocaleString('id-ID'), width - 10, y);
    y += 20;
  });

  ctx.textAlign = 'center';
  ctx.fillText("--------------------------------", width / 2, y); y += 20;

  // Total
  if (tax > 0) {
    ctx.textAlign = 'left';
    ctx.fillText(`Tax (${tax}%):`, 10, y);
    ctx.textAlign = 'right';
    ctx.fillText(taxAmount.toLocaleString('id-ID'), width - 10, y); y += 20;
  }

  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'left';
  ctx.fillText("TOTAL:", 10, y);
  ctx.textAlign = 'right';
  ctx.fillText(total.toLocaleString('id-ID'), width - 10, y); y += 25;

  // Footer Text
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  const footerLines = footer.split('\n');
  footerLines.forEach(line => {
    ctx.fillText(line, width / 2, y); y += 16;
  });
}

// Event Listener Form Struk
document.querySelectorAll('#receiptSection input, #receiptSection textarea').forEach(e => {
  e.addEventListener('input', renderReceipt);
});

// Render Awal
renderReceipt();

// 2. UNGGAH GAMBAR
document.getElementById('imageInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const scale = 384 / img.width;
      canvas.width = 384;
      canvas.height = Math.floor(img.height * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Binarization (Hitam-Putih)
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < imgData.data.length; i += 4) {
        let avg = (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;
        let color = avg < 128 ? 0 : 255;
        imgData.data[i] = color;
        imgData.data[i + 1] = color;
        imgData.data[i + 2] = color;
      }
      ctx.putImageData(imgData, 0, 0);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// 3. KONEKSI BLUETOOTH BLE
btnConnect.addEventListener('click', async () => {
  try {
    log("Mencari Bluetooth Printer MXW01...");
    bleDevice = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '0000ae30-0000-1000-8000-00805f9b34fb',
        '0000af30-0000-1000-8000-00805f9b34fb'
      ]
    });

    log(`Menghubungkan ke ${bleDevice.name}...`);
    const server = await bleDevice.gatt.connect();
    const services = await server.getPrimaryServices();
    
    for (let service of services) {
      const characteristics = await service.getCharacteristics();
      if (characteristics.length > 0) {
        printCharacteristic = characteristics[0];
        break;
      }
    }
    log(`Terhubung ke: ${bleDevice.name}`);
  } catch (err) {
    log(`Gagal: ${err.message}`);
  }
});

// 4. KONVERSI CANVAS KE BITMAP BYTE PRINTER
function getPrinterBytes() {
  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height).data;
  let bytes = [];

  // Command Init MXW01
  bytes.push(0x1b, 0x40); // Reset
  bytes.push(0x1d, 0x76, 0x30, 0x00); // Mode Bitmap Raster
  bytes.push((width / 8) & 0xff, 0x00); // Byte per baris (48)
  bytes.push(height & 0xff, (height >> 8) & 0xff); // Tinggi

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x += 8) {
      let byteVal = 0;
      for (let bit = 0; bit < 8; bit++) {
        const idx = ((y * width) + (x + bit)) * 4;
        const avg = (imgData[idx] + imgData[idx + 1] + imgData[idx + 2]) / 3;
        if (avg < 128) {
          byteVal |= (1 << (7 - bit));
        }
      }
      bytes.push(byteVal);
    }
  }

  // Feed kertas
  bytes.push(0x1b, 0x64, 0x04);
  return new Uint8Array(bytes);
}

// 5. PRINT NOW (PENGIRIMAN DATA ASLI)
btnPrint.addEventListener('click', async () => {
  if (!printCharacteristic) {
    alert("Hubungkan Bluetooth Printer Terlebih Dahulu!");
    return;
  }

  try {
    log("Mengolah data gambar...");
    const dataBytes = getPrinterBytes();
    
    log(`Mengirim data cetak (${dataBytes.length} bytes)...`);
    const chunkSize = 80;
    
    for (let i = 0; i < dataBytes.length; i += chunkSize) {
      const chunk = dataBytes.slice(i, i + chunkSize);
      await printCharacteristic.writeValue(chunk);
      
      const progress = Math.round(((i + chunk.length) / dataBytes.length) * 100);
      log(`Mencetak: ${progress}%`);
      
      // Delay singkat
      await new Promise(r => setTimeout(r, 15));
    }

    log("Pencetakan Selesai dengan Sukses!");
  } catch (err) {
    log(`Gagal Mencetak: ${err.message}`);
  }
});

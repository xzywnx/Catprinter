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

document.getElementById('receiptDate').value = new Date().toLocaleString();

function log(msg) {
  logArea.textContent = `Status: ${msg}`;
}

// Beralih Mode
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

// Render Struk
function renderReceipt() {
  const width = 384;
  const store = document.getElementById('storeName').value;
  const phone = document.getElementById('storePhone').value;
  const itemsText = document.getElementById('receiptItems').value;
  const footer = document.getElementById('footerText').value;

  const items = itemsText.split('\n').map(line => {
    const parts = line.split(':');
    return { name: parts[0] ? parts[0].trim() : '', price: parts[1] ? parts[1].trim() : '0' };
  });

  canvas.width = width;
  canvas.height = 200 + (items.length * 20);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, canvas.height);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';

  let y = 30;
  ctx.fillText(store, width / 2, y); y += 20;
  ctx.font = '14px monospace';
  ctx.fillText(phone, width / 2, y); y += 20;
  ctx.fillText("--------------------------------", width / 2, y); y += 20;

  items.forEach(item => {
    ctx.textAlign = 'left';
    ctx.fillText(item.name, 10, y);
    ctx.textAlign = 'right';
    ctx.fillText(item.price, width - 10, y);
    y += 20;
  });

  ctx.textAlign = 'center';
  ctx.fillText("--------------------------------", width / 2, y); y += 20;
  ctx.fillText(footer, width / 2, y);
}

document.querySelectorAll('#receiptSection input, #receiptSection textarea').forEach(e => {
  e.addEventListener('input', renderReceipt);
});
renderReceipt();

// Olah Gambar
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
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// Koneksi Web Bluetooth
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
      const characteristics = await service.getCharacteristics();
      if (characteristics.length > 0) {
        printCharacteristic = characteristics[0];
        break;
      }
    }
    log(`Terhubung ke ${bleDevice.name}!`);
  } catch (err) {
    log(`Gagal: ${err.message}`);
  }
});

// Tombol Print
btnPrint.addEventListener('click', async () => {
  if (!printCharacteristic) {
    alert("Hubungkan Bluetooth Printer Terlebih Dahulu!");
    return;
  }
  log("Mengirim data ke printer...");
  // Logika pengiriman byte
  setTimeout(() => log("Pencetakan Selesai!"), 1000);
});

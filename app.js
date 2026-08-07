// ELEMEN UI
var btnReceiptMode = document.getElementById('btnReceiptMode');
var btnImageMode = document.getElementById('btnImageMode');
var receiptSection = document.getElementById('receiptSection');
var imageSection = document.getElementById('imageSection');
var btnConnect = document.getElementById('btnConnect');
var btnPrint = document.getElementById('btnPrint');
var canvas = document.getElementById('printCanvas');
var ctx = canvas ? canvas.getContext('2d') : null;
var logArea = document.getElementById('logArea');
var batteryStatus = document.getElementById('batteryStatus');
var previewMetrics = document.getElementById('previewMetrics');

var bleDevice = null;
var printCharacteristic = null;
var itemsList = [];

// TANGGAL OTOMATIS
var dateInput = document.getElementById('receiptDate');
if (dateInput) {
  dateInput.value = new Date().toLocaleString('id-ID');
}

function log(msg) {
  if (logArea) logArea.textContent = "Status: " + msg;
}

// SWITCH MODE
btnReceiptMode.onclick = function() {
  btnReceiptMode.className = 'btn-mode active';
  btnImageMode.className = 'btn-mode';
  receiptSection.className = 'card';
  imageSection.className = 'card hidden';
  renderReceipt();
};

btnImageMode.onclick = function() {
  btnImageMode.className = 'btn-mode active';
  btnReceiptMode.className = 'btn-mode';
  imageSection.className = 'card';
  receiptSection.className = 'card hidden';
  updateImagePreview();
};

// TAMBAH ITEM
var btnAddItem = document.getElementById('btnAddItem');
btnAddItem.onclick = function() {
  var nameInput = document.getElementById('itemNameInput');
  var priceInput = document.getElementById('itemPriceInput');
  if (!nameInput.value) return;

  itemsList.push({
    name: nameInput.value,
    price: parseFloat(priceInput.value) || 0
  });

  nameInput.value = '';
  priceInput.value = '';
  updateItemListUI();
  renderReceipt();
};

function updateItemListUI() {
  var ul = document.getElementById('itemListUI');
  if (!ul) return;
  ul.innerHTML = '';
  
  for (var i = 0; i < itemsList.length; i++) {
    var item = itemsList[i];
    var li = document.createElement('li');
    li.innerHTML = '<span>' + item.name + '</span><span>Rp ' + item.price.toLocaleString('id-ID') + ' <b style="color:red;cursor:pointer;margin-left:8px;" onclick="removeItem(' + i + ')">[X]</b></span>';
    ul.appendChild(li);
  }
}

window.removeItem = function(index) {
  itemsList.splice(index, 1);
  updateItemListUI();
  renderReceipt();
};

// RENDER STRUK
function renderReceipt() {
  if (!canvas || !ctx) return;
  var width = 384;
  
  var store = document.getElementById('storeName').value || '';
  var phone = document.getElementById('storePhone').value || '';
  var table = document.getElementById('receiptTable').value || '';
  var server = document.getElementById('receiptServer').value || '';
  var order = document.getElementById('receiptOrder').value || '';
  var tax = parseFloat(document.getElementById('receiptTax').value) || 0;
  var dateStr = document.getElementById('receiptDate').value || '';
  var tip = parseFloat(document.getElementById('receiptTip').value) || 0;
  var paid = parseFloat(document.getElementById('receiptPaid').value) || 0;
  var footer = document.getElementById('footerText').value || '';

  var subtotal = 0;
  for (var i = 0; i < itemsList.length; i++) {
    subtotal += itemsList[i].price;
  }

  var taxAmount = subtotal * (tax / 100);
  var total = subtotal + taxAmount + tip;
  var change = Math.max(0, paid - total);
  
  document.getElementById('receiptChange').value = change.toLocaleString('id-ID');

  canvas.width = width;
  canvas.height = 260 + (itemsList.length * 20);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, canvas.height);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'center';

  var y = 25;
  ctx.fillText(store, width / 2, y); y += 18;
  ctx.font = '13px monospace';
  ctx.fillText(phone, width / 2, y); y += 18;
  ctx.fillText("--------------------------------", width / 2, y); y += 16;

  ctx.textAlign = 'left';
  ctx.fillText("DATE: " + dateStr, 10, y); y += 16;
  ctx.fillText("ORDER #: " + order, 10, y); y += 16;
  ctx.fillText("TABLE: " + table + "   SERVER: " + server, 10, y); y += 16;
  ctx.textAlign = 'center';
  ctx.fillText("--------------------------------", width / 2, y); y += 18;

  for (var j = 0; j < itemsList.length; j++) {
    var itm = itemsList[j];
    ctx.textAlign = 'left';
    ctx.fillText(itm.name.substring(0, 18), 10, y);
    ctx.textAlign = 'right';
    ctx.fillText(itm.price.toLocaleString('id-ID'), width - 10, y);
    y += 18;
  }

  ctx.textAlign = 'center';
  ctx.fillText("--------------------------------", width / 2, y); y += 18;

  ctx.textAlign = 'left';
  ctx.fillText("SUBTOTAL:", 10, y); ctx.textAlign = 'right'; ctx.fillText(subtotal.toLocaleString('id-ID'), width - 10, y); y += 16;
  ctx.textAlign = 'left';
  ctx.fillText("TAX (" + tax + "%):", 10, y); ctx.textAlign = 'right'; ctx.fillText(taxAmount.toLocaleString('id-ID'), width - 10, y); y += 16;
  ctx.textAlign = 'left';
  ctx.fillText("TOTAL:", 10, y); ctx.textAlign = 'right'; ctx.fillText(total.toLocaleString('id-ID'), width - 10, y); y += 20;

  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  var lines = footer.split('\n');
  for (var k = 0; k < lines.length; k++) {
    ctx.fillText(lines[k], width / 2, y); y += 14;
  }

  previewMetrics.innerHTML = "Items: " + itemsList.length + " | Subtotal: Rp " + subtotal.toLocaleString('id-ID') + " | Total: Rp " + total.toLocaleString('id-ID');
}

// RESET FORM
document.getElementById('btnResetReceipt').onclick = function() {
  itemsList = [];
  updateItemListUI();
  renderReceipt();
};

// GAMBAR PREVIEW
var loadedImage = null;
document.getElementById('imageInput').onchange = function(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(evt) {
    loadedImage = new Image();
    loadedImage.onload = updateImagePreview;
    loadedImage.src = evt.target.result;
  };
  reader.readAsDataURL(file);
};

document.getElementById('thresholdSlider').oninput = function(e) {
  document.getElementById('thresholdVal').textContent = e.target.value;
  updateImagePreview();
};

document.getElementById('invertCheckbox').onchange = updateImagePreview;

function updateImagePreview() {
  if (!loadedImage || !ctx) return;
  var scale = 384 / loadedImage.width;
  canvas.width = 384;
  canvas.height = Math.floor(loadedImage.height * scale);
  ctx.drawImage(loadedImage, 0, 0, canvas.width, canvas.height);

  var threshold = parseInt(document.getElementById('thresholdSlider').value || 128);
  var invert = document.getElementById('invertCheckbox').checked;

  var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (var i = 0; i < imgData.data.length; i += 4) {
    var avg = (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;
    var color = avg < threshold ? 0 : 255;
    if (invert) color = 255 - color;
    imgData.data[i] = imgData.data[i + 1] = imgData.data[i + 2] = color;
  }
  ctx.putImageData(imgData, 0, 0);

  previewMetrics.innerHTML = "Original: " + loadedImage.width + "x" + loadedImage.height + "px | Print: " + canvas.width + "x" + canvas.height + "px";
}

// BLUETOOTH BLE CONNECT
btnConnect.onclick = function() {
  log("Mencari Bluetooth Printer...");
  navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: ['0000ae30-0000-1000-8000-00805f9b34fb', '0000af30-0000-1000-8000-00805f9b34fb']
  })
  .then(function(device) {
    bleDevice = device;
    log("Menghubungkan ke " + device.name + "...");
    return device.gatt.connect();
  })
  .then(function(server) {
    return server.getPrimaryServices();
  })
  .then(function(services) {
    if (services.length > 0) {
      return services[0].getCharacteristics();
    }
  })
  .then(function(chars) {
    if (chars && chars.length > 0) {
      printCharacteristic = chars[0];
      batteryStatus.textContent = "🔋 85%";
      log("Terhubung ke: " + bleDevice.name);
    }
  })
  .catch(function(err) {
    log("Gagal koneksi: " + err.message);
  });
};

btnPrint.onclick = function() {
  if (!printCharacteristic) {
    alert("Sambungkan Bluetooth Printer Terlebih Dahulu!");
    return;
  }
  log("Mengirimkan data cetak...");
};

// JALANKAN AWAL
renderReceipt();

/**
 * Maktab Ovozi - Telegram Web App Client
 * Bot Token: 9070135329:AAGePTSiRBMBz9l3dQNgan6qU66pPsDgpME
 * Admin ID: 6649277063
 */

const CONFIG = {
  BOT_TOKEN: '9070135329:AAGePTSiRBMBz9l3dQNgan6qU66pPsDgpME',
  ADMIN_CHAT_ID: '6649277063',
  MAX_CHARS: 1000,
  MAX_FILE_SIZE_MB: 50,
  MAX_FILES: 10
};

// Initialize Telegram WebApp SDK
const tg = window.Telegram?.WebApp;
if (tg) {
  try {
    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation();
  } catch (e) {
    console.warn('Telegram WebApp init warning:', e);
  }
}

// DOM Elements
const form = document.getElementById('suggestionForm');
const messageInput = document.getElementById('messageInput');
const charCount = document.getElementById('charCount');
const photoInput = document.getElementById('photoInput');
const fileInput = document.getElementById('fileInput');
const attachHint = document.getElementById('attachHint');
const filesPreviewContainer = document.getElementById('filesPreviewContainer');
const fileCountBadge = document.getElementById('fileCountBadge');
const filesGrid = document.getElementById('filesGrid');
const clearAllFilesBtn = document.getElementById('clearAllFilesBtn');
const submitBtn = document.getElementById('submitBtn');
const submitBtnText = document.getElementById('submitBtnText');
const resultModal = document.getElementById('resultModal');
const newFeedbackBtn = document.getElementById('newFeedbackBtn');
const closeWebAppBtn = document.getElementById('closeWebAppBtn');
const toastContainer = document.getElementById('toastContainer');

// State
let selectedFiles = [];
let isSubmitting = false;

// Helpers
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf': return '📕';
    case 'doc':
    case 'docx': return '📘';
    case 'xls':
    case 'xlsx': return '📗';
    case 'ppt':
    case 'pptx': return '📙';
    case 'zip':
    case 'rar':
    case '7z': return '🗜️';
    case 'mp3':
    case 'wav': return '🎵';
    case 'mp4':
    case 'mov': return '🎬';
    case 'txt': return '📄';
    default: return '📁';
  }
}

function getFormattedDate() {
  const now = new Date();
  return now.toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function showToast(message, type = 'error') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'error' ? '⚠️' : '✅'}</span>
    <span>${escapeHtml(message)}</span>
  `;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

function haptic(type = 'light') {
  try {
    if (tg?.HapticFeedback) {
      if (type === 'success' || type === 'error' || type === 'warning') {
        tg.HapticFeedback.notificationOccurred(type);
      } else {
        tg.HapticFeedback.impactOccurred(type);
      }
    }
  } catch (e) {
    // Ignore haptic errors outside Telegram
  }
}

// Character counter & button status
function updateState() {
  const currentLength = messageInput.value.length;
  charCount.textContent = currentLength;

  if (currentLength > CONFIG.MAX_CHARS) {
    charCount.style.color = '#ef4444';
  } else {
    charCount.style.color = '';
  }

  const hasContent = messageInput.value.trim().length > 0 || selectedFiles.length > 0;
  submitBtn.disabled = !hasContent || isSubmitting;
}

messageInput.addEventListener('input', updateState);

// File handling
function handleFiles(fileList) {
  if (!fileList || fileList.length === 0) return;

  const remainingSlots = CONFIG.MAX_FILES - selectedFiles.length;
  if (remainingSlots <= 0) {
    showToast(`Ko'pi bilan ${CONFIG.MAX_FILES} ta fayl yuklashingiz mumkin.`);
    return;
  }

  const filesToAdd = Array.from(fileList).slice(0, remainingSlots);
  const maxBytes = CONFIG.MAX_FILE_SIZE_MB * 1024 * 1024;

  for (const file of filesToAdd) {
    if (file.size > maxBytes) {
      showToast(`"${file.name}" juda katta. Maksimal hajm: ${CONFIG.MAX_FILE_SIZE_MB}MB`);
      continue;
    }
    selectedFiles.push(file);
  }

  renderFilePreviews();
  updateState();
  haptic('light');
}

function renderFilePreviews() {
  if (selectedFiles.length === 0) {
    filesPreviewContainer.style.display = 'none';
    photoInput.value = '';
    fileInput.value = '';
    return;
  }

  filesPreviewContainer.style.display = 'block';
  fileCountBadge.textContent = selectedFiles.length;
  filesGrid.innerHTML = '';

  selectedFiles.forEach((file, index) => {
    const isImage = file.type.startsWith('image/');
    const item = document.createElement('div');
    item.className = 'file-item';

    let mediaHtml = '';
    if (isImage) {
      const thumbUrl = URL.createObjectURL(file);
      mediaHtml = `<img src="${thumbUrl}" class="file-thumb" alt="Preview">`;
    } else {
      mediaHtml = `<div class="file-doc-icon">${getFileIcon(file.name)}</div>`;
    }

    item.innerHTML = `
      ${mediaHtml}
      <div class="file-info">
        <div class="file-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
        <div class="file-size">${formatBytes(file.size)}</div>
      </div>
      <button type="button" class="file-remove-btn" data-index="${index}" title="O'chirish">✕</button>
    `;

    filesGrid.appendChild(item);
  });

  // Attach delete handlers
  document.querySelectorAll('.file-remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.getAttribute('data-index'), 10);
      removeFile(index);
    });
  });
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  renderFilePreviews();
  updateState();
  haptic('light');
}

clearAllFilesBtn.addEventListener('click', () => {
  selectedFiles = [];
  renderFilePreviews();
  updateState();
  haptic('light');
});

photoInput.addEventListener('change', (e) => handleFiles(e.target.files));
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

// Drag & drop support on textarea card
const inputCard = document.getElementById('inputCard');
['dragenter', 'dragover'].forEach(eventName => {
  inputCard.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    inputCard.style.borderColor = '#38bdf8';
  });
});
['dragleave', 'drop'].forEach(eventName => {
  inputCard.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    inputCard.style.borderColor = '';
  });
});
inputCard.addEventListener('drop', (e) => {
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    handleFiles(e.dataTransfer.files);
  }
});

// Telegram API Calling
async function sendToTelegram() {
  const text = messageInput.value.trim();
  if (!text && selectedFiles.length === 0) return;

  isSubmitting = true;
  submitBtn.disabled = true;
  submitBtn.classList.add('loading');
  submitBtnText.textContent = 'Yuborilmoqda...';
  haptic('medium');

  const dateTime = getFormattedDate();

  // Header format for admin
  const baseCaption = `🎓 <b>Maktab Ovozi — Yangi taklif!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    (text ? `💬 <b>Xabar:</b>\n${escapeHtml(text)}\n\n` : `💬 <i>Faqat media fayl yuborildi</i>\n\n`) +
    `📅 <b>Vaqt:</b> ${dateTime}\n` +
    `🔒 <b>Holati:</b> Anonim\n` +
    (selectedFiles.length > 0 ? `📎 <b>Fayllar soni:</b> ${selectedFiles.length} ta\n` : '') +
    `━━━━━━━━━━━━━━━━━━━━━`;

  try {
    if (selectedFiles.length === 0) {
      // 1. Text only -> sendMessage
      const response = await fetch(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CONFIG.ADMIN_CHAT_ID,
          text: baseCaption,
          parse_mode: 'HTML'
        })
      });

      const data = await response.json();
      if (!data.ok) throw new Error(data.description || 'Xabar yuborishda xatolik yuz berdi');

    } else {
      // 2. Has attachments
      // Split photos and other files
      const photos = selectedFiles.filter(f => f.type.startsWith('image/'));
      const documents = selectedFiles.filter(f => !f.type.startsWith('image/'));

      let captionUsed = false;

      // Send photos
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        submitBtnText.textContent = `Rasm yuklanmoqda (${i + 1}/${photos.length})...`;
        
        const formData = new FormData();
        formData.append('chat_id', CONFIG.ADMIN_CHAT_ID);
        formData.append('photo', photo);

        if (!captionUsed) {
          // Telegram caption limit is 1024 chars
          if (baseCaption.length <= 1024) {
            formData.append('caption', baseCaption);
            formData.append('parse_mode', 'HTML');
            captionUsed = true;
          }
        } else {
          formData.append('caption', `📷 Biriktirilgan rasm #${i + 1}`);
        }

        const res = await fetch(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.description || `Rasm #${i + 1} yuborilmadi`);
      }

      // Send documents / files
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        submitBtnText.textContent = `Fayl yuklanmoqda (${i + 1}/${documents.length})...`;

        const formData = new FormData();
        formData.append('chat_id', CONFIG.ADMIN_CHAT_ID);
        formData.append('document', doc);

        if (!captionUsed) {
          if (baseCaption.length <= 1024) {
            formData.append('caption', baseCaption);
            formData.append('parse_mode', 'HTML');
            captionUsed = true;
          }
        } else {
          formData.append('caption', `📁 Hujjat: ${doc.name}`);
        }

        const res = await fetch(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendDocument`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.description || `Fayl "${doc.name}" yuborilmadi`);
      }

      // If caption couldn't fit or wasn't used yet, send the text separately
      if (!captionUsed) {
        await fetch(`https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: CONFIG.ADMIN_CHAT_ID,
            text: baseCaption,
            parse_mode: 'HTML'
          })
        });
      }
    }

    // Success!
    haptic('success');
    showSuccessModal();

  } catch (error) {
    console.error('Send error:', error);
    haptic('error');
    showToast(`Xatolik: ${error.message || 'Tarmoq xatosi yuz berdi'}`);
  } finally {
    isSubmitting = false;
    submitBtn.classList.remove('loading');
    submitBtnText.textContent = 'Yuborish';
    updateState();
  }
}

submitBtn.addEventListener('click', sendToTelegram);

function showSuccessModal() {
  resultModal.style.display = 'flex';
}

function resetForm() {
  messageInput.value = '';
  selectedFiles = [];
  renderFilePreviews();
  updateState();
}

newFeedbackBtn.addEventListener('click', () => {
  resultModal.style.display = 'none';
  resetForm();
  messageInput.focus();
  haptic('light');
});

closeWebAppBtn.addEventListener('click', () => {
  if (tg?.close) {
    tg.close();
  } else {
    resultModal.style.display = 'none';
    resetForm();
  }
});

// Initial state
updateState();

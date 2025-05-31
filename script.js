// Utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Application Module
const App = (function () {
  // Store all DOM element references
  const domElements = {};

  // Application state
  const state = {
    qrText: '',
    qrSize: 200,
    fgColor: '#ffffff',
    useGradient: false,
    gradientColor1: '#00ffcc',
    gradientColor2: '#ff00cc',
    bgColor: '#000000',
    borderRadius: 10,
    padding: 10,
    error: null, // To store any error messages
  };

  /**
   * Initializes DOM element references.
   */
  function initDOMElements() {
    domElements.qrText = document.getElementById('qr-text');
    domElements.qrSize = document.getElementById('qr-size');
    domElements.qrSizeValue = document.getElementById('qr-size-value');
    domElements.fgColor = document.getElementById('fg-color');
    domElements.useGradient = document.getElementById('use-gradient');
    domElements.gradientControls = document.getElementById('gradient-controls');
    domElements.gradientColor1 = document.getElementById('gradient-color1');
    domElements.gradientColor2 = document.getElementById('gradient-color2');
    domElements.bgColor = document.getElementById('bg-color');
    domElements.borderRadius = document.getElementById('border-radius');
    domElements.borderRadiusValue = document.getElementById(
      'border-radius-value'
    );
    domElements.padding = document.getElementById('padding');
    domElements.paddingValue = document.getElementById('padding-value');
    domElements.qrContainer = document.getElementById('qr-container');
    domElements.qrCanvas = document.getElementById('qr-canvas');
    domElements.downloadBtn = document.getElementById('download-btn');

    // Set initial values from DOM
    state.qrText = domElements.qrText.value;
    state.qrSize = parseInt(domElements.qrSize.value);
    state.fgColor = domElements.fgColor.value;
    state.useGradient = domElements.useGradient.checked;
    state.gradientColor1 = domElements.gradientColor1.value;
    state.gradientColor2 = domElements.gradientColor2.value;
    state.bgColor = domElements.bgColor.value;
    state.borderRadius = parseInt(domElements.borderRadius.value);
    state.padding = parseInt(domElements.padding.value);
  }

  /**
   * Updates UI elements that display current values.
   */
  function updateUIDisplays() {
    domElements.qrSizeValue.textContent = `${state.qrSize}px`;
    domElements.borderRadiusValue.textContent = `${state.borderRadius}px`;
    domElements.paddingValue.textContent = `${state.padding}px`;
    // Toggle visibility and ensure ARIA attributes reflect the state if needed
    const isHidden = !state.useGradient;
    domElements.gradientControls.classList.toggle('hidden', isHidden);
    // If using aria-expanded on the checkbox for the gradient controls:
    // domElements.useGradient.setAttribute('aria-expanded', !isHidden);
  }

  /**
   * Displays an error message on the QR code canvas area.
   * The qr-container's aria-live region should announce this change.
   * @param {string} message - The error message to display.
   */
  function displayError(message) {
    state.error = message;
    const canvas = domElements.qrCanvas;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = state.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 16px Arial'; // Make error text bold for better visibility
    ctx.fillStyle = '#ff3333'; // Brighter red for better contrast on dark backgrounds
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxWidth = canvas.width - 20;
    const words = message.split(' ');
    let line = '';
    const lines = [];
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());

    const lineHeight = 20;
    const startY = (canvas.height - lines.length * lineHeight) / 2;

    lines.forEach((l, i) => {
      ctx.fillText(l, canvas.width / 2, startY + i * lineHeight);
    });

    domElements.downloadBtn.disabled = true;
    // Update ARIA label to reflect error state
    canvas.setAttribute('aria-label', `Error generating QR Code: ${message}`);
    console.error(message);
  }

  /**
   * Draws the QR code on the canvas.
   */
  function drawQRCode() {
    state.error = null;
    domElements.qrCanvas.setAttribute('aria-label', 'QR Code Preview Area'); // Reset ARIA label

    if (typeof QRCode === 'undefined') {
      displayError(
        'Error: QR Code library (qrcode.min.js) failed to load. Please check your internet connection or script inclusions.'
      );
      return;
    }

    const text = state.qrText.trim();
    if (!text) {
      const ctx = domElements.qrCanvas.getContext('2d');
      ctx.clearRect(
        0,
        0,
        domElements.qrCanvas.width,
        domElements.qrCanvas.height
      );
      domElements.downloadBtn.disabled = true;
      domElements.qrCanvas.setAttribute(
        'aria-label',
        'QR Code Preview Area: No text entered.'
      );
      return;
    }

    try {
      const size = state.qrSize;
      const canvas = domElements.qrCanvas;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = state.bgColor;
      ctx.fillRect(0, 0, size, size);

      const tempDiv = document.createElement('div');
      const qrInstance = new QRCode(tempDiv, {
        text: text,
        width: size,
        height: size,
        colorDark: '#000000',
        colorLight: '#ffffff',
      });

      const moduleCount = qrInstance._oQRCode.moduleCount;
      if (!moduleCount || moduleCount === 0) {
        // This specific error might be better handled by QRCode.js itself,
        // but good to have a safeguard.
        throw new Error(
          'QR Code module count is zero. Input data may be too long or complex for the current QR version.'
        );
      }
      const cellSize = size / moduleCount;

      let fillStyle = state.fgColor;
      if (state.useGradient) {
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, state.gradientColor1);
        gradient.addColorStop(1, state.gradientColor2);
        fillStyle = gradient;
      }
      ctx.fillStyle = fillStyle;

      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (qrInstance._oQRCode.isDark(row, col)) {
            ctx.fillRect(
              Math.round(col * cellSize),
              Math.round(row * cellSize),
              Math.ceil(cellSize),
              Math.ceil(cellSize)
            );
          }
        }
      }
      domElements.downloadBtn.disabled = false;
      // Update ARIA label with QR content
      canvas.setAttribute('aria-label', `QR Code for: ${text}`);
    } catch (error) {
      // More specific error for data too long if possible
      if (error.message.includes('code length overflow')) {
        displayError(
          `Error: Data too long for QR Code. Please shorten the input text. Max capacity varies with error correction level.`
        );
      } else {
        displayError(`Error generating QR Code: ${error.message}`);
      }
    }
  }

  const debouncedDrawQRCode = debounce(drawQRCode, 250);

  /**
   * Handles the download of the QR code.
   */
  function handleDownload() {
    if (state.error || domElements.downloadBtn.disabled) {
      console.warn('Download prevented due to an error or disabled button.');
      // Optionally, alert the user that download is not possible
      // alert("Cannot download QR code due to an error or invalid state.");
      return;
    }
    const imageUrl = domElements.qrCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'qr-code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Sets up all event listeners for UI interactions.
   */
  function setupEventListeners() {
    domElements.qrText.addEventListener('input', (e) => {
      state.qrText = e.target.value;
      debouncedDrawQRCode();
    });

    domElements.qrSize.addEventListener('input', (e) => {
      state.qrSize = parseInt(e.target.value);
      updateUIDisplays();
      domElements.qrCanvas.width = state.qrSize;
      domElements.qrCanvas.height = state.qrSize;
      debouncedDrawQRCode();
    });

    domElements.fgColor.addEventListener('input', (e) => {
      state.fgColor = e.target.value;
      debouncedDrawQRCode();
    });

    domElements.useGradient.addEventListener('change', (e) => {
      state.useGradient = e.target.checked;
      updateUIDisplays();
      debouncedDrawQRCode();
    });

    domElements.gradientColor1.addEventListener('input', (e) => {
      state.gradientColor1 = e.target.value;
      debouncedDrawQRCode();
    });

    domElements.gradientColor2.addEventListener('input', (e) => {
      state.gradientColor2 = e.target.value;
      debouncedDrawQRCode();
    });

    domElements.bgColor.addEventListener('input', (e) => {
      state.bgColor = e.target.value;
      debouncedDrawQRCode();
    });

    domElements.borderRadius.addEventListener('input', (e) => {
      state.borderRadius = parseInt(e.target.value);
      updateUIDisplays();
    });

    domElements.padding.addEventListener('input', (e) => {
      state.padding = parseInt(e.target.value);
      updateUIDisplays();
    });

    domElements.downloadBtn.addEventListener('click', handleDownload);
  }

  /**
   * Initializes the application.
   */
  function init() {
    initDOMElements();
    updateUIDisplays();
    setupEventListeners();
    domElements.qrCanvas.width = state.qrSize;
    domElements.qrCanvas.height = state.qrSize;
    drawQRCode();
  }

  return {
    init: init,
  };
})();

document.addEventListener('DOMContentLoaded', App.init);

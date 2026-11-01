export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadSvg(svgString, filename = 'automaton.svg') {
  downloadBlob(new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' }), filename);
}

export function downloadPng(svgString, width, height, filename = 'automaton.png', scale = 2) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('PNG export failed'));
        downloadBlob(blob, filename);
        resolve();
      }, 'image/png');
    };
    img.onerror = () => reject(new Error('Could not render the diagram to PNG'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
  });
}

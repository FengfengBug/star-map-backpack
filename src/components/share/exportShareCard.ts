const EXPORT_WIDTH = 1080;
const EXPORT_HEIGHT = 1350;

function loadSvgImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('SVG image loading failed'));
    image.src = url;
  });
}

function exportCanvas(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('PNG encoding failed'));
    }, 'image/png');
  });
}

export async function downloadShareCardPng(svg: SVGSVGElement, fileName: string) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(EXPORT_WIDTH));
  clone.setAttribute('height', String(EXPORT_HEIGHT));

  const source = new XMLSerializer().serializeToString(clone);
  const svgUrl = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }));
  let downloadUrl: string | null = null;

  try {
    const image = await loadSvgImage(svgUrl);
    const canvas = document.createElement('canvas');
    canvas.width = EXPORT_WIDTH;
    canvas.height = EXPORT_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable');

    context.fillStyle = '#fffdf8';
    context.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
    context.drawImage(image, 0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
    const png = await exportCanvas(canvas);

    downloadUrl = URL.createObjectURL(png);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = fileName;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(svgUrl);
    if (downloadUrl) {
      const url = downloadUrl;
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  }
}

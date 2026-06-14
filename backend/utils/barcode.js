import bwipjs from 'bwip-js';

export async function generateBarcodeImage(value) {
  const png = await bwipjs.toBuffer({
    bcid: 'code128',
    text: value,
    scale: 3,
    height: 10,
    includetext: true,
    textxalign: 'center',
  });
  return png;
}

export function generateBarcodeValue(jobNumber, serialNumber) {
  const cleanJob = jobNumber.replace(/\./g, '');
  return `AF-${cleanJob}-${serialNumber}-${Date.now().toString(36).toUpperCase()}`;
}

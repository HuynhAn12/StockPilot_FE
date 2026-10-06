const ChuSo = [' không', ' một', ' hai', ' ba', ' bốn', ' năm', ' sáu', ' bảy', ' tám', ' chín'];
const Tien = ['', ' nghìn', ' triệu', ' tỷ', ' nghìn tỷ', ' triệu tỷ'];

function docSo3ChuSo(baso) {
  let tram = Math.floor(baso / 100);
  let chuc = Math.floor((baso % 100) / 10);
  let donvi = baso % 10;
  let ketQua = '';

  if (tram === 0 && chuc === 0 && donvi === 0) return '';

  if (tram !== 0) {
    ketQua += ChuSo[tram] + ' trăm';
    if (chuc === 0 && donvi !== 0) ketQua += ' linh';
  }

  if (chuc !== 0 && chuc !== 1) {
    ketQua += ChuSo[chuc] + ' mươi';
    if (chuc === 0 && donvi !== 0) ketQua += ' linh';
  }

  if (chuc === 1) ketQua += ' mười';

  switch (donvi) {
    case 1:
      if (chuc !== 0 && chuc !== 1) {
        ketQua += ' mốt';
      } else {
        ketQua += ChuSo[donvi];
      }
      break;
    case 5:
      if (chuc === 0) {
        ketQua += ChuSo[donvi];
      } else {
        ketQua += ' lăm';
      }
      break;
    default:
      if (donvi !== 0) {
        ketQua += ChuSo[donvi];
      }
      break;
  }
  return ketQua;
}

export function docSoThanhChu(soTien) {
  if (soTien === 0) return 'Không đồng';
  if (!soTien || isNaN(soTien)) return '';

  let so = Math.abs(Math.round(soTien));
  let viTri = 0;
  let lan = 0;
  let ketQua = '';
  let i = 0;
  let chuoiTien = '';
  let mangTien = [];

  while (so > 0) {
    mangTien[i] = so % 1000;
    so = Math.floor(so / 1000);
    i++;
  }

  for (let j = mangTien.length - 1; j >= 0; j--) {
    let doc = docSo3ChuSo(mangTien[j]);
    if (doc !== '') {
      chuoiTien += doc + Tien[j];
    }
  }

  chuoiTien = chuoiTien.trim();
  if (chuoiTien.length > 0) {
    chuoiTien = chuoiTien.charAt(0).toUpperCase() + chuoiTien.slice(1) + ' đồng chẵn';
  }
  return chuoiTien;
}

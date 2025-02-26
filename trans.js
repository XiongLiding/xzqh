// 专有名词的变量名用拼音简称

const fs = require('fs');
const txt = fs.readFileSync('./input.txt', 'utf-8');
const data = txt
  .replaceAll('*', '')
  .trim()
  .split('\n')
  .map(v => v.trim().split(/\s+/))
  .filter(v => v.length > 1);

const writeCSV = (name, data) => {
  const txt = data.map(v => v.join(',')).join('\n');
  fs.writeFileSync(`./output/${name}.csv`, txt, 'utf-8');
};

const writeSQL = (name, fields, data) => {
  const txt = data.map(r => r.map(c => `'${c}'`).join(',')).join('),\n(');
  fs.writeFileSync(
    `./output/${name}.sql`,
    `INSERT INTO region (${fields}) VALUES\n(${txt})\n`,
    'utf-8',
  );
};

const writeJSON = (name, data) => {
  let obj = {};
  data.forEach(v => {
    obj[v[0]] = v[1];
  });
  let txt = JSON.stringify(obj);
  fs.writeFileSync(`./output/${name}.json`, txt, 'utf-8');
};

// 原始数据
writeCSV('origin', data);
writeSQL('origin', 'code, name', data);
writeJSON('origin', data);

const toIdx = arr => {
  let obj = {};
  arr.forEach(v => (obj[v] = 1));
  return obj;
};
const codes = data.map(v => v[0]);
const provinceCodes = codes.filter(v => v.substr(2) == '0000');
const idxProvince = toIdx(provinceCodes);

// 直辖市
const zxs = ['110000', '120000', '310000', '500000'];
const idxZxs = toIdx(zxs);

// 直辖市辖区
const sxq = codes.filter(
  v => idxZxs[v.substr(0, 2) + '0000'] && v.substr(2, 2) == '01',
);
const idxSxq = toIdx(sxq);

// 直辖市辖县
const sxx = codes.filter(
  v => idxZxs[v.substr(0, 2) + '0000'] && v.substr(2, 2) == '02',
);
const idxSxx = toIdx(sxx);

// 省直辖县级行政区
const szx = codes.filter(v => v.substr(2, 2) == '90');
const idxSzx = toIdx(szx);

// 直筒子市
const ztz = codes.filter(
  v =>
    v.substr(2, 2) != '00' &&
    v.substr(4, 2) == '00' &&
    !codes.some(
      v2 => v2.substr(4, 2) != '00' && v2.substr(0, 4) == v.substr(0, 4),
    ),
);
const idxZtz = toIdx(ztz);

const dynamicParent = code => {
  if (idxProvince[code]) return '000000'; // 省级
  if (code.substr(4, 2) == '00' && !idxProvince[code])
    return code.substr(0, 2) + '0000'; // 市级
  if (idxSxq[code] || idxSxx[code] || idxSzx[code])
    return code.substr(0, 2) + '0000'; // 省级直辖的县级
  return code.substr(0, 4) + '00';
};

// 动态层级
const dynamic = data.map(v => {
  const parent = dynamicParent(v[0]);
  return [...v, parent];
});

writeCSV('parent-dynamic', dynamic);
writeSQL('parent-dynamic', 'code, name, parent', dynamic);

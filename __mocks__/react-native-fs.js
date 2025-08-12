const files = new Map();

const RNFS = {
  DocumentDirectoryPath: '/mock/Documents',
  exists: jest.fn(async (path) => files.has(path)),
  readFile: jest.fn(async (path, _encoding = 'utf8') => {
    if (!files.has(path)) throw new Error('ENOENT');
    return files.get(path);
  }),
  writeFile: jest.fn(async (path, content, _encoding = 'utf8') => {
    files.set(path, String(content));
    return true;
  }),
};

module.exports = RNFS;



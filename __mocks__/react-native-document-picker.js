module.exports = {
  types: {
    allFiles: '*/*',
    images: 'image/*',
    plainText: 'text/plain',
  },
  async pick() {
    // return empty selection by default
    return [];
  },
};



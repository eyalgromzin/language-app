module.exports = {
  types: {
    allFiles: '*/*',
    images: 'image/*',
    plainText: 'text/plain',
  },
  async pickSingle() {
    throw new Error('DocumentPicker mocked: no file selected');
  },
};



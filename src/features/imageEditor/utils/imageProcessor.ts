export async function processImage(originalUri, edits, annotations) {
  console.log('Processing image:', originalUri, edits, annotations);
  return 'file://edited_' + Date.now() + '.jpg';
}
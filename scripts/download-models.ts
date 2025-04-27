import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const modelsDir = path.join(process.cwd(), 'public', 'models');

// Create models directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

const models = [
  {
    name: 'face_recognition_model-shard1.bin',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1'
  },
  {
    name: 'face_recognition_model-shard2.bin',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard2'
  },
  {
    name: 'face_recognition_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json'
  },
  {
    name: 'face_landmark_68_model-shard1.bin',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-shard1'
  },
  {
    name: 'face_landmark_68_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_model-weights_manifest.json'
  },
  {
    name: 'tiny_face_detector_model-shard1.bin',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-shard1'
  },
  {
    name: 'tiny_face_detector_model-weights_manifest.json',
    url: 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/tiny_face_detector_model-weights_manifest.json'
  }
];

async function downloadFile(url: string, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

async function downloadModels() {
  console.log('Downloading face-api.js models...');
  
  for (const model of models) {
    const filePath = path.join(modelsDir, model.name);
    console.log(`Downloading ${model.name}...`);
    try {
      await downloadFile(model.url, filePath);
      console.log(`Downloaded ${model.name}`);
    } catch (error) {
      console.error(`Error downloading ${model.name}:`, error);
    }
  }
  
  console.log('All models downloaded successfully!');
}

downloadModels().catch(console.error); 
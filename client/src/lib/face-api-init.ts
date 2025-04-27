import * as faceapi from 'face-api.js';

// Global state for model loading
let modelsLoaded = false;
let modelLoadPromise: Promise<void> | null = null;

export async function initializeFaceApi() {
  if (modelsLoaded) {
    console.log('✅ Face models already loaded - using cached models');
    return;
  }
  
  if (modelLoadPromise) {
    console.log('⏳ Face models are currently loading - waiting for completion');
    await modelLoadPromise;
    return;
  }
  
  modelLoadPromise = (async () => {
    const startTime = performance.now();
    console.log('🚀 Starting face model initialization...');
    
    try {
      // Load models sequentially to reduce memory usage
      await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      modelsLoaded = true;
      
      const endTime = performance.now();
      console.log(`✅ Face models loaded successfully in ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      console.error('❌ Error loading face detection models:', error);
      throw error;
    } finally {
      modelLoadPromise = null;
    }
  })();
  
  await modelLoadPromise;
}

export function areFaceModelsLoaded() {
  return modelsLoaded;
} 
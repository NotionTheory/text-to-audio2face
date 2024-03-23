// Import required modules and classes
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { Transform } from 'stream';

// Configuration constants
const PROTO_PATH = "C:/Users/Dave/AppData/Local/ov/pkg/deps/b9070d65cb1908ec472cf47bc29f8126/exts/omni.audio2face.player/omni/audio2face/player/scripts/streaming_server/proto/audio2face.proto";
const A2F_INSTANCE_NAME = '/World/audio2face/PlayerStreaming_03';
const A2F_SERVER_ADDRESS = 'localhost:50051';
const audioBitrate = 24000;

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// Load gRPC proto file for audio2face
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});
const audio2faceProto = grpc.loadPackageDefinition(packageDefinition).nvidia.audio2face;

// gRPC client for audio2face
const client = new audio2faceProto.Audio2Face(A2F_SERVER_ADDRESS, grpc.credentials.createInsecure());
  // Setup the gRPC call for streaming audio
  const call = client.PushAudioStream((error) => {
    if (error) {
      console.error('Error during PushAudioStream:', error);
    }
  });

  // Write start marker to the gRPC call
  call.write({
    start_marker: {
      instance_name: A2F_INSTANCE_NAME,
      samplerate: audioBitrate,
      block_until_playback_is_finished: true
    }
  });

// Function to stream audio to Audio2Face
export async function streamAudioToA2F(ttsStream) {
  // Create an instance of AudioBufferToFloat32Transform
  // const audioTransform = new AudioBufferToFloat32Transform();
    
  // Handle data events for the audio transform
  const int16Array = new Int16Array(ttsStream.buffer, ttsStream.byteOffset, ttsStream.length / Int16Array.BYTES_PER_ELEMENT);
  const float32Array = new Float32Array(int16Array.length);
  const gain = 2.0; // Adjust this value to change the amplification level

  int16Array.forEach((int16, i) => {
    float32Array[i] = (int16 / 32768.0) * gain;
  });

  call.write({ audio_data: Buffer.from(float32Array.buffer) });

  // call.end();
}

export async function endCall() {
  call.end();
}
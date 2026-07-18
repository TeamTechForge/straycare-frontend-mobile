// services/WebRTCService.ts

import { NativeModules } from "react-native";
import type {
  RTCPeerConnection as TRTCPeerConnection,
  RTCIceCandidate as TRTCIceCandidate,
  RTCSessionDescription as TRTCSessionDescription,
  MediaStream as TMediaStream,
} from "react-native-webrtc";

let RTCPeerConnection: any = class DummyPeerConnection {
  onicecandidate: any = null;
  ontrack: any = null;
  localDescription: any = null;
  remoteDescription: any = null;
  addTrack() {}
  createOffer() { return Promise.resolve({}); }
  createAnswer() { return Promise.resolve({}); }
  setLocalDescription() { return Promise.resolve(); }
  setRemoteDescription() { return Promise.resolve(); }
  addIceCandidate() { return Promise.resolve(); }
  getTracks() { return []; }
  close() {}
};

let RTCIceCandidate: any = class DummyIceCandidate {};
let RTCSessionDescription: any = class DummySessionDescription {};
let MediaStream: any = class DummyMediaStream {
  addTrack() {}
  getTracks() { return []; }
  getAudioTracks() { return []; }
};
let mediaDevices: any = {
  enumerateDevices: () => Promise.resolve([]),
  getUserMedia: () => Promise.resolve(new MediaStream()),
};

// Check if we are running in an environment with the native WebRTCModule
// (Expo Go does NOT support native WebRTCModule)
const hasWebRTC = !!NativeModules.WebRTCModule;

if (hasWebRTC) {
  try {
    const webrtc = require("react-native-webrtc");
    RTCPeerConnection = webrtc.RTCPeerConnection;
    RTCIceCandidate = webrtc.RTCIceCandidate;
    RTCSessionDescription = webrtc.RTCSessionDescription;
    MediaStream = webrtc.MediaStream;
    mediaDevices = webrtc.mediaDevices;
  } catch (e) {
    console.warn("WebRTC module found but failed to load:", e);
  }
} else {
  console.log("WebRTC native module not found (running in Expo Go/Web). Calling feature is disabled.");
}

export { hasWebRTC };

export class WebRTCService {
  private peerConnection: TRTCPeerConnection | null = null;
  public localStream: TMediaStream | null = null;
  public remoteStream: TMediaStream | null = null;

  private onIceCandidateCallback?: (candidate: TRTCIceCandidate) => void;
  private onRemoteStreamCallback?: (stream: TMediaStream) => void;

  private iceCandidateQueue: TRTCIceCandidate[] = [];

  constructor() {
    this.remoteStream = new MediaStream();
  }

  public setCallbacks(
    onIceCandidate: (candidate: TRTCIceCandidate) => void,
    onRemoteStream: (stream: TMediaStream) => void
  ) {
    this.onIceCandidateCallback = onIceCandidate;
    this.onRemoteStreamCallback = onRemoteStream;
  }

  public async setupLocalStream(): Promise<TMediaStream> {
    const devices = await mediaDevices.enumerateDevices();
    
    // We only need audio for voice calls
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    
    this.localStream = stream as TMediaStream;
    return this.localStream;
  }

  public createPeerConnection(): TRTCPeerConnection {
    const configuration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };

    const pc = new RTCPeerConnection(configuration);
    this.peerConnection = pc;

    pc.onicecandidate = (event: any) => {
      if (event.candidate && this.onIceCandidateCallback) {
        this.onIceCandidateCallback(event.candidate);
      }
    };

    pc.ontrack = (event: any) => {
      if (event.track && this.remoteStream) {
        this.remoteStream.addTrack(event.track);
        if (this.onRemoteStreamCallback) {
          this.onRemoteStreamCallback(this.remoteStream);
        }
      }
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach((track: any) => {
        if (this.localStream) {
            pc.addTrack(track, this.localStream);
        }
      });
    }

    return pc as TRTCPeerConnection;
  }

  public async createOffer(): Promise<TRTCSessionDescription> {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    const offer = await this.peerConnection.createOffer({});
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  private async processIceCandidateQueue(): Promise<void> {
    const pc = this.peerConnection as any;
    const hasRemoteDesc = pc?.remoteDescription || pc?.currentRemoteDescription;
    if (!pc || !hasRemoteDesc) return;
    
    console.log(`[WebRTCService] Processing ICE candidate queue. Size: ${this.iceCandidateQueue.length}`);
    while (this.iceCandidateQueue.length > 0) {
      const candidate = this.iceCandidateQueue.shift();
      if (candidate) {
        try {
          await pc.addIceCandidate(candidate);
          console.log(`[WebRTCService] Successfully added queued ICE candidate.`);
        } catch (e) {
          console.error(`[WebRTCService] Error adding queued ICE candidate:`, e);
        }
      }
    }
  }

  public async handleOffer(offer: any): Promise<TRTCSessionDescription> {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    await this.processIceCandidateQueue();
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  public async handleAnswer(answer: any): Promise<void> {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    await this.processIceCandidateQueue();
  }

  public async addIceCandidate(candidate: any): Promise<void> {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    const pc = this.peerConnection as any;
    
    const hasRemoteDesc = pc.remoteDescription || pc.currentRemoteDescription;
    
    console.log(`[WebRTCService] addIceCandidate. hasRemoteDesc: ${!!hasRemoteDesc}`);

    if (!hasRemoteDesc) {
      console.log(`[WebRTCService] Queueing ICE candidate because remote description is null.`);
      this.iceCandidateQueue.push(new RTCIceCandidate(candidate));
      return;
    }
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
      console.log(`[WebRTCService] Successfully added ICE candidate.`);
    } catch (e) {
      console.error(`[WebRTCService] Error adding ICE candidate:`, e);
    }
  }

  public toggleMute(isMuted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track: any) => {
        track.enabled = !isMuted;
      });
    }
  }

  public cleanup(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track: any) => track.stop());
      this.localStream = null;
    }
    
    this.remoteStream = new MediaStream();
    this.iceCandidateQueue = [];

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}

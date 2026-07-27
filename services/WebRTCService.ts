// services/WebRTCService.ts

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from "react-native-webrtc";

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  public localStream: MediaStream | null = null;
  public remoteStream: MediaStream | null = null;

  private onIceCandidateCallback?: (candidate: RTCIceCandidate) => void;
  private onRemoteStreamCallback?: (stream: MediaStream) => void;

  private iceCandidateQueue: RTCIceCandidate[] = [];

  constructor() {
    this.remoteStream = new MediaStream();
  }

  public setCallbacks(
    onIceCandidate: (candidate: RTCIceCandidate) => void,
    onRemoteStream: (stream: MediaStream) => void
  ) {
    this.onIceCandidateCallback = onIceCandidate;
    this.onRemoteStreamCallback = onRemoteStream;
  }

  public async setupLocalStream(): Promise<MediaStream> {
    const isFront = true;
    const devices = await mediaDevices.enumerateDevices();
    
    // We only need audio for voice calls
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    
    this.localStream = stream as MediaStream;
    return this.localStream;
  }

  public createPeerConnection(): RTCPeerConnection {
    const configuration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };

    this.peerConnection = new RTCPeerConnection(configuration);

    (this.peerConnection as any).onicecandidate = (event: any) => {
      if (event.candidate && this.onIceCandidateCallback) {
        this.onIceCandidateCallback(event.candidate);
      }
    };

    (this.peerConnection as any).ontrack = (event: any) => {
      if (event.track && this.remoteStream) {
        this.remoteStream.addTrack(event.track);
        if (this.onRemoteStreamCallback) {
          this.onRemoteStreamCallback(this.remoteStream);
        }
      }
    };

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        if (this.localStream) {
            this.peerConnection?.addTrack(track, this.localStream);
        }
      });
    }

    return this.peerConnection;
  }

  public async createOffer(): Promise<RTCSessionDescription> {
    if (!this.peerConnection) throw new Error("PeerConnection not initialized");
    const offer = await this.peerConnection.createOffer({});
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  private async processIceCandidateQueue(): Promise<void> {
    const hasRemoteDesc = this.peerConnection?.remoteDescription || (this.peerConnection as any)?.currentRemoteDescription;
    if (!this.peerConnection || !hasRemoteDesc) return;
    
    console.log(`[WebRTCService] Processing ICE candidate queue. Size: ${this.iceCandidateQueue.length}`);
    while (this.iceCandidateQueue.length > 0) {
      const candidate = this.iceCandidateQueue.shift();
      if (candidate) {
        try {
          await this.peerConnection.addIceCandidate(candidate);
          console.log(`[WebRTCService] Successfully added queued ICE candidate.`);
        } catch (e) {
          console.error(`[WebRTCService] Error adding queued ICE candidate:`, e);
        }
      }
    }
  }

  public async handleOffer(offer: any): Promise<RTCSessionDescription> {
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
    
    // In react-native-webrtc, currentRemoteDescription might be needed or remoteDescription
    const hasRemoteDesc = this.peerConnection.remoteDescription || (this.peerConnection as any).currentRemoteDescription;
    
    console.log(`[WebRTCService] addIceCandidate. hasRemoteDesc: ${!!hasRemoteDesc}`);

    if (!hasRemoteDesc) {
      console.log(`[WebRTCService] Queueing ICE candidate because remote description is null.`);
      this.iceCandidateQueue.push(new RTCIceCandidate(candidate));
      return;
    }
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log(`[WebRTCService] Successfully added ICE candidate.`);
    } catch (e) {
      console.error(`[WebRTCService] Error adding ICE candidate:`, e);
    }
  }

  public toggleMute(isMuted: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }

  public cleanup(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    
    // We intentionally don't do new MediaStream() right away so that
    // old remote streams are cleared completely.
    this.remoteStream = new MediaStream();
    this.iceCandidateQueue = [];

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}

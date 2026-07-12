// contexts/CallContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "expo-router";
import { BASE_URL } from "../constants/config.constants";
import { useAuth } from "./AuthContext";
import { CallState } from "../enums/CallState";
import { CallEvents } from "../enums/CallEvents";
import { WebRTCService } from "../services/WebRTCService";
import { ICallParticipantDTO } from "../types/call";
import IncomingCallModal from "../components/call/IncomingCallModal";

interface CallContextType {
  callState: CallState;
  activeCallData: ICallParticipantDTO | null;
  isMuted: boolean;
  isSpeakerOn: boolean;
  startCall: (calleeId: string, calleeName: string, calleeImage?: string) => void;
  acceptCall: () => void;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const router = useRouter();

  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [activeCallData, setActiveCallData] = useState<ICallParticipantDTO | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const webrtcServiceRef = useRef<WebRTCService>(new WebRTCService());
  const webrtcService = webrtcServiceRef.current;

  // Track if we are the caller to know how to handle connection
  const isCallerRef = useRef<boolean>(false);

  const callStateRef = useRef<CallState>(callState);
  const activeCallDataRef = useRef<ICallParticipantDTO | null>(activeCallData);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  useEffect(() => {
    activeCallDataRef.current = activeCallData;
  }, [activeCallData]);

  // Initialize Socket.IO connection for /call namespace
  useEffect(() => {
    if (!user?._id || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(`${BASE_URL}/call`, {
      transports: ["websocket"],
      autoConnect: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("user:join", { userId: user._id });
    });

    // Handle Incoming Call
    socket.on(CallEvents.INCOMING, (payload: any) => {
      if (callStateRef.current !== CallState.IDLE) {
        // We are already in a call, maybe auto-decline with busy signal? (YAGNI for now, just ignore or decline)
        socket.emit(CallEvents.DECLINED, { callerId: payload.caller.userId, calleeId: user._id });
        return;
      }
      isCallerRef.current = false;
      setActiveCallData(payload.caller);
      setCallState(CallState.INCOMING);
    });

    // Handle Call Accepted
    socket.on(CallEvents.ACCEPTED, async (payload: any) => {
      if (!isCallerRef.current) return;
      setCallState(CallState.CONNECTING);
      try {
        const offer = await webrtcService.createOffer();
        socket.emit(CallEvents.WEBRTC_OFFER, {
          callerId: user._id,
          calleeId: payload.calleeId,
          offer,
        });
      } catch (err) {
        console.error("Failed to create offer", err);
        socket.emit(CallEvents.ENDED, { callerId: user._id, calleeId: payload.calleeId });
        setCallState(CallState.IDLE);
        setActiveCallData(null);
        webrtcService.cleanup();
      }
    });

    // Handle Call Declined
    socket.on(CallEvents.DECLINED, () => {
      setCallState(CallState.IDLE);
      setActiveCallData(null);
      webrtcService.cleanup();
      if (router.canGoBack()) {
         router.back();
      }
    });

    // Handle Call Ended
    socket.on(CallEvents.ENDED, () => {
      setCallState(CallState.IDLE);
      setActiveCallData(null);
      webrtcService.cleanup();
      // If we are on the call screen, go back
      if (router.canGoBack()) {
          // Wait, router.back might pop incorrectly if we are not on call screen, but typically we are
          // A more robust way is to just push to index, or handle in the CallScreen component itself via useEffect
      }
    });

    // WebRTC Signalling
    socket.on(CallEvents.WEBRTC_OFFER, async (payload: any) => {
      try {
        const answer = await webrtcService.handleOffer(payload.offer);
        socket.emit(CallEvents.WEBRTC_ANSWER, {
          callerId: payload.callerId,
          calleeId: user._id,
          answer,
        });
        setCallState(CallState.CONNECTED);
      } catch (err) {
        console.error("Failed to handle offer", err);
      }
    });

    socket.on(CallEvents.WEBRTC_ANSWER, async (payload: any) => {
      try {
        await webrtcService.handleAnswer(payload.answer);
        setCallState(CallState.CONNECTED);
      } catch (err) {
        console.error("Failed to handle answer", err);
      }
    });

    socket.on(CallEvents.WEBRTC_ICE_CANDIDATE, async (payload: any) => {
      try {
        await webrtcService.addIceCandidate(payload.candidate);
      } catch (err) {
        console.error("Failed to add ice candidate", err);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?._id, token]);

  // Setup WebRTC callbacks
  useEffect(() => {
    webrtcService.setCallbacks(
      (candidate) => {
        if (!socketRef.current || !activeCallData) return;
        socketRef.current.emit(CallEvents.WEBRTC_ICE_CANDIDATE, {
          callerId: isCallerRef.current ? user?._id : activeCallData.userId,
          calleeId: isCallerRef.current ? activeCallData.userId : user?._id,
          candidate,
        });
      },
      (stream) => {
        // remote stream added
        console.log("Remote stream added");
      }
    );
  }, [activeCallData, user?._id]);

  const startCall = useCallback(async (calleeId: string, calleeName: string, calleeImage?: string) => {
    if (!socketRef.current || !user) return;
    isCallerRef.current = true;
    const callee: ICallParticipantDTO = { userId: calleeId, name: calleeName, profileImage: calleeImage };
    setActiveCallData(callee);
    setCallState(CallState.OUTGOING);
    
    try {
      await webrtcService.setupLocalStream();
      webrtcService.createPeerConnection();
      
      socketRef.current.emit(CallEvents.START, {
        caller: { userId: user._id, name: user.name },
        calleeId,
      });

      // Navigate to Call Screen
      router.push(`/call/${calleeId}`);
    } catch (err) {
      console.error("Failed to start call", err);
      setCallState(CallState.IDLE);
      setActiveCallData(null);
    }
  }, [user]);

  const acceptCall = useCallback(async () => {
    if (!socketRef.current || !user || !activeCallData) return;
    
    try {
      await webrtcService.setupLocalStream();
      webrtcService.createPeerConnection();

      setCallState(CallState.CONNECTING);
      
      socketRef.current.emit(CallEvents.ACCEPTED, {
        callerId: activeCallData.userId,
        calleeId: user._id,
      });

      // Navigate to call screen
      router.push(`/call/${activeCallData.userId}`);
    } catch (err) {
      console.error("Failed to accept call", err);
      endCall();
    }
  }, [activeCallData, user]);

  const declineCall = useCallback(() => {
    if (!socketRef.current || !user || !activeCallData) return;
    socketRef.current.emit(CallEvents.DECLINED, {
      callerId: activeCallData.userId,
      calleeId: user._id,
    });
    setCallState(CallState.IDLE);
    setActiveCallData(null);
  }, [activeCallData, user]);

  const endCall = useCallback(() => {
    if (!socketRef.current || !user || !activeCallData) return;
    socketRef.current.emit(CallEvents.ENDED, {
      callerId: isCallerRef.current ? user._id : activeCallData.userId,
      calleeId: isCallerRef.current ? activeCallData.userId : user._id,
    });
    
    setCallState(CallState.IDLE);
    setActiveCallData(null);
    webrtcService.cleanup();
  }, [activeCallData, user]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      webrtcService.toggleMute(next);
      return next;
    });
  }, []);

  const toggleSpeaker = useCallback(() => {
    // Requires react-native-incall-manager or specific WebRTC setup, simple mock for now
    setIsSpeakerOn((prev) => !prev);
  }, []);

  return (
    <CallContext.Provider
      value={{
        callState,
        activeCallData,
        isMuted,
        isSpeakerOn,
        startCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMute,
        toggleSpeaker,
      }}
    >
      {children}
      {/* Global Incoming Call Modal */}
      {callState === CallState.INCOMING && activeCallData && (
        <IncomingCallModal
          callerName={activeCallData.name}
          callerImage={activeCallData.profileImage}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}
    </CallContext.Provider>
  );
}

export const useCall = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
};

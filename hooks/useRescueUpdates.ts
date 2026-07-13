import { useEffect, useCallback, useRef } from "react";
import { useSocket } from "../contexts/SocketContext";
import { useNotification } from "../contexts/NotificationContext";

interface Report {
  caseId: string;
  status: string;
  [key: string]: any;
}

export const useRescueUpdates = (
  report: Report | null,
  onStatusUpdate?: (updatedReport: Report) => void
) => {
  const { socket } = useSocket();
  const { addNotification } = useNotification();
  const reportRef = useRef(report);

  useEffect(() => {
    reportRef.current = report;
  }, [report]);

  useEffect(() => {
    if (!socket || !report?.caseId) {
      return;
    }

    const joinRoom = () => {
      socket.emit("join_rescue", { caseId: report.caseId });
      console.log(`[SOCKET] Joined rescue room for case: ${report.caseId}`);
    };

    // Join room when socket connects
    if (socket.connected) {
      joinRoom();
    } else {
      socket.on("connect", joinRoom);
    }

    // Listen for status updates
    const handleStatusUpdate = (data: any) => {
      console.log(`[SOCKET] Status update received:`, data);

      if (reportRef.current) {
        const updatedReport = {
          ...reportRef.current,
          status: data.status,
          timeline: data.timeline || reportRef.current.timeline,
        };

        reportRef.current = updatedReport;

        // Notify callback (for map re-render)
        if (onStatusUpdate) {
          onStatusUpdate(updatedReport);
        }

        // Show notification
        const statusMessages: { [key: string]: string } = {
          "Needs Help": "Case reported and needs help",
          "Under Rescue": "A rescuer is on the way",
          Treated: "Your animal is being treated",
          "Ready for Adoption": "Animal is ready for adoption",
        };

        const message = statusMessages[data.status] || `Status: ${data.status}`;
        addNotification({
          _id: `${Date.now()}`,
          userId: "",
          title: "Case Status Update",
          message: message,
          type: "info",
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    };

    const handleLocationUpdate = (data: any) => {
      console.log(`[SOCKET] Location update received:`, data);
      if (onStatusUpdate && reportRef.current) {
        const updatedReport = {
          ...reportRef.current,
          rescuerLocation: data.location,
        };
        onStatusUpdate(updatedReport);
      }
    };

    const handleRescueAssigned = (data: any) => {
      console.log(`[SOCKET] Rescue assigned:`, data);
      addNotification({
        _id: `${Date.now()}`,
        userId: "",
        title: "Rescuer Assigned",
        message: `${data.rescuerName} has accepted your case`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString(),
      });
    };

    const handleRescueBroadcast = (data: any) => {
      console.log(`[SOCKET] Broadcast message:`, data);
      addNotification({
        _id: `${Date.now()}`,
        userId: "",
        title: data.title || "Update",
        message: data.message,
        type: data.type || "info",
        read: false,
        createdAt: new Date().toISOString(),
      });
    };

    socket.on("status_update", handleStatusUpdate);
    socket.on("location_update", handleLocationUpdate);
    socket.on("rescue_assigned", handleRescueAssigned);
    socket.on("rescue_broadcast", handleRescueBroadcast);

    return () => {
      socket.off("status_update", handleStatusUpdate);
      socket.off("location_update", handleLocationUpdate);
      socket.off("rescue_assigned", handleRescueAssigned);
      socket.off("rescue_broadcast", handleRescueBroadcast);

      // Leave room when component unmounts
      if (report?.caseId) {
        socket.emit("leave_rescue", { caseId: report.caseId });
      }
    };
  }, [socket, report?.caseId, onStatusUpdate, addNotification]);
};

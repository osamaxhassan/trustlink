// Holds the live Socket.io instance to be used across services and controllers
let ioInstance = null;

export const setIO = (io) => {
  ioInstance = io;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io instance has not been initialized.');
  }
  return ioInstance;
};

// Send event to specific user room (e.g., user_5)
export const emitToUser = (userId, event, payload) => {
  if (ioInstance) {
    ioInstance.to(`user_${userId}`).emit(event, payload);
  }
};

// Send event to all participants of a job
export const emitToJobRoom = (jobId, event, payload) => {
  if (ioInstance) {
    ioInstance.to(`job_${jobId}`).emit(event, payload);
  }
};
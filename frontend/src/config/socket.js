import socket from 'socket.io-client';

let socketInstance = null;
let isConnected = false;
let messageQueue = [];

export const initializeSocket = (projectId) => {
    return new Promise((resolve, reject) => {
        try {
            // Disconnect existing socket if any
            if (socketInstance) {
                socketInstance.disconnect();
                socketInstance = null;
                isConnected = false;
            }

            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            
            socketInstance = socket(apiUrl, {
                auth: {
                    token: localStorage.getItem('token')
                },
                query: {
                    projectId
                },
                transports: ['websocket', 'polling'], // Fallback transports
                timeout: 10000,
                forceNew: true
            });

            // Add connection event listeners
            socketInstance.on('connect', () => {
                console.log('✅ Socket connected:', socketInstance.id);
                isConnected = true;
                
                // Process any queued messages
                while (messageQueue.length > 0) {
                    const { eventName, data } = messageQueue.shift();
                    socketInstance.emit(eventName, data);
                    console.log('📤 Sent queued message:', eventName);
                }
                
                resolve(socketInstance);
            });

            socketInstance.on('connect_error', (error) => {
                console.error('❌ Socket connection error:', error);
                isConnected = false;
                reject(error);
            });

            socketInstance.on('disconnect', (reason) => {
                console.log('🔌 Socket disconnected:', reason);
                isConnected = false;
            });

            // Set a timeout for connection
            setTimeout(() => {
                if (!isConnected) {
                    console.warn('⚠️ Socket connection timeout');
                    reject(new Error('Socket connection timeout'));
                }
            }, 10000);

        } catch (error) {
            console.error('❌ Failed to initialize socket:', error);
            reject(error);
        }
    });
}

export const receiveMessage = (eventName, cb) => {
    if (socketInstance && typeof socketInstance.on === 'function') {
        socketInstance.on(eventName, cb);
    } else {
        console.warn('Socket not initialized or invalid when trying to receive message:', eventName);
    }
}

export const sendMessage = (eventName, data) => {
    if (socketInstance && typeof socketInstance.emit === 'function' && isConnected) {
        socketInstance.emit(eventName, data);
        console.log('📤 Message sent:', eventName);
    } else if (socketInstance && !isConnected) {
        // Queue the message if socket exists but not connected yet
        messageQueue.push({ eventName, data });
        console.log('📥 Message queued (socket not connected):', eventName);
    } else {
        console.warn('⚠️ Socket not initialized when trying to send message:', eventName);
    }
}

export const disconnectSocket = () => {
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        isConnected = false;
        messageQueue = []; // Clear any queued messages
        console.log('🔌 Socket disconnected and cleaned up');
    }
}

// Export function to check connection status
export const isSocketConnected = () => {
    return socketInstance && isConnected;
}
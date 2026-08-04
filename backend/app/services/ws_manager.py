import logging
from typing import List
from fastapi import WebSocket
from datetime import datetime

logger = logging.getLogger("auto_cold_mailer")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info("WebSocket client disconnected.")

    async def broadcast(self, message: dict):
        if "timestamp" not in message:
            message["timestamp"] = datetime.now().strftime("%H:%M:%S")
            
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.warning(f"Error sending message to WebSocket client: {e}")
                disconnected.append(connection)
                
        for conn in disconnected:
            self.disconnect(conn)

ws_manager = ConnectionManager()

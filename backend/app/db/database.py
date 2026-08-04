import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

try:
    import certifi
    ca_file = certifi.where()
except ImportError:
    ca_file = None

logger = logging.getLogger("auto_cold_mailer")

class Database:
    client: Optional[AsyncIOMotorClient] = None
    db = None
    is_connected: bool = False
    _memory_applications: Dict[int, Dict[str, Any]] = {}
    
    async def connect(self):
        uri = settings.MONGODB_URI.strip('"').strip("'")
        
        client_kwargs = {
            "serverSelectionTimeoutMS": 8000,
            "connectTimeoutMS": 10000
        }
        
        # Attach SSL CA certificates if using cloud SSL / MongoDB Atlas
        if ca_file and ("mongodb+srv://" in uri or "ssl=true" in uri.lower() or "tls=true" in uri.lower()):
            client_kwargs["tlsCAFile"] = ca_file

        try:
            logger.info(f"Connecting to MongoDB database at {uri.split('@')[-1] if '@' in uri else 'localhost'}...")
            self.client = AsyncIOMotorClient(uri, **client_kwargs)
            
            # Test connection with ping
            await self.client.admin.command('ping')
            self.db = self.client[settings.DATABASE_NAME]
            self.is_connected = True
            logger.info(f"Successfully connected to MongoDB Atlas / Database '{settings.DATABASE_NAME}'.")
        except Exception as e:
            self.is_connected = False
            logger.warning(f"Could not connect to MongoDB Atlas ({e}). Falling back to in-memory async store.")

    async def close(self):
        if self.client:
            self.client.close()
            logger.info("Closed MongoDB connection.")

    async def insert_applications(self, apps: List[Dict[str, Any]]) -> int:
        now = datetime.now(timezone.utc).isoformat()
        count = 0
        for app in apps:
            app["createdAt"] = now
            app["updatedAt"] = now
            app["status"] = "Pending"
            app["subject"] = app.get("subject", "")
            app["emailBody"] = app.get("emailBody", "")
            app["error"] = app.get("error", "")
            app["sentAt"] = None
            
            app_id = app["applicationId"]
            self._memory_applications[app_id] = dict(app)
            
            if self.is_connected and self.db is not None:
                try:
                    await self.db.applications.update_one(
                        {"applicationId": app_id},
                        {"$set": app},
                        upsert=True
                    )
                except Exception as ex:
                    logger.error(f"MongoDB write error for {app_id}: {ex}")
            count += 1
        return count

    async def update_application(self, app_id: int, updates: Dict[str, Any]):
        updates["updatedAt"] = datetime.now(timezone.utc).isoformat()
        if app_id in self._memory_applications:
            self._memory_applications[app_id].update(updates)
            
        if self.is_connected and self.db is not None:
            try:
                await self.db.applications.update_one(
                    {"applicationId": app_id},
                    {"$set": updates}
                )
            except Exception as ex:
                logger.error(f"MongoDB update error for {app_id}: {ex}")

    async def get_all_applications(self) -> List[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            try:
                cursor = self.db.applications.find({}, {"_id": 0}).sort("applicationId", 1)
                results = await cursor.to_list(length=1000)
                if results:
                    return results
            except Exception as e:
                logger.error(f"Error fetching applications from MongoDB: {e}")
        
        # Fallback to memory store sorted by applicationId
        return [self._memory_applications[k] for k in sorted(self._memory_applications.keys())]

    async def get_application_by_id(self, app_id: int) -> Optional[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            try:
                result = await self.db.applications.find_one({"applicationId": app_id}, {"_id": 0})
                if result:
                    return result
            except Exception as e:
                logger.error(f"Error fetching app {app_id} from MongoDB: {e}")
                
        return self._memory_applications.get(app_id)

    async def clear_applications(self):
        self._memory_applications.clear()
        if self.is_connected and self.db is not None:
            try:
                await self.db.applications.delete_many({})
            except Exception as e:
                logger.error(f"Error clearing applications from MongoDB: {e}")

db = Database()

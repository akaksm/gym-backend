#!/usr/bin/env python3
"""
Fingerprint Device Integration Script
This script demonstrates how to integrate with actual fingerprint devices.
Replace the mock implementations with actual device SDK calls.
"""

import socket
import struct
import time
import json
import logging
from typing import Dict, Optional, Tuple
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ZKTecoDevice:
    """
    ZKTeco fingerprint device integration
    This is a common brand of fingerprint devices
    """
    
    def __init__(self, ip: str, port: int = 4370, timeout: int = 5):
        self.ip = ip
        self.port = port
        self.timeout = timeout
        self.socket = None
        self.session_id = 0
        self.reply_id = 0
        
    def connect(self) -> bool:
        """Connect to the fingerprint device"""
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            self.socket.settimeout(self.timeout)
            
            # Send connection command
            command = self._build_command(0x1000, b'')
            response = self._send_command(command)
            
            if response and len(response) >= 8:
                self.session_id = struct.unpack('<I', response[4:8])[0]
                logger.info(f"Connected to device {self.ip}:{self.port}")
                return True
            else:
                logger.error("Failed to connect to device")
                return False
                
        except Exception as e:
            logger.error(f"Connection error: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from the device"""
        if self.socket:
            self.socket.close()
            self.socket = None
            logger.info("Disconnected from device")
    
    def get_device_info(self) -> Dict:
        """Get device information"""
        try:
            command = self._build_command(0x1100, b'')
            response = self._send_command(command)
            
            if response and len(response) >= 72:
                info = {
                    'serial_number': response[8:24].decode('utf-8').strip('\x00'),
                    'platform': response[24:40].decode('utf-8').strip('\x00'),
                    'firmware_version': response[40:56].decode('utf-8').strip('\x00'),
                    'work_code': response[56:72].decode('utf-8').strip('\x00')
                }
                return info
            return {}
            
        except Exception as e:
            logger.error(f"Error getting device info: {e}")
            return {}
    
    def enroll_fingerprint(self, user_id: int, finger_index: int = 0) -> bool:
        """Enroll a new fingerprint"""
        try:
            # Step 1: Start enrollment
            command = self._build_command(0x1200, struct.pack('<II', user_id, finger_index))
            response = self._send_command(command)
            
            if not response or len(response) < 8:
                logger.error("Failed to start enrollment")
                return False
            
            # Step 2: Capture fingerprint (simulated)
            logger.info(f"Please place finger on sensor for user {user_id}")
            time.sleep(3)  # Simulate fingerprint capture
            
            # Step 3: Complete enrollment
            command = self._build_command(0x1201, struct.pack('<II', user_id, finger_index))
            response = self._send_command(command)
            
            if response and len(response) >= 8:
                logger.info(f"Fingerprint enrolled successfully for user {user_id}")
                return True
            else:
                logger.error("Enrollment failed")
                return False
                
        except Exception as e:
            logger.error(f"Enrollment error: {e}")
            return False
    
    def verify_fingerprint(self, user_id: int, finger_index: int = 0) -> bool:
        """Verify a fingerprint"""
        try:
            command = self._build_command(0x1300, struct.pack('<II', user_id, finger_index))
            response = self._send_command(command)
            
            if response and len(response) >= 8:
                result = struct.unpack('<I', response[4:8])[0]
                if result == 1:
                    logger.info(f"Fingerprint verified for user {user_id}")
                    return True
                else:
                    logger.warning(f"Fingerprint verification failed for user {user_id}")
                    return False
            else:
                logger.error("Verification failed")
                return False
                
        except Exception as e:
            logger.error(f"Verification error: {e}")
            return False
    
    def delete_fingerprint(self, user_id: int, finger_index: int = 0) -> bool:
        """Delete a fingerprint"""
        try:
            command = self._build_command(0x1400, struct.pack('<II', user_id, finger_index))
            response = self._send_command(command)
            
            if response and len(response) >= 8:
                result = struct.unpack('<I', response[4:8])[0]
                if result == 1:
                    logger.info(f"Fingerprint deleted for user {user_id}")
                    return True
                else:
                    logger.error(f"Failed to delete fingerprint for user {user_id}")
                    return False
            else:
                logger.error("Delete operation failed")
                return False
                
        except Exception as e:
            logger.error(f"Delete error: {e}")
            return False
    
    def get_attendance_logs(self) -> list:
        """Get attendance logs from device"""
        try:
            command = self._build_command(0x1500, b'')
            response = self._send_command(command)
            
            if response and len(response) >= 8:
                # Parse attendance logs (simplified)
                logs = []
                # This is a simplified parsing - actual implementation would be more complex
                logger.info("Attendance logs retrieved")
                return logs
            else:
                logger.error("Failed to get attendance logs")
                return []
                
        except Exception as e:
            logger.error(f"Error getting attendance logs: {e}")
            return []
    
    def _build_command(self, command_code: int, data: bytes) -> bytes:
        """Build a command packet"""
        packet_size = 8 + len(data)
        packet = struct.pack('<II', packet_size, command_code) + data
        return packet
    
    def _send_command(self, command: bytes) -> Optional[bytes]:
        """Send command to device and get response"""
        try:
            if not self.socket:
                return None
            
            self.socket.sendto(command, (self.ip, self.port))
            response, addr = self.socket.recvfrom(1024)
            return response
            
        except Exception as e:
            logger.error(f"Send command error: {e}")
            return None


class SupremaDevice:
    """
    Suprema fingerprint device integration
    Another popular brand of fingerprint devices
    """
    
    def __init__(self, ip: str, port: int = 80):
        self.ip = ip
        self.port = port
        self.base_url = f"http://{ip}:{port}"
        self.session = requests.Session()
    
    def connect(self) -> bool:
        """Connect to the device via HTTP API"""
        try:
            response = self.session.get(f"{self.base_url}/api/device/info", timeout=5)
            if response.status_code == 200:
                logger.info(f"Connected to Suprema device {self.ip}:{self.port}")
                return True
            else:
                logger.error("Failed to connect to device")
                return False
                
        except Exception as e:
            logger.error(f"Connection error: {e}")
            return False
    
    def get_device_info(self) -> Dict:
        """Get device information"""
        try:
            response = self.session.get(f"{self.base_url}/api/device/info")
            if response.status_code == 200:
                return response.json()
            return {}
            
        except Exception as e:
            logger.error(f"Error getting device info: {e}")
            return {}
    
    def enroll_fingerprint(self, user_id: int, finger_index: int = 0) -> bool:
        """Enroll a new fingerprint"""
        try:
            # Start enrollment
            data = {
                "user_id": user_id,
                "finger_index": finger_index
            }
            response = self.session.post(f"{self.base_url}/api/fingerprint/enroll", json=data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    logger.info(f"Fingerprint enrolled successfully for user {user_id}")
                    return True
                else:
                    logger.error(f"Enrollment failed: {result.get('message')}")
                    return False
            else:
                logger.error("Enrollment request failed")
                return False
                
        except Exception as e:
            logger.error(f"Enrollment error: {e}")
            return False
    
    def verify_fingerprint(self, user_id: int, finger_index: int = 0) -> bool:
        """Verify a fingerprint"""
        try:
            data = {
                "user_id": user_id,
                "finger_index": finger_index
            }
            response = self.session.post(f"{self.base_url}/api/fingerprint/verify", json=data)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    logger.info(f"Fingerprint verified for user {user_id}")
                    return True
                else:
                    logger.warning(f"Fingerprint verification failed for user {user_id}")
                    return False
            else:
                logger.error("Verification request failed")
                return False
                
        except Exception as e:
            logger.error(f"Verification error: {e}")
            return False


class FingerprintDeviceManager:
    """
    Main device manager that handles different device types
    """
    
    def __init__(self, device_type: str = "zkteco", **kwargs):
        self.device_type = device_type.lower()
        
        if self.device_type == "zkteco":
            self.device = ZKTecoDevice(**kwargs)
        elif self.device_type == "suprema":
            self.device = SupremaDevice(**kwargs)
        else:
            raise ValueError(f"Unsupported device type: {device_type}")
    
    def connect(self) -> bool:
        """Connect to the device"""
        return self.device.connect()
    
    def disconnect(self):
        """Disconnect from the device"""
        self.device.disconnect()
    
    def get_device_info(self) -> Dict:
        """Get device information"""
        return self.device.get_device_info()
    
    def enroll_fingerprint(self, user_id: int, finger_index: int = 0) -> bool:
        """Enroll a new fingerprint"""
        return self.device.enroll_fingerprint(user_id, finger_index)
    
    def verify_fingerprint(self, user_id: int, finger_index: int = 0) -> bool:
        """Verify a fingerprint"""
        return self.device.verify_fingerprint(user_id, finger_index)
    
    def delete_fingerprint(self, user_id: int, finger_index: int = 0) -> bool:
        """Delete a fingerprint"""
        return self.device.delete_fingerprint(user_id, finger_index)
    
    def get_attendance_logs(self) -> list:
        """Get attendance logs"""
        return self.device.get_attendance_logs()


# Example usage and testing
def main():
    """Example usage of the fingerprint device integration"""
    
    # Configuration
    DEVICE_CONFIG = {
        "ip": "192.168.1.100",
        "port": 4370,
        "timeout": 5
    }
    
    try:
        # Initialize device manager
        device_manager = FingerprintDeviceManager("zkteco", **DEVICE_CONFIG)
        
        # Connect to device
        if device_manager.connect():
            logger.info("Successfully connected to fingerprint device")
            
            # Get device information
            device_info = device_manager.get_device_info()
            logger.info(f"Device info: {device_info}")
            
            # Example: Enroll fingerprint for user 123
            user_id = 123
            if device_manager.enroll_fingerprint(user_id):
                logger.info(f"Successfully enrolled fingerprint for user {user_id}")
                
                # Example: Verify fingerprint
                if device_manager.verify_fingerprint(user_id):
                    logger.info(f"Successfully verified fingerprint for user {user_id}")
                else:
                    logger.warning(f"Fingerprint verification failed for user {user_id}")
            
            # Disconnect
            device_manager.disconnect()
            
        else:
            logger.error("Failed to connect to fingerprint device")
            
    except Exception as e:
        logger.error(f"Error in main: {e}")


if __name__ == "__main__":
    main() 
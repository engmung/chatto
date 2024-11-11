# 전역 설정
DEBUG_MODE = False  # GUI 및 디버그 정보 표시 여부

import cv2
import mediapipe as mp
import numpy as np
from datetime import datetime
import json
import asyncio
import websockets
import time

def nothing(x):
    pass

class SimpleDetectionServer:
    def __init__(self, host='localhost', port=12345):
        # 기본 설정
        self.host = host
        self.port = port
        self.is_running = True
        self.connected_clients = set()
        self.viewer_present = False
        self.last_presence_time = datetime.now()
        self.fps = 0
        self.fps_time = time.time()
        self.fps_counter = 0

        print("[Setup] MediaPipe 초기화 중...")
        
        # MediaPipe 설정
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils
        
        self.pose = self.mp_pose.Pose(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
            model_complexity=0  # Lite 모델 사용
        )

        print("[Setup] MediaPipe 초기화 완료")

        # GUI 설정 (디버그 모드일 때만)
        if DEBUG_MODE:
            cv2.namedWindow('Controls')
            cv2.createTrackbar('Shoulder Width (%)', 'Controls', 20, 100, nothing)
            cv2.createTrackbar('Presence Timeout (s)', 'Controls', 2, 10, nothing)

    def get_parameters(self):
        """GUI 또는 기본 파라미터 값 반환"""
        if DEBUG_MODE:
            return {
                'shoulder_width': cv2.getTrackbarPos('Shoulder Width (%)', 'Controls') / 100.0,
                'presence_timeout': cv2.getTrackbarPos('Presence Timeout (s)', 'Controls')
            }
        else:
            return {
                'shoulder_width': 0.2,
                'presence_timeout': 2.0
            }

    def detect_viewer(self, frame):
        """가장 가까운 관람객 감지"""
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(frame_rgb)

        if not results.pose_landmarks:
            return False, None

        height, width = frame.shape[:2]
        params = self.get_parameters()

        # 어깨 너비 계산
        landmarks = results.pose_landmarks.landmark
        left_shoulder = landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER]
        right_shoulder = landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER]
        shoulder_width = abs(left_shoulder.x - right_shoulder.x)

        if DEBUG_MODE:
            # 어깨 표시
            left_pos = (int(left_shoulder.x * width), int(left_shoulder.y * height))
            right_pos = (int(right_shoulder.x * width), int(right_shoulder.y * height))
            color = (0, 255, 0) if shoulder_width > params['shoulder_width'] else (0, 0, 255)
            cv2.line(frame, left_pos, right_pos, color, 2)
            cv2.putText(frame, f"Width: {shoulder_width:.2f}", 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

        return shoulder_width > params['shoulder_width'], results.pose_landmarks

    def update_presence(self, is_detected):
        """관람객 presence 상태 업데이트"""
        current_time = datetime.now()
        previous_state = self.viewer_present
        params = self.get_parameters()

        if is_detected:
            self.last_presence_time = current_time
            if not self.viewer_present:
                self.viewer_present = True
                return True
        elif self.viewer_present:
            if (current_time - self.last_presence_time).total_seconds() > params['presence_timeout']:
                self.viewer_present = False
                return True
                
        return previous_state != self.viewer_present

    def calculate_fps(self):
        """FPS 계산"""
        self.fps_counter += 1
        current_time = time.time()
        if current_time - self.fps_time >= 1.0:
            self.fps = self.fps_counter
            self.fps_counter = 0
            self.fps_time = current_time

    async def handle_client(self, websocket):
        """클라이언트 연결 처리"""
        print(f"[Server] 클라이언트 연결됨")
        self.connected_clients.add(websocket)
        
        try:
            while self.is_running:
                try:
                    await websocket.recv()
                except websockets.exceptions.ConnectionClosed:
                    break
                except Exception as e:
                    print(f"[Error] 클라이언트 통신 오류: {e}")
                    break
        finally:
            self.connected_clients.remove(websocket)
            print("[Server] 클라이언트 연결 종료")

    async def broadcast(self, message):
        """모든 연결된 클라이언트에게 메시지 전송"""
        if self.connected_clients:
            disconnected_clients = set()
            for client in self.connected_clients:
                try:
                    await client.send(json.dumps(message))
                except:
                    disconnected_clients.add(client)
            
            self.connected_clients -= disconnected_clients

    async def process_camera(self):
        """카메라 처리"""
        cap = cv2.VideoCapture(0)
        
        # 카메라 설정
        cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'MJPG'))
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv2.CAP_PROP_FPS, 30)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        print("[Camera] 카메라 스트림 시작")
        
        if not cap.isOpened():
            print("[Error] 카메라를 열 수 없습니다")
            return

        frame_count = 0
        
        try:
            while self.is_running:
                # 프레임 스킵
                frame_count += 1
                if frame_count % 2 == 0:
                    cap.grab()
                    continue

                ret, frame = cap.read()
                if not ret:
                    continue

                # 프레임 처리
                is_present, landmarks = self.detect_viewer(frame)
                presence_changed = self.update_presence(is_present)

                if presence_changed:
                    await self.broadcast({
                        "viewer_present": self.viewer_present,
                        "timestamp": datetime.now().isoformat()
                    })

                if DEBUG_MODE:
                    # FPS 계산 및 표시
                    self.calculate_fps()
                    cv2.putText(frame, f"FPS: {self.fps}", 
                               (frame.shape[1] - 100, frame.shape[0] - 20), 
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                    
                    # Presence 상태 표시
                    if self.viewer_present:
                        params = self.get_parameters()
                        time_left = params['presence_timeout'] - (datetime.now() - self.last_presence_time).total_seconds()
                        cv2.putText(frame, f"Presence: {time_left:.1f}s",
                                  (10, frame.shape[0] - 20), 
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                    
                    cv2.imshow('Debug View', frame)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break

                await asyncio.sleep(0.01)

        finally:
            print("[Camera] 카메라 스트림 종료")
            cap.release()
            if DEBUG_MODE:
                cv2.destroyAllWindows()

    async def start(self):
        """서버 시작"""
        print(f"[Server] 서버가 {self.host}:{self.port}에서 시작되었습니다")
        async with websockets.serve(self.handle_client, self.host, self.port):
            try:
                await self.process_camera()
            except Exception as e:
                print(f"[Error] 서버 오류: {e}")
            finally:
                print("[Server] 서버를 종료합니다...")
                self.is_running = False

def main():
    server = SimpleDetectionServer()
    try:
        asyncio.run(server.start())
    except KeyboardInterrupt:
        print("[Server] 프로그램을 종료합니다...")
    except Exception as e:
        print(f"[Error] 예상치 못한 오류 발생: {e}")

if __name__ == "__main__":
    main()
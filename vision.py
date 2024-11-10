import cv2
import mediapipe as mp
import numpy as np
from datetime import datetime
import json
import asyncio
import websockets
import math
import time
from collections import deque
import concurrent.futures
from threading import Thread

def nothing(x):
    pass

class ExhibitionDetectionServer:
    def __init__(self, host='localhost', port=12345):
        self.host = host
        self.port = port
        
        # MediaPipe 초기화
        print("[Setup] MediaPipe 모델 초기화 중...")
        self.mp_pose = mp.solutions.pose
        self.mp_hands = mp.solutions.hands
        self.mp_drawing = mp.solutions.drawing_utils
        
        # MediaPipe 설정 최적화
        self.pose = self.mp_pose.Pose(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
            model_complexity=1,  # 0=Lite, 1=Full, 2=Heavy
            smooth_landmarks=True  # 랜드마크 스무딩 활성화
        )
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,  # 비디오 모드
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
            model_complexity=0  # Lite 모델 사용
        )
        print("[Setup] MediaPipe 모델 초기화 완료")
        
        # 성능 관련 변수
        self.frame_queue = deque(maxlen=2)  # 프레임 버퍼
        self.fps = 0
        self.fps_counter = 0
        self.fps_time = time.time()
        
        # GUI 설정창 생성
        cv2.namedWindow('Controls')
        
        # Trackbar 생성
        cv2.createTrackbar('Target FPS', 'Controls', 30, 60, nothing)  # FPS 제어
        cv2.createTrackbar('Shoulder Width (%)', 'Controls', 40, 100, nothing)  # 어깨 너비 임계값
        cv2.createTrackbar('Min Swipe Distance (%)', 'Controls', 10, 100, nothing)  # 최소 스와이프 거리
        cv2.createTrackbar('Min Speed (px/s)', 'Controls', 500, 2000, nothing)  # 최소 스와이프 속도
        cv2.createTrackbar('Presence Timeout (s)', 'Controls', 2, 15, nothing)  # presence 타임아웃
        cv2.createTrackbar('Swipe Cooldown (ms)', 'Controls', 1000, 2000, nothing)  # 스와이프 쿨다운
        
        # 상태 변수
        self.is_running = True
        self.connected_clients = set()
        self.viewer_present = False
        self.last_presence_detection = datetime.now()
        
        # 제스처 감지 변수
        self.left_hand_history = []
        self.right_hand_history = []
        self.last_swipe_time = datetime.now()
        
    def get_parameters(self):
        """GUI에서 현재 파라미터 값들을 가져옴"""
        return {
            'shoulder_width': cv2.getTrackbarPos('Shoulder Width (%)', 'Controls') / 100.0,
            'min_swipe_distance': cv2.getTrackbarPos('Min Swipe Distance (%)', 'Controls') / 100.0,
            'min_speed': cv2.getTrackbarPos('Min Speed (px/s)', 'Controls'),
            'presence_timeout': cv2.getTrackbarPos('Presence Timeout (s)', 'Controls'),
            'swipe_cooldown': cv2.getTrackbarPos('Swipe Cooldown (ms)', 'Controls') / 1000.0
        }
        
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
            
    def calculate_fps(self):
        """FPS 계산"""
        self.fps_counter += 1
        current_time = time.time()
        if current_time - self.fps_time >= 1.0:
            self.fps = self.fps_counter
            self.fps_counter = 0
            self.fps_time = current_time
            
    async def capture_frames(self, cap):
        """별도 스레드에서 프레임 캡처"""
        while self.is_running:
            ret, frame = cap.read()
            if ret:
                if len(self.frame_queue) > 0:
                    self.frame_queue.popleft()  # 오래된 프레임 제거
                self.frame_queue.append(frame)
            await asyncio.sleep(0.001)  # 최소 대기 시간

    async def process_camera(self):
        """개선된 카메라 처리"""
        cap = cv2.VideoCapture(0)
        
        # 카메라 설정 최적화
        cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'MJPG'))
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv2.CAP_PROP_FPS, 60)  # 카메라 FPS 최대로 설정
        
        print("[Camera] 카메라 스트림 시작")
        
        if not cap.isOpened():
            print("[Error] 카메라를 열 수 없습니다")
            return
            
        # 프레임 캡처 태스크 시작
        capture_task = asyncio.create_task(self.capture_frames(cap))
        
        try:
            while self.is_running:
                if len(self.frame_queue) == 0:
                    await asyncio.sleep(0.001)
                    continue
                
                # 프레임 처리
                frame = self.frame_queue[-1].copy()  # 최신 프레임 사용
                params = self.get_parameters()
                target_fps = cv2.getTrackbarPos('Target FPS', 'Controls')
                
                # FPS 계산 및 표시
                self.calculate_fps()
                cv2.putText(frame, f"FPS: {self.fps}", 
                           (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
                # 관람객 감지
                is_close, pose_landmarks = self.detect_viewer(frame)
                presence_changed = self.update_viewer_presence(is_close)
                
                # 스와이프 감지 (관람객이 있을 때만)
                swipe_direction = None
                if self.viewer_present:
                    swipe_direction, _ = self.detect_swipe(frame)
                
                # 상태 변경 또는 스와이프 시에만 메시지 전송
                if presence_changed or swipe_direction:
                    message = {
                        "viewer_present": self.viewer_present,
                        "swipe_direction": swipe_direction,
                        "timestamp": datetime.now().isoformat()
                    }
                    print(f"[Info] 상태 변경: {message}")
                    await self.broadcast(message)
                
                # 디버그 정보 표시
                if self.viewer_present:
                    time_left = params['presence_timeout'] - (datetime.now() - self.last_presence_detection).total_seconds()
                    if time_left > 0:
                        cv2.putText(frame, f"Presence: {time_left:.1f}s",
                                  (int(frame.shape[1] * 0.05), int(frame.shape[0] * 0.15)),
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
                # 화면 표시
                cv2.imshow('Debug View', frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
                
                # FPS 제어
                if target_fps > 0:
                    await asyncio.sleep(1.0/target_fps)
                else:
                    await asyncio.sleep(0.001)
                
        finally:
            self.is_running = False
            await capture_task
            cap.release()
            cv2.destroyAllWindows()
    
    def detect_viewer(self, frame):
        """어깨 너비 기반 관람객 감지"""
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pose_results = self.pose.process(frame_rgb)
        
        if not pose_results.pose_landmarks:
            return False, None
            
        landmarks = pose_results.pose_landmarks.landmark
        params = self.get_parameters()
        
        # 어깨 너비 계산
        left_shoulder = landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER]
        right_shoulder = landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER]
        shoulder_width = abs(left_shoulder.x - right_shoulder.x)
        
        is_close = shoulder_width > params['shoulder_width']
        
        # 디버그 표시
        height, width = frame.shape[:2]
        text_pos = (int(width * 0.05), int(height * 0.1))
        cv2.putText(frame, f"Shoulder Width: {shoulder_width:.3f}", text_pos,
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0) if is_close else (0, 0, 255), 2)
        
        # 어깨 표시
        left_x, left_y = int(left_shoulder.x * width), int(left_shoulder.y * height)
        right_x, right_y = int(right_shoulder.x * width), int(right_shoulder.y * height)
        cv2.line(frame, (left_x, left_y), (right_x, right_y),
                (0, 255, 0) if is_close else (0, 0, 255), 3)
        
        return is_close, pose_results.pose_landmarks
        
    def detect_swipe(self, frame):
        """단순화된 스와이프 감지"""
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        hand_results = self.hands.process(frame_rgb)
        
        if not hand_results.multi_hand_landmarks:
            self.left_hand_history.clear()
            self.right_hand_history.clear()
            return None, None
            
        height, width = frame.shape[:2]
        params = self.get_parameters()
        
        # 쿨다운 체크
        current_time = datetime.now()
        time_since_last = (current_time - self.last_swipe_time).total_seconds()
        if time_since_last < params['swipe_cooldown']:
            cv2.putText(frame, f"Cooldown: {params['swipe_cooldown'] - time_since_last:.1f}s", 
                       (width - 200, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            return None, hand_results.multi_hand_landmarks[0]
            
        for hand_idx, (hand_landmarks, handedness) in enumerate(
            zip(hand_results.multi_hand_landmarks, hand_results.multi_handedness)):
            
            # 손의 좌우 구분
            is_right = (handedness.classification[0].label == "Left")
            hand_type = "Right" if is_right else "Left"
            
            # 손바닥 중심 위치
            palm = hand_landmarks.landmark[9]
            palm_x = int(palm.x * width)
            
            # 손 시각화
            self.mp_drawing.draw_landmarks(
                frame,
                hand_landmarks,
                self.mp_hands.HAND_CONNECTIONS,
                self.mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=4),
                self.mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2)
            )
            
            # 기본 정보 표시
            y_offset = 60 + (hand_idx * 60)
            cv2.putText(frame, f"Hand: {hand_type}", 
                       (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            # 현재 손의 기록
            history = self.right_hand_history if is_right else self.left_hand_history
            history.append((current_time, palm_x))
            
            # 0.2초보다 오래된 기록 제거
            while history and (current_time - history[0][0]).total_seconds() > 0.2:
                history.pop(0)
            
            # 이동 거리 계산
            if len(history) >= 2:
                start_x = history[0][1]
                end_x = history[-1][1]
                movement = end_x - start_x
                time_diff = (history[-1][0] - history[0][0]).total_seconds()
                
                if time_diff > 0:
                    speed = abs(movement / time_diff)
                    min_distance = width * params['min_swipe_distance']
                    
                    # 디버그 정보 표시
                    cv2.putText(frame, f"Movement: {movement:+.0f}px", 
                               (10, y_offset + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                    cv2.putText(frame, f"Speed: {speed:.0f}px/s", 
                               (200, y_offset + 20), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
                    
                    if abs(movement) > min_distance and speed > params['min_speed']:
                        if is_right:  # 오른손
                            direction = "left" if movement < 0 else "right"
                        else:  # 왼손
                            direction = "right" if movement < 0 else "left"
                        
                        cv2.putText(frame, f"SWIPE {direction.upper()}!", 
                                   (width//2 - 100, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2)
                        
                        history.clear()
                        self.last_swipe_time = current_time
                        return direction, hand_landmarks
        
        return None, hand_results.multi_hand_landmarks[0] if hand_results.multi_hand_landmarks else None
        
    def update_viewer_presence(self, is_close):
        """관람객 presence 상태 업데이트"""
        current_time = datetime.now()
        previous_state = self.viewer_present
        params = self.get_parameters()
        
        if is_close:
            self.last_presence_detection = current_time
            if not self.viewer_present:
                self.viewer_present = True
                return True
        elif self.viewer_present:
            if (current_time - self.last_presence_detection).total_seconds() > params['presence_timeout']:
                self.viewer_present = False
                return True
                
        return previous_state != self.viewer_present
        
    async def process_camera(self):
        """카메라 처리"""
        cap = cv2.VideoCapture(0)
        print("[Camera] 카메라 스트림 시작")
        
        if not cap.isOpened():
            print("[Error] 카메라를 열 수 없습니다")
            return
            
        try:
            while self.is_running:
                ret, frame = cap.read()
                if not ret:
                    continue
                    
                params = self.get_parameters()
                
                # 관람객 감지
                is_close, pose_landmarks = self.detect_viewer(frame)
                presence_changed = self.update_viewer_presence(is_close)
                
                # 스와이프 감지 (관람객이 있을 때만)
                swipe_direction = None
                if self.viewer_present:
                    swipe_direction, _ = self.detect_swipe(frame)
                
                # 상태 변경 또는 스와이프 시에만 메시지 전송
                if presence_changed or swipe_direction:
                    message = {
                        "viewer_present": self.viewer_present,
                        "swipe_direction": swipe_direction,
                        "timestamp": datetime.now().isoformat()
                    }
                    print(f"[Info] 상태 변경: {message}")
                    await self.broadcast(message)
                
                # Presence 타이머 표시
                if self.viewer_present:
                    time_left = params['presence_timeout'] - (datetime.now() - self.last_presence_detection).total_seconds()
                    if time_left > 0:
                        cv2.putText(frame, f"Presence: {time_left:.1f}s",
                                  (int(frame.shape[1] * 0.05), int(frame.shape[0] * 0.15)),
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                
                # 컨트롤 값 표시
                cv2.imshow('Debug View', frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
                    
                await asyncio.sleep(0.01)
                
        finally:
            print("[Camera] 카메라 스트림 종료")
            cap.release()
            cv2.destroyAllWindows()
            
    async def start_server(self):
        """WebSocket 서버 시작"""
        print(f"[Server] 서버가 {self.host}:{self.port}에서 시작되었습니다")
        
        async with websockets.serve(self.handle_client, self.host, self.port):
            camera_task = asyncio.create_task(self.process_camera())
            
            try:
                await asyncio.Future()
            except KeyboardInterrupt:
                print("[Server] 서버를 종료합니다...")
            finally:
                self.is_running = False
                await camera_task
                print("[Server] 서버가 종료되었습니다")

def main():
    server = ExhibitionDetectionServer()
    try:
        asyncio.run(server.start_server())
    except KeyboardInterrupt:
        print("[Server] 프로그램을 종료합니다...")
    except Exception as e:
        print(f"[Error] 예상치 못한 오류 발생: {e}")

if __name__ == "__main__":
    main()
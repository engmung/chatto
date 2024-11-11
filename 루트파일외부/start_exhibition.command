#!/bin/bash
echo "Starting Exhibition Web Application..."
cd "$(dirname "$0")/exhibition-project"

echo "Installing dependencies..."
npm install

echo "Starting Vision Service..."
python3 vision.py &
VISION_PID=$!

echo "Starting Development Server..."
npm run dev &
DEV_PID=$!

echo "Opening in browser..."
sleep 5
open http://localhost:3000

echo "Exhibition is running!"
echo "Press Ctrl+C to close all processes..."

# 프로세스 종료 처리
trap 'kill $VISION_PID $DEV_PID; exit' INT TERM

# 프로세스가 종료될 때까지 대기
wait
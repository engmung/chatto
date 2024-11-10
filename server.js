// server.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(express.json());

const CONVERSATIONS_FILE = path.join(__dirname, 'conversations.json');
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json'); // Google Cloud Console에서 받은 인증 파일
const FOLDER_ID = 'your_google_drive_folder_id'; // 저장할 Google Drive 폴더 ID

// Google Drive API 설정
const setupDrive = async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });
  
  const driveService = google.drive({ version: 'v3', auth });
  return driveService;
};

const uploadToDrive = async (conversations) => {
  try {
    const driveService = await setupDrive();
    const fileMetadata = {
      name: `conversations_${new Date().toISOString().split('T')[0]}.json`,
      parents: [FOLDER_ID]
    };

    const media = {
      mimeType: 'application/json',
      body: JSON.stringify(conversations, null, 2)
    };

    await driveService.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    });

    // 업로드 후 로컬 파일 초기화
    await fs.writeFile(CONVERSATIONS_FILE, JSON.stringify([], null, 2), 'utf8');
    
    console.log('Successfully uploaded to Google Drive');
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
  }
};

// 대화 저장 API
app.post('/api/save-conversation', async (req, res) => {
  try {
    // 기존 파일 읽기 시도
    let conversations = [];
    try {
      const data = await fs.readFile(CONVERSATIONS_FILE, 'utf8');
      conversations = JSON.parse(data);
    } catch (error) {
      console.log('Creating new conversations file');
    }

    // 새 대화 추가
    conversations.push({
      timestamp: new Date().toISOString(),
      ...req.body
    });

    // 파일 저장
    await fs.writeFile(
      CONVERSATIONS_FILE, 
      JSON.stringify(conversations, null, 2),
      'utf8'
    );

    // 완료된 대화가 10개 이상이면 Google Drive에 업로드
    if (conversations.length >= 10) {
      await uploadToDrive(conversations);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving conversation:', error);
    res.status(500).json({ error: 'Failed to save conversation' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
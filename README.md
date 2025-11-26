# ML 코딩 어시스턴트

머신러닝 코딩 문제를 입력하면 즉시 답변해주는 챗봇입니다.

## 기능

- 🤖 GPT-4 Turbo 기반 머신러닝 코딩 어시스턴트
- 💻 실행 가능한 코드 솔루션 즉시 제공
- 📝 코드 블록 자동 포맷팅 및 하이라이트
- 📱 반응형 디자인 (모바일 지원)

## API 키 설정

**⚠️ 중요 보안 안내:**
GitHub Pages는 정적 사이트 호스팅이므로, 프론트엔드에서 API 키를 사용하면 브라우저에 노출됩니다. 

### 초기 설정 방법

1. **`config.example.js`를 복사하여 `config.js` 생성:**
   ```bash
   cp config.example.js config.js
   ```

2. **`config.js` 파일을 열어서 실제 API 키 입력:**
   ```javascript
   const CONFIG = {
       OPENROUTER_API_KEY: 'your-actual-api-key-here',  // 여기에 실제 API 키 입력
       OPENROUTER_API_URL: 'https://openrouter.ai/api/v1/chat/completions',
       MODEL: 'openai/gpt-4-turbo'
   };
   ```

3. **`.gitignore`에 `config.js`가 포함되어 있어 GitHub에 올라가지 않습니다.**
   - ✅ `config.example.js`는 GitHub에 올라갑니다 (템플릿)
   - ❌ `config.js`는 GitHub에 올라가지 않습니다 (실제 API 키)

### GitHub Pages 배포 시 주의사항

**문제:** GitHub Pages에 배포하려면 `config.js` 파일이 필요하지만, API 키를 공개하고 싶지 않습니다.

**해결 방법:**

#### 방법 1: GitHub Pages에 직접 배포 (API 키 공개됨)
- `config.js`를 `.gitignore`에서 제거하고 커밋
- ⚠️ API 키가 공개 저장소에 노출됨
- 사용량 제한을 설정하거나 테스트 키만 사용 권장

#### 방법 2: 서버리스 함수 사용 (권장 - 프로덕션)
더 안전한 방법은 서버리스 함수를 사용하는 것입니다:

1. **Vercel Functions** 사용:
   - `api/chat.js` 파일 생성
   - API 키를 환경 변수로 설정
   - 프론트엔드에서 `/api/chat` 엔드포인트 호출

2. **Netlify Functions** 사용:
   - `netlify/functions/chat.js` 파일 생성
   - 환경 변수 설정
   - 프론트엔드에서 `.netlify/functions/chat` 호출

3. **GitHub Pages + 별도 백엔드**:
   - 별도 서버에서 API 프록시 구현
   - GitHub Pages는 프론트엔드만 호스팅

## 배포 방법

### GitHub Pages 배포

1. **GitHub 저장소 생성** (공개 또는 비공개 모두 가능)
   - **비공개 저장소 권장**: API 키가 노출되지 않아 더 안전합니다
   - **공개 저장소**: 누구나 코드와 API 키를 볼 수 있습니다

2. 모든 파일 커밋 및 푸시:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```
   
   **포함되는 파일:**
   ```
   index.html
   script.js
   config.js          (API 키 포함)
   config.example.js  (템플릿)
   styles.css
   .gitignore
   README.md
   ```

3. 저장소 설정 → Pages → Source를 `main` 브랜치로 설정
4. 배포 완료!

**📌 저장소 유형별 안내:**
- **비공개 저장소**: ✅ API 키가 노출되지 않음, GitHub Pages도 정상 작동
- **공개 저장소**: ⚠️ API 키가 공개됨, 사용량 제한 설정 권장

### 로컬 테스트

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve

# 또는 브라우저에서 직접 index.html 열기
```

## 사용 방법

1. 페이지 로드 후 챗봇이 자동으로 열립니다
2. 머신러닝 코딩 문제를 입력하세요
3. 예시:
   - "로지스틱 회귀 모델을 scikit-learn으로 구현해줘"
   - "CNN으로 이미지 분류하는 코드 작성해줘"
   - "랜덤 포레스트 하이퍼파라미터 튜닝 코드"

## 기술 스택

- HTML5
- CSS3
- Vanilla JavaScript
- OpenRouter API
- GPT-4 Turbo

sk1-or1-v1-7620eb1f8e7c8f088119faefa5d58eb8a8db61f7a6b69ff52c0e80efbd551b97


import requests
K=""
U="https://openrouter.ai/api/v1/chat/completions"
H={"Authorization":f"Bearer {K}","Content-Type":"application/json"}
def ask(p,m="openai/gpt-4-turbo"):
 r=requests.post(U,headers=H,json={"model":m,"messages":[{"role":"user","content":p}],"temperature":0.7,"max_tokens":2000})
 return r.json()["choices"][0]["message"]["content"] if r.ok else None
def code(p,m="openai/gpt-4-turbo"):
 s="Output ONLY executable code. No explanations, no markdown."
 r=requests.post(U,headers=H,json={"model":m,"messages":[{"role":"system","content":s},{"role":"user","content":p}],"temperature":0.7,"max_tokens":2000})
 return r.json()["choices"][0]["message"]["content"] if r.ok else None
def img(i,t="",m="openai/gpt-4o"):
 c=[{"type":"image_url","image_url":{"url":i}}]
 if t:c.append({"type":"text","text":t})
 r=requests.post(U,headers=H,json={"model":m,"messages":[{"role":"user","content":c}],"temperature":0.7,"max_tokens":2000})
 return r.json()["choices"][0]["message"]["content"] if r.ok else None

print(code("로지스틱 회귀 모델을 scikit-learn으로 구현해줘"))


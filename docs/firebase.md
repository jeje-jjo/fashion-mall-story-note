# Firebase 설정 현황

정리: 2026-11-06

## 프로젝트
| 항목 | 값 |
|---|---|
| 프로젝트 ID | `fashion-mall-story` (번호 710838311399) |
| 계정 | hj920619@gmail.com |
| Firestore | `(default)`, `asia-northeast3`(서울), 네이티브 모드 |
| 로그인 | Google 로그인 사용 중 |
| 승인 도메인 | localhost, fashion-mall-story.firebaseapp.com, fashion-mall-story.web.app, **jeje-jjo.github.io** |

## 웹 앱 설정 값
웹 앱 이름은 `패션몰스토리 노트`. 아래 값은 브라우저에 그대로 노출되는 공개 값이라 커밋해도 된다. 보안은 `firestore.rules`가 맡는다.

```ts
export const firebaseConfig = {
  apiKey: "AIzaSyAnUygHR9yqwpdgs6TWz6ccv3jPpq57fHU",
  authDomain: "fashion-mall-story.firebaseapp.com",
  projectId: "fashion-mall-story",
  storageBucket: "fashion-mall-story.firebasestorage.app",
  messagingSenderId: "710838311399",
  appId: "1:710838311399:web:9c984c3922c63c92f50542",
};
```

## 보안 규칙 (`firestore.rules`)
- 본인 uid(`9dlSV6iYolauEAhEkRIZJktyox32`, hj920619@gmail.com 구글 로그인)만 모든 문서를 읽고 쓸 수 있다(2026-11-06 이메일 확인 → uid 고정).
- 로그인하지 않은 요청은 읽기와 쓰기 모두 403으로 막히는 것을 확인했다.
- 기준 데이터 스크립트(firebase CLI 토큰)는 IAM 권한으로 통과하므로 이 규칙과 무관하다.

배포 명령:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## 아직 안 한 것
- 웹 API 키를 HTTP 리퍼러(`jeje-jjo.github.io/*`, `localhost:*`)로 제한하기. 선택 사항이며 Google Cloud 콘솔 → API 및 서비스 → 사용자 인증 정보에서 한다.
- 아이폰 사파리에서 팝업 로그인 확인(docs/plan.md 1절).

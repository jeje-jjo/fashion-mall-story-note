import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

// 공개돼도 되는 웹 설정 값. 보안은 firestore.rules(본인만)가 맡는다.
export const firebaseConfig = {
  apiKey: "AIzaSyAnUygHR9yqwpdgs6TWz6ccv3jPpq57fHU",
  authDomain: "fashion-mall-story.firebaseapp.com",
  projectId: "fashion-mall-story",
  storageBucket: "fashion-mall-story.firebasestorage.app",
  messagingSenderId: "710838311399",
  appId: "1:710838311399:web:9c984c3922c63c92f50542",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence); // 아이폰 홈 화면 앱에서도 로그인 유지
export const provider = new GoogleAuthProvider();

// 오프라인 캐시(IndexedDB): 기준 데이터는 한 번 받으면 다음부터 바로 뜬다
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export const MOCK = import.meta.env.DEV && import.meta.env.VITE_MOCK === "1";

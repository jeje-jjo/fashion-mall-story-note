import "./styles/legacy.css";
import "./styles/pixel-diary.css";
import { installPixelIcons } from "./ui/pixel-icons";

installPixelIcons();

// 미리보기 빌드는 인증·Firestore 모듈을 시작하지 않는다.
if (import.meta.env.MODE === "preview") {
  void import("./preview");
} else {
  void import("./startup");
}

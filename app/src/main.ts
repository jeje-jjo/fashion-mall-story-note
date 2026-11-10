import "./styles/legacy.css";
import "./styles/pixel-diary.css";
import "./styles/appearance.css";
import "./styles/responsive-polish.css";
import "./styles/design-system.css";
import { installPixelIcons } from "./ui/pixel-icons";
import { restoreAppearance } from "./ui/appearance";

restoreAppearance();
installPixelIcons();

// 미리보기 빌드는 인증·Firestore 모듈을 시작하지 않는다.
if (import.meta.env.MODE === "preview") {
  void import("./preview");
} else {
  void import("./startup");
}

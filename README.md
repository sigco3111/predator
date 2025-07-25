# 포식자 (Predator)

**당신보다 작은 개체를 흡수하여 성장하고, 더 큰 위협은 피하세요. 세상에서 가장 거대한 존재가 되어보세요!**

이 프로젝트는 웹 브라우저에서 실행되는 간단하지만 중독성 있는 아케이드 게임입니다. 플레이어는 자신의 개체를 조종하여 다른 작은 개체들을 흡수하며 질량을 늘려나갑니다. 하지만 자신보다 큰 개체나 특수한 위험 요소와 충돌하면 게임이 종료되거나 불이익을 받게 됩니다.

실행주소1 : https://predator-rho.vercel.app/

실행주소2 : https://dev-canvas-pi.vercel.app/

---

## ✨ 주요 기능

- **직관적인 게임 플레이**: 간단한 조작으로 배우기는 쉽지만 마스터하기는 어렵습니다.
- **성장 시스템**: 작은 개체를 흡수하여 질량과 크기를 키우는 만족감을 느낄 수 있습니다.
- **다양한 개체들**:
    - **먹이 (청록색)**: 당신보다 작아 흡수할 수 있는 대상입니다.
    - **위협 (붉은색)**: 당신보다 커서 피해야 하는 위험한 존재입니다.
- **특수 요소**:
    - **축소기 (마젠타색 마름모)**: 부딪히면 질량이 절반으로 줄어드는 매우 위험한 개체입니다.
    - **보호막 (빛나는 아이템)**: 획득 시 위협적인 충돌을 1회 방어합니다.
    - **성운 (보라색 안개)**: 진입 시 모든 개체의 이동 속도가 느려지는 전략적 공간입니다.
- **콤보 시스템**: 짧은 시간 안에 연속으로 개체를 흡수하면 더 많은 질량 보너스를 획득합니다.
- **반응형 컨트롤**:
    - **데스크탑**: `WASD` 또는 `화살표 키`로 정밀한 조작이 가능합니다.
    - **모바일**: 화면 위 방향 패드를 통해 어디서든 플레이할 수 있습니다.
- **동적 AI**: AI 개체들은 플레이어의 상태에 따라 도망치거나, 추격하거나, 배회하는 등 다양한 행동 패턴을 보입니다.
- **상세한 결과 화면**: 게임 오버 시 최종 질량과 함께 시간 경과에 따른 질량 변화를 시각적인 그래프로 보여줍니다.
- **도움말 기능**: 메인 메뉴와 일시정지 메뉴에서 언제든지 상세한 게임 규칙을 확인할 수 있습니다.

---

## 🛠️ 기술 스택

- **프레임워크**: React (Hooks)
- **언어**: TypeScript
- **렌더링**: HTML5 Canvas API
- **스타일링**: Tailwind CSS
- **아이콘**: Lucide React
- **모듈 로딩**: ES Modules with Import Maps (별도의 빌드 과정 없음)

---

## 📂 파일 구조

```
.
├── components/          # React 컴포넌트
│   ├── GravityCanvas.tsx  # 게임 시뮬레이션 렌더링
│   ├── DirectionalPad.tsx # 모바일용 방향 패드
│   └── ...              # 기타 UI 컴포넌트
├── hooks/               # 커스텀 React 훅
│   └── useSimulation.ts   # 메인 게임 루프 및 상태 관리 로직
├── services/            # 비즈니스 로직 (React와 분리)
│   ├── simulationService.ts # 물리 엔진, 충돌 감지, AI 로직
│   └── spatialGridService.ts # 성능 최적화를 위한 공간 그리드
├── utils/               # 유틸리티 함수
│   └── math.ts            # 수학 및 색상 관련 헬퍼
├── App.tsx              # 메인 애플리케이션 컴포넌트
├── constants.ts         # 물리 상수, 게임플레이 설정 등
├── index.html           # 애플리케이션 진입점
├── index.tsx            # React 앱 마운트
├── metadata.json        # 앱 메타데이터
├── README.md            # 프로젝트 설명 파일 (현재 파일)
└── types.ts             # TypeScript 타입 정의
```

---

## 🚀 로컬에서 실행하기

이 프로젝트는 별도의 빌드 도구(Webpack, Vite 등) 없이 최신 브라우저의 ES Modules 기능을 사용하여 실행됩니다.

1.  **저장소 복제:**
    ```bash
    git clone https://github.com/your-username/predator.git
    cd predator
    ```

2.  **로컬 웹 서버 실행:**
    프로젝트 루트 디렉토리에서 간단한 로컬 웹 서버를 실행해야 합니다. Python이 설치되어 있다면 다음 명령어를 사용할 수 있습니다.

    ```bash
    # Python 3
    python -m http.server
    ```
    또는 VS Code를 사용하신다면 [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) 확장 프로그램을 설치하고 `Go Live` 버튼을 클릭하여 서버를 실행할 수 있습니다.

3.  **브라우저에서 열기:**
    서버가 시작되면 터미널에 표시된 주소(보통 `http://localhost:8000`)를 웹 브라우저에서 열어 게임을 실행합니다.

---

## 🤝 기여하기

이 프로젝트에 대한 기여를 환영합니다! 버그 수정, 새로운 기능 제안, 코드 개선 등 어떤 형태의 기여든 좋습니다.

1.  이 저장소를 Fork 하세요.
2.  새로운 기능이나 수정을 위한 브랜치를 만드세요 (`git checkout -b feature/amazing-feature`).
3.  변경 사항을 커밋하세요 (`git commit -m 'Add some amazing feature'`).
4.  브랜치에 Push 하세요 (`git push origin feature/amazing-feature`).
5.  Pull Request를 열어주세요.
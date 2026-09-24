# Smooth scroll bằng Lenis — hướng dẫn tái sử dụng

> File này dành cho Claude Code: đọc hết rồi áp dụng vào dự án hiện tại.
> Nguồn: portfolio_frontend (React 18 + Vite + GSAP ScrollTrigger + Lenis 1.3.x), đã chạy ổn định trên mọi trang.
> Trước khi làm, hãy kiểm tra dự án đích: framework nào (React/Vite/Next…), đã có GSAP chưa, có router chưa, có modal/vùng cuộn con không. Chỉ lấy những phần cần dùng.

## Mục tiêu

- Lăn chuột hoặc touchpad thì trang **trượt mượt rồi chậm dần** (không nhảy từng nấc 100px).
- Click menu, anchor hay nút "về đầu trang" thì trang **cuộn mượt tới section**. Quãng xa được cho thời gian dài hơn.
- Nếu có GSAP ScrollTrigger: animation theo cuộn **khớp từng frame** với vị trí cuộn.
- Điện thoại/tablet cảm ứng: **giữ cuộn gốc của hệ điều hành** (quán tính native đã mượt sẵn).

## 1. Cài đặt

```bash
npm install lenis
# Chỉ khi dự án dùng ScrollTrigger:
npm install gsap
```

Package tên là `lenis`, KHÔNG phải `@studio-freight/lenis` (tên cũ, đã ngừng phát triển).

## 2. Cấu hình dùng chung

```js
export const LENIS_OPTIONS = {
  duration: 1.4,                                              // mỗi lần cuộn trượt ~1.4s
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),   // expo-out: nhanh lúc đầu, hãm dần
  smoothWheel: true,                                          // làm mượt chuột + touchpad
  wheelMultiplier: 0.9,                                       // mỗi nấc chuột đi ngắn hơn mặc định một chút
  respectReducedMotion: false,                                // xem ghi chú bên dưới
};
```

- `syncTouch` để mặc định (false): thiết bị cảm ứng cuộn native.
- `respectReducedMotion: false` là lựa chọn riêng của dự án gốc (người dùng tắt "Animation effects" trên Windows nhưng vẫn muốn hiệu ứng). **Ở dự án mới, hỏi người dùng.** Mặc định an toàn cho người dùng nói chung là `true`.

## 3. Hook cho React — có GSAP ScrollTrigger

`src/hooks/useLenis.js`:

```js
import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const LENIS_OPTIONS = { /* như mục 2 */ };

// Lenis cấp trang, chạy bằng GSAP ticker để ScrollTrigger luôn đồng bộ.
// Gán lên window.__lenis để các helper (nav, scroll-to-top) gọi scrollTo.
export default function useLenis() {
  useEffect(() => {
    const lenis = new Lenis(LENIS_OPTIONS);

    lenis.on("scroll", ScrollTrigger.update);

    const tickerFn = (time) => lenis.raf(time * 1000); // GSAP tính bằng giây, Lenis cần ms
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0); // không để GSAP "nhảy cóc" thời gian khi tab bị lag

    window.__lenis = lenis;

    return () => {
      lenis.destroy();
      gsap.ticker.remove(tickerFn);
      window.__lenis = null;
    };
  }, []);
}
```

Lenis v1.x cuộn chính `window` (không bọc container giả), nên **KHÔNG cần `ScrollTrigger.scrollerProxy`**.

### Biến thể không có GSAP

```js
useEffect(() => {
  const lenis = new Lenis(LENIS_OPTIONS);
  let rafId;
  const loop = (time) => {
    lenis.raf(time);
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);
  window.__lenis = lenis;
  return () => {
    cancelAnimationFrame(rafId);
    lenis.destroy();
    window.__lenis = null;
  };
}, []);
```

### Gắn vào đâu

Gọi `useLenis()` **một lần ở component cấp trang** (mỗi page component, hoặc một layout bọc mọi route). Trong dự án gốc, mỗi trang (`HomePage`, `ProjectDetail`, `Works`) tự gọi `useLenis()`. Không gọi trong component con lặp lại, vì sẽ tạo nhiều instance tranh nhau cuộn trang.

## 4. Cuộn bằng code (click menu, anchor, scroll-to-top)

Luôn cuộn **qua Lenis**. Không dùng `window.scrollTo` hay `element.scrollIntoView` khi Lenis đang chạy, vì vị trí nội bộ của Lenis sẽ lệch với vị trí thật và lần lăn chuột kế tiếp bị giật.

Easing mặc định (expo-out) đi khoảng 50% quãng đường ngay trong vài frame đầu, nên khi nhảy xa các section vụt qua. Với cuộn do click, dùng `easeInOutCubic` và cho thời gian tăng theo quãng đường:

```js
// src/utils/scrollToSection.js
const MIN_DURATION = 1.2;           // giây — quãng ngắn
const MAX_DURATION = 3.0;           // giây — quãng rất xa
const BASE_DURATION = 1.2;
const DURATION_PER_VIEWPORT = 0.25; // thêm 0.25s cho mỗi 100vh

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function durationFor(distance) {
  const viewports = Math.abs(distance) / window.innerHeight;
  const d = BASE_DURATION + viewports * DURATION_PER_VIEWPORT;
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, d));
}

// true trong lúc đang cuộn do click — navbar dùng để không cho
// IntersectionObserver đổi mục active qua từng section đi ngang.
let navScrolling = false;
let navScrollTimer = null;
export const isNavScrolling = () => navScrolling;

export function smoothScrollTo(top, onComplete) {
  const lenis = window.__lenis;
  const duration = durationFor(top - window.scrollY);

  navScrolling = true;
  clearTimeout(navScrollTimer);
  // Mở khoá bằng timeout, KHÔNG dựa vào onComplete: nếu người dùng lăn chuột
  // giữa chừng, Lenis huỷ scrollTo và onComplete không bao giờ chạy.
  navScrollTimer = setTimeout(() => { navScrolling = false; }, duration * 1000 + 100);

  if (lenis) {
    lenis.scrollTo(top, { duration, easing: easeInOutCubic, onComplete });
  } else {
    window.scrollTo({ top, behavior: "smooth" });
    if (onComplete) setTimeout(onComplete, duration * 1000);
  }
}

// Cuộn tới element theo selector, trừ chiều cao navbar cố định (80px — chỉnh theo dự án).
export function scrollToSection(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  smoothScrollTo(el.getBoundingClientRect().top + window.scrollY - 80);
}
```

Mọi chỗ cuộn do click (navbar, menu mobile, chấm điều hướng, footer, nút về đầu trang) đều gọi helper này để cảm giác cuộn giống hệt nhau. Với link `<a href="#id">`, gọi `e.preventDefault()` rồi `scrollToSection("#id")`.

### Nhảy thẳng không animation (vào trang có hash, đổi route)

```js
const lenis = window.__lenis;
lenis.resize(); // BẮT BUỘC nếu nội dung vừa render xong (sau loading screen, sau khi đổi route)
lenis.scrollTo(top, { immediate: true, force: true });
```

- **Phải gọi `lenis.resize()` trước.** Lenis đo lại chiều cao trang bằng ResizeObserver, chạy bất đồng bộ. Ngay sau khi nội dung xuất hiện, giới hạn cuộn vẫn có thể là 0, nên `scrollTo` bị kẹp về 0.
- `force: true` để vẫn cuộn được khi Lenis đang `stop()`.
- Khi đổi route (SPA), cuộn về đầu bằng `window.__lenis.scrollTo(0, { immediate: true, force: true })` thay vì `window.scrollTo(0, 0)`.
- Nên đặt `history.scrollRestoration = "manual"` (ở `main.jsx`), để trình duyệt không tự khôi phục vị trí cũ, chống lại Lenis khi reload hoặc bấm Back.

## 5. Vùng cuộn con bên trong trang (modal, khung preview, danh sách dài…)

Mặc định Lenis cấp trang bắt mọi sự kiện lăn chuột. Nếu có một div `overflow: auto` bên trong, cần một trong hai cách:

**a) Chỉ cần vùng con cuộn native:** thêm `data-lenis-prevent` vào element đó. Lenis trang sẽ bỏ qua sự kiện lăn chuột phát ra từ bên trong.

**b) Muốn vùng con cũng cuộn mượt như trang:** tạo Lenis riêng cho nó.

```js
// wrapper = hộp có overflow:auto, content = con trực tiếp chứa nội dung
export function useNestedLenis(wrapperRef, contentRef) {
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    const lenis = new Lenis({ ...LENIS_OPTIONS, wrapper, content });
    const tickerFn = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tickerFn);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(tickerFn);
    };
  }, [wrapperRef, contentRef]);
}
```

```jsx
<div
  ref={wrapperRef}
  data-lenis-prevent                 // Lenis trang bỏ qua, Lenis con vẫn nhận
  style={{
    height: "100%",                  // KHÔNG dùng position:absolute; inset:0 (xem mục 7)
    overflowY: "auto",
    overscrollBehavior: "contain",   // chạm đáy không kéo cả trang theo (dự phòng cho cuộn cảm ứng)
  }}
>
  <div ref={contentRef}>{/* nội dung */}</div>
</div>
```

Lenis con vẫn nhận được sự kiện dù có `data-lenis-prevent`, vì Lenis chỉ xét đường đi của sự kiện tính từ root của chính nó trở lên.

## 6. Modal / overlay toàn màn hình

`document.body.style.overflow = "hidden"` **không đủ** để khoá trang phía sau khi có Lenis. Phải dừng Lenis:

```js
useEffect(() => {
  if (!isOpen) return;
  window.__lenis?.stop();
  document.body.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = "";
    window.__lenis?.start();
  };
}, [isOpen]);
```

Nếu nội dung trong modal cũng cần cuộn: thêm `data-lenis-prevent` (cuộn native), hoặc dùng `useNestedLenis` (cuộn mượt).

## 7. Những lỗi đã gặp — tránh lặp lại

| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Cuộn giật, như hai lớp cuộn chồng nhau | CSS có `html { scroll-behavior: smooth }` | Xoá dòng đó. Lenis đã lo phần cuộn mượt. |
| ScrollTrigger lệch với vị trí cuộn | Thiếu `lenis.on("scroll", ScrollTrigger.update)`, hoặc chạy Lenis bằng rAF riêng song song với GSAP ticker | Chạy Lenis bằng `gsap.ticker` như mục 3 |
| Click menu thì các section vụt qua quá nhanh | Easing expo-out mặc định với quãng xa | `easeInOutCubic` + duration theo quãng đường (mục 4) |
| Mục active trên navbar nhảy qua từng section khi click | IntersectionObserver bắt được mọi section đi ngang | Bỏ qua cập nhật khi `isNavScrolling()` đang là true |
| `scrollTo` về 0 dù đã truyền vị trí đúng | Lenis chưa đo lại chiều cao trang | Gọi `lenis.resize()` trước `scrollTo` |
| Mở modal nhưng trang phía sau vẫn cuộn | `body overflow:hidden` không chặn được Lenis | `lenis.stop()` / `lenis.start()` |
| Lăn chuột trong vùng con thì cả trang cuộn theo | Thiếu `data-lenis-prevent` / `overscroll-behavior: contain` | Mục 5 |
| Vùng con có `overflow:auto` nhưng lăn chuột không cuộn (`scrollTop` luôn là 0) | Vùng cuộn đặt `position:absolute; inset:0` bên trong một box có `aspect-ratio`: Chromium tính `scrollHeight === clientHeight` | Dùng `height: 100%` (flow bình thường) |
| Hai instance Lenis tranh nhau cuộn trang | Gọi `useLenis()` ở nhiều component, hoặc quên `destroy()` khi unmount | Gọi 1 lần mỗi trang, luôn cleanup |

## 8. Kiểm tra sau khi cài

1. Lăn chuột hoặc touchpad: trang trượt mượt, dừng từ từ, không giật.
2. Click từng link menu: cuộn mượt tới đúng section, không bị navbar che, quãng xa không "bay".
3. Lăn chuột giữa lúc đang cuộn do click: người dùng giành lại quyền điều khiển, không bị kẹt.
4. Có ScrollTrigger: animation khớp khi cuộn nhanh, cuộn chậm và cuộn ngược.
5. Mở modal: trang phía sau đứng yên. Đóng modal: cuộn lại bình thường.
6. Vùng cuộn con: cuộn được, chạm đáy không kéo trang theo.
7. Đổi route / reload / bấm Back: vị trí cuộn đúng như mong muốn.
8. Thiết bị cảm ứng (hoặc DevTools device mode): vẫn cuộn native bình thường.
9. Không có lỗi trong console.

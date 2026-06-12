# Enhanced Image Preview 技术文档

## 概述

Enhanced Image Preview 是一个高价值（$660）的图像预览增强功能，旨在解决传统图像预览在加载速度、交互体验和资源管理方面的瓶颈。该功能通过预加载、渐进式渲染、智能缓存和手势交互，显著提升用户浏览图像时的流畅度和响应性。本文档将详细阐述其核心实现机制、配置参数、代码示例及注意事项，帮助开发者快速集成并优化图像预览体验。

## 核心特性

1. **渐进式加载**：从低分辨率占位图逐步过渡到全分辨率图像，减少白屏时间。
2. **智能预加载**：基于视口位置和用户行为预测，提前加载相邻图像。
3. **手势交互**：支持缩放、平移、旋转和滑动切换，兼容触摸与鼠标操作。
4. **内存优化**：自动释放不可见图像的显存占用，避免浏览器崩溃。
5. **自定义过渡动画**：支持淡入、缩放、模糊效果等，提升视觉连贯性。

## 详细说明

### 1. 渐进式加载实现

渐进式加载的核心是使用 `BlurHash` 或 `LQIP`（Low Quality Image Placeholder）生成模糊缩略图，然后通过 `IntersectionObserver` 触发高分辨率图像加载。

```javascript
// 示例：使用 BlurHash 实现渐进式加载
const img = new Image();
const placeholder = document.getElementById('placeholder');

// 解码 BlurHash 并渲染为 canvas
const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
const pixels = decodeBlurHash(blurhash, 32, 32);
const canvas = document.createElement('canvas');
canvas.width = 32;
canvas.height = 32;
const ctx = canvas.getContext('2d');
const imageData = ctx.createImageData(32, 32);
imageData.data.set(pixels);
ctx.putImageData(imageData, 0, 0);

// 将 canvas 转换为占位图
placeholder.src = canvas.toDataURL();

// 加载高分辨率图像
img.src = 'https://example.com/high-res-image.jpg';
img.onload = () => {
  // 使用 CSS 过渡实现平滑切换
  placeholder.style.opacity = '0';
  img.style.opacity = '1';
};
```

### 2. 智能预加载策略

预加载基于用户滚动速度和视口位置动态调整。使用 `IntersectionObserver` 监控可见区域，并计算相邻图像的加载优先级。

```javascript
class ImagePreloader {
  constructor(options = {}) {
    this.observer = new IntersectionObserver(this.handleIntersection.bind(this), {
      rootMargin: '200px 0px', // 提前 200px 开始加载
      threshold: 0.1
    });
    this.preloadQueue = [];
    this.maxConcurrent = 3; // 最大并发加载数
    this.activeLoads = 0;
  }

  observe(element) {
    this.observer.observe(element);
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const highResSrc = img.dataset.src;
        if (highResSrc && !img.classList.contains('loaded')) {
          this.enqueue(img, highResSrc);
        }
        this.observer.unobserve(img);
      }
    });
  }

  enqueue(img, src) {
    this.preloadQueue.push({ img, src });
    this.processQueue();
  }

  processQueue() {
    while (this.activeLoads < this.maxConcurrent && this.preloadQueue.length > 0) {
      const { img, src } = this.preloadQueue.shift();
      this.loadImage(img, src);
      this.activeLoads++;
    }
  }

  loadImage(img, src) {
    const tempImg = new Image();
    tempImg.onload = () => {
      img.src = src;
      img.classList.add('loaded');
      this.activeLoads--;
      this.processQueue();
    };
    tempImg.src = src;
  }
}

// 使用示例
const preloader = new ImagePreloader();
document.querySelectorAll('.preview-image').forEach(el => preloader.observe(el));
```

### 3. 手势交互与缩放

使用 `Pointer Events` 统一处理鼠标和触摸事件，支持双指缩放和单指平移。

```javascript
class ImageGestureController {
  constructor(container) {
    this.container = container;
    this.image = container.querySelector('img');
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.lastDistance = 0;
    this.isPinching = false;

    this.setupEvents();
  }

  setupEvents() {
    this.container.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.container.addEventListener('pointermove', this.onPointerMove.bind(this));
    this.container.addEventListener('pointerup', this.onPointerUp.bind(this));
    // 双指缩放通过 touch 事件处理
    this.container.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.container.addEventListener('touchmove', this.onTouchMove.bind(this));
  }

  onPointerDown(e) {
    this.startX = e.clientX - this.translateX;
    this.startY = e.clientY - this.translateY;
    this.isDragging = true;
  }

  onPointerMove(e) {
    if (!this.isDragging) return;
    this.translateX = e.clientX - this.startX;
    this.translateY = e.clientY - this.startY;
    this.updateTransform();
  }

  onPointerUp() {
    this.isDragging = false;
  }

  onTouchStart(e) {
    if (e.touches.length === 2) {
      this.isPinching = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.lastDistance = Math.sqrt(dx * dx + dy * dy);
    }
  }

  onTouchMove(e) {
    if (!this.isPinching || e.touches.length !== 2) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const scaleFactor = distance / this.lastDistance;
    this.scale *= scaleFactor;
    this.scale = Math.min(Math.max(this.scale, 0.5), 5); // 限制缩放范围
    this.lastDistance = distance;
    this.updateTransform();
  }

  updateTransform() {
    this.image.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
  }
}
```

### 4. 内存优化与自动释放

使用 `WeakRef` 和 `FinalizationRegistry` 监控不可见元素，并在其被回收时释放图像资源。

```javascript
class ImageMemoryManager {
  constructor() {
    this.registry = new FinalizationRegistry((heldValue) => {
      // 释放图像 Blob URL 或取消请求
      if (heldValue.blobUrl) {
        URL.revokeObjectURL(heldValue.blobUrl);
      }
    });
  }

  registerImage(img, metadata) {
    const ref = new WeakRef(img);
    this.registry.register(img, metadata);
  }
}
```

## 配置参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `preloadMargin` | Number | 200 | 预加载触发距离（像素） |
| `maxConcurrent` | Number | 3 | 最大并发图像加载数 |
| `minScale` | Number | 0.5 | 最小缩放比例 |
| `maxScale` | Number | 5 | 最大缩放比例 |
| `transitionDuration` | Number | 300 | 渐进式加载过渡时间（毫秒） |
| `blurHashSize` | Number | 32 | BlurHash 解码尺寸 |

## 示例：完整集成

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .image-container {
      position: relative;
      width: 100%;
      height: 400px;
      overflow: hidden;
      background: #f0f0f0;
    }
    .image-container img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: opacity 0.3s ease;
    }
    .placeholder {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      filter: blur(20px);
      transition: opacity 0.3s ease;
    }
  </style>
</head>
<body>
  <div class="image-container" id="preview">
    <img class="placeholder" id="placeholder" alt="">
    <img class="high-res" id="highRes" data-src="https://example.com/image.jpg" alt="Preview">
  </div>

  <script src="blurhash-decoder.min.js"></script>
  <script>
    // 初始化渐进式加载
    const placeholder = document.getElementById('placeholder');
    const highRes = document.getElementById('highRes');
    const container = document.getElementById('preview');

    // 解码 BlurHash
    const blurhash = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
    const pixels = decodeBlurHash(blurhash, 32, 32);
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(32, 32);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
    placeholder.src = canvas.toDataURL();

    // 加载高分辨率图像
    const img = new Image();
    img.onload = () => {
      highRes.src = img.src;
      placeholder.style.opacity = '0';
      highRes.style.opacity = '1';
    };
    img.src = highRes.dataset.src;

    // 初始化手势控制
    new ImageGestureController(container);
  </script>
</body>
</html>
```

## 注意事项

1. **BlurHash 生成**：建议在服务端预生成 BlurHash 字符串，避免客户端计算开销。
2. **跨域问题**：如果图像来自不同域名，需确保服务器返回正确的 CORS 头。
3. **内存泄漏**：在单页应用中，组件卸载时必须取消所有未完成的图像请求和观察器。
4. **性能基准**：对于大量图像（超过 100 张），建议使用虚拟滚动或分页加载，避免 DOM 节点过多。
5. **无障碍性**：为图像添加 `alt` 属性，并在手势交互中提供键盘替代操作（如 `Ctrl+滚轮` 缩放）。
6. **浏览器兼容性**：`IntersectionObserver` 和 `Pointer Events` 在 IE11 中不支持，需提供 polyfill。

## 总结

Enhanced Image Preview 通过渐进式加载、智能预加载、手势交互和内存优化，显著提升了图像浏览的用户体验。开发者可根据实际需求调整配置参数，并结合 BlurHash 等工具实现平滑过渡。该方案适用于相册、电商产品图、地图缩略图等场景，在保证性能的同时提供丰富的交互能力。
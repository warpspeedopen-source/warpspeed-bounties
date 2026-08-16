from pathlib import Path
from dataclasses import dataclass, field
from typing import Callable, Optional, Dict, Any, Tuple
from enum import Enum
from functools import wraps

class PreviewState(Enum):
    IDLE = 'idle'
    ACTIVE = 'active'
    FULL = 'fullscreen'

@dataclass
class ImageDimensions:
    width: int = 1920
    height: int = 1080

@dataclass
class ImagePreview:
    source: str
    state: PreviewState = PreviewState.IDLE
    scale: float = 1.0
    pan_x: float = 0.0
    pan_y: float = 0.0
    index: int = 0
    dimensions: ImageDimensions = field(default_factory=ImageDimensions)
    handlers: Dict[str, Callable] = field(default_factory=dict)

    def __post_init__(self) -> None:
        self.file_path = Path(self.source) if self.source else self.source

    def bind(self, name: str, callback: Callable) -> 'ImagePreview':
        self.handlers[name] = callback
        return self

    def trigger(self, event: str, data: Any = None) -> Optional[bool]:
        handler = self.handlers.get(event)
        if handler:
            handler(event, data, self)
            return True
        return True

    def handle_pinch(self, delta_scale: float) -> 'ImagePreview':
        self.scale += delta_scale
        self.trigger('scale', self.scale)
        return self

    def handle_pan(self, delta_x: float, delta_y: float) -> 'ImagePreview':
        self.pan_x += delta_x
        self.pan_y += delta_y
        self.trigger('pan', (self.pan_x, self.pan_y))
        return self

    def toggle_fullscreen(self) -> 'ImagePreview':
        if self.state.value == PreviewState.IDLE:
            self.state = PreviewState.ACTIVE
        elif self.state.value == PreviewState.ACTIVE:
            self.state = PreviewState.FULL
        return self

    def handle_tap(self, index: int) -> 'ImagePreview':
        if index == -1:
            self.state = PreviewState.IDLE
            self.trigger('close', self.state.value)
        else:
            self.index = index
            self.trigger('navigate', index)
        return self

    def get_position(self) -> Tuple[float, float]:
        return (
            self.pan_x * self.dimensions.width,
            self.pan_y * self.dimensions.height
        )

    def bind_event(self, event_name: str, listener: Callable) -> 'ImagePreview':
        self.bind(event_name, listener)
        return self

    def set_dimensions(self, width: int, height: int) -> 'ImagePreview':
        self.dimensions.width = width
        self.dimensions.height = height
        return self

    def __str__(self) -> str:
        return f"Preview({self.source}, scale={self.scale:.2f}, state={self.state.value})"

class warpSpeed:
    @staticmethod
    def preview(source: str, **kwargs) -> ImagePreview:
        return ImagePreview(source=source, **kwargs)

    @staticmethod
    def open(source: str) -> ImagePreview:
        return ImagePreview(source=source)

    @staticmethod
    def context(source: str) -> ImagePreview:
        p = ImagePreview(source=source)
        p.bind('open', lambda e, d, p: p.state = PreviewState.ACTIVE)
        return p

if __name__ == '__main__':
    p = warpSpeed.preview('/images/hero.jpg', index=0)
    p.set_dimensions(3840, 2160)
    p.bind('scale', lambda e, s, c: print(f"Scaling to {c.scale}x"))
    p.bind('pan', lambda e, d, c: print(f"Panning: {d}"))
    p.state = PreviewState.ACTIVE
    print(p)
    p.handle_pinch(1.2)
    p.handle_pan(50, 50)
    p.toggle_fullscreen()
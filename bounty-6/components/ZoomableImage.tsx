import React, { useRef, useCallback } from 'react'
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  GestureResponderEvent,
  PanResponderGestureState,
  View,
} from 'react-native'
import { ZoomChangeCallback } from '../types'

const SCREEN = Dimensions.get('window')
const MAX_SCALE = 5
const MIN_SCALE = 1
const DOUBLE_TAP_THROTTLE = 300

interface Props {
  uri: string
  onZoomChange?: ZoomChangeCallback
  onSingleTap?: () => void
}

const ZoomableImage: React.FC<Props> = ({ uri, onZoomChange, onSingleTap }) => {
  const scale = useRef(new Animated.Value(1)).current
  const translateX = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(0)).current

  const lastScale = useRef(1)
  const lastTranslateX = useRef(0)
  const lastTranslateY = useRef(0)
  const lastDistance = useRef(0)
  const isZoomed = useRef(false)

  const lastTapTs = useRef(0)
  const lastTapPos = useRef({ x: 0, y: 0 })

  const imageSize = useRef({ width: SCREEN.width, height: SCREEN.height })

  const onImageLoad = useCallback(
    (e: { nativeEvent: { source: { width: number; height: number } } }) => {
      const { width, height } = e.nativeEvent.source
      const ratio = Math.min(SCREEN.width / width, SCREEN.height / height)
      imageSize.current = { width: width * ratio, height: height * ratio }
    },
    [],
  )

  const clampTranslate = useCallback(
    (tx: number, ty: number, currentScale: number) => {
      // Bounds so image edges don't drift past screen edges
      const iw = (imageSize.current.width * currentScale) / 2
      const ih = (imageSize.current.height * currentScale) / 2
      const sw = SCREEN.width / 2
      const sh = SCREEN.height / 2
      return {
        translateX: Math.max(-(iw - sw), Math.min(iw - sw, tx)),
        translateY: Math.max(-(ih - sh), Math.min(ih - sh, ty)),
      }
    },
    [],
  )

  const commitTransform = useCallback(() => {
    ;(scale as any)._value !== undefined &&
      ((lastScale.current = (scale as any)._value),
      (lastTranslateX.current = (translateX as any)._value),
      (lastTranslateY.current = (translateY as any)._value))

    const zoomed = lastScale.current > 1.05
    if (zoomed !== isZoomed.current) {
      isZoomed.current = zoomed
      onZoomChange?.(zoomed)
    }
  }, [onZoomChange, scale, translateX, translateY])

  const getDistance = (touches: any[]) => {
    const dx = touches[0].pageX - touches[1].pageX
    const dy = touches[0].pageY - touches[1].pageY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const getFocalPoint = (touches: any[]) => ({
    x: (touches[0].pageX + touches[1].pageX) / 2,
    y: (touches[0].pageY + touches[1].pageY) / 2,
  })

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e: GestureResponderEvent, gs: PanResponderGestureState) => {
        // Respond to pinch (2 fingers) or pan when zoomed (>1 finger or significant dx)
        return gs.numberActiveTouches === 2 || (lastScale.current > 1 && (Math.abs(gs.dx) > 3 || Math.abs(gs.dy) > 3))
      },
      onPanResponderGrant: (e: GestureResponderEvent) => {
        const touches = e.nativeEvent.touches
        if (touches && touches.length === 2) {
          lastDistance.current = getDistance(touches as any)
        }
      },
      onPanResponderMove: (e: GestureResponderEvent, gs: PanResponderGestureState) => {
        const touches = e.nativeEvent.touches as any

        if (touches && touches.length === 2) {
          const distance = getDistance(touches)
          const focal = getFocalPoint(touches)

          const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, lastScale.current * (distance / lastDistance.current)))
          scale.setValue(newScale)
          lastDistance.current = distance

          if (newScale > 1.05) {
            onZoomChange?.(true)
          }
        } else if (touches && touches.length === 1 && lastScale.current > 1.05) {
          const tx = lastTranslateX.current + gs.dx / lastScale.current
          const ty = lastTranslateY.current + gs.dy / lastScale.current
          const clamped = clampTranslate(tx, ty, lastScale.current)
          translateX.setValue(clamped.translateX)
          translateY.setValue(clamped.translateY)
        }
      },
      onPanResponderRelease: () => {
        // Snap back if scale < 1
        if (lastScale.current < 1) {
          lastScale.current = 1
          Animated.parallel([
            Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
          ]).start()
          lastTranslateX.current = 0
          lastTranslateY.current = 0
          onZoomChange?.(false)
        } else {
          commitTransform()
        }
      },
    }),
  ).current

  const handleDoubleTap = useCallback(
    (x: number, y: number) => {
      if (lastScale.current > 1.05) {
        // Zoom out
        Animated.parallel([
          Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        ]).start()
        lastScale.current = 1
        lastTranslateX.current = 0
        lastTranslateY.current = 0
        onZoomChange?.(false)
      } else {
        // Zoom in at tap point
        const targetScale = 2.5
        const tx = (SCREEN.width / 2 - x) / targetScale
        const ty = (SCREEN.height / 2 - y) / targetScale
        lastScale.current = targetScale
        lastTranslateX.current = tx
        lastTranslateY.current = ty
        Animated.parallel([
          Animated.spring(scale, { toValue: targetScale, useNativeDriver: true }),
          Animated.spring(translateX, { toValue: tx, useNativeDriver: true }),
          Animated.spring(translateY, { toValue: ty, useNativeDriver: true }),
        ]).start()
        onZoomChange?.(true)
      }
    },
    [scale, translateX, translateY, onZoomChange],
  )

  const onTouchEnd = useCallback(
    (e: GestureResponderEvent) => {
      const now = Date.now()
      const { pageX, pageY } = e.nativeEvent
      const dt = now - lastTapTs.current
      const dist = Math.sqrt(
        (pageX - lastTapPos.current.x) ** 2 + (pageY - lastTapPos.current.y) ** 2,
      )

      if (dt < DOUBLE_TAP_THROTTLE && dist < 30) {
        handleDoubleTap(pageX - SCREEN.width / 2, pageY - SCREEN.height / 2)
        lastTapTs.current = 0
      } else {
        lastTapTs.current = now
        lastTapPos.current = { x: pageX, y: pageY }
        if (!onSingleTap) return
        // Defer so double-tap has a chance to fire
        setTimeout(() => {
          if (lastTapTs.current === now) {
            onSingleTap()
          }
        }, DOUBLE_TAP_THROTTLE + 10)
      }
    },
    [handleDoubleTap, onSingleTap],
  )

  return (
    <View style={styles.container} onTouchEnd={onTouchEnd}>
      <Animated.Image
        source={{ uri }}
        style={[
          styles.image,
          {
            transform: [
              { translateX: translateX as any },
              { translateY: translateY as any },
              { scale: scale as any },
            ],
          },
        ]}
        resizeMode="contain"
        onLoad={onImageLoad}
        {...panResponder.panHandlers}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: SCREEN.width,
    height: SCREEN.height,
  },
})

export default ZoomableImage

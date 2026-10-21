import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook to detect prefers-reduced-motion media query
 */
export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const listener = (event) => setReducedMotion(event.matches);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      mediaQuery.addListener(listener);
      return () => mediaQuery.removeListener(listener);
    }
  }, []);

  return reducedMotion;
}

/**
 * Hook to detect touch/mobile devices to simplify 3D parallax
 */
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouch;
}

/**
 * Hook for Intersection Observer viewport reveals
 */
export function useIntersectionReveal(options = { threshold: 0.15, triggerOnce: true }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (options.triggerOnce) {
          observer.unobserve(node);
        }
      } else if (!options.triggerOnce) {
        setIsVisible(false);
      }
    }, options);

    observer.observe(node);
    return () => observer.disconnect();
  }, [options.threshold, options.triggerOnce]);

  return [ref, isVisible];
}

/**
 * Hook for restrained 3D cinematic tilt and perspective tracking
 * - Starts with a subtle 3-5 degree angle
 * - Smoothly tracks cursor on hover
 * - Smoothly settles back toward readable front-facing angle on leave
 */
export function useCinematicTilt(config = {}) {
  const {
    maxTiltX = 4, // Degrees
    maxTiltY = 4, // Degrees
    initialTiltX = 3,
    initialTiltY = -3.5,
    perspective = 1200
  } = config;

  const ref = useRef(null);
  const reducedMotion = useReducedMotion();
  const isTouch = useIsTouchDevice();

  const [tilt, setTilt] = useState({
    x: initialTiltX,
    y: initialTiltY,
    isHovered: false
  });

  const handleMouseMove = useCallback((e) => {
    if (reducedMotion || isTouch || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width; // 0 to 1
    const yRatio = (e.clientY - rect.top) / rect.height; // 0 to 1

    // Convert to degrees: center is 0, edges are ±maxTilt
    const tiltY = (xRatio - 0.5) * (maxTiltY * 2);
    const tiltX = (0.5 - yRatio) * (maxTiltX * 2);

    setTilt({
      x: Math.round(tiltX * 10) / 10,
      y: Math.round(tiltY * 10) / 10,
      isHovered: true
    });
  }, [maxTiltX, maxTiltY, reducedMotion, isTouch]);

  const handleMouseEnter = useCallback(() => {
    if (reducedMotion || isTouch) return;
    setTilt(prev => ({ ...prev, isHovered: true }));
  }, [reducedMotion, isTouch]);

  const handleMouseLeave = useCallback(() => {
    if (reducedMotion || isTouch) return;
    // Settle toward clean, readable front-facing alignment
    setTilt({
      x: 0,
      y: 0,
      isHovered: false
    });
  }, [reducedMotion, isTouch]);

  const style = reducedMotion || isTouch
    ? { transform: 'none' }
    : {
        transform: `perspective(${perspective}px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0)`,
        transition: tilt.isHovered
          ? 'transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)'
          : 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
        transformStyle: 'preserve-3d',
        willChange: 'transform'
      };

  return {
    ref,
    tiltStyle: style,
    onMouseMove: handleMouseMove,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    isHovered: tilt.isHovered
  };
}

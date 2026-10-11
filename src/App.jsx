import React, { useState, useEffect, useRef, useCallback } from 'react'

const LETTERS = ['W', 'E', 'L', 'C', 'O', 'M', 'E', ' ', 'I', 'T', 'Z', 'F', 'I', 'Z', 'Z']

export default function App() {
  const runwayRef = useRef(null)
  const bannerRef = useRef(null)
  const carRef = useRef(null)
  const trailRef = useRef(null)
  const lettersRef = useRef([])

  const [showCard1, setShowCard1] = useState(false) 
  const [showCard2, setShowCard2] = useState(false) 
  const [showCard3, setShowCard3] = useState(false) 
   const [scrollPct, setScrollPct] = useState(0)
  const [isAutoCruising, setIsAutoCruising] = useState(false)

  const motionState = useRef({
    targetProgress: 0,
    currentProgress: 0,
    autoDirection: 1,
  })

  const geometryCache = useRef({
    maxX: 0,
    carWidth: 380,
    letterPositions: [],
  })

  const updateGeometryCache = useCallback(() => {
    const banner = bannerRef.current
    const car = carRef.current
    if (!banner) return

    const bannerRect = banner.getBoundingClientRect()
    const carWidth = car && car.offsetWidth > 0 ? car.offsetWidth : 380
    const maxX = Math.max(100, banner.clientWidth - carWidth)

    const letterPositions = lettersRef.current.map((el) => {
      if (!el) return { centerX: 0, el: null, isSpace: false }
      const rect = el.getBoundingClientRect()
      return {
        centerX: rect.left - bannerRect.left + rect.width / 2,
        el,
        isSpace: el.classList.contains('space'),
      }
    })

    geometryCache.current = {
      maxX,
      carWidth,
      letterPositions,
    }
  }, [])

  useEffect(() => {
    updateGeometryCache()
    const timer = setTimeout(updateGeometryCache, 100)
    window.addEventListener('resize', updateGeometryCache, { passive: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateGeometryCache)
    }
  }, [updateGeometryCache])

  useEffect(() => {
    let animId

    const getScrollProgress = () => {
      const scrollY = window.pageYOffset || window.scrollY || document.documentElement.scrollTop || 0
      const totalHeight = runwayRef.current ? runwayRef.current.offsetHeight : document.documentElement.scrollHeight
      const maxScroll = Math.max(1, totalHeight - window.innerHeight)
      return Math.min(1, Math.max(0, scrollY / maxScroll))
    }

    const onScroll = () => {
      if (isAutoCruising) return
      motionState.current.targetProgress = getScrollProgress()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()

    const onWheel = () => {
      if (isAutoCruising) return
      requestAnimationFrame(onScroll)
    }
    window.addEventListener('wheel', onWheel, { passive: true })

    const renderLoop = () => {
      const state = motionState.current
      const cache = geometryCache.current

      if (isAutoCruising) {
        state.targetProgress += 0.0035 * state.autoDirection
        if (state.targetProgress >= 1) {
          state.targetProgress = 1
          state.autoDirection = -1
        } else if (state.targetProgress <= 0) {
          state.targetProgress = 0
          state.autoDirection = 1
        }
      }

      const diff = state.targetProgress - state.currentProgress
      state.currentProgress += diff * 0.15

      if (Math.abs(diff) < 0.0001) {
        state.currentProgress = state.targetProgress
      }

      const progress = state.currentProgress
      const car = carRef.current
      const trail = trailRef.current
      const banner = bannerRef.current

      const bannerWidth = banner ? banner.clientWidth : window.innerWidth
      const carWidth = cache.carWidth || 380
      const maxX = cache.maxX > 0 ? cache.maxX : Math.max(100, bannerWidth - carWidth)

      if (car) {
        const carX = progress * maxX
        car.style.transform = `translate3d(${carX}px, -50%, 0)`

        if (trail) {
          const trailWidth = Math.max(0, carX + 35)
          trail.style.width = `${trailWidth}px`
        }

        const carFrontX = carX + carWidth * 0.35
        const letters = cache.letterPositions

        for (let i = 0; i < letters.length; i++) {
          const item = letters[i]
          if (!item.el || item.isSpace) continue

          if (carFrontX >= item.centerX) {
            item.el.classList.add('visible')
          } else {
            item.el.classList.remove('visible')
          }
        }

        setShowCard1(progress >= 0.20)
        setShowCard2(progress >= 0.40)
        setShowCard3(progress >= 0.55)

        setScrollPct(Math.round(progress * 100))
      }

      animId = requestAnimationFrame(renderLoop)
    }

    animId = requestAnimationFrame(renderLoop)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', onWheel)
      cancelAnimationFrame(animId)
    }
  }, [isAutoCruising])

  return (
    <div className="scroll-runway" ref={runwayRef}>
      <div className="hero-pinned">
        <div className="stats-top">
          <div className={`card lime ${showCard1 ? 'show' : ''}`}>
            <h2>58%</h2>
            <p>Increase in pick up point use</p>
          </div>

          <div className={`card dark ${showCard2 ? 'show' : ''}`}>
            <h2>27%</h2>
            <p>Increase in pick up point use</p>
          </div>
        </div>

        <div className="banner" ref={bannerRef}>
          <div className="trail" ref={trailRef} />

          <h1 className="welcome">
            {LETTERS.map((letter, idx) =>
              letter === ' ' ? (
                <span
                  key={idx}
                  ref={(el) => (lettersRef.current[idx] = el)}
                  className="letter space"
                >
                  &nbsp;
                </span>
              ) : (
                <span
                  key={idx}
                  ref={(el) => (lettersRef.current[idx] = el)}
                  className="letter"
                >
                  {letter}
                </span>
              )
            )}
          </h1>

          <img
            ref={carRef}
            src="/car-top.png"
            alt="Orange McLaren Sports Car"
            className="car"
            draggable={false}
            onLoad={updateGeometryCache}
          />
        </div>

        <div className="stats-bottom">
          <div className={`card blue ${showCard3 ? 'show' : ''}`}>
            <h2>23%</h2>
            <p>Decreased in customer phone calls</p>
          </div>
        </div>
      </div>

    </div>
  )
}
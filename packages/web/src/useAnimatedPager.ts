/**
 * useAnimatedPager — 动态分页 hook，带进退场动效 + 音效
 *
 * 用法：
 *   const pager = useAnimatedPager({
 *     items: filteredList,           // 全量数据
 *     containerRef,                  // 列表容器 ref（测高度）
 *     observeRef,                    // 可选：额外观测的元素（如右侧面板）
 *     getItemId: (item) => item.id,  // 取 ID 函数
 *     minSize: 8,                    // 最小行数
 *     rowHeight: 68,                 // 每行高度 (px)
 *     overhead: 80,                  // 容器内非行区域高度 (header + pagination)
 *     sound: true,                   // 是否播放音效（或传自定义音效配置）
 *   })
 *
 *   // 渲染：
 *   {pager.items.map(item => (
 *     <Row key={item.id} className={pager.animClass(item.id)} ... />
 *   ))}
 *   <Pagination page={pager.page} pageSize={pager.pageSize}
 *     total={filteredList.length} onPageChange={pager.setPage} />
 */

import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'

// ── Audio engine (Web Audio API, zero external files) ──

let _audioCtx: AudioContext | null = null
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new AudioContext()
  return _audioCtx
}

type SoundPreset = 'trash' | 'pop' | 'none'

interface SoundConfig {
  exit?: SoundPreset
  enter?: SoundPreset
}

function playSound(preset: SoundPreset) {
  if (preset === 'none') return
  try {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') ctx.resume()
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    if (preset === 'trash') {
      const filter = ctx.createBiquadFilter()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, now)
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.25)
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(2000, now)
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.3)
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
      osc.connect(filter).connect(gain).connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.35)
    } else {
      // pop
      osc.type = 'sine'
      osc.frequency.setValueAtTime(300, now)
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.12)
      gain.gain.setValueAtTime(0.06, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.15)
    }
  } catch {
    /* audio not available */
  }
}

// ── CSS keyframes (inject once) ──

const STYLE_ID = '__animated-pager-keyframes'
function ensureStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes ap-trash{0%{opacity:1;transform:translateY(0) scale(1) rotate(0)}30%{opacity:.8;transform:translateY(6px) scale(.96) rotate(1deg)}100%{opacity:0;transform:translateY(50px) scale(.7) rotate(4deg);max-height:0;padding-top:0;padding-bottom:0}}
    @keyframes ap-enter{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
    .ap-exit{animation:ap-trash .4s cubic-bezier(.55,.06,.68,.19) both!important;pointer-events:none!important}
    .ap-enter{animation:ap-enter .3s cubic-bezier(.22,1,.36,1) both}
  `
  document.head.appendChild(style)
}

// ── Hook ──

interface AnimatedPagerOptions<T> {
  /** Full list of items (pre-filtered/sorted) */
  items: T[]
  /** Ref to the list container element (used for height measurement) */
  containerRef: RefObject<HTMLElement | null>
  /** Optional: additional element to observe for height changes */
  observeRef?: RefObject<HTMLElement | null>
  /** Function to extract a unique ID from each item */
  getItemId: (item: T) => string
  /** Minimum number of rows to show (default: 8) */
  minSize?: number
  /** Height of each row in pixels (default: 68) */
  rowHeight?: number
  /** Non-row area height in pixels: header + pagination (default: 80) */
  overhead?: number
  /** Sound config: true for defaults, object for custom, false to disable */
  sound?: boolean | SoundConfig
  /** Exit animation duration in ms (default: 450) */
  exitDuration?: number
  /** Extra dependency that triggers recalculation (e.g., selectedId) */
  recalcOn?: unknown
}

interface AnimatedPagerResult<T> {
  /** Items to render (includes exiting items during animation) */
  items: T[]
  /** Current page size */
  pageSize: number
  /** Current page number */
  page: number
  /** Set current page */
  setPage: (p: number) => void
  /** Get animation CSS class for an item: 'ap-exit' | 'ap-enter' | undefined */
  animClass: (id: string) => string | undefined
}

export function useAnimatedPager<T>(options: AnimatedPagerOptions<T>): AnimatedPagerResult<T> {
  const {
    items,
    containerRef,
    observeRef,
    getItemId,
    minSize = 8,
    rowHeight = 68,
    overhead = 80,
    sound = true,
    exitDuration = 450,
    recalcOn,
  } = options

  const soundConfig: SoundConfig =
    sound === true
      ? { exit: 'trash', enter: 'pop' }
      : sound === false
        ? { exit: 'none', enter: 'none' }
        : sound

  // Inject keyframes CSS
  useEffect(ensureStyles, [])

  // ── Dynamic page size ──
  const [pageSize, setPageSize] = useState(minSize)
  const [page, setPage] = useState(1)

  const recalc = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const rows = Math.max(minSize, Math.floor((el.offsetHeight - overhead) / rowHeight))
    setPageSize(rows)
  }, [containerRef, minSize, overhead, rowHeight])

  useEffect(() => {
    const list = containerRef.current
    const detail = observeRef?.current
    if (!list) return
    recalc()
    const ro = new ResizeObserver(recalc)
    ro.observe(list)
    if (detail) ro.observe(detail)
    return () => ro.disconnect()
  }, [recalc, containerRef, observeRef])

  // Recalc on external trigger (e.g., selectedId changes)
  useEffect(() => {
    void recalcOn
    requestAnimationFrame(() => requestAnimationFrame(recalc))
  }, [recalcOn, recalc])

  // ── Exit/enter animation state ──
  const prevSizeRef = useRef(pageSize)
  const [exitingIds, setExitingIds] = useState<string[]>([])
  const [enteringIds, setEnteringIds] = useState<string[]>([])
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [displaySize, setDisplaySize] = useState(pageSize)

  useEffect(() => {
    const prev = prevSizeRef.current
    prevSizeRef.current = pageSize

    if (pageSize < prev && pageSize >= minSize) {
      // Shrinking → trash animation
      const start = (page - 1) * pageSize
      const exiting = items.slice(start + pageSize, start + prev).map(getItemId)
      if (exiting.length > 0) {
        setExitingIds(exiting)
        playSound(soundConfig.exit ?? 'trash')
        if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
        exitTimerRef.current = setTimeout(() => {
          setExitingIds([])
          setDisplaySize(pageSize)
        }, exitDuration)
      } else {
        setDisplaySize(pageSize)
      }
    } else if (pageSize > prev) {
      // Growing → enter animation
      setDisplaySize(pageSize)
      const start = (page - 1) * pageSize
      const entering = items.slice(start + prev, start + pageSize).map(getItemId)
      if (entering.length > 0) {
        setEnteringIds(entering)
        playSound(soundConfig.enter ?? 'pop')
        if (enterTimerRef.current) clearTimeout(enterTimerRef.current)
        enterTimerRef.current = setTimeout(() => setEnteringIds([]), 350)
      }
    } else {
      setDisplaySize(pageSize)
    }
  }, [pageSize, items, page, getItemId, minSize, exitDuration, soundConfig.exit, soundConfig.enter])

  // ── Build visible items ──
  const visibleSize = exitingIds.length > 0 ? displaySize : pageSize
  const pagedItems = useMemo(() => {
    const start = (page - 1) * visibleSize
    const main = items.slice(start, start + visibleSize)
    if (exitingIds.length > 0) {
      const extras = items.filter(
        (item) =>
          exitingIds.includes(getItemId(item)) &&
          !main.some((m) => getItemId(m) === getItemId(item)),
      )
      return [...main, ...extras]
    }
    return main
  }, [items, page, visibleSize, exitingIds, getItemId])

  const animClass = useCallback(
    (id: string): string | undefined => {
      if (exitingIds.includes(id)) return 'ap-exit'
      if (enteringIds.includes(id)) return 'ap-enter'
      return undefined
    },
    [exitingIds, enteringIds],
  )

  return { items: pagedItems, pageSize, page, setPage, animClass }
}

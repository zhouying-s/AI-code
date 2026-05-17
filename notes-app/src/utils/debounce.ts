export interface DebouncedFn<A extends unknown[]> {
  (...args: A): void
  cancel(): void
  flush(): void
}

export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  delay: number,
): DebouncedFn<A> {
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: A | null = null

  const wrapped = (...args: A) => {
    lastArgs = args
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      if (lastArgs) fn(...lastArgs)
      timer = null
      lastArgs = null
    }, delay)
  }

  wrapped.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
    lastArgs = null
  }

  wrapped.flush = () => {
    if (timer && lastArgs) {
      clearTimeout(timer)
      fn(...lastArgs)
      timer = null
      lastArgs = null
    }
  }

  return wrapped as DebouncedFn<A>
}

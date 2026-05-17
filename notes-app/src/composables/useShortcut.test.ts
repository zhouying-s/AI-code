/* eslint-disable vue/one-component-per-file */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { useShortcut } from './useShortcut'

describe('useShortcut', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('fires handler on matching key combo', () => {
    const handler = vi.fn()
    const C = defineComponent({
      setup() {
        useShortcut('ctrl+j', handler)
        return () => null
      },
    })
    mount(C, { attachTo: document.body })
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', ctrlKey: true }))
    expect(handler).toHaveBeenCalledOnce()
  })

  it('does not fire on different key', () => {
    const handler = vi.fn()
    const C = defineComponent({
      setup() {
        useShortcut('ctrl+j', handler)
        return () => null
      },
    })
    mount(C, { attachTo: document.body })
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    expect(handler).not.toHaveBeenCalled()
  })

  it('cleans up on unmount', () => {
    const handler = vi.fn()
    const C = defineComponent({
      setup() {
        useShortcut('ctrl+j', handler)
        return () => null
      },
    })
    const wrapper = mount(C, { attachTo: document.body })
    wrapper.unmount()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', ctrlKey: true }))
    expect(handler).not.toHaveBeenCalled()
  })
})

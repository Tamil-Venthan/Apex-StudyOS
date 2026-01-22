import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

interface ShortcutConfig {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts(): void {
  const navigate = useNavigate()

  useEffect(() => {
    const shortcuts: ShortcutConfig[] = [
      {
        key: 's',
        ctrl: true,
        action: () => {
          navigate('/subjects')
          toast.success('Opening Subjects...', { icon: '📚' })
        },
        description: 'Go to subjects'
      },
      {
        key: 'c',
        ctrl: true,
        action: () => {
          navigate('/classes')
          toast.success('Opening Classes...', { icon: '🎓' })
        },
        description: 'Go to classes'
      },
      {
        key: 'a',
        ctrl: true,
        action: () => {
          navigate('/analytics')
          toast.success('Opening Analytics...', { icon: '📊' })
        },
        description: 'Go to analytics'
      },

      {
        key: 'h',
        ctrl: true,
        action: () => {
          navigate('/')
          toast.success('Going Home...', { icon: '🏠' })
        },
        description: 'Go to home'
      },
      {
        key: '/',
        ctrl: true,
        action: () => {
          toast('Keyboard shortcuts:', {
            icon: '⌨️',
            duration: 5000,
            style: {
              background: '#1e293b',
              color: '#fff',
              maxWidth: '500px'
            }
          })
          setTimeout(() => {
            toast('Ctrl+H: Home | Ctrl+S: Subjects | Ctrl+C: Classes | Ctrl+A: Analytics', {
              duration: 8000,
              icon: '💡',
              style: {
                background: '#1e293b',
                color: '#e2e8f0',
                fontSize: '13px'
              }
            })
          }, 100)
        },
        description: 'Show keyboard shortcuts'
      }
    ]

    const handleKeyDown = (e: KeyboardEvent): void => {
      // Don't trigger shortcuts when typing in inputs/textareas
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Ctrl+S for save in editors
        if (!(e.ctrlKey && e.key === 's')) {
          return
        }
      }

      shortcuts.forEach((shortcut) => {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey
        const altMatch = shortcut.alt ? e.altKey : !e.altKey

        if (e.key.toLowerCase() === shortcut.key && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault()
          shortcut.action()
        }
      })

      // ESC to close dialogs (handled globally)
      if (e.key === 'Escape') {
        const dialogs = document.querySelectorAll('[role="dialog"]')
        if (dialogs.length > 0) {
          // Click the close button or backdrop
          const closeButton = dialogs[dialogs.length - 1].querySelector('[aria-label="Close"]')
          if (closeButton) {
            ;(closeButton as HTMLElement).click()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [navigate])
}

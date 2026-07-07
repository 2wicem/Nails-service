import { useCallback, useEffect, useRef } from 'react'
import { apiFetch } from '../config/api'

const POLL_MS = 45000

const canNotify = () =>
  typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'

export const requestWorkerNotifications = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  return Notification.requestPermission()
}

const notifyNewBooking = (booking, onOpen) => {
  if (!canNotify()) {
    return
  }

  const when = booking.slot?.label ? ` · ${booking.slot.label}` : ''
  const notification = new Notification('New booking request', {
    body: `${booking.name} — ${booking.service || 'Service'}${when}`,
    tag: `booking-${booking.id}`,
    icon: '/icon.svg',
  })

  notification.onclick = () => {
    window.focus()
    onOpen?.(booking.id)
    notification.close()
  }
}

export const useWorkerNotifications = ({ bookings, enabled, onOpenBooking }) => {
  const seenPendingRef = useRef(new Set())
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    const pendingIds = bookings
      .filter((booking) => booking.status === 'pending')
      .map((booking) => booking.id)

    if (!initializedRef.current) {
      pendingIds.forEach((id) => seenPendingRef.current.add(id))
      initializedRef.current = true
      return undefined
    }

    pendingIds.forEach((id) => {
      if (!seenPendingRef.current.has(id)) {
        seenPendingRef.current.add(id)
        const booking = bookings.find((item) => item.id === id)
        if (booking) {
          notifyNewBooking(booking, onOpenBooking)
        }
      }
    })

    return undefined
  }, [bookings, enabled, onOpenBooking])

  useEffect(() => {
    if (!enabled || !canNotify()) {
      return undefined
    }

    const poll = async () => {
      try {
        const response = await apiFetch('/products/bookings/worker/')
        if (!response.ok) {
          return
        }
        const data = await response.json()
        const pending = (data.bookings || []).filter((booking) => booking.status === 'pending')

        pending.forEach((booking) => {
          if (!seenPendingRef.current.has(booking.id)) {
            seenPendingRef.current.add(booking.id)
            notifyNewBooking(booking, onOpenBooking)
          }
        })
      } catch {
        // Ignore polling errors
      }
    }

    const timer = setInterval(poll, POLL_MS)
    return () => clearInterval(timer)
  }, [enabled, onOpenBooking])
}

export const useNotificationPermission = () => {
  const request = useCallback(() => requestWorkerNotifications(), [])
  return { request, canNotify: canNotify() }
}

/* eslint-disable react/prop-types */
import { useCallback, useEffect, useState } from 'react'
import { todayIso } from '../constants/slots'
import { apiFetch } from '../config/api'
import './css/Dashboard.css'

const MANAGE_PATH = '/products/slots/manage/'
const TOGGLE_PATH = '/products/slots/toggle/'
const OFF_DAY_PATH = '/products/slots/off-day/'

const STATUS_LABELS = {
  available: 'Available',
  booked: 'Booked',
  unavailable: 'Off',
}

const bookingStatusLabel = (slot) => {
  if (slot.status === 'booked' && slot.booking?.status === 'pending') {
    return 'Pending'
  }
  return STATUS_LABELS[slot.status]
}

const WorkerSchedule = ({ onChanged = null }) => {
  const [date, setDate] = useState(todayIso())
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)
  const [status, setStatus] = useState(null)
  const [offDayLoading, setOffDayLoading] = useState(false)

  const loadSlots = useCallback(async () => {
    setLoading(true)
    setStatus(null)

    try {
      const response = await apiFetch(`${MANAGE_PATH}?date=${date}`)
      const text = await response.text()
      const data = text ? JSON.parse(text) : {}

      if (!response.ok) {
        throw new Error(data.error || 'Could not load schedule.')
      }

      setSlots(data.slots || [])
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
      setSlots([])
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    loadSlots()
  }, [loadSlots])

  const shiftDate = (days) => {
    const next = new Date(`${date}T12:00:00`)
    next.setDate(next.getDate() + days)
    setDate(next.toISOString().slice(0, 10))
  }

  const toggleSlot = async (slot) => {
    if (slot.status === 'booked') {
      return
    }

    const nextStatus = slot.status === 'available' ? 'unavailable' : 'available'
    setToggling(slot.start_hour)
    setStatus(null)

    try {
      const response = await apiFetch(TOGGLE_PATH, {
        method: 'POST',
        body: JSON.stringify({
          date,
          start_hour: slot.start_hour,
          status: nextStatus,
        }),
      })

      const text = await response.text()
      const data = text ? JSON.parse(text) : {}

      if (!response.ok) {
        throw new Error(data.error || 'Could not update slot.')
      }

      setSlots((current) =>
        current.map((item) =>
          item.start_hour === slot.start_hour ? { ...item, ...data.slot } : item
        )
      )
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setToggling(null)
    }
  }

  const markOffDay = async () => {
    const confirmed = window.confirm(
      `Mark all open slots off for ${formattedDate}? Existing bookings will stay.`
    )
    if (!confirmed) {
      return
    }

    setOffDayLoading(true)
    setStatus(null)

    try {
      const response = await apiFetch(OFF_DAY_PATH, {
        method: 'POST',
        body: JSON.stringify({ date }),
      })

      const text = await response.text()
      const data = text ? JSON.parse(text) : {}

      if (!response.ok) {
        throw new Error(data.error || 'Could not mark off day.')
      }

      setStatus({ type: 'success', message: data.message })
      await loadSlots()
      onChanged?.()
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setOffDayLoading(false)
    }
  }

  const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="worker-schedule mb-4">
      <div className="worker-schedule-header">
        <div>
          <h2 className="worker-schedule-title">Your 2-hour slots</h2>
          <p className="text-muted mb-0 worker-schedule-subtitle">
            Mark slots as available so clients can book. Booked slots lock automatically.
          </p>
        </div>
        <div className="worker-schedule-nav">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => shiftDate(-1)}>
            ← Prev
          </button>
          <input
            type="date"
            className="form-control form-control-sm worker-schedule-date"
            value={date}
            min={todayIso()}
            onChange={(e) => setDate(e.target.value)}
          />
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => shiftDate(1)}>
            Next →
          </button>
        </div>
      </div>

      <p className="worker-schedule-day text-center text-muted">{formattedDate}</p>

      <div className="worker-schedule-offday-wrap">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary worker-offday-btn"
          onClick={markOffDay}
          disabled={offDayLoading}
        >
          {offDayLoading ? 'Saving...' : 'Mark off day'}
        </button>
      </div>

      {status && (
        <div className={`alert alert-${status.type === 'error' ? 'danger' : 'success'} py-2`}>
          {status.message}
        </div>
      )}

      {loading ? (
        <p className="text-center text-muted">Loading schedule...</p>
      ) : (
        <div className="worker-slot-grid">
          {slots.map((slot) => {
            const isBooked = slot.status === 'booked'
            const isPending = isBooked && slot.booking?.status === 'pending'
            const isAvailable = slot.status === 'available'
            const busy = toggling === slot.start_hour
            const cardStatus = isPending ? 'pending' : slot.status

            return (
              <button
                key={slot.start_hour}
                type="button"
                className={`worker-slot-card worker-slot-card--${cardStatus}`}
                onClick={() => toggleSlot(slot)}
                disabled={isBooked || busy}
                title={
                  isPending
                    ? slot.booking
                      ? `Pending — ${slot.booking.name}`
                      : 'Pending booking'
                    : isBooked
                      ? slot.booking
                        ? `Booked by ${slot.booking.name}`
                        : 'Booked'
                      : isAvailable
                        ? 'Click to mark off'
                        : 'Click to mark available'
                }
              >
                <span className="worker-slot-time">{slot.label}</span>
                <span className="worker-slot-status">{bookingStatusLabel(slot)}</span>
                {isBooked && slot.booking && (
                  <span className="worker-slot-client">
                    {slot.booking.name} · {slot.booking.service || 'Service'}
                  </span>
                )}
                {!isBooked && (
                  <span className="worker-slot-hint">{busy ? 'Saving...' : 'Tap to toggle'}</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default WorkerSchedule

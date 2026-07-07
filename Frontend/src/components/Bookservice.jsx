/* eslint-disable react/prop-types */
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { todayIso } from '../constants/slots'
import {
  SERVICE_VENUES,
  SALON_LOCATION,
  resolveBookingLocation,
  venueLocationLabel,
  venueLocationPlaceholder,
} from '../constants/serviceVenue'
import { useAuth } from '../context/useAuth'
import BrandLogo from './BrandLogo'
import './css/Bookservice.css'

const API_URL = '/api/products/bookings/'
const SLOTS_URL = '/api/products/slots/'
const WORKERS_URL = '/api/products/workers/'

const emptyForm = { name: '', phone: '', location: '', service: '', venue: 'indoor' }

const parseWorkerId = (value) => {
  if (value == null || value === '') {
    return null
  }
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

const formFromUser = (user, service = '') => {
  const base = {
    name: '',
    phone: '',
    location: '',
    service,
    venue: 'indoor',
  }

  if (!user) {
    return base
  }

  return {
    ...base,
    name: user.name || '',
    phone: user.phone || '',
    location: user.default_location || '',
  }
}

const isOutdoorVenue = (venue) => venue === 'outdoor'

const Bookservice = ({
  serviceName = '',
  variant = 'cta',
  label = '',
  workerId = null,
  workerName = '',
}) => {
  const modalId = `booking-modal-${useId().replace(/:/g, '')}`
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [appointmentDate, setAppointmentDate] = useState(todayIso())
  const [availableSlots, setAvailableSlots] = useState([])
  const [selectedSlotId, setSelectedSlotId] = useState(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [workers, setWorkers] = useState([])
  const [workersLoading, setWorkersLoading] = useState(false)
  const [selectedWorkerId, setSelectedWorkerId] = useState(null)

  const prefilledWorkerId = useMemo(
    () =>
      parseWorkerId(workerId) ??
      parseWorkerId(searchParams.get('worker')) ??
      parseWorkerId(searchParams.get('technician')),
    [workerId, searchParams]
  )

  const prefilledService =
    serviceName || searchParams.get('service') || searchParams.get('serviceName') || ''

  const hasFixedService = Boolean(serviceName)

  const selectedWorker = workers.find((entry) => entry.id === selectedWorkerId)
  const selectedWorkerLabel =
    selectedWorker?.name || workerName || (selectedWorkerId ? 'Selected technician' : 'Any available')

  const closeModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  const openModal = useCallback(() => {
    setIsOpen(true)
  }, [])

  const loadWorkers = useCallback(async () => {
    setWorkersLoading(true)

    try {
      const response = await fetch(WORKERS_URL)
      const text = await response.text()
      const data = text ? JSON.parse(text) : {}

      if (!response.ok) {
        throw new Error(data.error || 'Could not load technicians.')
      }

      setWorkers(data.workers || [])
    } catch (error) {
      setWorkers([])
      setStatus({ type: 'error', message: error.message })
    } finally {
      setWorkersLoading(false)
    }
  }, [])

  const loadAvailableSlots = useCallback(async (date, filterWorkerId) => {
    setSlotsLoading(true)

    try {
      const params = new URLSearchParams({ date })
      if (filterWorkerId) {
        params.set('worker_id', String(filterWorkerId))
      }

      const response = await fetch(`${SLOTS_URL}?${params.toString()}`, { credentials: 'include' })
      const text = await response.text()
      const data = text ? JSON.parse(text) : {}

      if (!response.ok) {
        throw new Error(data.error || 'Could not load time slots.')
      }

      setAvailableSlots(data.slots || [])
    } catch (error) {
      setAvailableSlots([])
      setStatus({ type: 'error', message: error.message })
    } finally {
      setSlotsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    setStatus(null)
    setForm(formFromUser(user, prefilledService))
    setAppointmentDate(todayIso())
    setSelectedSlotId(null)
    setSelectedWorkerId(prefilledWorkerId)
    loadWorkers()
  }, [isOpen, user, prefilledService, prefilledWorkerId, loadWorkers])

  useEffect(() => {
    if (!isOpen || workersLoading) {
      return undefined
    }

    if (prefilledWorkerId && workers.some((entry) => entry.id === prefilledWorkerId)) {
      setSelectedWorkerId(prefilledWorkerId)
    }
  }, [isOpen, workers, workersLoading, prefilledWorkerId])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    setSelectedSlotId(null)
    loadAvailableSlots(appointmentDate, selectedWorkerId)
  }, [appointmentDate, selectedWorkerId, isOpen, loadAvailableSlots])

  useEffect(() => {
    if (!isOpen) {
      document.body.classList.remove('modal-open')
      document.body.style.removeProperty('overflow')
      document.body.style.removeProperty('padding-right')
      return undefined
    }

    document.body.classList.add('modal-open')
    document.body.style.overflow = 'hidden'

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeModal()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.classList.remove('modal-open')
      document.body.style.removeProperty('overflow')
      document.body.style.removeProperty('padding-right')
    }
  }, [isOpen, closeModal])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleVenueSelect = (venue) => {
    setForm((current) => ({
      ...current,
      venue,
      location: isOutdoorVenue(venue) ? current.location : '',
    }))
  }

  const handleWorkerSelect = (id) => {
    setSelectedWorkerId(id)
    setSelectedSlotId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (isOutdoorVenue(form.venue) && !form.location.trim()) {
      setStatus({ type: 'error', message: 'Please enter your address for outdoor service.' })
      return
    }

    setLoading(true)
    setStatus(null)

    const service = form.service.trim() || serviceName
    const location = resolveBookingLocation(form.venue, form.location)
    const payload = {
      ...form,
      service,
      location,
      requested_date: appointmentDate,
    }

    if (selectedSlotId) {
      payload.slot_id = selectedSlotId
    } else if (selectedWorkerId) {
      payload.preferred_worker_id = selectedWorkerId
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const text = await response.text()
      let data = {}

      if (text) {
        try {
          data = JSON.parse(text)
        } catch {
          throw new Error(
            response.ok
              ? 'Invalid response from server.'
              : `Server error (${response.status}). Make sure Django is running on port 8000.`
          )
        }
      } else if (!response.ok) {
        throw new Error(
          'Cannot reach the booking server. Start the backend: python manage.py runserver 0.0.0.0:8000'
        )
      }

      if (!response.ok) {
        throw new Error(data.error || 'Booking failed.')
      }

      setStatus({ type: 'success', message: data.message })
      setForm(formFromUser(user, prefilledService))
      setSelectedSlotId(null)
      loadAvailableSlots(appointmentDate, selectedWorkerId)
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  const displayService = form.service || prefilledService
  const today = todayIso()
  const isTodaySelected = appointmentDate === today
  const formattedAppointmentDate = new Date(`${appointmentDate}T12:00:00`).toLocaleDateString(
    undefined,
    { weekday: 'long', month: 'long', day: 'numeric' }
  )
  const triggerLabel =
    label ||
    (workerName
      ? `Book with ${workerName}`
      : variant === 'cta'
        ? 'Book now'
        : variant === 'table'
          ? prefilledService || serviceName
          : 'Book service')

  const handleClose = (event) => {
    event.preventDefault()
    event.stopPropagation()
    closeModal()
  }

  const handleOpen = (event) => {
    event.stopPropagation()
    openModal()
  }

  if (!isOpen) {
    return (
      <div className={`booking-trigger${variant === 'table' ? ' booking-trigger--table' : ''}`}>
        <button
          type="button"
          className={`btn btn-primary booking-btn booking-btn--${variant}`}
          onClick={handleOpen}
          data-booking-trigger
        >
          {triggerLabel}
        </button>
      </div>
    )
  }

  const modal = (
    <>
      <div
        className="modal fade booking-modal show"
        id={modalId}
        tabIndex="-1"
        aria-labelledby={`${modalId}-label`}
        aria-hidden={false}
        style={{ display: 'block' }}
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable booking-modal-dialog">
          <div className="modal-content booking-modal-content">
            <div className="modal-header booking-modal-header">
              <div className="booking-modal-header-main">
                <BrandLogo size="sm" />
                <h2 className="modal-title booking-modal-title" id={`${modalId}-label`}>
                  Book{displayService ? ` — ${displayService}` : ''}
                </h2>
              </div>
              <button
                type="button"
                className="btn-close booking-modal-close"
                onClick={handleClose}
                aria-label="Close"
              />
            </div>
            <div className="modal-body booking-modal-body">
            {user && (
              <p className="booking-prefill-note">
                Booking as <strong>{user.name}</strong>
              </p>
            )}

            {status && (
              <div className={`alert alert-${status.type === 'success' ? 'success' : 'danger'}`}>
                {status.message}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor={`${modalId}-service`} className="form-label">
                  Service
                </label>
                <input
                  type="text"
                  className="form-control"
                  id={`${modalId}-service`}
                  name="service"
                  value={form.service}
                  onChange={handleChange}
                  readOnly={hasFixedService}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor={`${modalId}-name`} className="form-label">
                  Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id={`${modalId}-name`}
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor={`${modalId}-phone`} className="form-label">
                  Phone
                </label>
                <input
                  type="tel"
                  className="form-control"
                  id={`${modalId}-phone`}
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                  inputMode="tel"
                  required
                />
              </div>

              <div className="mb-3">
                <span className="form-label d-block">
                  Technician <span className="booking-slot-optional">(optional)</span>
                </span>
                {workersLoading ? (
                  <p className="booking-worker-empty">Loading technicians...</p>
                ) : workers.length === 0 ? (
                  <p className="booking-worker-empty booking-slot-empty--soft">
                    No technicians listed right now. You can still send your request — we will
                    assign someone and confirm your time.
                  </p>
                ) : (
                  <div className="booking-worker-grid">
                    <button
                      type="button"
                      className={`booking-worker-btn${selectedWorkerId == null ? ' is-selected' : ''}`}
                      onClick={() => handleWorkerSelect(null)}
                    >
                      <span className="booking-worker-name">Any available</span>
                      <span className="booking-worker-hint">First open slot</span>
                    </button>
                    {workers.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        className={`booking-worker-btn${selectedWorkerId === entry.id ? ' is-selected' : ''}`}
                        onClick={() => handleWorkerSelect(entry.id)}
                      >
                        <span className="booking-worker-name">{entry.name}</span>
                        <span className="booking-worker-hint">
                          {entry.is_available
                            ? `${entry.available_slots} open slot${entry.available_slots === 1 ? '' : 's'}`
                            : 'No slots soon'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedWorkerId != null && (
                  <p className="booking-worker-note">
                    Showing times for <strong>{selectedWorkerLabel}</strong>
                  </p>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor={`${modalId}-date`} className="form-label">
                  Appointment date
                </label>
                <div className="booking-date-row">
                  <input
                    type="date"
                    className="form-control"
                    id={`${modalId}-date`}
                    value={appointmentDate}
                    min={today}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className={`booking-date-today-btn${isTodaySelected ? ' is-selected' : ''}`}
                    onClick={() => setAppointmentDate(today)}
                    aria-label="Set appointment date to today"
                    aria-pressed={isTodaySelected}
                  >
                    Today
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <span className="form-label d-block">
                  2-hour time slot <span className="booking-slot-optional">(optional)</span>
                </span>
                <p className="booking-slot-date-note">{formattedAppointmentDate}</p>

                {slotsLoading ? (
                  <p className="booking-slot-empty">Loading available slots...</p>
                ) : availableSlots.length === 0 ? (
                  <p className="booking-slot-empty booking-slot-empty--soft">
                    No open slots for this day
                    {selectedWorkerId ? ` with ${selectedWorkerLabel}` : ''}. You can still send
                    your request — we will confirm a time with you.
                  </p>
                ) : (
                  <div className="booking-slot-grid">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        className={`booking-slot-btn${selectedSlotId === slot.id ? ' is-selected' : ''}`}
                        onClick={() => setSelectedSlotId(slot.id)}
                      >
                        <span className="booking-slot-time">{slot.label}</span>
                        {selectedWorkerId == null && (
                          <span className="booking-slot-worker">{slot.worker_name}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <span className="form-label d-block">Service location</span>
                <div className="booking-venue-grid">
                  {SERVICE_VENUES.map(({ value, label, hint, icon }) => (
                    <button
                      key={value}
                      type="button"
                      className={`booking-venue-btn${form.venue === value ? ' is-selected' : ''}`}
                      onClick={() => handleVenueSelect(value)}
                    >
                      <i className={icon} aria-hidden="true" />
                      <span className="booking-venue-label">{label}</span>
                      <span className="booking-venue-hint">{hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                {isOutdoorVenue(form.venue) ? (
                  <>
                    <label htmlFor={`${modalId}-location`} className="form-label">
                      {venueLocationLabel(form.venue)}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id={`${modalId}-location`}
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      placeholder={venueLocationPlaceholder(form.venue)}
                      autoComplete="street-address"
                      required
                    />
                  </>
                ) : (
                  <div className="booking-salon-info">
                    <span className="form-label d-block">{venueLocationLabel(form.venue)}</span>
                    <p className="booking-salon-info__address">
                      <i className="fa-solid fa-location-dot" aria-hidden="true" />
                      {SALON_LOCATION}
                    </p>
                    <p className="booking-salon-info__hint">
                      Your appointment will be at our salon — no address needed.
                    </p>
                  </div>
                )}
              </div>

              <div className="booking-modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={handleClose}>
                  Quit
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Sending...' : selectedSlotId ? 'Send' : 'Send request'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" aria-hidden="true" />
    </>
  )

  return (
    <div className={`booking-trigger${variant === 'table' ? ' booking-trigger--table' : ''}`}>
      <button
        type="button"
        className={`btn btn-primary booking-btn booking-btn--${variant}`}
        onClick={handleOpen}
        data-booking-trigger
      >
        {triggerLabel}
      </button>
      {createPortal(modal, document.body)}
    </div>
  )
}

export default Bookservice

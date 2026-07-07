import { useEffect, useState } from 'react'
import Bookservice from './Bookservice'

const WORKERS_URL = '/api/products/workers/'

const formatNextSlot = (nextSlot) => {
  if (!nextSlot) {
    return 'No open slots yet'
  }

  const date = new Date(`${nextSlot.date}T12:00:00`)
  const day = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  return `${day} · ${nextSlot.label}`
}

const workerInitials = (name) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

const AvailableWorkers = () => {
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const loadWorkers = async () => {
      try {
        const response = await fetch(WORKERS_URL)
        const text = await response.text()
        const data = text ? JSON.parse(text) : {}

        if (!response.ok) {
          throw new Error(data.error || 'Could not load technicians.')
        }

        if (!cancelled) {
          setWorkers(data.workers || [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
          setWorkers([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadWorkers()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="available-workers" aria-labelledby="available-workers-heading">
      <div className="available-workers-header text-center">
        <span className="available-workers-eyebrow">Our team</span>
        <h2 id="available-workers-heading" className="available-workers-title">
          Available technicians
        </h2>
        <p className="available-workers-sub">
          Book with any open team member — slots update live from their schedules.
        </p>
      </div>

      {loading && <p className="available-workers-status text-center">Loading team...</p>}
      {error && <p className="available-workers-status available-workers-status--error text-center">{error}</p>}

      {!loading && !error && workers.length === 0 && (
        <p className="available-workers-status text-center">Technicians will appear here once staff schedules are set.</p>
      )}

      {!loading && !error && workers.length > 0 && (
        <div className="available-workers-grid">
          {workers.map((worker) => (
            <article
              key={worker.id}
              className={`available-worker-card${worker.is_available ? ' is-available' : ''}`}
            >
              <div className="available-worker-card__top">
                <span className="available-worker-avatar" aria-hidden="true">
                  {workerInitials(worker.name)}
                </span>
                <div className="available-worker-card__meta">
                  <h3 className="available-worker-name">{worker.name}</h3>
                  <p className="available-worker-role">{worker.role_label}</p>
                </div>
                <span
                  className={`available-worker-badge${worker.is_available ? ' is-open' : ''}`}
                >
                  {worker.is_available ? 'Available' : 'Fully booked'}
                </span>
              </div>

              <p className="available-worker-slots">
                {worker.is_available
                  ? `${worker.available_slots} open slot${worker.available_slots === 1 ? '' : 's'} (next 2 weeks)`
                  : 'Check back soon for new openings'}
              </p>
              <p className="available-worker-next">
                <i className="fa-regular fa-clock" aria-hidden="true" />
                {formatNextSlot(worker.next_slot)}
              </p>

              <Bookservice
                variant="card"
                workerId={worker.id}
                workerName={worker.name}
                label={`Book with ${worker.name}`}
              />
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default AvailableWorkers

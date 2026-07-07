export const SLOT_HOURS = [8, 10, 12, 14, 16, 18]

export const formatSlotLabel = (startHour) => {
  const endHour = startHour + 2

  const fmt = (hour) => {
    const suffix = hour < 12 ? 'AM' : 'PM'
    let display = hour % 12
    if (display === 0) display = 12
    return `${display}:00 ${suffix}`
  }

  return `${fmt(startHour)} – ${fmt(endHour)}`
}

export const todayIso = () => new Date().toISOString().slice(0, 10)

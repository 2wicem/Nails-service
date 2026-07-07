/* eslint-disable react/prop-types */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

export const AuthContext = createContext(null)

const AUTH_BASE = '/api/products/auth'

async function parseResponse(response) {
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
      'Cannot reach the server. Start the backend: python manage.py runserver 0.0.0.0:8000'
    )
  }

  if (!response.ok) {
    throw new Error(data.error || 'Request failed.')
  }

  return data
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async ({ silent = false } = {}) => {
    try {
      const response = await fetch(`${AUTH_BASE}/me/`, { credentials: 'include' })
      const text = await response.text()
      const data = text ? JSON.parse(text) : {}

      if (response.ok) {
        setUser(data.user ?? null)
        return data.user ?? null
      }

      if (!silent) {
        setUser(null)
      }
    } catch {
      if (!silent) {
        setUser(null)
      }
    }

    return null
  }, [])

  useEffect(() => {
    refreshUser()
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [refreshUser])

  const login = useCallback(async ({ email, password }) => {
    const response = await fetch(`${AUTH_BASE}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    const data = await parseResponse(response)
    setUser(data.user)
    return data
  }, [])

  const register = useCallback(async (form) => {
    const response = await fetch(`${AUTH_BASE}/register/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    })
    const data = await parseResponse(response)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(async () => {
    const response = await fetch(`${AUTH_BASE}/logout/`, {
      method: 'POST',
      credentials: 'include',
    })
    await parseResponse(response)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser, setUser }),
    [user, loading, login, register, logout, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

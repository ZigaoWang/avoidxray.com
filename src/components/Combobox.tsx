'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'

type Option = { id: string; name: string; brand?: string | null; imageUrl?: string | null }

export default function Combobox({
  options,
  value,
  onChange,
  onCreate,
  placeholder,
  label
}: {
  options: Option[]
  value: string
  onChange: (id: string) => void
  onCreate: (name: string) => Promise<Option>
  placeholder: string
  label: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isSelectingRef = useRef(false) // Track if user is clicking an option

  const selected = options.find(o => o.id === value)

  // Helper to get display name for an option
  const getDisplayName = useCallback((o: Option) => o.brand ? `${o.brand} ${o.name}` : o.name, [])

  const filtered = options.filter(o => {
    const displayName = getDisplayName(o).toLowerCase()
    const q = query.toLowerCase()
    return displayName.includes(q) || o.name.toLowerCase().includes(q)
  })

  // Check for exact match against full display name or just name
  const exactMatch = options.some(o => {
    const displayName = getDisplayName(o).toLowerCase()
    const q = query.toLowerCase()
    return o.name.toLowerCase() === q || displayName === q
  })

  useEffect(() => {
    if (selected && !open) setQuery(getDisplayName(selected))
  }, [selected, open, getDisplayName])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleCreate = async () => {
    if (!query.trim() || exactMatch) return
    setCreating(true)
    const created = await onCreate(query.trim())
    onChange(created.id)
    setOpen(false)
    setCreating(false)
  }

  const handleSelect = (o: Option) => {
    isSelectingRef.current = true
    onChange(o.id)
    setQuery(getDisplayName(o))
    setOpen(false)
    // Reset the flag after a short delay
    setTimeout(() => { isSelectingRef.current = false }, 200)
  }

  const handleBlur = () => {
    setTimeout(() => {
      // If user just clicked an option, don't interfere
      if (isSelectingRef.current) return

      if (!query.trim()) {
        // If query is empty and we have a selected value, restore it
        if (selected) {
          setQuery(getDisplayName(selected))
        }
        setOpen(false)
        return
      }

      // Auto-select exact match (check both name and full display name)
      const match = options.find(o => {
        const displayName = getDisplayName(o).toLowerCase()
        const q = query.toLowerCase()
        return o.name.toLowerCase() === q || displayName === q
      })

      if (match) {
        onChange(match.id)
        setQuery(getDisplayName(match))
      } else if (filtered.length === 1) {
        // If only one option matches, auto-select it
        onChange(filtered[0].id)
        setQuery(getDisplayName(filtered[0]))
      } else if (selected) {
        // If no match and we have a previous selection, restore it
        setQuery(getDisplayName(selected))
      }
      // Don't auto-create on blur - user must explicitly click "+ Add"
      setOpen(false)
    }, 150)
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-neutral-500 text-xs uppercase tracking-wider mb-2 font-medium">{label}</label>

      {/* Selected item display with image */}
      {selected && !open && selected.imageUrl && (
        <div className="absolute left-3 top-[38px] z-10 pointer-events-none">
          <div className="relative w-6 h-6">
            <Image
              src={selected.imageUrl}
              alt=""
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => { setQuery(''); setOpen(true) }}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full p-3 bg-neutral-900 text-white border border-neutral-800 focus:border-[#D32F2F] focus:outline-none ${
          selected?.imageUrl && !open ? 'pl-11' : ''
        }`}
      />
      {open && (
        <div className="absolute z-10 w-full mt-1 bg-neutral-900 border border-neutral-800 max-h-64 overflow-auto">
          {filtered.map(o => (
            <button
              key={o.id}
              type="button"
              onMouseDown={() => { isSelectingRef.current = true }} // Set flag before blur fires
              onClick={() => handleSelect(o)}
              className="w-full px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors flex items-center gap-2"
            >
              {o.imageUrl && (
                <div className="relative w-8 h-8 flex-shrink-0">
                  <Image
                    src={o.imageUrl}
                    alt=""
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <span>{getDisplayName(o)}</span>
            </button>
          ))}
          {query && !exactMatch && (
            <button
              type="button"
              onMouseDown={() => { isSelectingRef.current = true }}
              onClick={handleCreate}
              disabled={creating}
              className="w-full px-3 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-800 hover:text-[#D32F2F] border-t border-neutral-800 transition-colors"
            >
              {creating ? 'Adding...' : `+ Add "${query}"`}
            </button>
          )}
          {!query && filtered.length === 0 && (
            <div className="px-3 py-2 text-neutral-600 text-sm">Type to search</div>
          )}
        </div>
      )}
    </div>
  )
}

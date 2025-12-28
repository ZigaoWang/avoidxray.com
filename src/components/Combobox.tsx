'use client'
import { useState, useRef, useEffect } from 'react'

type Option = { id: string; name: string; brand?: string | null }

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

  const selected = options.find(o => o.id === value)
  const filtered = options.filter(o =>
    o.name.toLowerCase().includes(query.toLowerCase()) ||
    (o.brand && o.brand.toLowerCase().includes(query.toLowerCase()))
  )
  const exactMatch = options.some(o => o.name.toLowerCase() === query.toLowerCase())

  useEffect(() => {
    if (selected && !open) setQuery(selected.brand ? `${selected.brand} ${selected.name}` : selected.name)
  }, [selected, open])

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

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-neutral-300 mb-2 text-sm">{label}</label>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full p-3 rounded-lg bg-neutral-800 text-white border border-neutral-700 focus:border-emerald-500 focus:outline-none transition-colors"
      />
      {open && (
        <div className="absolute z-10 w-full mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl max-h-60 overflow-auto">
          {filtered.map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => { onChange(o.id); setQuery(o.brand ? `${o.brand} ${o.name}` : o.name); setOpen(false) }}
              className="w-full px-4 py-3 text-left text-white hover:bg-neutral-700 transition-colors"
            >
              {o.brand ? `${o.brand} ${o.name}` : o.name}
            </button>
          ))}
          {query && !exactMatch && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="w-full px-4 py-3 text-left text-emerald-400 hover:bg-neutral-700 border-t border-neutral-700 transition-colors"
            >
              {creating ? 'Adding...' : `+ Add "${query}"`}
            </button>
          )}
          {!query && filtered.length === 0 && (
            <div className="px-4 py-3 text-neutral-500">Type to search or add new</div>
          )}
        </div>
      )}
    </div>
  )
}

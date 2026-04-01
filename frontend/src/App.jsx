import { useState, useEffect, useCallback } from 'react'
import './App.css'
import Contact from './components/Contacts'
import Toast from './components/Toast'
import personService from './services/persons'

const PAGE_SIZE = 5
const PHONE_REGEX = /^[+]?[\d\s\-().]{7,15}$/

function validate(name, number) {
  const errors = {}
  if (!name.trim()) errors.name = 'Name is required'
  else if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters'
  if (!number.trim()) errors.number = 'Number is required'
  else if (!PHONE_REGEX.test(number.trim())) errors.number = 'Invalid format (e.g. 040-1234567 or +1-555-0100)'
  return errors
}

export default function App() {
  const [persons, setPersons] = useState([])

  // Add form
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [formErrors, setFormErrors] = useState({})

  // Edit
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editNumber, setEditNumber] = useState('')

  // Search / sort / page
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // Toasts
  const [toasts, setToasts] = useState([])

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  // ── Load contacts ──────────────────────────────────────────────────────────
  useEffect(() => {
    personService.getAll().then(data => {
      if (Array.isArray(data)) setPersons(data)
      else addToast('Failed to load contacts', 'error')
    }).catch(() => addToast('Could not reach server', 'error'))
  }, [])

  // ── Derived list (filter → sort → paginate) ────────────────────────────────
  const filtered = persons
    .filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.number.includes(searchTerm)
    )
    .sort((a, b) =>
      sortOrder === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Reset to page 1 when search changes
  useEffect(() => { setCurrentPage(1) }, [searchTerm])

  // ── Add contact ────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault()
    const errors = validate(name, number)
    if (Object.keys(errors).length) { setFormErrors(errors); return }

    const duplicate = persons.find(p => p.name.toLowerCase() === name.trim().toLowerCase())
    if (duplicate) {
      setFormErrors({ name: `${name.trim()} is already in the phonebook` })
      return
    }

    personService.create({ name: name.trim(), number: number.trim() })
      .then(saved => {
        setPersons(prev => [...prev, saved])
        setName('')
        setNumber('')
        setFormErrors({})
        addToast(`${saved.name} added successfully`, 'success')
      })
      .catch(err => {
        const msg = err.response?.data?.error || 'Failed to add contact'
        addToast(msg, 'error')
      })
  }

  // ── Edit contact ───────────────────────────────────────────────────────────
  const handleEdit = (person) => {
    setEditId(person.id)
    setEditName(person.name)
    setEditNumber(person.number)
  }

  const handleCancelEdit = () => {
    setEditId(null)
    setEditName('')
    setEditNumber('')
  }

  const handleUpdate = () => {
    const errors = validate(editName, editNumber)
    if (Object.keys(errors).length) {
      addToast(Object.values(errors)[0], 'warning')
      return
    }

    personService.update(editId, { name: editName.trim(), number: editNumber.trim() })
      .then(updated => {
        setPersons(prev => prev.map(p => p.id === editId ? updated : p))
        addToast(`${updated.name} updated`, 'success')
        handleCancelEdit()
      })
      .catch(err => {
        const msg = err.response?.data?.error || 'Failed to update contact'
        addToast(msg, 'error')
      })
  }

  // ── Delete contact ─────────────────────────────────────────────────────────
  const handleDelete = (id, personName) => {
    if (!window.confirm(`Delete ${personName}?`)) return
    personService.remove(id)
      .then(() => {
        setPersons(prev => prev.filter(p => p.id !== id))
        addToast(`${personName} deleted`, 'info')
      })
      .catch(() => {
        setPersons(prev => prev.filter(p => p.id !== id))
        addToast(`${personName} was already removed`, 'warning')
      })
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="app-container">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="app-header">
        <h1>📞 Phonebook</h1>
        <p>{persons.length} contact{persons.length !== 1 ? 's' : ''} saved</p>
      </div>

      {/* ── Add Form ── */}
      <div className="card">
        <h2>Add New Contact</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>Name</label>
            <input
              value={name}
              onChange={e => { setName(e.target.value); setFormErrors(prev => ({ ...prev, name: undefined })) }}
              placeholder="Full name"
              className={formErrors.name ? 'error' : ''}
            />
            {formErrors.name && <div className="field-error">{formErrors.name}</div>}
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              value={number}
              onChange={e => { setNumber(e.target.value); setFormErrors(prev => ({ ...prev, number: undefined })) }}
              placeholder="e.g. 040-1234567"
              className={formErrors.number ? 'error' : ''}
            />
            {formErrors.number
              ? <div className="field-error">{formErrors.number}</div>
              : <div className="form-hint">Accepted: 040-1234567, +1-555-0100, etc.</div>
            }
          </div>
          <button type="submit" className="btn btn-primary">+ Add Contact</button>
        </form>
      </div>

      {/* ── Contact List ── */}
      <div className="card">
        <h2>Contacts</h2>

        <div className="toolbar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name or number…"
            />
          </div>
          <button
            className="sort-btn"
            onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑ A–Z' : '↓ Z–A'}
          </button>
        </div>

        <div className="contact-count">
          {filtered.length === persons.length
            ? `${persons.length} contact${persons.length !== 1 ? 's' : ''}`
            : `${filtered.length} of ${persons.length} contacts`}
        </div>

        {paginated.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📭</div>
            <p>{searchTerm ? 'No contacts match your search.' : 'No contacts yet. Add one above!'}</p>
          </div>
        ) : (
          <ul className="contact-list">
            {paginated.map(person => (
              <Contact
                key={person.id}
                person={person}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isEditing={editId === person.id}
                editName={editName}
                editNumber={editNumber}
                onEditName={setEditName}
                onEditNumber={setEditNumber}
                onUpdate={handleUpdate}
                onCancelEdit={handleCancelEdit}
              />
            ))}
          </ul>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setCurrentPage(p => p - 1)} disabled={safePage === 1}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`page-btn ${safePage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button className="page-btn" onClick={() => setCurrentPage(p => p + 1)} disabled={safePage === totalPages}>›</button>
          </div>
        )}
      </div>
    </div>
  )
}

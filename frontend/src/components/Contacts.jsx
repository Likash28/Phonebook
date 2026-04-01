const Contact = ({ person, onEdit, onDelete, isEditing, editName, editNumber, onEditName, onEditNumber, onUpdate, onCancelEdit }) => {
  const initial = person.name ? person.name[0].toUpperCase() : '?'

  if (isEditing) {
    return (
      <li className="edit-form">
        <div className="form-group">
          <label>Name</label>
          <input value={editName} onChange={e => onEditName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Number</label>
          <input value={editNumber} onChange={e => onEditNumber(e.target.value)} placeholder="e.g. 040-1234567" />
        </div>
        <div className="edit-form-actions">
          <button className="btn btn-success" onClick={onUpdate}>Save</button>
          <button className="btn btn-ghost" onClick={onCancelEdit}>Cancel</button>
        </div>
      </li>
    )
  }

  return (
    <li className="contact-item">
      <div className="contact-avatar">{initial}</div>
      <div className="contact-info">
        <div className="contact-name">{person.name}</div>
        <div className="contact-number">{person.number}</div>
      </div>
      <div className="contact-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(person)}>Edit</button>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(person.id, person.name)}>Delete</button>
      </div>
    </li>
  )
}

export default Contact

require('dotenv').config()
const express = require("express")
const cors = require("cors")
const app = express()
const morgan = require('morgan')
const PhoneBook = require('./models/person.js')

app.set('json spaces', 2)
app.use(express.json())
app.use(cors())
app.use(express.static('dist'))

morgan.token('body', (req) => JSON.stringify(req.body))
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

// GET all contacts
app.get('/api/persons', (req, res, next) => {
    PhoneBook.find({})
        .then(result => res.json(result))
        .catch(error => next(error))
})

// GET single contact
app.get('/api/persons/:id', (req, res, next) => {
    PhoneBook.findById(req.params.id)
        .then(person => {
            if (person) res.json(person)
            else res.status(404).json({ error: 'Contact not found' })
        })
        .catch(error => next(error))
})

// POST — create contact (with duplicate name check)
app.post('/api/persons', (req, res, next) => {
    const { name, number } = req.body
    if (!name || !number) {
        return res.status(400).json({ error: 'Name and number are required' })
    }
    PhoneBook.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } })
        .then(existing => {
            if (existing) {
                return res.status(409).json({ error: `${name.trim()} is already in the phonebook` })
            }
            const person = new PhoneBook({ name: name.trim(), number: number.trim() })
            return person.save().then(saved => res.json(saved))
        })
        .catch(error => next(error))
})

// PUT — update contact
app.put('/api/persons/:id', (req, res, next) => {
    const { name, number } = req.body
    if (!name || !number) {
        return res.status(400).json({ error: 'Name and number are required' })
    }
    PhoneBook.findByIdAndUpdate(
        req.params.id,
        { name: name.trim(), number: number.trim() },
        { new: true, runValidators: true, context: 'query' }
    )
        .then(updated => {
            if (updated) res.json(updated)
            else res.status(404).json({ error: 'Contact not found' })
        })
        .catch(error => next(error))
})

// DELETE contact
app.delete('/api/persons/:id', (req, res, next) => {
    PhoneBook.findByIdAndDelete(req.params.id)
        .then(() => res.status(204).end())
        .catch(error => next(error))
})

// 404 fallback
app.use((req, res) => {
    res.status(404).json({ error: 'Unknown endpoint' })
})

// Error handler
app.use((error, req, res, next) => {
    console.error(error.message)
    if (error.name === 'CastError') {
        return res.status(400).json({ error: 'Malformatted id' })
    }
    if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})

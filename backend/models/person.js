require('dotenv').config()
const mongoose = require('mongoose')
const url = process.env.MONGODB_URI

mongoose.set('strictQuery', false)

mongoose.connect(url, { family: 4 }).then(() => {
    console.log('Connected to MongoDB')
}).catch(() => {
    console.log('Failed to connect to MongoDB')
})

const phonebookSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minLength: 2,
        trim: true
    },
    number: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^[+]?[\d\s\-().]{7,15}$/.test(v)
            },
            message: props => `${props.value} is not a valid phone number`
        }
    }
})

phonebookSchema.set('toJSON', {
    transform: (document, returnedObj) => {
        returnedObj.id = returnedObj._id.toString()
        delete returnedObj._id
        delete returnedObj.__v
    }
})

module.exports = mongoose.model('PhoneBook', phonebookSchema)

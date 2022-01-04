require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const res = require('express/lib/response')
const mongoose = require('mongoose')
const Person = require('./models/person')
const app = express()

morgan.token('postObject', function(req, res) {
    if (req.method === 'POST') {
        return JSON.stringify(req.body)
    } else {
        return ''
    }
})

const errorHandler = (error, request, response, next) => {
    console.error(error.name)
  
    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message})
    }

    next(error)
}

app.use(cors())
app.use(express.json())
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :postObject'))
app.use(express.static('build'))

app.get('/', (request, response) => {
    response.send('<h1>Phonebook server. Are you supposed to be back here?</h1>')
})

app.get('/info', (request, response) => {
    Person.countDocuments({})
        .then(docCount => {
            response.send(`<p> Phonebook currently has 
            ${docCount} 
            people in it </p> <p>${new Date()}</p>`)})   
})

app.get('/api/persons', (request, response) => {
    Person.find({}).then(person => {
        response.json(person)
    })    
    
})

app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(`${request.params.id}`)
    .then(person => {
        if (person) {
            response.json(person)
        } else {
            response.status(404).end()
        }  
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
    docId = request.params.id
    Person.findByIdAndDelete(docId).then((result)=> {
        response.statusMessage = 'Data successfully deleted'
        response.status(202).end()
    })
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
    const body = request.body
    const person = new Person({
        name: body.name,
        number: body.number
    })
    
    console.log(person.name)
    Person.exists( { name: `${person.name}`}).then((answer) => {
        
            person.save().then(result => {
                console.log(`added ${person.name} ${person.number} to phonebook`)
                response.json(result)
                })
                .catch(error => next(error))
              
    })
    .catch(error => next(error))   
})

app.put('/api/persons/:id', (request, response, next) => {
    docId = request.params.id
    const body = request.body
    const person = {
        name: body.name,
        number: body.number
    }

    Person.findByIdAndUpdate(request.params.id, {number: body.number}, {runValidators: true, context: 'query', new:true})
        .exec()
        .then(updatedPerson => {
            if (!updatedPerson) {
                response.statusMessage = `${person.name} not found`
                response.status(404).end()
            } else {
                response.status(202).json(updatedPerson)
            }
        })
        .catch(error => next(error)) 
})

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
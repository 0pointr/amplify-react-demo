/* src/App.js */
import React, { useEffect, useState } from 'react'
import { Amplify, API, graphqlOperation, Auth } from 'aws-amplify'
import { createTodo } from './graphql/mutations'
import { listTodos } from './graphql/queries'

import { withAuthenticator, Button, Heading, View, Text, TextField } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

import awsExports from "./aws-exports";
Amplify.configure(awsExports);


const initialState = { name: '', description: '' }

const App = ({signOut, user}) => {
  const [formState, setFormState] = useState(initialState)
  const [todos, setTodos] = useState([])

  useEffect(() => {
    fetchTodos()
  }, [])

  function setInput(key, value) {
    setFormState({ ...formState, [key]: value })
  }

  async function fetchTodos() {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const todoData = await API.graphql(graphqlOperation(
          listTodos, 
          {filter: {userId: { eq: user.attributes.email} }}
        )
      );
      const todos = todoData.data.listTodos.items
      setTodos(todos)
    } catch (err) { console.log('error fetching todos') }
  }

  async function addTodo() {
    try {
      if (!formState.name || !formState.description) return
      const user = await Auth.currentAuthenticatedUser();
      const todo = { ...formState, userId: user.attributes.email }
      console.log(`todo: ${JSON.stringify(todo)}\nuser:${user.attributes.email}`)
      setTodos([...todos, todo])
      setFormState(initialState)
      await API.graphql(graphqlOperation(createTodo, {input: todo}))
    } catch (err) {
      console.log('error creating todo:', err)
    }
  }

  return (
    <View style={styles.container}>
      <Heading level={2}>Hello {user.attributes.email}</Heading>
      <Button onClick={signOut}>Sign out</Button>
      <h2>Amplify Todos</h2>
        <TextField
          onChange={event => setInput('name', event.target.value)}
          style={styles.input}
          value={formState.name}
          placeholder="Name"
        />
        <TextField
          onChange={event => setInput('description', event.target.value)}
          style={styles.input}
          value={formState.description}
          placeholder="Description"
        />
        <button style={styles.button} onClick={addTodo}>Create Todo</button>
        {
          todos.map((todo, index) => (
            <View key={todo.id ? todo.id : index} style={styles.todo}>
              <Text style={styles.todoName}>{todo.name}</Text>
              <Text style={styles.todoDescription}>{todo.description}</Text>
            </View>
          ))
        }
    </View>
  )
}

const styles = {
  container: { width: 400, margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 20 },
  todo: {  marginBottom: 15 },
  input: { border: 'none', backgroundColor: '#ddd', marginBottom: 10, padding: 8, fontSize: 18 },
  todoName: { fontSize: 20, fontWeight: 'bold' },
  todoDescription: { marginBottom: 0 },
  button: { backgroundColor: 'black', color: 'white', outline: 'none', fontSize: 18, padding: '12px 0px' }
}

export default withAuthenticator(App);
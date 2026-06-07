import {render} from 'preact'
import './styles.css'
import {App} from './App.jsx'

const root = document.getElementById('root')
if (root) render(<App />, root)

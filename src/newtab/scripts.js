import {h, render} from 'preact'
import '#/newtab/styles.css'
import {App} from '#/newtab/App'

const root = document.getElementById('root')
if (root) render(h(App, null), root)

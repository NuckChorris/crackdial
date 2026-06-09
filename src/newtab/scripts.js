import {h, render} from 'preact'
import '#/newtab/styles.css'
import {App} from '#/newtab/App'
import {initFavicon} from '#/newtab/shared/favicon'

const root = document.getElementById('root')
if (root) render(h(App, null), root)

initFavicon()

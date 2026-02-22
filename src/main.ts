import App from './App.svelte'

const target = document.getElementById('app') ?? document.body

(App as any)({ target })

export default null

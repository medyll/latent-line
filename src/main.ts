import App from './App.svelte'

const target = (document.getElementById('app') ?? document.body) as Element;
;

(App as any)({ target });

export default null;

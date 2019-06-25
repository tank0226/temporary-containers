import clonedeep from 'lodash.clonedeep';
window.clonedeep = clonedeep;

export default function init(App) {
  // Workaround until parcel supports externals
  // https://github.com/parcel-bundler/parcel/issues/144

  const loadStylesheet = (href) => {
    return new Promise(resolve => {
      const stylesheet = document.createElement('link');
      stylesheet.rel = 'stylesheet';
      stylesheet.type = 'text/css';
      stylesheet.href = href;
      stylesheet.onload = resolve;
      document.head.appendChild(stylesheet);
    });
  };

  const loadScript = (href) => {
    return new Promise(resolve => {
      const script = document.createElement('script');
      script.async = false;
      script.src = href;
      script.onload = resolve;
      document.body.appendChild(script);
    });
  };

  Promise.all([
    loadStylesheet('/fontello/fontello-embedded.css'),
    loadStylesheet('/semantic/semantic.min.css'),
    loadScript('/jquery/jquery.min.js'),
    loadScript('/jquery/jquery.address.js'),
    loadScript('/semantic/semantic.min.js'),
    loadScript('/vue/vue.runtime.min.js'),
    import('./shared.js')
  ]).then(promises => {
    Vue.mixin({
      methods: {
        t: browser.i18n.getMessage
      }
    });

    const shared = promises.pop().default;
    new Vue(shared(App));
  });
}
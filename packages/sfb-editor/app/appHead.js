(function() {
    if (!process.env.HOT) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = './dist/style.css';
      // HACK: Writing the script path should be done with webpack
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }());
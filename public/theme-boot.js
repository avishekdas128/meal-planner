// Runs before first paint (loaded as a blocking script in <head>) so a dark-mode user never sees a light flash.
try { document.documentElement.dataset.theme = JSON.parse(localStorage.getItem('kkb:v1')).theme || 'dark'; } catch { document.documentElement.dataset.theme = 'dark'; }

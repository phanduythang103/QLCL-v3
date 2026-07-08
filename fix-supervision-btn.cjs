const fs = require('fs');
const path = require('path');
const dir = 'd:/OneDrive/Code webapp/QLCL-v3/components';

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.tsx')) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf-8');
    
    // We want to add w-full lg:w-auto to the Thêm giám sát mới button.
    const regex = /(className=")([^"]*)(">\s*<Plus[^>]*\/>\s*Thêm giám sát mới\s*<\/button>)/g;
    
    let changed = false;
    content = content.replace(regex, (match, p1, classes, p3) => {
      if (classes.includes('w-full')) return match;
      changed = true;
      return `${p1}w-full lg:w-auto ${classes}${p3}`;
    });

    if (changed) {
      fs.writeFileSync(p, content, 'utf-8');
      console.log('Updated ' + file);
    }
  }
});

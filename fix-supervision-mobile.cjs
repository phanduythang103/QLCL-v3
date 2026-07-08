const fs = require('fs');
const path = require('path');
const dir = 'd:/OneDrive/Code webapp/QLCL-v3/components';

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.tsx')) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf-8');
    
    // Replace flex-nowrap overflow-x-auto no-scrollbar with flex-wrap md:flex-nowrap
    // Because md:flex-nowrap will keep it on one line for tablet and desktop, 
    // and flex-wrap will allow it to wrap on mobile.
    
    const regex1 = /className="flex flex-nowrap overflow-x-auto no-scrollbar items-center gap-(\d+)([^"]*)"/g;
    let changed = false;

    content = content.replace(regex1, (match, gap, rest) => {
      changed = true;
      return `className="flex flex-wrap lg:flex-nowrap items-center gap-${gap}${rest}"`;
    });

    if (changed) {
      fs.writeFileSync(p, content, 'utf-8');
      console.log('Updated ' + file);
    }
  }
});

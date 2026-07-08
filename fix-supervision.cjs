const fs = require('fs');
const path = require('path');
const dir = 'd:/OneDrive/Code webapp/QLCL-v3/components';

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.tsx')) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf-8');
    
    const search1 = 'className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-[32px] border border-slate-100 shadow-sm"';
    const replace1 = 'className="flex flex-nowrap overflow-x-auto no-scrollbar items-center gap-4 bg-white p-2 rounded-[32px] border border-slate-100 shadow-sm"';
    
    // Some might not have shadow-sm or exact same classes, let's also check a generic regex
    const regex = /className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-\[32px\]([^"]*)"/g;
    const replaceRegex = 'className="flex flex-nowrap overflow-x-auto no-scrollbar items-center gap-4 bg-white p-2 rounded-[32px]$1"';

    if (content.match(regex)) {
      content = content.replace(regex, replaceRegex);
      fs.writeFileSync(p, content, 'utf-8');
      console.log('Updated ' + file);
    }
  }
});

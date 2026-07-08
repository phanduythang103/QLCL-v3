const fs = require('fs');
const path = require('path');
const dir = 'd:/OneDrive/Code webapp/QLCL-v3/components';

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.tsx')) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf-8');
    let changed = false;

    // We look for 'className="flex flex-wrap items-center gap-' or similar in the right context
    const regex1 = /className="flex flex-wrap items-center gap-(\d+)([^"]*)"/g;
    
    // Only replace if it's the filter wrapper, which usually contains DateRangeFilter
    // Actually it's safe to just replace flex-wrap with flex-nowrap overflow-x-auto no-scrollbar for all flex-wrap items-center gap-X wrappers that are immediately before DateRangeFilter
    
    // A simpler way: just replace all `flex flex-wrap items-center` in the header section.
    // Let's just do a global replace for `flex flex-wrap items-center gap-` with `flex flex-nowrap overflow-x-auto no-scrollbar items-center gap-` if they have `bg-white` or just `gap-3`/`gap-4`.
    
    content = content.replace(regex1, (match, gap, rest) => {
      // Don't replace if it already has overflow-x-auto
      if (rest.includes('overflow-x-auto')) return match;
      changed = true;
      return `className="flex flex-nowrap overflow-x-auto no-scrollbar items-center gap-${gap}${rest}"`;
    });

    if (changed) {
      fs.writeFileSync(p, content, 'utf-8');
      console.log('Updated ' + file);
    }
  }
});

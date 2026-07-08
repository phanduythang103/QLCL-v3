const fs = require('fs');
const path = require('path');
const dir = 'd:/OneDrive/Code webapp/QLCL-v3/components';

function replaceInFile(filename, search, replace) {
  const p = path.join(dir, filename);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf-8');
  content = content.replace(/\r\n/g, '\n');
  if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(p, content, 'utf-8');
    console.log('Updated ' + filename);
  } else {
    console.log('Skipped ' + filename + ' (pattern not found)');
  }
}

replaceInFile('BedUsageModule.tsx', 
  '      <div className="flex flex-col gap-4">', 
  '      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">'
);

replaceInFile('ExamTimeModule.tsx', 
  '      <div className="flex flex-col gap-4">\n        <div className="flex items-center gap-3">', 
  '      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">\n        <div className="flex items-center gap-3">'
);

replaceInFile('NKVMModule.tsx', 
  '      <div className="flex flex-col gap-4">\n        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">', 
  '      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">\n        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-auto">'
);

replaceInFile('ORDowntimeModule.tsx', 
  '      <div className="flex flex-col gap-4">\n        <div className="flex items-start sm:items-center gap-3 sm:gap-4">', 
  '      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">\n        <div className="flex items-start sm:items-center gap-3 sm:gap-4">'
);

replaceInFile('ORUsageModule.tsx', 
  '      <div className="flex flex-col gap-4">\n        <div className="flex items-center gap-3">', 
  '      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">\n        <div className="flex items-center gap-3">'
);

replaceInFile('NurseRatioModule.tsx', 
  '      <div className="flex flex-col gap-4">',
  '      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">'
);

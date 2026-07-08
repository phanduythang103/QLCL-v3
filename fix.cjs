const fs = require('fs');
const path = require('path');
const dir = 'd:/OneDrive/Code webapp/QLCL-v3/components';

function replaceInFile(filename, search, replace) {
  const p = path.join(dir, filename);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf-8');
  if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(p, content, 'utf-8');
    console.log('Updated ' + filename);
  } else {
    console.log('Skipped ' + filename + ' (pattern not found)');
  }
}

replaceInFile('FacilitySecurityModule.tsx', 
  '      <div className="flex flex-col gap-4">\n        <div className="flex items-start sm:items-center gap-3">', 
  '      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">\n        <div className="flex items-start sm:items-center gap-3">'
);

replaceInFile('KtcmModule.tsx', 
  '        <div className="ktcm-header flex flex-col p-4 md:px-6 gap-4">', 
  '        <div className="ktcm-header flex flex-col xl:flex-row xl:items-center xl:justify-between p-4 md:px-6 gap-4">'
);

replaceInFile('BedUsageModule.tsx', 
  '    <div className="min-h-full flex flex-col gap-6">\n      {/* Header & Tabs */}\n      <div className="flex flex-col gap-4">', 
  '    <div className="min-h-full flex flex-col gap-6">\n      {/* Header & Tabs */}\n      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">'
);

replaceInFile('ExamTimeModule.tsx', 
  '    <div className="min-h-full flex flex-col gap-6">\n      {/* Header & Tabs */}\n      <div className="flex flex-col gap-4">\n        <div className="flex items-center gap-3">', 
  '    <div className="min-h-full flex flex-col gap-6">\n      {/* Header & Tabs */}\n      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">\n        <div className="flex items-center gap-3">'
);

replaceInFile('NKVMModule.tsx', 
  '      <div className="flex flex-col gap-4">\n        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">', 
  '      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">\n        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">'
);

replaceInFile('ORDowntimeModule.tsx', 
  '    <div className="min-h-full flex flex-col gap-6">\n      {/* Header & Tabs */}\n      <div className="flex flex-col gap-4">\n        <div className="flex items-start sm:items-center gap-3 sm:gap-4">', 
  '    <div className="min-h-full flex flex-col gap-6">\n      {/* Header & Tabs */}\n      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">\n        <div className="flex items-start sm:items-center gap-3 sm:gap-4">'
);

replaceInFile('ORUsageModule.tsx', 
  '    <div className="min-h-full flex flex-col gap-6">\n      {/* Header & Tabs */}\n      <div className="flex flex-col gap-4">', 
  '    <div className="min-h-full flex flex-col gap-6">\n      {/* Header & Tabs */}\n      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">'
);

replaceInFile('SeriousIncidentModule.tsx', 
  '      <div className="flex flex-col gap-4">\n        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">', 
  '      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">\n        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">'
);

replaceInFile('VAPModule.tsx', 
  '      <div className="flex flex-col gap-4">\n        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">', 
  '      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">\n        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">'
);

replaceInFile('LengthOfStayModule.tsx', 
  '        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">\n          <div className="indicator-subtab-list">',
  '        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">\n          <div className="indicator-subtab-list">'
);

replaceInFile('NurseRatioModule.tsx', 
  '    <div className="min-h-full flex flex-col gap-6">\n      {/* Module Header */}\n      <div className="flex flex-col gap-4">',
  '    <div className="min-h-full flex flex-col gap-6">\n      {/* Module Header */}\n      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">'
);

replaceInFile('HandHygieneModule.tsx', 
  '        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">\n          <div className="indicator-subtab-list indicator-subtab-list-2">',
  '        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">\n          <div className="indicator-subtab-list indicator-subtab-list-2">'
);

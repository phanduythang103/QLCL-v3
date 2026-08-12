const fs = require('fs');
const files = fs.readdirSync('components').filter(f => f.endsWith('MonitoringModule.tsx')).map(f => 'components/' + f);
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const thMatch = content.match(/<thead[^>]*>[\s\S]*?<tr[^>]*>([\s\S]*?)<\/tr>[\s\S]*?<\/thead>/i);
  if (!thMatch) return;
  const thRow = thMatch[1];
  const thLabels = [];
  const thRegex = /<th[^>]*>(.*?)<\/th>/gi;
  let match;
  while ((match = thRegex.exec(thRow)) !== null) {
    thLabels.push(match[1].replace(/<[^>]+>/g, '').trim());
  }
  if (thLabels.length === 0) return;
  
  const trMatches = Array.from(content.matchAll(/<tr[^>]*key=[^>]*>([\s\S]*?)<\/tr>/gi));
  if (trMatches.length > 0) {
    const dataTr = trMatches[0][0];
    const dataTrInner = trMatches[0][1];
    
    const tdParts = dataTrInner.split(/(<td[^>]*>)/i);
    let newInner = '';
    let tdIndex = 0;
    
    for (let i = 0; i < tdParts.length; i++) {
       if (tdParts[i].toLowerCase().startsWith('<td')) {
          if (tdIndex < thLabels.length) {
             const label = thLabels[tdIndex];
             const injected = tdParts[i].replace(/<td/i, `<td data-label="${label}"`);
             newInner += injected;
          } else {
             newInner += tdParts[i];
          }
          tdIndex++;
       } else {
          newInner += tdParts[i];
       }
    }
    
    const newTr = dataTr.replace(dataTrInner, newInner);
    content = content.replace(dataTr, newTr);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Injected labels into', file);
  }
});

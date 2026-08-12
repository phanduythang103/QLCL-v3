const fs = require('fs');
let css = fs.readFileSync('index.css', 'utf8');

const replaceStr = `
  @media (max-width: 767px) {
    .table-standardized {
      min-width: 0 !important;
      display: block;
      background: transparent !important;
      border: none !important;
    }
    
    .table-standardized thead {
      display: none;
    }
    
    .table-standardized tbody,
    .table-standardized tr {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    
    .table-standardized tbody {
      gap: 16px;
    }
    
    .table-standardized tr {
      background: #fff;
      border: 1px solid var(--ui-border, #e2e8f0) !important;
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
      gap: 6px;
    }
    
    .table-standardized td {
      border: none !important;
      border-bottom: 1px dashed #f1f5f9 !important;
      padding: 8px 0 !important;
      text-align: right;
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    
    .table-standardized td:last-child {
      border-bottom: none !important;
      justify-content: flex-end;
      padding-top: 12px !important;
      margin-top: 4px;
    }
    
    .table-standardized td[data-label]::before {
      content: attr(data-label);
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      color: #64748b;
      margin-right: 16px;
      flex-shrink: 0;
    }
  }
`;

const re = /@media \(\s*max-width:\s*767px\s*\)\s*\{\s*\.mobile-module-content\s*\.table-standardized\s*\{[^}]+\}\s*\.mobile-module-content\s*table\s*th,\s*\.mobile-module-content\s*table\s*td\s*\{[^}]+\}\s*\}/;

if (re.test(css)) {
  css = css.replace(re, replaceStr);
  fs.writeFileSync('index.css', css, 'utf8');
  console.log('Successfully updated mobile table CSS');
} else {
  css += '\n\n' + replaceStr;
  fs.writeFileSync('index.css', css, 'utf8');
  console.log('Appended mobile table CSS');
}

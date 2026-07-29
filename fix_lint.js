const fs = require('fs');

function replace(file, find, replaceText) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    if (typeof find === 'string') {
        content = content.replace(find, replaceText);
    } else {
        content = content.replace(find, replaceText);
    }
    fs.writeFileSync(file, content);
}

replace('src/app/api/stats/route.ts', "import { NextRequest, NextResponse } from 'next/server';", "import { NextResponse } from 'next/server';");
replace('src/app/api/stats/route.ts', "import { NextRequest } from 'next/server';", "");

// in telegram.ts
replace('src/lib/telegram.ts', "import { formatDateTelegram, calculateStopPct, calculateStopMarg, calculateResultMarg, formatDuration } from '@/lib/calculations';", "import { formatDateTelegram, calculateStopPct, calculateResultMarg, formatDuration } from '@/lib/calculations';");


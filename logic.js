/* ==========================================
   CROSSWORD TILES GENERATOR - LOGIC SCRIPT
   ========================================== */

const TILE_PX = 50;  
const TILE_MM = 20;  
const PX_PER_MM = TILE_PX / TILE_MM; 

const SCORES = { 
    'A':1, 'B':3, 'C':3, 'D':2, 'E':1, 'F':4, 'G':2, 'H':4, 'I':1, 'J':8, 'K':5, 'L':1, 'M':3, 
    'N':1, 'O':1, 'P':3, 'Q':10, 'R':1, 'S':1, 'T':1, 'U':1, 'V':4, 'W':4, 'X':8, 'Y':4, 'Z':10, 
    '+':0, '*':0 
};
const ICONS = { '+': '❤', '*': '★' };

let variations = [];
let currentIndex = 0;

function addChar(char) { 
    const input = document.getElementById('userInput'); 
    input.value += " " + char + " "; 
    input.focus(); 
}

function clearAll() {
    document.getElementById('userInput').value = "";
    document.getElementById('board-surface').innerHTML = "";
    document.getElementById('missing').innerText = "";
    document.getElementById('statusLabel').innerText = "Ready";
    document.getElementById('btnPrev').disabled = true;
    document.getElementById('btnNext').disabled = true;
    document.getElementById('visual-frame').style.display = 'none';
    variations = [];
    currentIndex = 0;
}

function updateVisuals() {
    const isRounded = document.getElementById('chkRounded').checked;
    const bgClass = document.getElementById('bgSelect').value;
    const tileClass = document.getElementById('tileSelect').value;
    const fontClass = document.getElementById('fontSelect').value;
    const engraveColor = document.getElementById('engraveColor').value; 
    
    // Merge Mode Check
    const mergeMode = document.getElementById('chkMergeOutline').checked;
    
    const showFrame = document.getElementById('chkFrame').checked;
    const fw = parseFloat(document.getElementById('frameW').value) || 10;
    const fh = parseFloat(document.getElementById('frameH').value) || 10;

    const wrapper = document.getElementById('board-wrapper');
    wrapper.className = `${bgClass} ${fontClass}`;

    const tiles = document.querySelectorAll('.tile');
    tiles.forEach(t => { 
        t.className = `tile ${tileClass}`;
        
        // VISUALS:
        if(isRounded && !mergeMode) t.classList.add('rounded'); 

        t.style.color = engraveColor;
        const scoreSpan = t.querySelector('.score');
        if(scoreSpan) scoreSpan.style.color = engraveColor;
        
        // If merge mode, make borders subtle blue to represent score lines
        if (mergeMode) {
            t.style.border = "1px solid rgba(0,0,255, 0.3)"; 
            t.style.borderRadius = "0"; 
        }
    });

    const frameDiv = document.getElementById('visual-frame');
    if (showFrame) {
        frameDiv.style.display = 'block';
        const wPX = (fw * 25.4) * PX_PER_MM;
        const hPX = (fh * 25.4) * PX_PER_MM;
        frameDiv.style.width = wPX + "px";
        frameDiv.style.height = hPX + "px";
        frameDiv.style.left = "50%";
        frameDiv.style.top = "50%";
        frameDiv.style.transform = "translate(-50%, -50%)";
    } else { 
        frameDiv.style.display = 'none'; 
    }
}

function runGenerator() {
    const btn = document.getElementById('genBtn');
    btn.innerText = "Processing...";
    setTimeout(() => {
        try { executeGeneration(); } 
        catch (err) { alert("Error: " + err.message); }
        btn.innerText = "Generate Layouts";
    }, 50);
}

function executeGeneration() {
    const input = document.getElementById('userInput').value;
    let words = input.toUpperCase().split(/[\s,\n]+/).filter(w => w.length > 0);
    
    if (words.length === 0) { alert("Please type words!"); return; }

    variations = [];
    const seen = new Set();
    const ATTEMPTS = 200; 

    for(let i=0; i<ATTEMPTS; i++) {
        let shuffled = [...words].sort(() => Math.random() - 0.5);
        let res = generateLayout(shuffled);
        
        if (res.placed.length > 0) {
            let sig = Object.keys(res.grid).sort().join("|");
            if (!seen.has(sig)) {
                seen.add(sig);
                variations.push(res);
            }
        }
    }

    variations.sort((a,b) => {
        if (b.placed.length !== a.placed.length) return b.placed.length - a.placed.length;
        let areaA = (a.bounds.maxX - a.bounds.minX) * (a.bounds.maxY - a.bounds.minY);
        let areaB = (b.bounds.maxX - b.bounds.minX) * (b.bounds.maxY - b.bounds.minY);
        return areaA - areaB;
    });

    if (variations.length > 0) {
        currentIndex = 0;
        render(currentIndex);
    } else {
        alert("Could not connect these words. Try adding a linking word.");
    }
}

function generateLayout(wordList) {
    let grid = {};
    let placed = [];
    let bounds = { minX:0, maxX:0, minY:0, maxY:0 };
    
    place(grid, bounds, wordList[0], 0, 0, 1, 0);
    placed.push(wordList[0]);
    
    let pending = wordList.slice(1);
    let stuck = false;

    while(pending.length > 0 && !stuck) {
        stuck = true;
        pending.sort(() => Math.random() - 0.5);

        for (let i=0; i<pending.length; i++) {
            let w = pending[i];
            if (tryPlace(grid, bounds, w)) {
                placed.push(w);
                pending.splice(i, 1);
                stuck = false;
                break; 
            }
        }
    }
    return { grid, bounds, placed, unplaced: pending };
}

function tryPlace(grid, bounds, word) {
    let coords = Object.keys(grid);
    coords.sort(() => Math.random() - 0.5);

    for (let k of coords) {
        let [bx, by] = k.split(',').map(Number);
        let letter = grid[k];

        for (let i=0; i<word.length; i++) {
            if (word[i] === letter) {
                let hasHoriz = grid[`${bx-1},${by}`] || grid[`${bx+1},${by}`];
                let hasVert = grid[`${bx},${by-1}`] || grid[`${bx},${by+1}`];

                if (hasHoriz && !hasVert) {
                    if (check(grid, word, bx, by-i, 0, 1)) {
                        place(grid, bounds, word, bx, by-i, 0, 1);
                        return true;
                    }
                }
                else if (hasVert && !hasHoriz) {
                     if (check(grid, word, bx-i, by, 1, 0)) {
                        place(grid, bounds, word, bx-i, by, 1, 0);
                        return true;
                    }
                }
                else if (!hasHoriz && !hasVert) {
                    if (check(grid, word, bx, by-i, 0, 1)) {
                        place(grid, bounds, word, bx, by-i, 0, 1);
                        return true;
                    }
                    if (check(grid, word, bx-i, by, 1, 0)) {
                        place(grid, bounds, word, bx-i, by, 1, 0);
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function check(grid, word, sx, sy, dx, dy) {
    for(let i=0; i<word.length; i++) {
        let x = sx + i*dx;
        let y = sy + i*dy;
        let k = `${x},${y}`;
        if (grid[k] && grid[k] !== word[i]) return false;
    }
    for(let i=0; i<word.length; i++) {
        let x = sx + i*dx;
        let y = sy + i*dy;
        let k = `${x},${y}`;
        if (!grid[k]) { 
            let n1 = grid[`${x+dy},${y+dx}`];
            let n2 = grid[`${x-dy},${y-dx}`];
            if (n1 || n2) return false;
            if (i===0 && grid[`${x-dx},${y-dy}`]) return false;
            if (i===word.length-1 && grid[`${x+dx},${y+dy}`]) return false;
        }
    }
    return true;
}

function place(grid, bounds, word, sx, sy, dx, dy) {
    for(let i=0; i<word.length; i++) {
        let x = sx + i*dx;
        let y = sy + i*dy;
        grid[`${x},${y}`] = word[i];
        bounds.minX = Math.min(bounds.minX, x);
        bounds.maxX = Math.max(bounds.maxX, x);
        bounds.minY = Math.min(bounds.minY, y);
        bounds.maxY = Math.max(bounds.maxY, y);
    }
}

function render(idx) {
    let data = variations[idx];
    let surface = document.getElementById('board-surface');
    surface.innerHTML = '';

    document.getElementById('statusLabel').innerText = `Var ${idx+1} / ${variations.length}`;
    document.getElementById('btnPrev').disabled = (idx === 0);
    document.getElementById('btnNext').disabled = (idx === variations.length-1);
    
    let missing = data.unplaced.length ? "Missing: " + data.unplaced.join(", ") : "All words placed!";
    document.getElementById('missing').innerText = missing;

    let w = (data.bounds.maxX - data.bounds.minX + 3) * TILE_PX;
    let h = (data.bounds.maxY - data.bounds.minY + 3) * TILE_PX;
    surface.style.width = w + "px";
    surface.style.height = h + "px";
    
    for(let k in data.grid) {
        let [gx, gy] = k.split(',').map(Number);
        let left = (gx - data.bounds.minX + 1) * TILE_PX;
        let top = (gy - data.bounds.minY + 1) * TILE_PX;
        
        let el = document.createElement('div');
        el.className = 'tile'; 
        el.style.left = left + 'px';
        el.style.top = top + 'px';
        
        let char = data.grid[k];
        let displayChar = ICONS[char] || char;
        
        el.innerHTML = `${displayChar}<span class="score">${SCORES[char]||0}</span>`;
        surface.appendChild(el);
    }
    updateVisuals();
}

function nextLayout() { if (currentIndex < variations.length - 1) { currentIndex++; render(currentIndex); } }
function prevLayout() { if (currentIndex > 0) { currentIndex--; render(currentIndex); } }

function getSystemFontStack(fontClass) {
    const map = {
        'font-arial': 'Arial',
        'font-arial-black': 'Arial Black',
        'font-times': 'Times New Roman',
        'font-courier': 'Courier New',
        'font-impact': 'Impact',
        'font-verdana': 'Verdana',
        'font-georgia': 'Georgia',
        'font-trebuchet': 'Trebuchet MS',
        'font-comic': 'Comic Sans MS'
    };
    return map[fontClass] || 'Arial';
}

function downloadSVG() {
    if (variations.length === 0) { alert("Please generate first."); return; }

    const data = variations[currentIndex];
    const mergeMode = document.getElementById('chkMergeOutline').checked;
    
    const isRounded = document.getElementById('chkRounded').checked;
    const tileMM = parseFloat(document.getElementById('tileSizeMM').value) || 20;
    
    // Config
    const gapMM = mergeMode ? 0 : 1; 
    const size = tileMM - gapMM; 
    // Now allow radius even in Merge Mode
    const radius = isRounded ? (size * 0.20) : 0; 
    
    const engraveColor = document.getElementById('engraveColor').value || "#000000";
    const fontClass = document.getElementById('fontSelect').value;
    const systemFont = getSystemFontStack(fontClass);

    const cols = (data.bounds.maxX - data.bounds.minX + 1);
    const rows = (data.bounds.maxY - data.bounds.minY + 1);
    const svgW = cols * tileMM;
    const svgH = rows * tileMM;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}mm" height="${svgH}mm" viewBox="0 0 ${svgW} ${svgH}">`;
    
    svg += `<style>
        .cut { fill: none; stroke: red; stroke-width: 0.1; }
        .score { fill: none; stroke: blue; stroke-width: 0.1; }
        .engrave { fill: ${engraveColor}; font-family: "${systemFont}", sans-serif; font-weight: bold; }
    </style>`;

    const offset = 0.5;

    // --- MODE 1: MERGED OUTLINE (With Smart Rounding) ---
    if (mergeMode) {
        
        for(let k in data.grid) {
            let [gx, gy] = k.split(',').map(Number);
            let x = (gx - data.bounds.minX) * tileMM + offset;
            let y = (gy - data.bounds.minY) * tileMM + offset;
            
            // Neighbors
            let nTop = data.grid[`${gx},${gy-1}`];
            let nBot = data.grid[`${gx},${gy+1}`];
            let nLeft = data.grid[`${gx-1},${gy}`];
            let nRight = data.grid[`${gx+1},${gy}`];

            // --- DRAW EDGES & CORNERS ---
            
            // TOP EDGE
            if(!nTop) {
                let x1 = x; let x2 = x + size;
                if(isRounded && !nLeft) x1 += radius;
                if(isRounded && !nRight) x2 -= radius;
                svg += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" class="cut"/>`;
            }
            // BOTTOM EDGE
            if(!nBot) {
                let x1 = x; let x2 = x + size;
                if(isRounded && !nLeft) x1 += radius;
                if(isRounded && !nRight) x2 -= radius;
                svg += `<line x1="${x1}" y1="${y+size}" x2="${x2}" y2="${y+size}" class="cut"/>`;
            }
            // LEFT EDGE
            if(!nLeft) {
                let y1 = y; let y2 = y + size;
                if(isRounded && !nTop) y1 += radius;
                if(isRounded && !nBot) y2 -= radius;
                svg += `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" class="cut"/>`;
            }
            // RIGHT EDGE
            if(!nRight) {
                let y1 = y; let y2 = y + size;
                if(isRounded && !nTop) y1 += radius;
                if(isRounded && !nBot) y2 -= radius;
                svg += `<line x1="${x+size}" y1="${y1}" x2="${x+size}" y2="${y2}" class="cut"/>`;
            }

            // --- DRAW CORNER ARCS ---
            if(isRounded) {
                if(!nTop && !nLeft) svg += `<path d="M ${x} ${y+radius} A ${radius} ${radius} 0 0 1 ${x+radius} ${y}" class="cut" />`;
                if(!nTop && !nRight) svg += `<path d="M ${x+size-radius} ${y} A ${radius} ${radius} 0 0 1 ${x+size} ${y+radius}" class="cut" />`;
                if(!nBot && !nRight) svg += `<path d="M ${x+size} ${y+size-radius} A ${radius} ${radius} 0 0 1 ${x+size-radius} ${y+size}" class="cut" />`;
                if(!nBot && !nLeft) svg += `<path d="M ${x+radius} ${y+size} A ${radius} ${radius} 0 0 1 ${x} ${y+size-radius}" class="cut" />`;
            }
            
            // --- INTERNAL SCORE LINES (BLUE) ---
            if(nTop)   svg += `<line x1="${x}" y1="${y}" x2="${x+size}" y2="${y}" class="score"/>`;
            if(nLeft)  svg += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y+size}" class="score"/>`;
        }
    } 

    // --- MODE 2: STANDARD SEPARATED TILES ---
    else {
        for(let k in data.grid) {
            let [gx, gy] = k.split(',').map(Number);
            let x = (gx - data.bounds.minX) * tileMM + offset;
            let y = (gy - data.bounds.minY) * tileMM + offset;
            svg += `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" ry="${radius}" class="cut" />`;
        }
    }

    // --- TEXT ENGRAVING ---
    for(let k in data.grid) {
        let [gx, gy] = k.split(',').map(Number);
        let x = (gx - data.bounds.minX) * tileMM + offset;
        let y = (gy - data.bounds.minY) * tileMM + offset;
        let char = data.grid[k];
        let displayChar = ICONS[char] || char;
        let score = SCORES[char] || 0;

        svg += `<text x="${x + size/2}" y="${y + size*0.72}" 
                 text-anchor="middle" 
                 font-family="${systemFont}" 
                 font-weight="bold" 
                 font-size="${size*0.6}" 
                 fill="${engraveColor}">${displayChar}</text>`;
        
        svg += `<text x="${x + size*0.92}" y="${y + size*0.88}" 
                 text-anchor="end" 
                 font-family="Arial" 
                 font-size="${size*0.2}" 
                 fill="${engraveColor}">${score}</text>`;
    }
    
    svg += `</svg>`;

    const blob = new Blob([svg], {type: "image/svg+xml"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `layout_${mergeMode?'outline':'tiles'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function downloadPNG() {
    if (variations.length === 0) { alert("Please generate first."); return; }
    
    const data = variations[currentIndex];
    const isRounded = document.getElementById('chkRounded').checked;
    const mergeMode = document.getElementById('chkMergeOutline').checked;
    
    const engraveColor = document.getElementById('engraveColor').value;
    const bgSelect = document.getElementById('bgSelect');
    const tileSelect = document.getElementById('tileSelect');
    
    const bgColors = {
        'bg-standard': '#ffffff', 'bg-pine': '#f0e6d2', 'bg-oak': '#e3cbae', 'bg-walnut': '#4e342e',
        'bg-blueprint': '#003366', 'bg-dark': '#222222', 
        'bg-acrylic-red': '#ffcdd2', 'bg-acrylic-blue': '#bbdefb', 'bg-acrylic-green': '#c8e6c9', 'bg-acrylic-black': '#444', 'bg-acrylic-white': '#f5f5f5'
    };
    
    const tileStyles = {
        'tile-standard': { fill: '#ffffff', stroke: 'red' },
        'tile-pine':     { fill: '#fdf5e6', stroke: '#d2b48c' },
        'tile-oak':      { fill: '#f4dcb1', stroke: '#8b4513' },
        'tile-walnut':   { fill: '#5d4037', stroke: '#3e2723' },
        'tile-blueprint':{ fill: '#003366', stroke: 'white' },
        'tile-dark':     { fill: '#333333', stroke: '#00ff00' },
        'tile-acrylic-red':   { fill: '#e53935', stroke: '#b71c1c' },
        'tile-acrylic-blue':  { fill: '#1e88e5', stroke: '#0d47a1' },
        'tile-acrylic-green': { fill: '#43a047', stroke: '#1b5e20' },
        'tile-acrylic-black': { fill: '#212121', stroke: 'black' },
        'tile-acrylic-white': { fill: '#ffffff', stroke: '#bdbdbd' }
    };
    
    const bgColor = bgColors[bgSelect.value] || '#ffffff';
    const style = tileStyles[tileSelect.value] || tileStyles['tile-standard'];

    const fontClass = document.getElementById('fontSelect').value;
    const systemFont = getSystemFontStack(fontClass);

    const P_SIZE = 100; 
    const cols = (data.bounds.maxX - data.bounds.minX + 1);
    const rows = (data.bounds.maxY - data.bounds.minY + 1);
    const pad = 60; 
    
    const canvas = document.createElement('canvas');
    canvas.width = cols * P_SIZE + (pad * 2);
    canvas.height = rows * P_SIZE + (pad * 2);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    for(let k in data.grid) {
        let [gx, gy] = k.split(',').map(Number);
        let x = (gx - data.bounds.minX) * P_SIZE + pad;
        let y = (gy - data.bounds.minY) * P_SIZE + pad;
        let char = data.grid[k];
        let displayChar = ICONS[char] || char;
        let score = SCORES[char] || 0;
        
        ctx.fillStyle = style.fill;
        ctx.strokeStyle = style.stroke;
        ctx.lineWidth = 4;
        
        let gap = 4;
        let size = P_SIZE - gap*2;
        let rx = x + gap; 
        let ry = y + gap;
        
        ctx.beginPath();
        if (isRounded && !mergeMode) {
            ctx.roundRect(rx, ry, size, size, 15);
        } else {
            ctx.rect(rx, ry, size, size);
        }
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = engraveColor;
        ctx.font = `bold 60px ${systemFont}`;
        ctx.fillText(displayChar, rx + size/2, ry + size * 0.65);
        
        ctx.font = "bold 20px Arial";
        ctx.fillText(score, rx + size - 20, ry + size - 20);
    }
    
    ctx.font = "italic 16px Arial";
    ctx.fillStyle = engraveColor;
    ctx.globalAlpha = 0.5;
    ctx.fillText("Proof - Crossword Tiles Generator", canvas.width/2, canvas.height - 20);

    const link = document.createElement('a');
    link.download = 'design_proof.png';
    link.href = canvas.toDataURL();
    link.click();
}

function openLink(url) {
    if (typeof require !== 'undefined' && typeof require('electron') !== 'undefined') {
        require('electron').shell.openExternal(url);
    } else {
        window.open(url, '_blank');
    }
}
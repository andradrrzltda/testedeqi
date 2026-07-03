// --- Geração de figuras vetoriais (SVG) para as questões visuais ---

const SHAPE_COLORS = {
  purple: "#2c3a5e",
  teal: "#2f6f5e",
  amber: "#b8912f",
  rose: "#8b3a3a",
};

const SIZE_RADIUS = { sm: 18, md: 26, lg: 34, xl: 42 };

const COUNT_LAYOUT = {
  1: { positions: [0], scale: 1 },
  2: { positions: [-22, 22], scale: 0.62 },
  3: { positions: [-28, 0, 28], scale: 0.46 },
  4: { positions: [-33, -11, 11, 33], scale: 0.36 },
  5: { positions: [-36, -18, 0, 18, 36], scale: 0.3 },
};

function cell(shape, opts = {}) {
  return {
    shape,
    color: opts.color || "purple",
    fill: opts.fill || "solid",
    size: opts.size || "md",
    count: opts.count || 1,
    rotation: opts.rotation || 0,
    mirror: opts.mirror || false,
  };
}

function polygonPoints(sides, r) {
  const pts = [];
  for (let k = 0; k < sides; k++) {
    const angle = ((-90 + k * (360 / sides)) * Math.PI) / 180;
    pts.push(`${(r * Math.cos(angle)).toFixed(2)},${(r * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(" ");
}

function starPoints(outerR, innerR) {
  const pts = [];
  for (let k = 0; k < 10; k++) {
    const r = k % 2 === 0 ? outerR : innerR;
    const angle = ((-90 + k * 36) * Math.PI) / 180;
    pts.push(`${(r * Math.cos(angle)).toFixed(2)},${(r * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(" ");
}

function shapeMarkup(shape, r, attrs) {
  switch (shape) {
    case "circle":
      return `<circle cx="0" cy="0" r="${r}" ${attrs}/>`;
    case "square":
      return `<rect x="${-r}" y="${-r}" width="${r * 2}" height="${r * 2}" ${attrs}/>`;
    case "triangle":
      return `<polygon points="${polygonPoints(3, r * 1.15)}" ${attrs}/>`;
    case "pentagon":
      return `<polygon points="${polygonPoints(5, r)}" ${attrs}/>`;
    case "hexagon":
      return `<polygon points="${polygonPoints(6, r)}" ${attrs}/>`;
    case "star":
      return `<polygon points="${starPoints(r * 1.05, r * 0.45)}" ${attrs}/>`;
    case "flag": {
      // Peça assimétrica (haste + bandeirola) usada nas questões de raciocínio espacial:
      // ao contrário dos polígonos regulares, ela não tem eixo de simetria, então
      // uma versão espelhada dela nunca coincide com nenhuma rotação da original.
      const pw = r * 0.22;
      const ph = r * 2;
      const fl = r * 1.05;
      const fh = r * 0.7;
      const pole = `<rect x="${(-pw / 2).toFixed(2)}" y="${(-ph / 2).toFixed(2)}" width="${pw.toFixed(2)}" height="${ph.toFixed(2)}" ${attrs}/>`;
      const flagPts = `${(pw / 2).toFixed(2)},${(-ph / 2).toFixed(2)} ${(pw / 2 + fl).toFixed(2)},${(-ph / 2 + fh / 2).toFixed(2)} ${(pw / 2).toFixed(2)},${(-ph / 2 + fh).toFixed(2)}`;
      return `${pole}<polygon points="${flagPts}" ${attrs}/>`;
    }
    default:
      return "";
  }
}

function cellSVG(data) {
  if (!data) {
    return `<svg viewBox="0 0 100 100" class="matrix-cell-svg matrix-cell-empty" aria-hidden="true">
      <text x="50" y="64" text-anchor="middle" font-size="42" fill="var(--gold-dark)">?</text>
    </svg>`;
  }
  if (data.kind) {
    return `<svg viewBox="0 0 100 100" class="matrix-cell-svg" aria-hidden="true">${puzzleCellMarkup(data)}</svg>`;
  }
  const color = SHAPE_COLORS[data.color] || SHAPE_COLORS.purple;
  const baseR = SIZE_RADIUS[data.size] || SIZE_RADIUS.md;
  const layout = COUNT_LAYOUT[data.count] || COUNT_LAYOUT[1];
  const r = baseR * layout.scale;
  const attrs =
    data.fill === "outline"
      ? `fill="none" stroke="${color}" stroke-width="7"`
      : `fill="${color}"`;
  const mirrorScale = data.mirror ? -1 : 1;

  const shapes = layout.positions
    .map(
      (x) =>
        `<g transform="translate(${50 + x},50) rotate(${data.rotation}) scale(${mirrorScale},1)">${shapeMarkup(data.shape, r, attrs)}</g>`
    )
    .join("");

  return `<svg viewBox="0 0 100 100" class="matrix-cell-svg" aria-hidden="true">${shapes}</svg>`;
}

// --- Geração das 9 questões de matriz customizadas ---

function isoCubeMarkup(size, texture) {
  const EDGE = { sm: 15, md: 20, lg: 26 };
  const e = EDGE[size] || EDGE.md;
  const cx = 50, topY = 50 - e * 1.15;
  const top = [
    [cx, topY],
    [cx + e, topY + e * 0.55],
    [cx, topY + e * 1.1],
    [cx - e, topY + e * 0.55],
  ];
  const left = [
    [cx - e, topY + e * 0.55],
    [cx, topY + e * 1.1],
    [cx, topY + e * 2.2],
    [cx - e, topY + e * 1.65],
  ];
  const right = [
    [cx, topY + e * 1.1],
    [cx + e, topY + e * 0.55],
    [cx + e, topY + e * 1.65],
    [cx, topY + e * 2.2],
  ];
  const toPoints = (pts) => pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  let markup = `
    <polygon points="${toPoints(top)}" fill="#ffffff" stroke="#201d17" stroke-width="1.6"/>
    <polygon points="${toPoints(left)}" fill="#f0e9db" stroke="#201d17" stroke-width="1.6"/>
    <polygon points="${toPoints(right)}" fill="#ffffff" stroke="#201d17" stroke-width="1.6"/>
  `;
  if (texture === "stripe" || texture === "grid") {
    const steps = 6;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x1 = right[0][0] + (right[1][0] - right[0][0]) * t;
      const y1 = right[0][1] + (right[1][1] - right[0][1]) * t;
      const x2 = right[3][0] + (right[2][0] - right[3][0]) * t;
      const y2 = right[3][1] + (right[2][1] - right[3][1]) * t;
      markup += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#201d17" stroke-width="1"/>`;
    }
  }
  if (texture === "grid") {
    const steps = 5;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x1 = right[0][0] + (right[3][0] - right[0][0]) * t;
      const y1 = right[0][1] + (right[3][1] - right[0][1]) * t;
      const x2 = right[1][0] + (right[2][0] - right[1][0]) * t;
      const y2 = right[1][1] + (right[2][1] - right[1][1]) * t;
      markup += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#201d17" stroke-width="1"/>`;
    }
  }
  return markup;
}

function burstMarkup(spec) {
  const { size = "sm", circleR = 30, rotate = 0, empty = false, spikes = 7 } = spec;
  const circle = `<circle cx="50" cy="50" r="${circleR}" fill="#ffffff" stroke="#201d17" stroke-width="1.6"/>`;
  if (empty) return circle;
  const R = { sm: 5, md: 9, lg: 14 }[size] || 6;
  const pts = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? R : R * 0.35;
    const angle = (i * Math.PI) / spikes + (rotate * Math.PI) / 180;
    pts.push(`${(50 + r * Math.cos(angle)).toFixed(1)},${(50 + r * Math.sin(angle)).toFixed(1)}`);
  }
  return `${circle}<polygon points="${pts.join(" ")}" fill="#201d17"/>`;
}

function butterflyMarkup(spec) {
  const { dotsLeft = 3, dotsRight = 3, offset = 0 } = spec;
  const wingL = `M50,50 C30,20 5,25 8,45 C10,60 30,55 50,50 Z`;
  const wingR = `M50,50 C70,20 95,25 92,45 C90,60 70,55 50,50 Z`;
  const posL = [[22, 32], [16, 42], [28, 44], [20, 38]];
  const posR = [[78, 32], [84, 42], [72, 44], [80, 38]];
  let dots = "";
  for (let i = 0; i < dotsLeft; i++) {
    const p = posL[(i + offset) % posL.length];
    dots += `<circle cx="${p[0]}" cy="${p[1]}" r="2.4" fill="#201d17"/>`;
  }
  for (let i = 0; i < dotsRight; i++) {
    const p = posR[(i + offset) % posR.length];
    dots += `<circle cx="${p[0]}" cy="${p[1]}" r="2.4" fill="#201d17"/>`;
  }
  return `
    <path d="${wingL}" fill="#ffffff" stroke="#201d17" stroke-width="1.5"/>
    <path d="${wingR}" fill="#ffffff" stroke="#201d17" stroke-width="1.5"/>
    <line x1="50" y1="35" x2="50" y2="62" stroke="#201d17" stroke-width="1.5"/>
    ${dots}
  `;
}

function pyramidMarkup(tiers, opts = {}) {
  const { hollow = false, mirror = false, offset = false, missing = null, extra = false } = opts;
  const bw = 10, bh = 7.5;
  let bricks = "";
  for (let row = 0; row < tiers; row++) {
    const bricksInRow = tiers - row;
    const rowWidth = bricksInRow * bw;
    let startX = mirror ? 50 + rowWidth / 2 - bw : 50 - rowWidth / 2;
    if (offset) startX += 6;
    const y = 80 - (row + 1) * bh;
    for (let i = 0; i < bricksInRow; i++) {
      if (missing && missing.row === row && missing.col === i) continue;
      const x = mirror ? startX - i * bw : startX + i * bw;
      bricks += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw - 1}" height="${bh - 1}" fill="${hollow ? "#ffffff" : "#201d17"}" stroke="#201d17" stroke-width="1"/>`;
    }
  }
  if (extra) {
    const y = 80 - (tiers + 1) * bh;
    const x = 50 - bw / 2;
    bricks += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw - 1}" height="${bh - 1}" fill="${hollow ? "#ffffff" : "#201d17"}" stroke="#201d17" stroke-width="1"/>`;
  }
  return bricks;
}

function shapeMarkerMarkup(spec) {
  const { container = "circle", marker = false, corner = "tl" } = spec;
  const shape =
    container === "circle"
      ? `<circle cx="50" cy="50" r="32" fill="#ffffff" stroke="#201d17" stroke-width="1.6"/>`
      : `<rect x="18" y="18" width="64" height="64" fill="#ffffff" stroke="#201d17" stroke-width="1.6"/>`;
  let markerSvg = "";
  if (marker) {
    const corners = {
      tl: [30, 30, 30, 44, 44, 44],
      tr: [70, 30, 70, 44, 56, 44],
      bl: [30, 70, 30, 56, 44, 56],
      br: [70, 70, 70, 56, 56, 56],
    };
    const [x1, y1, x2, y2, x3, y3] = corners[corner] || corners.tl;
    markerSvg = `<polyline points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="none" stroke="#201d17" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return shape + markerSvg;
}

function faceMarkup(spec) {
  const { container = "circle", nose = false, eyesBig = false, frown = false, noseScale = 1 } = spec;
  const shape =
    container === "circle"
      ? `<circle cx="50" cy="50" r="32" fill="#ffffff" stroke="#201d17" stroke-width="1.6"/>`
      : `<rect x="18" y="18" width="64" height="64" rx="10" fill="#ffffff" stroke="#201d17" stroke-width="1.6"/>`;
  const eyeRx = eyesBig ? 2.8 : 1.8;
  const eyeRy = eyesBig ? 3.8 : 2.6;
  const eyes = `<ellipse cx="40" cy="44" rx="${eyeRx}" ry="${eyeRy}" fill="#201d17"/><ellipse cx="60" cy="44" rx="${eyeRx}" ry="${eyeRy}" fill="#201d17"/>`;
  const mouth = frown
    ? `<path d="M40,64 Q50,58 60,64" fill="none" stroke="#201d17" stroke-width="1.6" stroke-linecap="round"/>`
    : `<path d="M40,60 Q50,66 60,60" fill="none" stroke="#201d17" stroke-width="1.6" stroke-linecap="round"/>`;
  const nw = 4 * noseScale;
  const noseSvg = nose ? `<polygon points="50,48 ${(50 - nw).toFixed(1)},56 ${(50 + nw).toFixed(1)},56" fill="none" stroke="#201d17" stroke-width="1.3"/>` : "";
  return shape + eyes + noseSvg + mouth;
}

function birdMarkup(spec) {
  const { wingLines = 3, mirror = false, beakLong = false, perch = "bar" } = spec;
  const scale = mirror ? -1 : 1;
  let wing = "";
  for (let i = 0; i < wingLines; i++) {
    const off = i * 4;
    wing += `<path d="M${(30 - off).toFixed(1)},${(45 + off * 0.4).toFixed(1)} Q${(20 - off).toFixed(1)},${(40 + off * 0.3).toFixed(1)} ${(12 - off).toFixed(1)},${(44 + off * 0.3).toFixed(1)}" fill="none" stroke="#201d17" stroke-width="1.3"/>`;
  }
  const beak = beakLong
    ? `<polygon points="70,50 82,47 70,54" fill="#ffffff" stroke="#201d17" stroke-width="1.4"/>`
    : `<polygon points="70,50 78,48 70,54" fill="#ffffff" stroke="#201d17" stroke-width="1.4"/>`;
  const perchSvg =
    perch === "bar"
      ? `<line x1="45" y1="72" x2="75" y2="72" stroke="#201d17" stroke-width="1.6"/>`
      : `<path d="M45,72 Q60,78 75,72" fill="none" stroke="#201d17" stroke-width="1.6"/>`;
  return `<g transform="translate(50,50) scale(${scale},1) translate(-50,-50)">
    <path d="M30,60 C25,40 45,32 65,38 C75,42 75,55 68,60 C60,66 40,66 30,60 Z" fill="#ffffff" stroke="#201d17" stroke-width="1.5"/>
    <circle cx="66" cy="40" r="2" fill="#201d17"/>
    ${beak}
    ${wing}
  </g>
  ${perchSvg}`;
}

function cornerFillMarkup(spec) {
  const { corner = "br", shape = "square", size = 26 } = spec;
  const frame = `<rect x="14" y="24" width="72" height="52" fill="#ffffff" stroke="#201d17" stroke-width="1.6"/>`;
  const anchors = { tl: [14, 24], tr: [86, 24], bl: [14, 76], br: [86, 76] };
  const [ax, ay] = anchors[corner] || anchors.br;
  const dx = corner.includes("l") ? 1 : -1;
  const dy = corner.includes("t") ? 1 : -1;
  let mark;
  if (shape === "circle") {
    const x1 = ax, y1 = ay + dy * size;
    const x2 = ax + dx * size, y2 = ay;
    const sweep = dx * dy > 0 ? 0 : 1;
    mark = `<path d="M${ax},${ay} L${x1.toFixed(1)},${y1.toFixed(1)} A${size},${size} 0 0 ${sweep} ${x2.toFixed(1)},${y2.toFixed(1)} Z" fill="#201d17"/>`;
  } else {
    const rx = corner.includes("l") ? ax : ax - size;
    const ry = corner.includes("t") ? ay : ay - size;
    mark = `<rect x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" width="${size}" height="${size}" fill="#201d17"/>`;
  }
  return frame + mark;
}

function miniGridMarkup(spec) {
  const { blackPos = "tr" } = spec;
  const s = 18, gap = 3;
  const positions = {
    tl: [50 - s - gap / 2, 50 - s - gap / 2],
    tr: [50 + gap / 2, 50 - s - gap / 2],
    bl: [50 - s - gap / 2, 50 + gap / 2],
    br: [50 + gap / 2, 50 + gap / 2],
  };
  let squares = "";
  Object.keys(positions).forEach((key) => {
    const [x, y] = positions[key];
    const fill = key === blackPos ? "#201d17" : "#ffffff";
    squares += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${s}" height="${s}" fill="${fill}" stroke="#201d17" stroke-width="1.4"/>`;
  });
  return squares;
}

function tetrominoMarkup(spec) {
  // Peça em "T" de 5 quadradinhos (3 em cima, 2 embaixo à direita do centro).
  // Um dos quadrados é preto; a posição do preto avança de célula em célula.
  const { black = 0, mirror = false } = spec;
  const s = 15;
  const cells = [
    [33, 43], [50, 43], [67, 43], [50, 60], [67, 60],
  ];
  let out = "";
  cells.forEach(([cx, cy], i) => {
    const x = (mirror ? 100 - cx : cx) - s / 2;
    const y = cy - s / 2;
    const fill = i === black ? "#201d17" : "#ffffff";
    out += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${s}" height="${s}" fill="${fill}" stroke="#201d17" stroke-width="1.4"/>`;
  });
  return out;
}

function puzzleCellMarkup(data) {
  switch (data.kind) {
    case "cube":
      return isoCubeMarkup(data.size, data.texture);
    case "burst":
      return burstMarkup(data);
    case "butterfly":
      return butterflyMarkup(data);
    case "pyramid":
      return pyramidMarkup(data.tiers, data);
    case "shapemarker":
      return shapeMarkerMarkup(data);
    case "face":
      return faceMarkup(data);
    case "bird":
      return birdMarkup(data);
    case "cornerfill":
      return cornerFillMarkup(data);
    case "minigrid":
      return miniGridMarkup(data);
    case "tetromino":
      return tetrominoMarkup(data);
    default:
      return "";
  }
}

// --- Banco de perguntas ---
// Cada questão tem uma "difficulty" (facil/medio/dificil), usada tanto para
// ordenar os itens dentro de cada categoria (do mais simples ao mais complexo,
// como nas baterias psicométricas reais) quanto para ponderar a pontuação final.
// Pelo menos 50% das questões são de raciocínio não-verbal (matricial + espacial).

const DIFFICULTY_WEIGHTS = { facil: 1, medio: 1.5, dificil: 2 };

// QI definido diretamente pelo NÚMERO de acertos (índice = quantidade de acertos).
// Escala centrada em 90 (≈ 16 acertos, cerca de metade das 33 questões).
//  - 0 a 9 acertos: nível base único (68).
//  - a partir de 10: um valor específico para CADA número de acertos, até 145.
const IQ_BY_CORRECT = [
  68, 68, 68, 68, 68, 68, 68, 68, 68, 68, //  0–9  (nível base)
  70, 73, 77, 80, 83, 86, 89, 90, 93, 96, // 10–19
  100, 102, 104, 106, 108, 110, 115, 118, 125, 129, // 20–29  (20 acertos = 100)
  135, 138, 142, 145, // 30–33
];

const QUESTIONS = [
  // ===== Raciocínio matricial (10 perguntas idênticas às imagens enviadas) =====
  // Cada pergunta usa DUAS imagens (na pasta images/):
  //   gridImg    -> o quadro da matriz (com o "?")
  //   optionsImg -> o painel com as 6 opções (grade 2x3)
  // As opções são numeradas linha a linha:
  //   0 = superior esquerda   1 = superior direita
  //   2 = meio esquerda       3 = meio direita
  //   4 = inferior esquerda   5 = inferior direita

  // 1) Quadriculado fino — a malha quadrada igual à do quadro
  {
    category: "Raciocínio matricial", type: "image", difficulty: "facil",
    gridImg: "images/1.png", optionsImg: "images/12.png", correct: 0,
  },
  // 2) Cruzes (+) — o bloco de cruzes regular que continua o padrão
  {
    category: "Raciocínio matricial", type: "image", difficulty: "medio",
    gridImg: "images/2.png", optionsImg: "images/22.png", correct: 1,
  },
  // 3) Losangos com X — a unidade igual às demais
  {
    category: "Raciocínio matricial", type: "image", difficulty: "facil",
    gridImg: "images/3.png", optionsImg: "images/33.png", correct: 0,
  },
  // 4) Grades — as linhas verticais adensam à direita; a mais densa
  {
    category: "Raciocínio matricial", type: "image", difficulty: "medio",
    gridImg: "images/4.png", optionsImg: "images/44.png", correct: 3,
  },
  // 5) Ondas + barco — as ondas que completam o canto
  {
    category: "Raciocínio matricial", type: "image", difficulty: "medio",
    gridImg: "images/5.png", optionsImg: "images/55.png", correct: 1,
  },
  // 6) Quadradinhos — o quadrado preto avança de posição
  {
    category: "Raciocínio matricial", type: "image", difficulty: "medio",
    gridImg: "images/6.png", optionsImg: "images/66.png", correct: 5,
  },
  // 7) Rostos — coluna = forma, linha = nariz -> quadrado sem nariz
  {
    category: "Raciocínio matricial", type: "image", difficulty: "facil",
    gridImg: "images/7.png", optionsImg: "images/77.png", correct: 5,
  },
  // 8) Cubos empilhados — a estrutura cresce; a maior pirâmide
  {
    category: "Raciocínio matricial", type: "image", difficulty: "dificil",
    gridImg: "images/8.png", optionsImg: "images/88.png", correct: 4,
  },
  // 9) Borboletas — a borboleta igual às demais
  {
    category: "Raciocínio matricial", type: "image", difficulty: "facil",
    gridImg: "images/9.png", optionsImg: "images/99.png", correct: 1,
  },
  // 10) Estilhaços — o círculo com um estilhaço normal
  {
    category: "Raciocínio matricial", type: "image", difficulty: "facil",
    gridImg: "images/10.png", optionsImg: "images/1010.png", correct: 0,
  },

  // ===== Raciocínio espacial (rotação vs. espelhamento) =====
  {
    category: "Raciocínio espacial",
    type: "spatial",
    difficulty: "medio",
    prompt: "Qual das opções mostra a mesma peça de referência, apenas girada — sem espelhar?",
    reference: cell("flag", { color: "teal", rotation: 0 }),
    options: [
      cell("flag", { color: "teal", rotation: 60, mirror: true }),
      cell("flag", { color: "teal", rotation: 150 }),
      cell("flag", { color: "teal", rotation: 200, mirror: true }),
      cell("flag", { color: "teal", rotation: 0, mirror: true }),
    ],
    correct: 1,
  },
  {
    category: "Raciocínio espacial",
    type: "spatial",
    difficulty: "medio",
    prompt: "Qual das opções mostra a mesma peça de referência, apenas girada — sem espelhar?",
    reference: cell("flag", { color: "amber", rotation: 0 }),
    options: [
      cell("flag", { color: "amber", rotation: 90 }),
      cell("flag", { color: "amber", rotation: 90, mirror: true }),
      cell("flag", { color: "amber", rotation: 270, mirror: true }),
      cell("flag", { color: "amber", rotation: 180, mirror: true }),
    ],
    correct: 0,
  },
  {
    category: "Raciocínio espacial",
    type: "spatial",
    difficulty: "dificil",
    prompt: "Qual das opções mostra a peça de referência refletida (espelhada), sem girar?",
    reference: cell("flag", { color: "rose", rotation: 40 }),
    options: [
      cell("flag", { color: "rose", rotation: 150, mirror: true }),
      cell("flag", { color: "rose", rotation: 40, mirror: true }),
      cell("flag", { color: "rose", rotation: 220 }),
      cell("flag", { color: "rose", rotation: 40 }),
    ],
    correct: 1,
  },
  {
    category: "Raciocínio espacial",
    type: "spatial",
    difficulty: "dificil",
    prompt: "Qual das opções mostra a mesma peça de referência, apenas girada — sem espelhar?",
    reference: cell("flag", { color: "purple", rotation: 70 }),
    options: [
      cell("flag", { color: "purple", rotation: 70, mirror: true }),
      cell("flag", { color: "purple", rotation: 200, mirror: true }),
      cell("flag", { color: "purple", rotation: 310 }),
      cell("flag", { color: "teal", rotation: 310 }),
    ],
    correct: 2,
  },

  // ===== Raciocínio verbal (analogias) =====
  {
    category: "Raciocínio verbal",
    difficulty: "facil",
    text: "Professor está para Escola assim como Médico está para:",
    options: ["Hospital", "Paciente", "Remédio", "Enfermeira"],
    correct: 0,
  },
  {
    category: "Raciocínio verbal",
    difficulty: "medio",
    text: "Chave está para Fechadura assim como Senha está para:",
    options: ["Login", "Computador", "Teclado", "Internet"],
    correct: 0,
  },
  {
    category: "Raciocínio verbal",
    difficulty: "dificil",
    text: "Semente está para Árvore assim como Ovo está para:",
    options: ["Ave", "Ninho", "Pena", "Bico"],
    correct: 0,
  },

  // ===== Similaridades (raciocínio abstrato verbal, estilo WAIS) =====
  {
    category: "Similaridades",
    difficulty: "facil",
    text: "Em que sentido Maçã e Banana são parecidas?",
    options: ["Ambas são frutas", "Ambas são vermelhas", "Ambas crescem em cactos", "Ambas têm caroço"],
    correct: 0,
  },
  {
    category: "Similaridades",
    difficulty: "medio",
    text: "Em que sentido um Relógio e uma Régua são parecidos?",
    options: ["Ambos são instrumentos de medição", "Ambos têm ponteiros", "Ambos são redondos", "Ambos indicam a hora"],
    correct: 0,
  },
  {
    category: "Similaridades",
    difficulty: "dificil",
    text: "Em que sentido Esperança e Medo são parecidos?",
    options: [
      "Ambos são emoções relacionadas a algo que ainda não aconteceu",
      "Ambos são sentimentos negativos",
      "Ambos causam tristeza",
      "Ambos são incontroláveis",
    ],
    correct: 0,
  },

  // ===== Raciocínio numérico (sequências e problemas aplicados) =====
  {
    category: "Raciocínio numérico",
    difficulty: "facil",
    text: "Qual número continua a sequência? 5, 10, 20, 40, ...",
    options: ["60", "70", "80", "90"],
    correct: 2,
  },
  {
    category: "Raciocínio numérico",
    difficulty: "medio",
    text: "Complete a sequência: 1, 4, 9, 16, 25, ...",
    options: ["30", "34", "36", "49"],
    correct: 2,
  },
  {
    category: "Raciocínio numérico",
    difficulty: "dificil",
    text: "Uma torneira enche um tanque em 6 horas. Outra, sozinha, enche o mesmo tanque em 3 horas. Se as duas forem abertas juntas, em quanto tempo o tanque fica cheio?",
    options: ["1,5 horas", "2 horas", "2,5 horas", "3 horas"],
    correct: 1,
  },
  {
    category: "Raciocínio numérico",
    difficulty: "dificil",
    text: "Um produto custava R$ 80 e sofreu um aumento de 25%. Em seguida, teve um desconto de 20% sobre o novo preço. Qual o preço final?",
    options: ["R$ 76", "R$ 80", "R$ 84", "R$ 90"],
    correct: 1,
  },

  // ===== Raciocínio lógico (silogismos e dedução) =====
  {
    category: "Raciocínio lógico",
    difficulty: "facil",
    text: "Todos os cães são mamíferos. Nenhum mamífero é peixe. Logo:",
    options: [
      "Nenhum cão é peixe",
      "Todos os peixes são cães",
      "Alguns cães são peixes",
      "Não é possível saber",
    ],
    correct: 0,
  },
  {
    category: "Raciocínio lógico",
    difficulty: "medio",
    text: "Se chove, a rua fica molhada. A rua está molhada. Logo:",
    options: [
      "Choveu",
      "Não é possível saber com certeza se choveu",
      "Não choveu",
      "A rua sempre fica molhada",
    ],
    correct: 1,
  },
  {
    category: "Raciocínio lógico",
    difficulty: "dificil",
    text: "Nem todos os artistas são pintores. Todos os pintores são criativos. Logo:",
    options: [
      "Todos os artistas são criativos",
      "Nenhum artista é criativo",
      "Não é possível determinar se todos os artistas são criativos",
      "Todos os criativos são pintores",
    ],
    correct: 2,
  },

  // ===== Compreensão verbal (vocabulário e classificação) =====
  {
    category: "Compreensão verbal",
    difficulty: "facil",
    text: "Qual é o antônimo de 'Meticuloso'?",
    options: ["Descuidado", "Cuidadoso", "Detalhado", "Preciso"],
    correct: 0,
  },
  {
    category: "Compreensão verbal",
    difficulty: "facil",
    text: "Qual palavra não pertence ao grupo?",
    options: ["Violino", "Flauta", "Piano", "Bateria", "Pincel"],
    correct: 4,
  },
  {
    category: "Compreensão verbal",
    difficulty: "dificil",
    text: "Qual é o antônimo de 'Perspicaz'?",
    options: ["Obtuso", "Atento", "Sagaz", "Astuto"],
    correct: 0,
  },

  // ===== Memória de trabalho =====
  {
    category: "Memória de trabalho",
    difficulty: "facil",
    text: "Leia a sequência e escolha a ordem invertida correta: 4 - 8 - 2 - 5",
    options: ["5-2-8-4", "4-8-2-5", "5-8-2-4", "2-4-5-8"],
    correct: 0,
  },
  {
    category: "Memória de trabalho",
    difficulty: "medio",
    text: "Memorize a sequência 6-1-8-4-2. Qual é o terceiro número dela?",
    options: ["1", "8", "4", "2"],
    correct: 1,
  },
  {
    category: "Memória de trabalho",
    difficulty: "dificil",
    text: "Reorganize mentalmente: primeiro os números em ordem crescente, depois as letras em ordem alfabética: 7-B-3-D-A. Qual é a sequência correta?",
    options: ["3-7-A-B-D", "A-B-D-3-7", "7-3-A-B-D", "3-7-D-B-A"],
    correct: 0,
  },
];

let currentIndex = 0;
let score = 0;
let selectedOption = null;
let startTime = null;
let timerInterval = null;
let answersLog = [];

const screens = {
  start: document.getElementById("screen-start"),
  quiz: document.getElementById("screen-quiz"),
  loading: document.getElementById("screen-loading"),
  reveal: document.getElementById("screen-reveal"),
  result: document.getElementById("screen-result"),
};

const appCard = document.getElementById("app-card");
const questionText = document.getElementById("question-text");
const matrixGrid = document.getElementById("matrix-grid");
const spatialReference = document.getElementById("spatial-reference");
const spatialReferenceShape = document.getElementById("spatial-reference-shape");
const optionsContainer = document.getElementById("options");
const answerLabel = document.querySelector(".answer-label");
const quizBody = document.querySelector(".quiz-body");
const progressBar = document.getElementById("progress-bar");
const timerEl = document.getElementById("timer");
const btnStart = document.getElementById("btn-start");
const btnRestart = document.getElementById("btn-restart");
const categoryBreakdown = document.getElementById("category-breakdown");

const ADVANCE_DELAY_MS = 350;

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
  appCard.classList.toggle("card-wide", name === "quiz");
}

function startQuiz() {
  currentIndex = 0;
  score = 0;
  answersLog = [];
  startTime = Date.now();
  showScreen("quiz");
  renderQuestion();
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  timerEl.textContent = `${mm}:${ss}`;
}

function renderVisualOptions(opts) {
  optionsContainer.classList.add("options-visual");
  opts.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "option option-visual";
    btn.innerHTML = cellSVG(opt);
    btn.addEventListener("click", () => selectOption(i));
    optionsContainer.appendChild(btn);
  });
}

function renderTextOptions(opts) {
  optionsContainer.classList.remove("options-visual");
  opts.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "option";
    btn.textContent = opt;
    btn.addEventListener("click", () => selectOption(i));
    optionsContainer.appendChild(btn);
  });
}

// Perguntas baseadas em imagem: mostra a imagem das 6 opções e sobrepõe 6 áreas
// clicáveis numa grade 2x3 (ordem linha a linha: 0..5).
function renderImageOptions(optionsImg) {
  optionsContainer.classList.remove("options-visual");
  const wrap = document.createElement("div");
  wrap.className = "options-image-wrap";

  const img = document.createElement("img");
  img.className = "options-bg";
  img.src = optionsImg;
  img.alt = "Opções de resposta";
  img.onerror = () => {
    img.replaceWith(
      Object.assign(document.createElement("div"), {
        className: "img-missing",
        innerHTML: `Falta enviar:<br>${optionsImg}`,
      })
    );
  };
  wrap.appendChild(img);

  const hotspots = document.createElement("div");
  hotspots.className = "options-hotspots";
  for (let i = 0; i < 6; i++) {
    const btn = document.createElement("button");
    btn.className = "option-hotspot";
    btn.setAttribute("aria-label", `Opção ${i + 1}`);
    btn.addEventListener("click", () => selectOption(i));
    hotspots.appendChild(btn);
  }
  wrap.appendChild(hotspots);
  optionsContainer.appendChild(wrap);
}

function renderQuestion() {
  const q = QUESTIONS[currentIndex];
  selectedOption = null;

  // Transição a cada nova pergunta. Nas 10 primeiras (matrizes em imagem) usamos
  // uma animação mais longa e elaborada; nas demais, o fade curto.
  if (quizBody) {
    const longAnim = currentIndex < 10;
    quizBody.classList.remove("q-enter", "q-enter-long");
    void quizBody.offsetWidth;
    quizBody.classList.add(longAnim ? "q-enter-long" : "q-enter");
  }

  progressBar.style.width = `${(currentIndex / QUESTIONS.length) * 100}%`;

  matrixGrid.hidden = true;
  matrixGrid.innerHTML = "";
  matrixGrid.classList.remove("cols-2", "is-image");
  spatialReference.hidden = true;
  optionsContainer.innerHTML = "";
  // O painel de opções das perguntas em imagem já traz "Escolha sua resposta:"
  // embutido, então escondemos o rótulo do HTML nesses casos.
  if (answerLabel) answerLabel.hidden = q.type === "image";
  if (quizBody) quizBody.classList.toggle("quiz-body-image", q.type === "image");

  if (q.type === "image") {
    questionText.textContent = q.prompt || "Qual figura completa a matriz?";
    matrixGrid.hidden = false;
    matrixGrid.classList.add("is-image");
    const gimg = document.createElement("img");
    gimg.className = "puzzle-img";
    gimg.src = q.gridImg;
    gimg.alt = "Matriz da pergunta";
    gimg.onerror = () => {
      matrixGrid.innerHTML = `<div class="img-missing">Falta enviar:<br>${q.gridImg}</div>`;
    };
    matrixGrid.appendChild(gimg);
    renderImageOptions(q.optionsImg);
  } else if (q.type === "matrix") {
    questionText.textContent = q.prompt || "Qual figura completa a matriz?";
    matrixGrid.hidden = false;
    matrixGrid.classList.toggle("cols-2", q.grid.length === 4);
    matrixGrid.innerHTML = q.grid.map((c) => cellSVG(c)).join("");
    renderVisualOptions(q.options);
  } else if (q.type === "spatial") {
    questionText.textContent = q.prompt;
    spatialReference.hidden = false;
    spatialReferenceShape.innerHTML = cellSVG(q.reference);
    renderVisualOptions(q.options);
  } else if (q.type === "oddoneout") {
    questionText.textContent = q.prompt;
    renderVisualOptions(q.options);
  } else {
    questionText.textContent = q.text;
    renderTextOptions(q.options);
  }
}

function selectOption(index) {
  if (selectedOption !== null) return;
  selectedOption = index;

  const q = QUESTIONS[currentIndex];
  const isCorrect = index === q.correct;
  answersLog.push({ category: q.category, difficulty: q.difficulty, correct: isCorrect });
  if (isCorrect) score++;

  // Não revela se a resposta está certa ou errada — só marca a selecionada.
  const optionEls = optionsContainer.querySelectorAll(".option, .option-hotspot");
  optionEls.forEach((el, i) => {
    el.classList.add("disabled");
    if (i === index) el.classList.add("selected");
  });

  setTimeout(nextQuestion, ADVANCE_DELAY_MS);
}

function nextQuestion() {
  currentIndex++;
  if (currentIndex >= QUESTIONS.length) {
    finishQuiz();
  } else {
    renderQuestion();
  }
}

// Classificação Wechsler usada no Brasil (média 100 / desvio 15).
function classifyIQ(iq) {
  if (iq < 70) return { label: "Abaixo da média", tone: "low" };
  if (iq < 80) return { label: "Limítrofe", tone: "low" };
  if (iq < 90) return { label: "Médio inferior", tone: "low" };
  if (iq < 110) return { label: "Médio", tone: "mid" };
  if (iq < 120) return { label: "Médio superior", tone: "mid" };
  if (iq < 130) return { label: "Superior", tone: "high" };
  return { label: "Superdotação · altas habilidades", tone: "high" };
}

// Normal acumulada (Abramowitz & Stegun 26.2.17) — fração da população abaixo de z.
function normalCdf(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

// Frase comparando com a população brasileira (curva padrão, média 100).
function brazilComparison(iq) {
  const cdf = normalCdf((iq - 100) / 15);
  if (iq >= 100) {
    const top = (1 - cdf) * 100;
    const topStr = top < 1 ? top.toFixed(1).replace(".", ",") : String(Math.round(top));
    return `Você está entre os ${topStr}% com maior QI do Brasil.`;
  }
  const better = Math.max(1, Math.round(cdf * 100));
  return `Você está acima de ${better}% dos brasileiros.`;
}

// Igual à de cima, mas com APENAS o número desfocado (para o gancho do paywall).
function brazilComparisonTeaser(iq) {
  const cdf = normalCdf((iq - 100) / 15);
  if (iq >= 100) {
    const top = (1 - cdf) * 100;
    const topStr = top < 1 ? top.toFixed(1).replace(".", ",") : String(Math.round(top));
    return `Você está entre os <span class="blur">${topStr}%</span> com maior QI do Brasil.`;
  }
  const better = Math.max(1, Math.round(cdf * 100));
  return `Você está acima de <span class="blur">${better}%</span> dos brasileiros.`;
}

// Médias nacionais de QI (valores populares/estimados — cientificamente debatidos).
const COUNTRY_IQ = [
  { c: "Coreia do Sul", iq: 107 }, { c: "China", iq: 107 }, { c: "Japão", iq: 106 },
  { c: "Singapura", iq: 106 }, { c: "Taiwan", iq: 106 }, { c: "Itália", iq: 102 },
  { c: "Rússia", iq: 102 }, { c: "Austrália", iq: 102 }, { c: "Espanha", iq: 101 },
  { c: "Suíça", iq: 101 }, { c: "Alemanha", iq: 100 }, { c: "Holanda", iq: 100 },
  { c: "Áustria", iq: 100 }, { c: "Suécia", iq: 99 }, { c: "Reino Unido", iq: 99 },
  { c: "Canadá", iq: 99 }, { c: "Estados Unidos", iq: 98 }, { c: "França", iq: 98 },
  { c: "Polônia", iq: 96 }, { c: "Portugal", iq: 95 }, { c: "Grécia", iq: 92 },
  { c: "Turquia", iq: 90 }, { c: "Brasil", iq: 87 }, { c: "Chile", iq: 87 },
  { c: "Argentina", iq: 86 }, { c: "México", iq: 86 },
];

function countryComparison(iq) {
  if (iq >= 109) {
    return "Seu QI está acima da média de qualquer país do mundo — as maiores médias nacionais ficam em torno de 106–107 (Coreia do Sul, China e Japão).";
  }
  if (iq < 85) {
    return "Fica abaixo da média nacional da maioria dos países, que costumam variar entre ~87 e ~107 nas estimativas disponíveis.";
  }
  const near = COUNTRY_IQ.map((o) => ({ ...o, d: Math.abs(o.iq - iq) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map((o) => `${o.c} (~${o.iq})`);
  return `Está próximo da média nacional de países como ${near.join(", ")}.`;
}

// Pessoas com QI popularmente atribuído (estimativas NÃO oficiais, muito citadas).
const FAMOUS_IQ = [
  { n: "Jodie Foster", iq: 132 }, { n: "Nicole Kidman", iq: 132 },
  { n: "Arnold Schwarzenegger", iq: 135 }, { n: "Emma Watson", iq: 138 },
  { n: "Natalie Portman", iq: 140 }, { n: "Shakira", iq: 140 },
  { n: "Madonna", iq: 140 }, { n: "Hillary Clinton", iq: 140 },
  { n: "Bill Gates", iq: 150 }, { n: "Mark Zuckerberg", iq: 152 },
  { n: "Elon Musk", iq: 155 }, { n: "Steve Jobs", iq: 160 },
  { n: "Quentin Tarantino", iq: 160 }, { n: "Albert Einstein", iq: 160 },
  { n: "Stephen Hawking", iq: 160 }, { n: "Garry Kasparov", iq: 190 },
];

// "1 em cada N pessoas" — só faz sentido acima da média (senão N seria ~1).
function rarityLine(iq) {
  const pAbove = 1 - normalCdf((iq - 100) / 15);
  if (pAbove <= 0 || pAbove >= 0.5) return "";
  const oneIn = Math.round(1 / pAbove);
  return `Aproximadamente 1 em cada ${oneIn.toLocaleString("pt-BR")} pessoas atinge um QI igual ou maior que o seu.`;
}

// Referência de pessoas/grupos com QI próximo (varia com a pontuação).
function referenceLine(iq) {
  if (iq >= 128) {
    const near = FAMOUS_IQ.map((o) => ({ ...o, d: Math.abs(o.iq - iq) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 4)
      .map((o) => `${o.n} (~${o.iq})`);
    return `Estimativas populares (não oficiais) de QI de celebridades colocam por perto nomes como ${near.join(", ")}. É também o piso de entrada da Mensa, a sociedade que só aceita o top 2%. Gênios históricos como Einstein e da Vinci costumam ser citados em ~160–190, mas são sempre estimativas retroativas — eles nunca fizeram um teste de verdade.`;
  }
  if (iq >= 118) {
    return "É a faixa média estimada de muitos médicos, engenheiros, cientistas e advogados de alto desempenho, acima da média dos universitários (~115). Curiosamente, grandes mestres de xadrez têm QI médio estimado em torno de 130 — perto do seu resultado.";
  }
  if (iq >= 108) {
    return "Fica na média ou acima de grupos como universitários (~115, estimado) e bem acima da média da população geral (100). É a faixa de quem costuma se dar bem em cursos e provas que exigem raciocínio.";
  }
  if (iq >= 95) {
    return "É a faixa em que está a maior parte das pessoas ao seu redor — colegas de trabalho, amigos e família tendem a se concentrar aqui, já que metade da população fica entre 90 e 110.";
  }
  return "Um teste rápido como este mede só uma fatia da inteligência; a maioria das pessoas muda de faixa dependendo do dia, do descanso e do tipo de prova. O número diz muito pouco sobre o seu valor ou o seu potencial.";
}

// Seção educativa fixa, mostrada em todos os resultados (mesmo conteúdo pra todos).
const IQ_ABOUT = `
  <h4 class="profile-h">Entenda o QI</h4>
  <p class="profile-desc">O QI (quociente de inteligência) é uma medida padronizada de raciocínio, construída para ter média 100 e desvio-padrão 15 na população. Ele resume habilidades como lógica, reconhecimento de padrões, raciocínio verbal, memória de trabalho e velocidade de processamento — mas é só uma fotografia de uma parte da mente.</p>
  <h4 class="profile-h">O que o QI ajuda a prever</h4>
  <ul class="profile-list">
    <li>Rapidez para aprender coisas novas e abstratas</li>
    <li>Desempenho médio em estudos e em muitas profissões</li>
    <li>Facilidade com problemas lógicos e de padrões</li>
  </ul>
  <h4 class="profile-h">O que o QI NÃO mede</h4>
  <ul class="profile-list profile-list-dot">
    <li>Criatividade e originalidade</li>
    <li>Inteligência emocional e empatia</li>
    <li>Caráter, disciplina e motivação</li>
    <li>Talento artístico, esportivo ou manual</li>
    <li>Sabedoria prática e bom senso do dia a dia</li>
  </ul>
  <h4 class="profile-h">De onde vem o teste de QI</h4>
  <p class="profile-desc">O primeiro teste prático foi criado por Alfred Binet, na França de 1905 — e não para rankear gênios, mas para identificar crianças que precisavam de mais apoio na escola. O termo "QI" foi cunhado por William Stern em 1912, e as escalas de David Wechsler se tornaram o padrão usado no mundo todo. Desde então, o chamado efeito Flynn mostrou que a pontuação média foi subindo cerca de 3 pontos por década ao longo do século XX — por isso os testes são recalibrados de tempos em tempos.</p>
`;

// Perfil aprofundado por faixa de QI (escolhido pelo maior "min" que o QI alcança).
const IQ_PROFILES = [
  {
    min: 130,
    title: "Superdotação · Altas habilidades",
    summary:
      "Você caiu na faixa de altas habilidades / superdotação — o mesmo corte (QI ≥ 130) usado como referência pela Mensa e pelos programas de AH/SD, onde estão cerca de 2% das pessoas. O perfil típico combina raciocínio abstrato muito veloz, facilidade de enxergar padrões onde a maioria só vê ruído e a capacidade de aprender assuntos complexos quase sem ajuda. Costuma vir acompanhado de curiosidade intensa, pensamento não-linear e uma exigência alta consigo mesmo — às vezes com tédio diante de tarefas repetitivas e forte tendência ao hiperfoco no que interessa. Modelos de altas habilidades, como o de Renzulli, lembram que superdotação não é só QI: envolve também criatividade e comprometimento com a tarefa — o talento só vira resultado quando encontra dedicação.",
    abilities: [
      "Resolver problemas totalmente novos, sem depender de exemplos prontos",
      "Aprender assuntos difíceis com pouquíssima instrução",
      "Perceber conexões e padrões sutis muito rápido",
      "Segurar e manipular bastante informação na cabeça ao mesmo tempo",
      "Fazer pontes entre áreas de conhecimento totalmente diferentes",
      "Sustentar raciocínios longos e complexos sem se perder",
      "Abstração e lógica bem acima do exigido pela maioria das profissões",
    ],
    careers:
      "Pesquisa científica, matemática, física, filosofia, xadrez de alto nível, programação e engenharia avançadas — campos que exigem abstração pesada e aprendizado autônomo. Também é comum nessa faixa quem se destaca em criação, estratégia e empreendedorismo. Ainda assim, QI alto sozinho não garante nada: motivação, disciplina e habilidades sociais pesam tanto quanto.",
    curiosities: [
      "O corte de 130 é exatamente o critério de entrada da Mensa, que só aceita o topo de 2% da população.",
      "QI acima de 145 é mais raro que 1 em cada 1.000 pessoas.",
      "O recorde do Guinness de maior QI já foi atribuído a Marilyn vos Savant (~228).",
      "Gênios históricos como Einstein, da Vinci e Newton têm QI apenas estimado retroativamente — nenhum deles chegou a fazer um teste real.",
      "O estudo de Terman com crianças superdotadas mostrou que persistência e caráter previram sucesso melhor que o próprio QI.",
    ],
  },
  {
    min: 120,
    title: "Inteligência superior",
    summary:
      "Resultado na faixa superior, à frente de cerca de 90% ou mais da população. Você aprende rápido, abstrai bem e lida com naturalidade com problemas complexos e inéditos. É a faixa frequente entre quem se destaca em áreas exigentes como engenharia, medicina, ciências exatas, direito e pesquisa — pessoas que costumam ter uma curva de aprendizado bem mais curta que a média e que muitas vezes se entediam com o ritmo comum, preferindo desafios.",
    abilities: [
      "Aprender conteúdos difíceis mais rápido que a maioria",
      "Raciocínio lógico e abstrato forte",
      "Resolver problemas de várias etapas sem se perder",
      "Enxergar a lógica por trás de sistemas complexos",
      "Argumentar e estruturar ideias com clareza",
      "Boa memória de trabalho e concentração",
    ],
    careers:
      "Medicina, engenharia, direito, ciências, tecnologia e gestão — áreas técnicas que você tende a dominar rapidamente. Boa parte dos cargos de liderança técnica e científica está nessa faixa. A partir daqui, o que mais separa as pessoas é método e esforço, não 'mais QI'.",
    curiosities: [
      "Cerca de 1 em cada 20 pessoas alcança QI 125 ou mais.",
      "Grandes mestres de xadrez têm QI médio estimado em torno de 130.",
      "Seu resultado já está acima da média de todos os países do mundo (a maior é ~107).",
      "Acima de ~120, hábitos e método explicam mais o desempenho do que pontos extras de QI.",
      "O QI prediz razoavelmente notas e desempenho profissional — mas não criatividade nem felicidade.",
    ],
  },
  {
    min: 110,
    title: "Médio superior (acima da média)",
    summary:
      "Você está acima da média, à frente da maioria das pessoas. Resolve bem tanto os problemas do dia a dia quanto os acadêmicos, aprende novas habilidades com relativa facilidade e tem bom raciocínio verbal e lógico. É a faixa comum entre universitários e profissionais qualificados, e bem confortável para cursos superiores e concursos que cobram raciocínio.",
    abilities: [
      "Bom desempenho nos estudos e no trabalho",
      "Aprender coisas novas sem grande dificuldade",
      "Raciocínio verbal e lógico acima da média",
      "Compreender textos e instruções complexas com facilidade",
      "Adaptar-se rápido a tarefas e contextos novos",
      "Planejar e organizar tarefas complexas",
    ],
    careers:
      "Ensino superior e profissões qualificadas em geral: administração, saúde, educação, tecnologia da informação e áreas técnicas. Muitos profissionais liberais e gestores estão aqui. Com dedicação, praticamente qualquer curso está ao seu alcance.",
    curiosities: [
      "Apenas cerca de 16% das pessoas ultrapassam o QI 115.",
      "É a faixa média estimada de quem conclui uma graduação.",
      "O teste de QI foi criado por Alfred Binet em 1905 — para ajudar crianças com dificuldade, não para rankear gênios.",
      "O termo 'QI' foi cunhado pelo psicólogo William Stern em 1912.",
      "Pequenas melhoras de sono, foco e prática já mudam bastante o desempenho nesse tipo de teste.",
    ],
  },
  {
    min: 90,
    title: "Médio (a faixa da maioria)",
    summary:
      "Aqui está a maior parte da população: cerca de metade das pessoas tem QI entre 90 e 110. É um funcionamento intelectual típico — você dá conta bem das demandas do cotidiano, do trabalho e dos estudos. Dentro dessa faixa, quanto mais perto de 109, mais ágil tende a ser o raciocínio em problemas novos; o que mais diferencia as pessoas por aqui é dedicação, experiência e interesse. Vale lembrar que dentro dessa faixa cabem tanto tarefas simples quanto muitas profissões que exigem anos de estudo.",
    abilities: [
      "Dar conta das demandas comuns do dia a dia e do trabalho",
      "Aprender com instrução e prática",
      "Bom senso e raciocínio prático",
      "Resolver problemas do cotidiano com eficiência",
      "Seguir e executar planos de várias etapas",
      "Comunicação e compreensão adequadas",
    ],
    careers:
      "Praticamente qualquer profissão do cotidiano; com estudo e prática, também as mais técnicas. Experiência e especialização costumam pesar muito mais que os pontos de QI nessa faixa.",
    curiosities: [
      "Cerca de metade da humanidade tem QI entre 90 e 110.",
      "Por definição, o QI médio mundial é fixado em 100 — e recalibrado a cada geração pelo chamado 'efeito Flynn'.",
      "68% das pessoas ficam entre 85 e 115; 95% ficam entre 70 e 130.",
      "As escalas Wechsler são as mais usadas no mundo para medir QI.",
      "O QI não mede criatividade, inteligência emocional nem sabedoria prática.",
    ],
  },
  {
    min: 80,
    title: "Médio inferior",
    summary:
      "Resultado um pouco abaixo da média nesta bateria. Vale lembrar que um teste rápido e recreativo como este mede só uma fatia do raciocínio (padrões visuais, lógica e um pouco de verbal) e é bastante sensível a cansaço, pressa e falta de familiaridade com esse tipo de questão. Costuma indicar um raciocínio prático preservado, com mais dificuldade nas questões mais abstratas. Não confunda um resultado mediano num teste rápido com o seu potencial real.",
    abilities: [
      "Lidar bem com tarefas práticas e concretas",
      "Aprender com repetição e exemplos",
      "Executar rotinas e processos com consistência",
      "Dar conta das atividades do dia a dia",
    ],
    careers:
      "Funções práticas e operacionais, com bom desempenho quando há treino, rotina e instruções claras.",
    curiosities: [
      "Testes rápidos e cronometrados costumam subestimar quem não está acostumado com o formato.",
      "O 'efeito Flynn' mostra que a pontuação média subiu ~3 pontos por década no século XX — ou seja, a régua muda com o tempo.",
      "Nutrição, escolaridade e até deficiência de iodo já afetaram a média de QI de países inteiros.",
      "O QI mede uma fatia da inteligência — não o seu valor nem o seu futuro.",
      "Descanso, calma e um segundo teste sem pressa podem mudar bastante o número.",
    ],
  },
  {
    min: 70,
    title: "Limítrofe",
    summary:
      "Pontuação abaixo da média neste teste. Como é uma prova curta e recreativa, o resultado é muito influenciado por pressa, distração e por não estar acostumado com esse formato de questão — não é um diagnóstico. Muita gente sobe várias faixas simplesmente refazendo com atenção. Se quiser um número mais confiável, refaça com calma, sem interrupções.",
    abilities: [
      "Tarefas concretas e do cotidiano",
      "Aprendizado com apoio e exemplos claros",
      "Rotinas e processos com orientação",
    ],
    careers:
      "Atividades concretas e do dia a dia, especialmente com apoio, exemplos e prática.",
    curiosities: [
      "Um único teste curto não é diagnóstico — ansiedade e pressa derrubam bastante a pontuação.",
      "Alfred Binet criou o teste justamente para apoiar quem tinha dificuldade, não para julgar ninguém.",
      "O QI não mede criatividade, empatia, talento artístico nem esforço.",
      "A régua do QI muda com o tempo (efeito Flynn), então o número é sempre relativo.",
      "Fazer o teste calmo e sem interrupções pode mudar bastante o resultado.",
    ],
  },
  {
    min: 0,
    title: "Abaixo da média",
    summary:
      "Pontuação baixa nesta rodada. Vale reforçar: este é um teste recreativo e curto, feito pra ser divertido e sem validade clínica. Resultados assim geralmente têm mais a ver com pressa, chutes ou falta de familiaridade com o formato do que com capacidade real. Inteligência tem muitas formas, e nenhuma prova de poucos minutos dá conta de todas elas. Vale refazer com calma.",
    abilities: [
      "Atividades práticas e do dia a dia",
      "Aprendizado passo a passo",
      "Tarefas guiadas, com apoio e exemplos",
    ],
    careers:
      "Atividades práticas e passo a passo, com orientação clara.",
    curiosities: [
      "Este é um teste recreativo, sem validade clínica — não substitui uma avaliação profissional.",
      "Cansaço, pressa e chutes influenciam muito os resultados baixos em testes rápidos.",
      "O QI mede só uma parte estreita da mente humana.",
      "Inteligência prática, social, emocional e criativa não aparece num teste como este.",
      "Vale refazer com calma, num momento tranquilo e sem distrações.",
    ],
  },
];

function getProfile(iq) {
  return IQ_PROFILES.find((p) => iq >= p.min) || IQ_PROFILES[IQ_PROFILES.length - 1];
}

// Perfil ESPECÍFICO por valor exato de QI, usado a partir de 22 acertos (QI ≥ 104).
// Cada nível tem: veredito (gênio/superdotado ou não), resumo, profissões reais e
// pessoas reais com QI aproximado (estimativas populares, não oficiais).
// Abaixo de 104 (menos de 22 acertos) o site continua usando o perfil por faixa.
const IQ_DETAIL = {
  77: {
    title: "Abaixo da média (faixa limítrofe)",
    verdict:
      "Não é superdotação nem nível de gênio — e também não é um diagnóstico. Este é um teste curto e recreativo, muito sensível a pressa, distração e falta de familiaridade com o formato. O número diz pouco sobre o seu potencial real.",
    summary:
      "Com 12 acertos, a pontuação ficou abaixo da média nesta rodada. Muita gente sobe várias faixas simplesmente refazendo com calma e sem interrupções. Costuma indicar um raciocínio mais prático e concreto, com mais dificuldade nas questões abstratas.",
    careers:
      "Você tende a se dar bem em funções práticas e concretas, com rotina e instruções claras: auxiliar de produção, serviços gerais, logística e estoque, montagem, atendimento e funções operacionais em geral — especialmente com treino e prática.",
    people:
      "Nesta faixa não existem estimativas confiáveis de 'QI de celebridades', e um número baixo num teste rápido não define ninguém: o boxeador Muhammad Ali, um dos maiores atletas da história, tirou cerca de 78 num teste de QI do exército e brincou que era 'o maior, não o mais inteligente'. Ou seja, o resultado aqui fala muito pouco sobre o seu valor.",
  },
  80: {
    title: "Médio inferior",
    verdict:
      "Não é gênio nem superdotação (o corte é 130) — e nem um diagnóstico. É um teste recreativo e curto, sensível a cansaço e pressa.",
    summary:
      "Com 13 acertos, o resultado ficou um pouco abaixo da média. Indica um raciocínio prático preservado, com mais dificuldade nos itens mais abstratos. Refazer com calma costuma mudar bastante o número.",
    careers:
      "Combinam com você funções práticas com rotina e apoio: atendimento ao cliente, operador(a) de caixa, auxiliar administrativo, produção, logística, manutenção e serviços com treinamento.",
    people:
      "As listas de 'QI de famosos' não alcançam esta faixa. Como lembrete de que o número importa pouco: Muhammad Ali, lenda do boxe, teve ~78 num teste do exército e seguiu sendo um dos maiores de todos os tempos.",
  },
  83: {
    title: "Médio inferior",
    verdict:
      "Não é superdotação nem nível de gênio, e não é um diagnóstico. Esta bateria mede sobretudo padrões visuais e lógica, e é bem sensível à pressa e ao cansaço.",
    summary:
      "Com 14 acertos, ficou abaixo da média nesta rodada. Costuma refletir mais pressa ou pouca familiaridade com o formato do que capacidade real, e um segundo teste, com calma, costuma render bem mais.",
    careers:
      "Você tende a ir bem em: motorista, operador(a) de máquinas, auxiliar de cozinha, vendas de balcão, produção, manutenção e serviços — funções concretas que rendem com treino e prática.",
    people:
      "Não há estimativas sérias de QI de celebridades nesta faixa; a referência honesta é a população em geral. E o número diz pouco: Muhammad Ali marcou ~78 num teste do exército e virou lenda mesmo assim.",
  },
  86: {
    title: "Médio inferior",
    verdict:
      "Longe do corte de superdotação (130) e do território de gênio, mas nada de diagnóstico: é um teste rápido e recreativo, fácil de ser puxado para baixo por distração.",
    summary:
      "Com 15 acertos, você está um pouco abaixo da média, mas perto dela. Descanso, calma e familiaridade com esse tipo de questão costumam empurrar o resultado para a faixa média.",
    careers:
      "Combinam com você funções técnicas e de atendimento com treino: vendas, atendimento ao cliente, produção qualificada, manutenção, logística e auxiliar administrativo.",
    people:
      "As listas populares de QI de famosos só citam números de ~120 pra cima, então não há celebridade 'desta faixa' para comparar — a referência real é a maioria das pessoas ao seu redor.",
  },
  89: {
    title: "Quase na média",
    verdict:
      "Não é superdotação nem gênio (corte 130), mas está praticamente encostando na faixa média da população. Também não é um diagnóstico.",
    summary:
      "Com 16 acertos, você está bem perto da média. Um pouco mais de calma e descanso já costumam levar o resultado para a faixa média, onde fica a maior parte das pessoas.",
    careers:
      "Você tende a se dar bem em: técnico(a) em diversas áreas, vendas, atendimento, auxiliar administrativo, produção qualificada, operações e serviços — com boa margem para crescer com estudo.",
    people:
      "Não existem estimativas confiáveis de QI de celebridades nesta faixa; a comparação justa é com a população geral e as médias nacionais, não com nomes famosos.",
  },
  90: {
    title: "Médio — a faixa da maioria",
    verdict:
      "Não é superdotação nem gênio (o corte é 130), mas também não está abaixo: 90 já entra na faixa média, a da maior parte das pessoas.",
    summary:
      "Com 17 acertos, você entra na faixa média — cerca de metade da população fica entre 90 e 110. É um funcionamento intelectual típico, que dá conta bem das demandas do dia a dia, do trabalho e dos estudos.",
    careers:
      "Praticamente qualquer profissão do cotidiano, e as mais técnicas com estudo e prática: administração, vendas, atendimento, produção, técnico(a) em diversas áreas, saúde, serviços e operações.",
    people:
      "As listas populares de QI de famosos só costumam citar números de 120 pra cima, então a referência honesta aqui é a maioria das pessoas ao seu redor. Seu resultado está próximo da média nacional estimada de vários países (o Brasil, por exemplo, aparece em ~87–100 nessas estimativas, que são muito debatidas).",
  },
  93: {
    title: "Médio — a faixa da maioria",
    verdict:
      "Faixa média, típica da maioria das pessoas. Não é superdotação nem gênio, e está bem dentro do funcionamento intelectual comum.",
    summary:
      "Com 18 acertos, você está confortavelmente na faixa média. Resolve bem os problemas do dia a dia e boa parte dos acadêmicos; o que mais diferencia as pessoas por aqui é interesse, prática e experiência.",
    careers:
      "Combinam com você praticamente todas as profissões do cotidiano e, com estudo, as técnicas: administração, saúde, educação, vendas, tecnologia (suporte), produção e serviços.",
    people:
      "Nesta faixa não há celebridades com 'QI conhecido' para citar (essas listas começam por volta de 120). A melhor referência é a população em geral e as médias nacionais, próximas do seu resultado.",
  },
  96: {
    title: "Médio",
    verdict:
      "Bem no miolo da faixa média, quase na marca de 100. Não é superdotação nem gênio — é o raciocínio típico da maior parte das pessoas.",
    summary:
      "Com 19 acertos, você está quase no centro exato da escala. Dá conta das demandas comuns e aprende bem com instrução e prática, com leve espaço para crescer rumo à média cheia (100).",
    careers:
      "Você se dá bem em praticamente qualquer profissão do dia a dia e, com estudo, nas técnicas: administração, saúde, educação, vendas, atendimento, produção, logística e tecnologia.",
    people:
      "A média mundial (100) está logo acima do seu resultado. Como as listas de QI de famosos só citam números bem mais altos, a referência real aqui é a maioria das pessoas ao seu redor, não uma celebridade.",
  },
  100: {
    title: "Exatamente na média",
    verdict:
      "É exatamente a média mundial de QI, fixada em 100. Não é superdotação nem gênio — e não precisa ser: metade das pessoas fica entre 90 e 110, então você está bem no centro da população.",
    summary:
      "Com 20 acertos, seu resultado é o ponto de equilíbrio da escala. Você lida bem com problemas do dia a dia e acadêmicos comuns; nesta faixa, o que mais diferencia as pessoas é interesse, prática e experiência.",
    careers:
      "Praticamente qualquer profissão do cotidiano e, com estudo, também as mais técnicas: administração, saúde, educação, vendas, serviços, produção e tecnologia.",
    people:
      "Por definição, 100 é a média de toda a população — é onde estão a maior parte dos seus colegas, amigos e familiares. As listas de 'QI de celebridades' começam bem acima (a partir de ~120), então não há uma pessoa famosa 'de QI 100' para citar: a referência é justamente a maioria das pessoas.",
  },
  102: {
    title: "Na média",
    verdict:
      "Levemente acima do ponto médio (100), ainda na faixa média. Não é superdotação nem gênio, mas também não está abaixo da média — é o funcionamento típico da maioria.",
    summary:
      "Com 21 acertos, você fica logo acima do centro da escala. É um raciocínio típico, com leve vantagem em problemas novos, e bastante espaço para crescer com método e prática.",
    careers:
      "Você tende a ir bem em praticamente qualquer profissão do cotidiano e, com estudo, nas técnicas: administração, saúde, educação, vendas, tecnologia, produção e serviços qualificados.",
    people:
      "Você está praticamente na média mundial (100). Como as listas populares de QI de famosos só citam números de ~120 pra cima, não há celebridade desta faixa para comparar — a referência é a maioria das pessoas ao seu redor.",
  },
  104: {
    title: "Acima da média",
    verdict:
      "Não é um resultado de gênio nem de superdotação — o corte de altas habilidades fica em 130, bem acima daqui —, mas está claramente acima da média da população, que é 100. Você está à frente de cerca de 60% das pessoas.",
    summary:
      "Com 22 acertos, seu raciocínio fica um degrau acima da média. Você resolve bem tanto os problemas do dia a dia quanto boa parte dos desafios acadêmicos e do trabalho, principalmente quando tem método e um pouco de prática. Aprende com facilidade e costuma se sair bem em provas e cursos que cobram raciocínio.",
    careers:
      "Você tende a ir bem em profissões qualificadas que misturam técnica e trato com pessoas: analista administrativo(a), técnico(a) de enfermagem, professor(a), representante comercial e vendas, corretor(a) de imóveis, supervisor(a) de operações, suporte e infraestrutura de TI, assistente jurídico(a) e gestão de pequenos negócios.",
    people:
      "As listas populares de 'QI de famosos' quase só citam números de 120 pra cima, então nesta faixa a referência mais honesta não é uma celebridade, e sim a maioria dos profissionais formados ao seu redor — o topo dos universitários é estimado em ~115. O nome público mais citado logo acima do seu nível costuma ser o do ex-presidente americano George W. Bush (~120, estimativa não oficial).",
  },
  106: {
    title: "Acima da média",
    verdict:
      "Ainda não é nível de gênio nem de superdotação (o corte é 130), mas está acima da média (100): você fica à frente de cerca de 65% das pessoas.",
    summary:
      "Com 23 acertos, você mostra um raciocínio consistente e acima do comum. Pega conceitos novos com relativa rapidez, lida bem com problemas de várias etapas e costuma ser a pessoa que 'entende as coisas rápido' no grupo. É uma faixa bem confortável para cursos superiores e concursos que exigem lógica.",
    careers:
      "Combinam com você: administração, contabilidade, professor(a), enfermagem, análise de dados júnior, técnico(a) em TI, comércio e vendas técnicas, logística, recursos humanos e empreendedorismo de pequeno e médio porte.",
    people:
      "Nesta faixa mediana-alta as estimativas populares de QI de celebridades praticamente não aparecem (elas costumam citar só números de 120 pra cima). A melhor referência é o topo dos universitários (~115) e, logo acima do seu resultado, o ex-presidente George W. Bush, frequentemente estimado em ~120 (estimativa não oficial).",
  },
  108: {
    title: "Acima da média",
    verdict:
      "Não chega a ser superdotação ou gênio (o corte de altas habilidades é 130), mas está no topo da faixa média — à frente de cerca de 70% das pessoas.",
    summary:
      "Com 24 acertos, você está quase entrando na faixa 'médio superior'. Seu raciocínio lógico e abstrato é bom, você aprende assuntos difíceis com pouca ajuda e organiza bem tarefas complexas. É a inteligência típica de quem se dá bem em graduações exigentes.",
    careers:
      "Você tende a brilhar em: engenharia (com dedicação), administração, direito, análise de sistemas, ciências contábeis, enfermagem e área da saúde, ensino, ciência de dados júnior e cargos de coordenação.",
    people:
      "É a faixa média estimada de quem conclui uma faculdade. As citações populares de QI de famosos começam um pouco acima do seu nível — o ex-presidente George W. Bush é comumente estimado em ~120 (não oficial), e a partir daí aparecem nomes como Nicole Kidman e Jodie Foster (~132).",
  },
  110: {
    title: "Médio superior",
    verdict:
      "Não é superdotação nem gênio (o corte é 130), mas 110 marca o começo do 'médio superior': você está à frente de cerca de 75% da população.",
    summary:
      "Com 25 acertos, seu desempenho já está claramente acima da maioria. Você compreende textos e instruções complexas com facilidade, adapta-se rápido a contextos novos e planeja bem tarefas de várias etapas. É a faixa de universitários e profissionais qualificados.",
    careers:
      "Áreas que combinam: engenharia, administração e gestão, direito, análise de dados, ciência da computação, medicina e saúde (com dedicação), pesquisa aplicada, arquitetura e cargos de liderança técnica.",
    people:
      "É o patamar médio de quem se forma na universidade (~115 no topo). Nas estimativas populares (não oficiais), o nome público mais próximo logo acima do seu é o do ex-presidente George W. Bush (~120); um pouco além aparecem Nicole Kidman e Jodie Foster (~132).",
  },
  115: {
    title: "Médio superior",
    verdict:
      "Ainda não é o corte de superdotação (130), mas 115 é exatamente um desvio-padrão acima da média: apenas cerca de 16% da população chega até aqui. Não é 'gênio', é claramente superior à média.",
    summary:
      "Com 26 acertos, você está no grupo de melhor desempenho. Aprende conteúdos difíceis mais rápido que a maioria, tem raciocínio lógico e abstrato forte e enxerga a lógica por trás de sistemas complexos. É a faixa comum entre profissionais altamente qualificados.",
    careers:
      "Você tende a se destacar em: engenharia, medicina, direito, ciências exatas, ciência de dados, análise de sistemas, pesquisa, finanças e cargos de liderança técnica ou científica.",
    people:
      "115 é a média estimada de quem se forma na universidade. Logo acima do seu nível, estimativas populares (não oficiais) citam George W. Bush (~120), e mais adiante Nicole Kidman e Jodie Foster (~132). Você já está a caminho da faixa dos nomes mais citados nessas listas.",
  },
  118: {
    title: "Inteligência acima da média",
    verdict:
      "Ainda não atinge o corte de superdotação (130), então não é 'gênio' no sentido técnico, mas está entre os cerca de 12% de melhor desempenho — inteligência claramente acima da média.",
    summary:
      "Com 27 acertos, você está no limiar da faixa superior. Sustenta raciocínios longos sem se perder, resolve problemas de várias etapas com facilidade e aprende quase sozinho assuntos que travam a maioria. É típico de médicos, engenheiros, advogados e cientistas.",
    careers:
      "Combinam fortemente: medicina, engenharia, direito, pesquisa científica, ciência de dados, tecnologia, magistratura e cargos técnicos de alta responsabilidade.",
    people:
      "Você está praticamente no mesmo patamar estimado do ex-presidente George W. Bush (~120, estimativa não oficial). Logo acima aparecem nomes como Nicole Kidman e Jodie Foster (~132), e a média estimada dos grandes mestres de xadrez fica em torno de 130.",
  },
  125: {
    title: "Inteligência superior",
    verdict:
      "Ainda não é o corte de superdotação (130), mas é inteligência superior de verdade: só cerca de 5% da população chega aqui. Está a um passo do território de 'gênio'.",
    summary:
      "Com 28 acertos, seu raciocínio está bem à frente da média. Você aprende rápido, abstrai com naturalidade e lida com problemas complexos e inéditos sem depender de exemplos prontos. É a faixa de quem costuma se destacar em áreas técnicas e científicas exigentes.",
    careers:
      "Você tende a se destacar em: medicina, engenharia, direito de alto desempenho, pesquisa científica, ciência de dados, física, tecnologia de ponta, magistratura e cargos de liderança técnica.",
    people:
      "A média estimada dos grandes mestres de xadrez (~130) está logo acima de você. Em estimativas populares (não oficiais), você se aproxima de nomes como Jodie Foster e Nicole Kidman (~132), e do piso de entrada da Mensa, que aceita o topo de 2% (130).",
  },
  129: {
    title: "Inteligência superior — no limiar da superdotação",
    verdict:
      "Você está a um único ponto do corte de superdotação e do piso de entrada da Mensa (130). Praticamente no limiar das altas habilidades — o topo de cerca de 3% da população.",
    summary:
      "Com 29 acertos, você está quase no território das altas habilidades. Percebe padrões sutis muito rápido, faz pontes entre áreas diferentes e sustenta raciocínios complexos com folga. Falta pouquíssimo para o corte oficial de superdotação.",
    careers:
      "Combinam com você: pesquisa científica, engenharia avançada, medicina, física, matemática aplicada, ciência de dados, direito de ponta, tecnologia e estratégia.",
    people:
      "Você está no mesmo patamar estimado de Jodie Foster e Nicole Kidman (~132) e logo abaixo de Arnold Schwarzenegger (~135) — estimativas populares, não oficiais. Está praticamente encostando no piso da Mensa (130).",
  },
  135: {
    title: "Superdotação · altas habilidades",
    verdict:
      "Aqui você cruza o corte de superdotação / altas habilidades (130) e o piso de entrada da Mensa — território de cerca de 1% da população. No sentido popular, já pode ser chamado de nível de gênio.",
    summary:
      "Com 30 acertos, você entra na faixa de altas habilidades. Combina raciocínio abstrato muito veloz, facilidade de enxergar padrões onde a maioria só vê ruído e capacidade de aprender assuntos complexos quase sem ajuda. Costuma vir com curiosidade intensa e pensamento não-linear.",
    careers:
      "Áreas que combinam: pesquisa científica, física, matemática, engenharia avançada, medicina, direito de ponta, programação, xadrez de alto nível, estratégia e empreendedorismo de base tecnológica.",
    people:
      "Você está bem no patamar estimado de Arnold Schwarzenegger (~135) e perto de Emma Watson (~138) — estimativas populares (não oficiais). É também o piso da Mensa, a sociedade que só aceita o topo de 2%.",
  },
  138: {
    title: "Superdotação · altas habilidades",
    verdict:
      "Está acima do corte de superdotação (130) e no piso da Mensa — nível que o senso comum chama de gênio, alcançado por menos de 1% das pessoas.",
    summary:
      "Com 31 acertos, seu raciocínio está entre os mais fortes. Você resolve problemas totalmente novos sem exemplos, aprende sozinho temas difíceis e faz conexões entre campos distantes. É o perfil típico de quem se destaca em ciência, tecnologia e criação de alto nível.",
    careers:
      "Você tende a brilhar em: pesquisa de ponta, física, matemática, engenharia e computação avançadas, medicina, direito de elite, estratégia e empreendedorismo inovador.",
    people:
      "Você está praticamente no QI estimado de Emma Watson (~138). Logo acima aparecem Natalie Portman, Shakira e Madonna (~140) — todas estimativas populares e não oficiais.",
  },
  142: {
    title: "Superdotação em grau elevado",
    verdict:
      "Bem acima do corte de superdotação (130): é o que o senso comum chama de nível de gênio, mais raro que 1 em cada 250 pessoas.",
    summary:
      "Com 32 acertos, você está num patamar raro. Sustenta raciocínios longos e complexos sem se perder, abstrai muito acima do exigido pela maioria das profissões e aprende praticamente qualquer assunto por conta própria. É a faixa de pesquisadores e criadores de destaque.",
    careers:
      "Combinam com você: pesquisa científica de fronteira, física, matemática, filosofia, engenharia e computação avançadas, medicina e direito de elite, além de xadrez e estratégia de alto nível.",
    people:
      "Você está no mesmo patamar estimado de Natalie Portman, Shakira, Madonna e Hillary Clinton (~140) — estimativas populares (não oficiais). O próximo degrau citado nessas listas é Bill Gates (~150).",
  },
  145: {
    title: "Superdotação em grau muito elevado",
    verdict:
      "QI 145 é mais raro que 1 em cada 1.000 pessoas — superdotação em grau elevado, o nível que o senso comum associa a gênios.",
    summary:
      "Com 33 acertos (o máximo), você atingiu o topo desta bateria. É um raciocínio abstrato e lógico excepcional, com facilidade de aprender assuntos complexos quase sem instrução e de sustentar raciocínios longos e inéditos. Vale lembrar: motivação e disciplina pesam tanto quanto o número.",
    careers:
      "Áreas que combinam: pesquisa de fronteira, matemática, física, filosofia, computação e engenharia avançadas, xadrez de alto nível e campos que exigem abstração pesada e aprendizado autônomo.",
    people:
      "Você está acima do QI estimado de quase todas as celebridades das listas populares; o próximo nome citado é Bill Gates (~150). Gênios históricos como Einstein e Stephen Hawking costumam aparecer em ~160, mas sempre como estimativas retroativas — nenhum deles chegou a fazer um teste real.",
  },
};

// Ao terminar o teste, guardamos o tempo e mostramos primeiro a tela de prévia
// ("Seu resultado está pronto!"). O resultado já é montado por baixo (borrado),
// mas o paywall só aparece quando a pessoa toca em "OBTER RESULTADOS".
let finalSeconds = 0;
function finishQuiz() {
  clearInterval(timerInterval);
  finalSeconds = Math.floor((Date.now() - startTime) / 1000);
  const idx = Math.max(0, Math.min(score, IQ_BY_CORRECT.length - 1));
  const iq = IQ_BY_CORRECT[idx];
  renderResult(iq); // resultado fica renderizado por baixo (borrado)
  buildTeaser(iq); // gancho: parte nítida + parte desfocada
  runLoading(() => showScreen("reveal")); // "IA calculando" (7s) e depois a prévia
}

// Tela de carregamento simulando a IA calculando o resultado (7 segundos).
// Anima o anel circular, a porcentagem e a barra, trocando as mensagens.
const LOADING_MS = 7000;
const LOADING_MESSAGES = [
  "Analisando suas respostas…",
  "Avaliando cada questão respondida…",
  "Calculando seu QI estimado…",
  "Mapeando seus traços de personalidade…",
  "Comparando com a população…",
  "Gerando seu resultado final…",
];
const RING_CIRCUMFERENCE = 339; // 2π·54

function runLoading(onDone) {
  const percentEl = document.getElementById("loader-percent");
  const statusEl = document.getElementById("loader-status");
  const fillEl = document.getElementById("loader-fill");
  const ringEl = document.getElementById("loader-ring");

  showScreen("loading");

  const start = performance.now();
  let lastMsg = -1;

  function setMessage(idx) {
    if (idx === lastMsg) return;
    lastMsg = idx;
    statusEl.textContent = LOADING_MESSAGES[idx];
    statusEl.style.animation = "none";
    void statusEl.offsetWidth;
    statusEl.style.animation = "";
  }
  setMessage(0);

  function frame(now) {
    const p = Math.min(1, (now - start) / LOADING_MS);

    // Número, bola (líquido subindo) e anel — tudo no mesmo quadro, sincronizado.
    percentEl.textContent = `${Math.round(p * 100)}%`;
    fillEl.style.height = `${p * 100}%`;
    ringEl.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - p));

    const msgIdx = Math.min(
      LOADING_MESSAGES.length - 1,
      Math.floor(p * LOADING_MESSAGES.length)
    );
    setMessage(msgIdx);

    if (p < 1) {
      requestAnimationFrame(frame);
    } else {
      setTimeout(onDone, 260);
    }
  }
  requestAnimationFrame(frame);
}

// "OBTER RESULTADOS": sai da prévia, sobrepõe a cobrança e mostra o resultado.
function revealResult() {
  lockResult(); // sobrepõe a cobrança e borra o resultado
  showScreen("result");
}

function renderResult(iq) {
  const totalSeconds = finalSeconds;

  const catMap = {};
  answersLog.forEach((a) => {
    if (!catMap[a.category]) catMap[a.category] = { correct: 0, total: 0 };
    catMap[a.category].total++;
    if (a.correct) catMap[a.category].correct++;
  });

  // O QI vem direto do número de acertos (tabela IQ_BY_CORRECT). Nada de
  // porcentagem, peso por dificuldade ou tempo: cada quantidade de acertos
  // tem um QI fixo e específico.
  const { label, tone } = classifyIQ(iq);

  document.getElementById("iq-score").textContent = iq;

  const classEl = document.getElementById("iq-class");
  classEl.textContent = label;
  classEl.className = `iq-class tone-${tone}`;

  document.getElementById("iq-compare").textContent = brazilComparison(iq);

  const profile = getProfile(iq);
  // A partir de 22 acertos (QI ≥ 104) usamos o perfil específico por valor de QI,
  // com veredito de gênio/superdotação, profissões reais e pessoas reais próximas.
  const detail = IQ_DETAIL[iq] || null;
  const rarity = rarityLine(iq);
  document.getElementById("result-profile").innerHTML = `
    <h3 class="profile-title">${detail ? detail.title : profile.title}</h3>
    ${detail ? `<p class="profile-verdict">${detail.verdict}</p>` : ""}
    <p class="profile-desc">${detail ? detail.summary : profile.summary}</p>
    ${rarity ? `<p class="profile-rarity">${rarity}</p>` : ""}
    <h4 class="profile-h">Habilidades e pontos fortes desse nível</h4>
    <ul class="profile-list">${profile.abilities.map((a) => `<li>${a}</li>`).join("")}</ul>
    <h4 class="profile-h">Profissões reais que combinam com você</h4>
    <p class="profile-desc">${detail ? detail.careers : profile.careers}</p>
    <h4 class="profile-h">Países com média de QI parecida</h4>
    <p class="profile-desc">${countryComparison(iq)}</p>
    <h4 class="profile-h">Pessoas com QI próximo do seu</h4>
    <p class="profile-desc">${detail ? detail.people : referenceLine(iq)}</p>
    <h4 class="profile-h">Curiosidades</h4>
    <ul class="profile-list profile-list-dot">${profile.curiosities.map((c) => `<li>${c}</li>`).join("")}</ul>
    <div class="profile-about">${IQ_ABOUT}</div>
    <p class="profile-note">Estimativas de QI de pessoas e países são populares e muito debatidas cientificamente; dependem de escolaridade, cultura e amostragem. Este teste é recreativo, sem validade clínica.</p>
  `;

  document.getElementById("result-detail").textContent =
    `Você acertou ${score} de ${answersLog.length} perguntas.`;

  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  document.getElementById("result-time").textContent = `Tempo total: ${mm}:${ss}`;

  categoryBreakdown.innerHTML =
    `<div class="cat-head">Desempenho por área</div>` +
    Object.entries(catMap)
      .map(([category, stats]) => {
        const pct = Math.round((stats.correct / stats.total) * 100);
        return `<div class="cat-row">
          <span class="cat-name">${category}</span>
          <span class="cat-bar"><span class="cat-bar-fill" style="width:${pct}%"></span></span>
          <span class="cat-count">${stats.correct}/${stats.total}</span>
        </div>`;
      })
      .join("");
}

// Monta o "gancho": algumas informações nítidas, outras desfocadas.
function buildTeaser(iq) {
  const { label } = classifyIQ(iq);
  const profile = getProfile(iq);
  const famousTeaser =
    iq >= 110
      ? FAMOUS_IQ.map((o) => ({ ...o, d: Math.abs(o.iq - iq) }))
          .sort((a, b) => a.d - b.d)
          .slice(0, 2)
          .map((o) => o.n)
          .join(" e ")
      : "pessoas famosas que você conhece";
  const trait = (profile.abilities[0] || "").toLowerCase();
  document.getElementById("teaser").innerHTML = `
    <div class="score-circle"><span class="blur blur-strong">${iq}</span><small>QI estimado</small></div>
    <p class="teaser-line">${brazilComparisonTeaser(iq)}</p>
    <p class="teaser-line">Sua classificação: <span class="blur">${label}</span></p>
    <p class="teaser-line">Seu QI é parecido com o de <span class="blur">${famousTeaser}</span></p>
    <p class="teaser-line">Você pode ter traços como <span class="blur">${trait}</span></p>
    <p class="teaser-hint">Desbloqueie para ver tudo: seu QI, a classificação, as pessoas e países com QI parecido, seu perfil cognitivo completo, habilidades e curiosidades.</p>
  `;
}

function lockResult() {
  document.getElementById("result-content").classList.add("locked");
  document.getElementById("paywall-overlay").hidden = false;
  resetPix();
}

function unlockResult() {
  document.getElementById("result-content").classList.remove("locked");
  document.getElementById("paywall-overlay").hidden = true;
}

// ================== Pagamento Pix (paywall) ==================
// EM PRODUÇÃO: troque DEV_MODE para false. Com isso o site passa a chamar o
// backend real, que deve expor:
//   POST /api/pix/criar         -> { id, qrImage (data URI da imagem), copiaECola }
//   GET  /api/pix/status?id=..  -> { status: "pendente" | "pago" | "expirado" }
// O backend confirma o pagamento pelo webhook do provedor (Mercado Pago, Asaas,
// etc.) e só então /status responde "pago". Veja PAGAMENTO.md.
const DEV_MODE = false;
const PIX_POLL_MS = 3000;

const btnPay = document.getElementById("btn-pay");
const pixBox = document.getElementById("pix-box");
const pixQr = document.getElementById("pix-qr");
const pixCode = document.getElementById("pix-code");
const pixStatus = document.getElementById("pix-status");
const btnCopyPix = document.getElementById("btn-copy-pix");

let pixPollTimer = null;
let pixChargeId = null;

const DEV_QR_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>
       <rect width='200' height='200' fill='#ffffff'/>
       <text x='100' y='96' text-anchor='middle' font-family='sans-serif' font-size='15' fill='#8a6d1f'>QR Pix</text>
       <text x='100' y='118' text-anchor='middle' font-family='sans-serif' font-size='12' fill='#9a9384'>(modo teste)</text>
     </svg>`
  );

function resetPix() {
  if (pixPollTimer) {
    clearInterval(pixPollTimer);
    pixPollTimer = null;
  }
  pixChargeId = null;
  pixBox.hidden = true;
  btnPay.hidden = false;
  btnPay.disabled = false;
  btnPay.textContent = "Desbloquear por R$ 5 (Pix)";
  pixStatus.classList.remove("paid");
}

async function createPixCharge() {
  if (DEV_MODE) {
    return {
      id: "dev-" + Date.now(),
      qrImage: DEV_QR_PLACEHOLDER,
      copiaECola: "00020126PIX-DE-TESTE-copia-e-cola-fake5204000053039865802BR6009SAO PAULO",
    };
  }
  const res = await fetch("/api/pix/criar", { method: "POST" });
  if (!res.ok) throw new Error("Falha ao criar cobrança");
  return res.json();
}

async function checkPixStatus() {
  try {
    const res = await fetch(`/api/pix/status?id=${encodeURIComponent(pixChargeId)}`);
    const data = await res.json();
    if (data.status === "pago") pixPaid();
    else if (data.status === "expirado") {
      resetPix();
      pixStatus.textContent = "Pix expirado. Toque em desbloquear para gerar um novo.";
    }
  } catch (e) {
    /* tenta de novo no próximo ciclo */
  }
}

function pixPaid() {
  if (pixPollTimer) {
    clearInterval(pixPollTimer);
    pixPollTimer = null;
  }
  pixStatus.classList.add("paid");
  pixStatus.textContent = "Pagamento confirmado! Liberando seu resultado…";
  setTimeout(unlockResult, 800);
}

async function startPayment() {
  btnPay.disabled = true;
  btnPay.textContent = "Gerando Pix…";
  try {
    const charge = await createPixCharge();
    pixChargeId = charge.id;
    pixQr.src = charge.qrImage;
    pixCode.value = charge.copiaECola;
    pixBox.hidden = false;
    btnPay.hidden = true;
    pixStatus.classList.remove("paid");
    if (DEV_MODE) {
      pixStatus.textContent = "Modo teste: confirmando pagamento em instantes…";
      setTimeout(pixPaid, 5000);
    } else {
      pixStatus.textContent = "Aguardando pagamento…";
      pixPollTimer = setInterval(checkPixStatus, PIX_POLL_MS);
    }
  } catch (e) {
    resetPix();
    btnPay.textContent = "Tentar de novo";
    pixStatus.textContent = "Não consegui gerar o Pix. Tente de novo.";
  }
}

btnPay.addEventListener("click", startPayment);
btnCopyPix.addEventListener("click", () => {
  pixCode.select();
  if (navigator.clipboard) navigator.clipboard.writeText(pixCode.value).catch(() => {});
  else document.execCommand("copy");
  btnCopyPix.textContent = "Copiado!";
  setTimeout(() => (btnCopyPix.textContent = "Copiar"), 1500);
});

// Pré-carrega as imagens das perguntas (matriz + opções) já no carregamento da
// página, para não aparecer só o texto por um instante enquanto a imagem baixa.
function preloadQuizImages() {
  QUESTIONS.forEach((q) => {
    if (q.type === "image") {
      [q.gridImg, q.optionsImg].forEach((src) => {
        if (src) {
          const im = new Image();
          im.src = src;
        }
      });
    }
  });
}
preloadQuizImages();

document.getElementById("btn-reveal").addEventListener("click", revealResult);
btnStart.addEventListener("click", startQuiz);
btnRestart.addEventListener("click", startQuiz);

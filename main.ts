// Tiny stack VM, ISA v1. Table-driven dispatch, one interpreter loop.
// Answers every instance of a set in one run: /input/<id>/program.bin +
// input.bin -> /output/<id>/stdout.bin + exit.txt. Node 22, erasable syntax.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
const IN = process.env.MAKEFUN_INPUT_DIR ?? "/input";
const OUT = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Per-opcode shape: [immediate bytes, values popped, values pushed].
const im = new Uint8Array(256), po = new Uint8Array(256), pu = new Uint8Array(256), kn = new Uint8Array(256);
kn[0] = 1; // HALT
for (const [o, i, p, q] of [
  [0x01, 1, 0, 1], [0x02, 4, 0, 1], [0x03, 0, 1, 0], [0x04, 0, 1, 2],
  [0x05, 0, 2, 2], [0x06, 0, 2, 3], [0x07, 0, 3, 3], [0x10, 0, 2, 1],
  [0x11, 0, 2, 1], [0x12, 0, 2, 1], [0x13, 0, 2, 1], [0x14, 0, 2, 1],
  [0x15, 0, 2, 1], [0x16, 0, 2, 1], [0x17, 0, 1, 1], [0x18, 0, 2, 1],
  [0x19, 0, 2, 1], [0x1a, 0, 2, 1], [0x1b, 0, 1, 1], // NOT is unary
  [0x1c, 0, 2, 1], [0x1d, 0, 2, 1], [0x1e, 0, 2, 1], [0x20, 0, 2, 1],
  [0x21, 0, 2, 1], [0x22, 0, 2, 1], [0x30, 2, 0, 0], [0x31, 2, 1, 0],
  [0x32, 2, 1, 0], [0x33, 2, 0, 0], [0x34, 0, 0, 0], [0x40, 0, 1, 1],
  [0x41, 0, 2, 0], [0x50, 0, 1, 0], [0x51, 0, 1, 0], [0x52, 0, 0, 1],
  [0x53, 0, 1, 0],
] as const) { im[o] = i; po[o] = p; pu[o] = q; kn[o] = 1; }

function run(p: Buffer, g: Buffer): { o: Uint8Array; l: number; e: number } {
  const s = new Int32Array(256), c = new Int32Array(64), m = new Int32Array(256);
  const o = new Uint8Array(65536);
  let sp = 0, cp = 0, pc = 0, n = 0, ip = 0, ol = 0, e = 9;
  const off = () => ((p[pc + 1] | (p[pc + 2] << 8)) << 16) >> 16; // signed 16-bit jump offset
  outer: while (true) {
    if (n >= 1000000) { e = 10; break; } // step limit
    if (pc < 0 || pc >= p.length) { e = 9; break; } // pc outside program
    const op = p[pc];
    if (!kn[op]) { e = 5; break; } // unknown opcode
    const l = im[op];
    if (pc + 1 + l > p.length) { e = 9; break; } // cut-off immediate
    if (sp < po[op]) { e = 2; break; } // stack underflow
    if (sp - po[op] + pu[op] > 256) { e = 3; break; } // stack overflow
    n++;
    let q = pc + 1 + l;
    switch (op) {
      case 0x00: e = 0; break outer; // HALT
      case 0x01: s[sp++] = (p[pc + 1] << 24) >> 24; break; // PUSH8, sign-extended
      case 0x02: s[sp++] = (p[pc + 1] | (p[pc + 2] << 8) | (p[pc + 3] << 16) | (p[pc + 4] << 24)) | 0; break; // PUSH32
      case 0x03: sp--; break; // POP
      case 0x04: s[sp] = s[sp - 1]; sp++; break; // DUP
      case 0x05: { const t = s[sp - 1]; s[sp - 1] = s[sp - 2]; s[sp - 2] = t; break; } // SWAP
      case 0x06: s[sp] = s[sp - 2]; sp++; break; // OVER
      case 0x07: { const t = s[sp - 3]; s[sp - 3] = s[sp - 2]; s[sp - 2] = s[sp - 1]; s[sp - 1] = t; break; } // ROT
      case 0x10: { const b = s[--sp]; s[sp - 1] = (s[sp - 1] + b) | 0; break; } // ADD
      case 0x11: { const b = s[--sp]; s[sp - 1] = (s[sp - 1] - b) | 0; break; } // SUB
      case 0x12: { const b = s[--sp]; s[sp - 1] = Math.imul(s[sp - 1], b); break; } // MUL, low 32 bits
      case 0x13: { const b = s[--sp], a = s[sp - 1]; if (!b) { e = 4; break outer; } s[sp - 1] = (a / b) | 0; break; } // DIV, trunc toward zero
      case 0x14: { const b = s[--sp], a = s[sp - 1]; if (!b) { e = 4; break outer; } s[sp - 1] = a % b; break; } // MOD, sign of a
      case 0x15: { const b = s[--sp], a = s[sp - 1]; if (!b) { e = 4; break outer; } s[sp - 1] = ((a >>> 0) / (b >>> 0)) | 0; break; } // DIVU
      case 0x16: { const b = s[--sp], a = s[sp - 1]; if (!b) { e = 4; break outer; } s[sp - 1] = ((a >>> 0) % (b >>> 0)) | 0; break; } // MODU
      case 0x17: s[sp - 1] = (-s[sp - 1]) | 0; break; // NEG wraps
      case 0x18: { const b = s[--sp]; s[sp - 1] &= b; break; } // AND
      case 0x19: { const b = s[--sp]; s[sp - 1] |= b; break; } // OR
      case 0x1a: { const b = s[--sp]; s[sp - 1] ^= b; break; } // XOR
      case 0x1b: s[sp - 1] = ~s[sp - 1]; break; // NOT
      case 0x1c: { const b = s[--sp]; s[sp - 1] <<= b & 31; break; } // SHL
      case 0x1d: { const b = s[--sp]; s[sp - 1] >>= b & 31; break; } // SHR, arithmetic
      case 0x1e: { const b = s[--sp]; s[sp - 1] = (s[sp - 1] >>> (b & 31)) | 0; break; } // SHRU, logical
      case 0x20: { const b = s[--sp]; s[sp - 1] = s[sp - 1] === b ? 1 : 0; break; } // EQ
      case 0x21: { const b = s[--sp]; s[sp - 1] = s[sp - 1] < b ? 1 : 0; break; } // LT
      case 0x22: { const b = s[--sp]; s[sp - 1] = (s[sp - 1] >>> 0) < (b >>> 0) ? 1 : 0; break; } // LTU
      case 0x30: q += off(); break; // JMP
      case 0x31: if (!s[--sp]) q += off(); break; // JZ
      case 0x32: if (s[--sp]) q += off(); break; // JNZ
      case 0x33: if (cp >= 64) { e = 7; break outer; } c[cp++] = q; q = p[pc + 1] | (p[pc + 2] << 8); break; // CALL
      case 0x34: if (!cp) { e = 8; break outer; } q = c[--cp]; break; // RET
      case 0x40: { const a = s[sp - 1]; if (a < 0 || a > 255) { e = 6; break outer; } s[sp - 1] = m[a]; break; } // LOAD
      case 0x41: { const a = s[--sp], v = s[--sp]; if (a < 0 || a > 255) { e = 6; break outer; } m[a] = v; break; } // STORE
      case 0x50: { const v = s[--sp], t = String(v); if (ol + t.length > 65536) { e = 11; break outer; } for (let i = 0; i < t.length; i++) o[ol++] = t.charCodeAt(i); break; } // PRINT
      case 0x51: if (ol >= 65536) { e = 11; break outer; } o[ol++] = s[--sp] & 255; break; // PUTC
      case 0x52: s[sp++] = ip < g.length ? g[ip++] : -1; break; // IN, -1 at EOF
      case 0x53: e = s[--sp] & 255; break outer; // EXIT, low byte
    }
    pc = q;
  }
  return { o, l: ol, e };
}

// Driver: one run answers every instance directory under the input dir.
for (const id of readdirSync(IN, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
  let g: Buffer;
  try { g = readFileSync(`${IN}/${id}/input.bin`); } catch { g = Buffer.alloc(0); }
  const r = run(readFileSync(`${IN}/${id}/program.bin`), g);
  mkdirSync(`${OUT}/${id}`, { recursive: true });
  writeFileSync(`${OUT}/${id}/stdout.bin`, r.o.subarray(0, r.l));
  writeFileSync(`${OUT}/${id}/exit.txt`, `${r.e}\n`);
}

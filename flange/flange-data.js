/* =====================================================================
 * flange-data.js  —  THE FLANGE DIMENSION TABLES
 * ---------------------------------------------------------------------
 * This file is pure data. The app logic lives in flange-logic.js.
 *
 * HOW THE DATA IS LAID OUT
 * Each entry in FLANGE_TABLES is one "table" = one standard + one
 * pressure rating, e.g. "EN 1092-1 PN16".  Each table has:
 *
 *   id         unique short name (no spaces)
 *   family     the standard, e.g. 'EN 1092-1'
 *   rating     'PN16', 'Table D', 'Class 150' ...
 *   material   what it is normally made from (steel, ductile iron ...)
 *   unit       'mm' or 'in' — the unit the numbers in `rows` are typed in.
 *              Inch tables are converted to mm by flange-logic.js, so
 *              you can copy numbers straight out of an imperial table.
 *   aliases    other names people use for the same drilling
 *   columns    the name of each value in a row (same order as the row)
 *   thicknessLabels  what each thickness column (t1, t2, t3) means
 *   rows       one array per size, in the order given by `columns`
 *   altBoltCount  { size: [other allowed bolt counts] }
 *   altOD      { size: other allowed outside diameter }
 *   rowNotes   { size: 'text shown with that size' }
 *   unverified { size: 'why this row could not be cross-checked' }
 *   notes      general notes shown for every size in the table
 *   sources    where the numbers came from
 *
 * COLUMN NAMES (not every table uses every column)
 *   dn      nominal size, DN (mm). For inch tables this is the usual
 *           metric equivalent, used only for display and sorting.
 *   nps     nominal size in inches as text, e.g. '4' or '1 1/2'
 *   od      flange outside diameter              (EN letter D)
 *   pcd     pitch circle / bolt circle diameter  (EN letter K)
 *   n       number of bolts
 *   hole    bolt hole diameter                   (EN letter L)
 *   bolt    bolt size as text: 'M16' or '5/8"'
 *   t1,t2,t3 flange thickness for different flange types (see
 *           thicknessLabels). null = not given by the standard.
 *   rf      raised face diameter                 (EN letter d1)
 *   pipeOD  outside diameter of the matching pipe (A for steel,
 *           DE for ductile iron)
 *
 * TO ADD A NEW STANDARD: copy one whole table object, give it a new
 * id, change the rows, and save. Nothing else needs changing — the
 * matcher automatically searches every table in this list.
 *
 * null means "no value in the standard / not known". Never guess a
 * number: leave it null and add a note instead.
 * ===================================================================== */

const FLANGE_TABLES = [

  /* ------------------------------------------------------------------
   * EN 1092-1:2018  STEEL FLANGES  (replaced BS 4504 and DIN 2501 etc.)
   * D, K, L, n, bolt: EN 1092-1:2018 Tables 11-15, cross-checked against
   *   Zickwolff (DN10-800) and S.K. Fitting Valve tables — 0 differences.
   * Thickness t1/t2/t3 and d1 (rf): read from EN 1092-1:2018 Tables 8, 11-15.
   * pipeOD: column A of the same tables.
   * ------------------------------------------------------------------ */
  {
    id: 'EN1092-1_PN6', family: 'EN 1092-1', rating: 'PN6', material: 'Steel', unit: 'mm',
    aliases: ['BS 4504 PN6', 'DIN PN6', 'BS EN 1092-1 PN6'],
    columns: ['dn', 'od', 'pcd', 'n', 'hole', 'bolt', 't1', 't2', 't3', 'rf', 'pipeOD'],
    thicknessLabels: { t1: 'Plate flange (type 01)', t2: 'Weld neck / hubbed (type 11/12/13)', t3: 'Blind (type 05)' },
    rows: [
      //  DN     D      K     n   L    bolt    t1    t2    t3    d1     A
      [   15,    80,    55,   4,  11,  'M10',    12,   12,    12,    40,   21.3],
      [   20,    90,    65,   4,  11,  'M10',    14,   14,    14,    50,   26.9],
      [   25,   100,    75,   4,  11,  'M10',    14,   14,    14,    60,   33.7],
      [   32,   120,    90,   4,  14,  'M12',    16,   14,    14,    70,   42.4],
      [   40,   130,   100,   4,  14,  'M12',    16,   14,    14,    80,   48.3],
      [   50,   140,   110,   4,  14,  'M12',    16,   14,    14,    90,   60.3],
      [   65,   160,   130,   4,  14,  'M12',    16,   14,    14,   110,   76.1],
      [   80,   190,   150,   4,  18,  'M16',    18,   16,    16,   128,   88.9],
      [  100,   210,   170,   4,  18,  'M16',    18,   16,    16,   148,  114.3],
      [  125,   240,   200,   8,  18,  'M16',    20,   18,    18,   178,  139.7],
      [  150,   265,   225,   8,  18,  'M16',    20,   18,    18,   202,  168.3],
      [  200,   320,   280,   8,  18,  'M16',    22,   20,    20,   258,  219.1],
      [  250,   375,   335,  12,  18,  'M16',    24,   22,    22,   312,    273],
      [  300,   440,   395,  12,  22,  'M20',    24,   22,    22,   365,  323.9],
      [  350,   490,   445,  12,  22,  'M20',    26,   22,    22,   415,  355.6],
      [  400,   540,   495,  16,  22,  'M20',    28,   22,    22,   465,  406.4],
      [  450,   595,   550,  16,  22,  'M20',    30,   22,    24,   520,    457],
      [  500,   645,   600,  20,  22,  'M20',    30,   24,    24,   570,    508],
      [  600,   755,   705,  20,  26,  'M24',    32,   30,    30,   670,    610],
      [  700,   860,   810,  24,  26,  'M24',    40,   30,    40,   775,    711],
      [  800,   975,   920,  24,  30,  'M27',    44,   30,    44,   880,    813],
      [  900,  1075,  1020,  24,  30,  'M27',    48,   34,    48,   980,    914],
      [ 1000,  1175,  1120,  28,  30,  'M27',    52,   38,    52,  1080,   1016],
      [ 1200,  1405,  1340,  32,  33,  'M30',    60,   42,    60,  1295,   1219],
    ],
    notes: ['PN6 is mainly used for low-pressure air, drainage and ventilation duty.'],
    sources: ['EN 1092-1:2018 Table 11 & Table 8', 'zickwolff.de flange dimensions PN6', 'skfitting.com EN 1092-1 table'],
  },
  {
    id: 'EN1092-1_PN10', family: 'EN 1092-1', rating: 'PN10', material: 'Steel', unit: 'mm',
    aliases: ['BS 4504 PN10', 'DIN PN10', 'BS EN 1092-1 PN10'],
    columns: ['dn', 'od', 'pcd', 'n', 'hole', 'bolt', 't1', 't2', 't3', 'rf', 'pipeOD'],
    thicknessLabels: { t1: 'Plate flange (type 01)', t2: 'Weld neck / hubbed (type 11/12/13)', t3: 'Blind (type 05)' },
    rows: [
      //  DN     D      K     n   L    bolt    t1    t2    t3    d1     A
      [   15,    95,    65,   4,  14,  'M12',    14,   16,    16,    45,   21.3],
      [   20,   105,    75,   4,  14,  'M12',    16,   18,    18,    58,   26.9],
      [   25,   115,    85,   4,  14,  'M12',    16,   18,    18,    68,   33.7],
      [   32,   140,   100,   4,  18,  'M16',    18,   18,    18,    78,   42.4],
      [   40,   150,   110,   4,  18,  'M16',    18,   18,    18,    88,   48.3],
      [   50,   165,   125,   4,  18,  'M16',    20,   18,    18,   102,   60.3],
      [   65,   185,   145,   8,  18,  'M16',    20,   18,    18,   122,   76.1],
      [   80,   200,   160,   8,  18,  'M16',    20,   20,    20,   138,   88.9],
      [  100,   220,   180,   8,  18,  'M16',    22,   20,    20,   158,  114.3],
      [  125,   250,   210,   8,  18,  'M16',    22,   22,    22,   188,  139.7],
      [  150,   285,   240,   8,  22,  'M20',    24,   22,    22,   212,  168.3],
      [  200,   340,   295,   8,  22,  'M20',    24,   24,    24,   268,  219.1],
      [  250,   395,   350,  12,  22,  'M20',    26,   26,    26,   320,    273],
      [  300,   445,   400,  12,  22,  'M20',    26,   26,    26,   370,  323.9],
      [  350,   505,   460,  16,  22,  'M20',    30,   26,    26,   430,  355.6],
      [  400,   565,   515,  16,  26,  'M24',    32,   26,    26,   482,  406.4],
      [  450,   615,   565,  20,  26,  'M24',    36,   28,    28,   532,    457],
      [  500,   670,   620,  20,  26,  'M24',    38,   28,    28,   585,    508],
      [  600,   780,   725,  20,  30,  'M27',    42,   30,    34,   685,    610],
      [  700,   895,   840,  24,  30,  'M27',    50,   35,    38,   800,    711],
      [  800,  1015,   950,  24,  33,  'M30',    56,   38,    48,   905,    813],
      [  900,  1115,  1050,  28,  33,  'M30',    62,   38,    50,  1005,    914],
      [ 1000,  1230,  1160,  28,  36,  'M33',    70,   44,    54,  1110,   1016],
      [ 1200,  1455,  1380,  32,  39,  'M36',    83,   55,    66,  1330,   1219],
      [ 1400,  1675,  1590,  36,  42,  'M39',  null,   65,  null,  1535,   1422],
      [ 1600,  1915,  1820,  40,  48,  'M45',  null,   75,  null,  1760,   1626],
      [ 1800,  2115,  2020,  44,  48,  'M45',  null,   85,  null,  1960,   1829],
      [ 2000,  2325,  2230,  48,  48,  'M45',  null,   90,  null,  2170,   2032],
    ],
    altBoltCount: { 65: [4] },
    rowNotes: { 65: 'EN 1092-1 lists 8 holes; 4 holes allowed by agreement to mate with cast iron (EN 1092-2) flanges.' },
    notes: ['DN15 to DN150 PN10 has exactly the same drilling and outside diameter as PN16.'],
    sources: ['EN 1092-1:2018 Table 12 & Table 8', 'zickwolff.de flange dimensions PN10', 'skfitting.com EN 1092-1 table'],
  },
  {
    id: 'EN1092-1_PN16', family: 'EN 1092-1', rating: 'PN16', material: 'Steel', unit: 'mm',
    aliases: ['BS 4504 PN16', 'DIN PN16', 'BS EN 1092-1 PN16'],
    columns: ['dn', 'od', 'pcd', 'n', 'hole', 'bolt', 't1', 't2', 't3', 'rf', 'pipeOD'],
    thicknessLabels: { t1: 'Plate flange (type 01)', t2: 'Weld neck / hubbed (type 11/12/13)', t3: 'Blind (type 05)' },
    rows: [
      //  DN     D      K     n   L    bolt    t1    t2    t3    d1     A
      [   15,    95,    65,   4,  14,  'M12',    14,   16,    16,    45,   21.3],
      [   20,   105,    75,   4,  14,  'M12',    16,   18,    18,    58,   26.9],
      [   25,   115,    85,   4,  14,  'M12',    16,   18,    18,    68,   33.7],
      [   32,   140,   100,   4,  18,  'M16',    18,   18,    18,    78,   42.4],
      [   40,   150,   110,   4,  18,  'M16',    18,   18,    18,    88,   48.3],
      [   50,   165,   125,   4,  18,  'M16',    20,   18,    18,   102,   60.3],
      [   65,   185,   145,   8,  18,  'M16',    20,   18,    18,   122,   76.1],
      [   80,   200,   160,   8,  18,  'M16',    20,   20,    20,   138,   88.9],
      [  100,   220,   180,   8,  18,  'M16',    22,   20,    20,   158,  114.3],
      [  125,   250,   210,   8,  18,  'M16',    22,   22,    22,   188,  139.7],
      [  150,   285,   240,   8,  22,  'M20',    24,   22,    22,   212,  168.3],
      [  200,   340,   295,  12,  22,  'M20',    26,   24,    24,   268,  219.1],
      [  250,   405,   355,  12,  26,  'M24',    29,   26,    26,   320,    273],
      [  300,   460,   410,  12,  26,  'M24',    32,   28,    28,   378,  323.9],
      [  350,   520,   470,  16,  26,  'M24',    35,   30,    30,   438,  355.6],
      [  400,   580,   525,  16,  30,  'M27',    38,   32,    32,   490,  406.4],
      [  450,   640,   585,  20,  30,  'M27',    42,   34,    40,   550,    457],
      [  500,   715,   650,  20,  33,  'M30',    46,   36,    44,   610,    508],
      [  600,   840,   770,  20,  36,  'M33',    55,   40,    54,   725,    610],
      [  700,   910,   840,  24,  36,  'M33',    63,   40,    58,   795,    711],
      [  800,  1025,   950,  24,  39,  'M36',    74,   41,    62,   900,    813],
      [  900,  1125,  1050,  28,  39,  'M36',    82,   48,    64,  1000,    914],
      [ 1000,  1255,  1170,  28,  42,  'M39',    90,   59,    68,  1115,   1016],
      [ 1200,  1485,  1390,  32,  48,  'M45',  null,   78,  null,  1330,   1219],
      [ 1400,  1685,  1590,  36,  48,  'M45',  null,   84,  null,  1530,   1422],
      [ 1600,  1930,  1820,  40,  56,  'M52',  null,  102,  null,  1750,   1626],
      [ 1800,  2130,  2020,  44,  56,  'M52',  null,  110,  null,  1950,   1829],
      [ 2000,  2345,  2230,  48,  62,  'M56',  null,  124,  null,  2150,   2032],
    ],
    altBoltCount: { 65: [4] },
    rowNotes: { 65: 'EN 1092-1 lists 8 holes; 4 holes allowed by agreement to mate with cast iron (EN 1092-2) flanges.' },
    notes: ['DN15 to DN150 PN16 has exactly the same drilling and outside diameter as PN10.'],
    sources: ['EN 1092-1:2018 Table 13 & Table 8', 'zickwolff.de flange dimensions PN16', 'skfitting.com EN 1092-1 table', 'roymech.co.uk BS EN 1092-1 PN16'],
  },
  {
    id: 'EN1092-1_PN25', family: 'EN 1092-1', rating: 'PN25', material: 'Steel', unit: 'mm',
    aliases: ['BS 4504 PN25', 'DIN PN25', 'BS EN 1092-1 PN25'],
    columns: ['dn', 'od', 'pcd', 'n', 'hole', 'bolt', 't1', 't2', 't3', 'rf', 'pipeOD'],
    thicknessLabels: { t1: 'Plate flange (type 01)', t2: 'Weld neck / hubbed (type 11/12/13)', t3: 'Blind (type 05)' },
    rows: [
      //  DN     D      K     n   L    bolt    t1    t2    t3    d1     A
      [   15,    95,    65,   4,  14,  'M12',    14,   16,    16,    45,   21.3],
      [   20,   105,    75,   4,  14,  'M12',    16,   18,    18,    58,   26.9],
      [   25,   115,    85,   4,  14,  'M12',    16,   18,    18,    68,   33.7],
      [   32,   140,   100,   4,  18,  'M16',    18,   18,    18,    78,   42.4],
      [   40,   150,   110,   4,  18,  'M16',    18,   18,    18,    88,   48.3],
      [   50,   165,   125,   4,  18,  'M16',    20,   20,    20,   102,   60.3],
      [   65,   185,   145,   8,  18,  'M16',    22,   22,    22,   122,   76.1],
      [   80,   200,   160,   8,  18,  'M16',    24,   24,    24,   138,   88.9],
      [  100,   235,   190,   8,  22,  'M20',    26,   24,    24,   162,  114.3],
      [  125,   270,   220,   8,  26,  'M24',    28,   26,    26,   188,  139.7],
      [  150,   300,   250,   8,  26,  'M24',    30,   28,    28,   218,  168.3],
      [  200,   360,   310,  12,  26,  'M24',    32,   30,    30,   278,  219.1],
      [  250,   425,   370,  12,  30,  'M27',    35,   32,    32,   335,    273],
      [  300,   485,   430,  16,  30,  'M27',    38,   34,    34,   395,  323.9],
      [  350,   555,   490,  16,  33,  'M30',    42,   38,    38,   450,  355.6],
      [  400,   620,   550,  16,  36,  'M33',    48,   40,    40,   505,  406.4],
      [  450,   670,   600,  20,  36,  'M33',    54,   46,    50,   555,    457],
      [  500,   730,   660,  20,  36,  'M33',    58,   48,    51,   615,    508],
      [  600,   845,   770,  20,  39,  'M36',    68,   48,    66,   720,    610],
      [  700,   960,   875,  24,  42,  'M39',    85,   50,  null,   820,    711],
      [  800,  1085,   990,  24,  48,  'M45',    95,   53,  null,   930,    813],
      [  900,  1185,  1090,  28,  48,  'M45',  null,   57,  null,  1030,    914],
      [ 1000,  1320,  1210,  28,  56,  'M52',  null,   63,  null,  1140,   1016],
    ],
    notes: ['DN15 to DN150 PN25 has the same drilling and outside diameter as PN40.'],
    sources: ['EN 1092-1:2018 Table 14 & Table 8', 'zickwolff.de flange dimensions PN25', 'skfitting.com EN 1092-1 table'],
  },
  {
    id: 'EN1092-1_PN40', family: 'EN 1092-1', rating: 'PN40', material: 'Steel', unit: 'mm',
    aliases: ['BS 4504 PN40', 'DIN PN40', 'BS EN 1092-1 PN40'],
    columns: ['dn', 'od', 'pcd', 'n', 'hole', 'bolt', 't1', 't2', 't3', 'rf', 'pipeOD'],
    thicknessLabels: { t1: 'Plate flange (type 01)', t2: 'Weld neck / hubbed (type 11/12/13)', t3: 'Blind (type 05)' },
    rows: [
      //  DN     D      K     n   L    bolt    t1    t2    t3    d1     A
      [   15,    95,    65,   4,  14,  'M12',    14,   16,    16,    45,   21.3],
      [   20,   105,    75,   4,  14,  'M12',    16,   18,    18,    58,   26.9],
      [   25,   115,    85,   4,  14,  'M12',    16,   18,    18,    68,   33.7],
      [   32,   140,   100,   4,  18,  'M16',    18,   18,    18,    78,   42.4],
      [   40,   150,   110,   4,  18,  'M16',    18,   18,    18,    88,   48.3],
      [   50,   165,   125,   4,  18,  'M16',    20,   20,    20,   102,   60.3],
      [   65,   185,   145,   8,  18,  'M16',    22,   22,    22,   122,   76.1],
      [   80,   200,   160,   8,  18,  'M16',    24,   24,    24,   138,   88.9],
      [  100,   235,   190,   8,  22,  'M20',    26,   24,    24,   162,  114.3],
      [  125,   270,   220,   8,  26,  'M24',    28,   26,    26,   188,  139.7],
      [  150,   300,   250,   8,  26,  'M24',    30,   28,    28,   218,  168.3],
      [  200,   375,   320,  12,  30,  'M27',    36,   34,    36,   285,  219.1],
      [  250,   450,   385,  12,  33,  'M30',    42,   38,    38,   345,    273],
      [  300,   515,   450,  16,  33,  'M30',    52,   42,    42,   410,  323.9],
      [  350,   580,   510,  16,  36,  'M33',    58,   46,    46,   465,  355.6],
      [  400,   660,   585,  16,  39,  'M36',    65,   50,    50,   535,  406.4],
      [  450,   685,   610,  20,  39,  'M36',  null,   57,    57,   560,    457],
      [  500,   755,   670,  20,  42,  'M39',  null,   57,    57,   615,    508],
      [  600,   890,   795,  20,  48,  'M45',  null,   72,    72,   735,    610],
    ],
    notes: ['DN15 to DN150 PN40 has the same drilling and outside diameter as PN25.'],
    sources: ['EN 1092-1:2018 Table 15 & Table 8', 'zickwolff.de flange dimensions PN40', 'skfitting.com EN 1092-1 table'],
  },

  /* ------------------------------------------------------------------
   * EN 1092-2  CAST IRON FLANGES (ductile / grey iron) — the usual UK
   * water industry flange on DI pipe, fittings and valves.
   * Source: BS EN 1092-2:1997 Tables 7-11 (D, K, L, n, bolt, DI
   *   thickness C). DN50-600 cross-checked against TPMC Steel's EN 1092-2
   *   tables (D, K, L, n, bolt, thickness all agree).
   * Bolt holes are bigger than steel (19/23/28 ... mm instead of 18/22/26)
   * but the PCD and outside diameter mate with EN 1092-1.
   * t1 = ductile iron flange thickness (types 05/11/12/13/14/21).
   * rf  = raised face diameter: EN 1092-2 uses the same d1 as EN 1092-1
   *       (copied from EN 1092-1 Table 8 — flagged in notes).
   * pipeOD = DE of ductile iron pipe, EN 545:2010 Table 16 (checked
   *       against Electrosteel and APS Romania data sheets).
   * The 2023 edition of EN 1092-2 exists; values here are from 1997 and
   * are believed unchanged for mating dimensions — check if critical.
   * ------------------------------------------------------------------ */
  {
    id: 'EN1092-2_PN6', family: 'EN 1092-2', rating: 'PN6', material: 'Cast iron (ductile / grey)', unit: 'mm',
    aliases: ['BS 4504 PN6 (cast iron)', 'BS EN 1092-2 PN6'],
    columns: ['dn', 'od', 'pcd', 'n', 'hole', 'bolt', 't1', 'rf', 'pipeOD'],
    thicknessLabels: { t1: 'Cast iron flange (first thickness column of the table)' },
    rows: [
      //  DN     D     K     n   L    bolt    t1   d1   DE
      [   15,   80,   55,  4, 11, 'M10',   12,  40, null],
      [   20,   90,   65,  4, 11, 'M10',   14,  50, null],
      [   25,  100,   75,  4, 11, 'M10',   14,  60, null],
      [   32,  120,   90,  4, 14, 'M12',   16,  70, null],
      [   40,  130,  100,  4, 14, 'M12',   16,  80,   56],
      [   50,  140,  110,  4, 14, 'M12',   16,  90,   66],
      [   60,  150,  120,  4, 14, 'M12',   16, null,  77],
      [   65,  160,  130,  4, 14, 'M12',   16, 110,   82],
      [   80,  190,  150,  4, 19, 'M16',   18, 128,   98],
      [  100,  210,  170,  4, 19, 'M16',   18, 148,  118],
      [  125,  240,  200,  8, 19, 'M16',   20, 178,  144],
      [  150,  265,  225,  8, 19, 'M16',   20, 202,  170],
      [  200,  320,  280,  8, 19, 'M16',   22, 258,  222],
      [  250,  375,  335, 12, 19, 'M16',   24, 312,  274],
      [  300,  440,  395, 12, 23, 'M20',   24, 365,  326],
      [  350,  490,  445, 12, 23, 'M20',   26, 415,  378],
      [  400,  540,  495, 16, 23, 'M20',   28, 465,  429],
      [  450,  595,  550, 16, 23, 'M20',   28, 520,  480],
      [  500,  645,  600, 20, 23, 'M20',   30, 570,  532],
      [  600,  755,  705, 20, 28, 'M24',   30, 670,  635],
      [  700,  860,  810, 24, 28, 'M24',   32, 775,  738],
      [  800,  975,  920, 24, 31, 'M27',   34, 880,  842],
      [  900, 1075, 1020, 24, 31, 'M27',   36, 980,  945],
      [ 1000, 1175, 1120, 28, 31, 'M27',   36, 1080, 1048],
      [ 1200, 1405, 1340, 32, 34, 'M30',   40, 1295, 1255],
    ],
    unverified: {
      _all: 'PN6 cast iron rows come from BS EN 1092-2:1997 only (no second source found). D, K, n and bolt agree with EN 1092-1 PN6; thickness column assignment (grey vs ductile iron) could not be confirmed.',
    },
    notes: ['PN6 cast iron flanges are uncommon in water supply; more likely on old low-pressure or drainage work.'],
    sources: ['BS EN 1092-2:1997 Table 7', 'EN 545:2010 Table 16 (pipe DE)'],
  },
  {
    id: 'EN1092-2_PN10', family: 'EN 1092-2', rating: 'PN10', material: 'Ductile iron', unit: 'mm',
    aliases: ['BS 4504 PN10 (cast iron)', 'BS EN 1092-2 PN10', 'DI PN10'],
    columns: ['dn', 'od', 'pcd', 'n', 'hole', 'bolt', 't1', 'rf', 'pipeOD'],
    thicknessLabels: { t1: 'Ductile iron flange' },
    rows: [
      //  DN     D     K     n   L    bolt    t1    d1    DE
      [   40,  150,  110,  4, 19, 'M16',   19,    88,   56],
      [   50,  165,  125,  4, 19, 'M16',   19,   102,   66],
      [   60,  175,  135,  4, 19, 'M16',   19,  null,   77],
      [   65,  185,  145,  4, 19, 'M16',   19,   122,   82],
      [   80,  200,  160,  8, 19, 'M16',   19,   138,   98],
      [  100,  220,  180,  8, 19, 'M16',   19,   158,  118],
      [  125,  250,  210,  8, 19, 'M16',   19,   188,  144],
      [  150,  285,  240,  8, 23, 'M20',   19,   212,  170],
      [  200,  340,  295,  8, 23, 'M20',   20,   268,  222],
      [  250,  395,  350, 12, 23, 'M20',   22,   320,  274],
      [  300,  445,  400, 12, 23, 'M20', 24.5,   370,  326],
      [  350,  505,  460, 16, 23, 'M20', 24.5,   430,  378],
      [  400,  565,  515, 16, 28, 'M24', 24.5,   482,  429],
      [  450,  615,  565, 20, 28, 'M24', 25.5,   532,  480],
      [  500,  670,  620, 20, 28, 'M24', 26.5,   585,  532],
      [  600,  780,  725, 20, 31, 'M27',   30,   685,  635],
      [  700,  895,  840, 24, 31, 'M27', 32.5,   800,  738],
      [  800, 1015,  950, 24, 34, 'M30',   35,   905,  842],
      [  900, 1115, 1050, 28, 34, 'M30', 37.5,  1005,  945],
      [ 1000, 1230, 1160, 28, 37, 'M33',   40,  1110, 1048],
      [ 1100, 1340, 1270, 32, 37, 'M33', 42.5,  null, 1152],
      [ 1200, 1455, 1380, 32, 41, 'M36',   45,  1330, 1255],
      [ 1400, 1675, 1590, 36, 44, 'M39',   46,  1535, 1462],
      [ 1500, 1785, 1700, 36, 44, 'M39', 47.5,  null, 1565],
      [ 1600, 1915, 1820, 40, 50, 'M45',   49,  1760, 1668],
      [ 1800, 2115, 2020, 44, 50, 'M45',   52,  1960, 1875],
      [ 2000, 2325, 2230, 48, 50, 'M45',   55,  2170, 2082],
    ],
    altBoltCount: { 65: [8] },
    altOD: { 250: 400, 300: 455 },
    rowNotes: {
      65: 'EN 1092-2:1997 lists 4 holes for DN65; steel EN 1092-1 lists 8 (4 by agreement). Either may be found.',
      250: 'Ductile iron pipes and fittings use D = 400 mm at DN250 (table value 395 mm for other cast irons).',
      300: 'Ductile iron pipes and fittings use D = 455 mm at DN300 (table value 445 mm for other cast irons).',
    },
    unverified: {
      700: 'DN700+ from BS EN 1092-2:1997 only; second-source check covered DN50-600.',
      800: 'From BS EN 1092-2:1997 only.', 900: 'From BS EN 1092-2:1997 only.', 1000: 'From BS EN 1092-2:1997 only.',
      1100: 'From BS EN 1092-2:1997 only.', 1200: 'From BS EN 1092-2:1997 only.', 1400: 'From BS EN 1092-2:1997 only.',
      1500: 'From BS EN 1092-2:1997 only.', 1600: 'From BS EN 1092-2:1997 only.', 1800: 'From BS EN 1092-2:1997 only.',
      2000: 'From BS EN 1092-2:1997 only.', 60: 'DN60 is a cast-iron-only size; from BS EN 1092-2:1997 only.',
    },
    notes: [
      'DN40 to DN150: EN 1092-2 says "use PN16 dimensions" — PN10 and PN16 iron flanges are identical in this range, including thickness.',
      'Raised face diameter copied from EN 1092-1 Table 8 (EN 1092-2 uses the same facing dimensions). Many iron flanges are flat-faced with a full-face gasket.',
      'PN10 ductile iron flanges may be used on socket pipelines up to about 15 bar (EN 1092-2 note).',
    ],
    sources: ['BS EN 1092-2:1997 Table 8', 'tpmcsteel.com EN 1092-2 PN10/16/25 tables', 'EN 545:2010 Table 16 (pipe DE)'],
  },
  {
    id: 'EN1092-2_PN16', family: 'EN 1092-2', rating: 'PN16', material: 'Ductile iron', unit: 'mm',
    aliases: ['BS 4504 PN16 (cast iron)', 'BS EN 1092-2 PN16', 'DI PN16'],
    columns: ['dn', 'od', 'pcd', 'n', 'hole', 'bolt', 't1', 'rf', 'pipeOD'],
    thicknessLabels: { t1: 'Ductile iron flange' },
    rows: [
      //  DN     D     K     n   L    bolt    t1    d1    DE
      [   40,  150,  110,  4, 19, 'M16',   19,    88,   56],
      [   50,  165,  125,  4, 19, 'M16',   19,   102,   66],
      [   60,  175,  135,  4, 19, 'M16',   19,  null,   77],
      [   65,  185,  145,  4, 19, 'M16',   19,   122,   82],
      [   80,  200,  160,  8, 19, 'M16',   19,   138,   98],
      [  100,  220,  180,  8, 19, 'M16',   19,   158,  118],
      [  125,  250,  210,  8, 19, 'M16',   19,   188,  144],
      [  150,  285,  240,  8, 23, 'M20',   19,   212,  170],
      [  200,  340,  295, 12, 23, 'M20',   20,   268,  222],
      [  250,  405,  355, 12, 28, 'M24',   22,   320,  274],
      [  300,  460,  410, 12, 28, 'M24', 24.5,   378,  326],
      [  350,  520,  470, 16, 28, 'M24', 26.5,   438,  378],
      [  400,  580,  525, 16, 31, 'M27',   28,   490,  429],
      [  450,  640,  585, 20, 31, 'M27',   30,   550,  480],
      [  500,  715,  650, 20, 34, 'M30', 31.5,   610,  532],
      [  600,  840,  770, 20, 37, 'M33',   36,   725,  635],
      [  700,  910,  840, 24, 37, 'M33', 39.5,   795,  738],
      [  800, 1025,  950, 24, 41, 'M36',   43,   900,  842],
      [  900, 1125, 1050, 28, 41, 'M36', 46.5,  1000,  945],
      [ 1000, 1255, 1170, 28, 44, 'M39',   50,  1115, 1048],
      [ 1100, 1355, 1270, 32, 44, 'M39', 53.5,  null, 1152],
      [ 1200, 1485, 1390, 32, 50, 'M45',   57,  1330, 1255],
      [ 1400, 1685, 1590, 36, 50, 'M45',   60,  1530, 1462],
      [ 1500, 1820, 1710, 36, 57, 'M52', 62.5,  null, 1565],
      [ 1600, 1930, 1820, 40, 57, 'M52',   65,  1750, 1668],
      [ 1800, 2130, 2020, 44, 57, 'M52',   70,  1950, 1875],
      [ 2000, 2345, 2230, 48, 62, 'M56',   75,  2150, 2082],
    ],
    altBoltCount: { 65: [8] },
    altOD: { 250: 400, 300: 455 },
    rowNotes: {
      65: 'EN 1092-2:1997 lists 4 holes for DN65; steel EN 1092-1 lists 8 (4 by agreement). Either may be found.',
      250: 'Ductile iron pipes and fittings use D = 400 mm at DN250 (table value 405 mm for other cast irons).',
      300: 'Ductile iron pipes and fittings use D = 455 mm at DN300 (table value 460 mm for other cast irons).',
    },
    unverified: {
      700: 'DN700+ from BS EN 1092-2:1997 only (D, K, n, bolt agree with EN 1092-1 PN16).',
      800: 'From BS EN 1092-2:1997 only.', 900: 'From BS EN 1092-2:1997 only.', 1000: 'From BS EN 1092-2:1997 only.',
      1100: 'From BS EN 1092-2:1997 only.', 1200: 'From BS EN 1092-2:1997 only.', 1400: 'From BS EN 1092-2:1997 only.',
      1500: 'From BS EN 1092-2:1997 only.', 1600: 'From BS EN 1092-2:1997 only.', 1800: 'From BS EN 1092-2:1997 only.',
      2000: 'From BS EN 1092-2:1997 only.', 60: 'DN60 is a cast-iron-only size; from BS EN 1092-2:1997 only.',
    },
    notes: [
      'DN40 to DN50: EN 1092-2 says "use PN40 dimensions".',
      'Raised face diameter copied from EN 1092-1 Table 8 (EN 1092-2 uses the same facing dimensions). Many iron flanges are flat-faced with a full-face gasket.',
    ],
    sources: ['BS EN 1092-2:1997 Table 9', 'tpmcsteel.com EN 1092-2 PN10/16/25 tables', 'EN 545:2010 Table 16 (pipe DE)'],
  },
  {
    id: 'EN1092-2_PN25', family: 'EN 1092-2', rating: 'PN25', material: 'Ductile iron', unit: 'mm',
    aliases: ['BS 4504 PN25 (cast iron)', 'BS EN 1092-2 PN25', 'DI PN25'],
    columns: ['dn', 'od', 'pcd', 'n', 'hole', 'bolt', 't1', 'rf', 'pipeOD'],
    thicknessLabels: { t1: 'Ductile iron flange' },
    rows: [
      //  DN     D     K     n   L    bolt    t1    d1    DE
      [   40,  150,  110,  4, 19, 'M16',   19,    88,   56],
      [   50,  165,  125,  4, 19, 'M16',   19,   102,   66],
      [   65,  185,  145,  8, 19, 'M16',   19,   122,   82],
      [   80,  200,  160,  8, 19, 'M16',   19,   138,   98],
      [  100,  235,  190,  8, 23, 'M20',   19,   162,  118],
      [  125,  270,  220,  8, 28, 'M24',   19,   188,  144],
      [  150,  300,  250,  8, 28, 'M24',   20,   218,  170],
      [  200,  360,  310, 12, 28, 'M24',   22,   278,  222],
      [  250,  425,  370, 12, 31, 'M27', 24.5,   335,  274],
      [  300,  485,  430, 16, 31, 'M27', 27.5,   395,  326],
      [  350,  555,  490, 16, 34, 'M30',   30,   450,  378],
      [  400,  620,  550, 16, 37, 'M33',   32,   505,  429],
      [  450,  670,  600, 20, 37, 'M33', 34.5,   555,  480],
      [  500,  730,  660, 20, 37, 'M33', 36.5,   615,  532],
      [  600,  845,  770, 20, 41, 'M36',   42,   720,  635],
      [  700,  960,  875, 24, 44, 'M39', 46.5,   820,  738],
      [  800, 1085,  990, 24, 50, 'M45',   51,   930,  842],
      [  900, 1185, 1090, 28, 50, 'M45', 55.5,  1030,  945],
      [ 1000, 1320, 1210, 28, 57, 'M52',   60,  1140, 1048],
    ],
    unverified: {
      700: 'From BS EN 1092-2:1997 only (D, K, n, bolt agree with EN 1092-1 PN25).',
      800: 'From BS EN 1092-2:1997 only.', 900: 'From BS EN 1092-2:1997 only.', 1000: 'From BS EN 1092-2:1997 only.',
    },
    notes: ['DN40 to DN100: EN 1092-2 says "use PN40 dimensions" — PN25 and PN40 iron flanges are identical in this range.'],
    sources: ['BS EN 1092-2:1997 Table 10', 'tpmcsteel.com EN 1092-2 PN25 table', 'EN 545:2010 Table 16 (pipe DE)'],
  },
  {
    id: 'EN1092-2_PN40', family: 'EN 1092-2', rating: 'PN40', material: 'Ductile iron', unit: 'mm',
    aliases: ['BS 4504 PN40 (cast iron)', 'BS EN 1092-2 PN40', 'DI PN40'],
    columns: ['dn', 'od', 'pcd', 'n', 'hole', 'bolt', 't1', 'rf', 'pipeOD'],
    thicknessLabels: { t1: 'Ductile iron flange' },
    rows: [
      //  DN     D     K     n   L    bolt    t1    d1    DE
      [   40,  150,  110,  4, 19, 'M16',   19,    88,   56],
      [   50,  165,  125,  4, 19, 'M16',   19,   102,   66],
      [   60,  175,  135,  8, 19, 'M16',   19,  null,   77],
      [   65,  185,  145,  8, 19, 'M16',   19,   122,   82],
      [   80,  200,  160,  8, 19, 'M16',   19,   138,   98],
      [  100,  235,  190,  8, 23, 'M20',   19,   162,  118],
      [  125,  270,  220,  8, 28, 'M24', 23.5,   188,  144],
      [  150,  300,  250,  8, 28, 'M24',   26,   218,  170],
      [  200,  375,  320, 12, 31, 'M27',   30,   285,  222],
      [  250,  450,  385, 12, 34, 'M30', 34.5,   345,  274],
      [  300,  515,  450, 16, 34, 'M30', 39.5,   410,  326],
      [  350,  580,  510, 16, 37, 'M33',   44,   465,  378],
      [  400,  660,  585, 16, 41, 'M36',   48,   535,  429],
      [  450,  685,  610, 20, 41, 'M36',   49,   560,  480],
      [  500,  755,  670, 20, 44, 'M39',   52,   615,  532],
      [  600,  890,  795, 20, 50, 'M45',   58,   735,  635],
    ],
    unverified: {
      _all: 'PN40 iron D, K, n and bolt agree with EN 1092-1 PN40 (two sources). Iron hole sizes and thicknesses are from BS EN 1092-2:1997 only.',
      60: 'DN60 is a cast-iron-only size; from BS EN 1092-2:1997 only.',
    },
    notes: [],
    sources: ['BS EN 1092-2:1997 Table 11', 'EN 545:2010 Table 16 (pipe DE)'],
  },

  /* ------------------------------------------------------------------
   * BS 10:1962  (withdrawn, but still everywhere on older UK plant)
   * Numbers are in INCHES, typed straight from the BS 10 tables.
   * Source 1: BS 10:1962 Table D/E/F reproduced by Evenort Ltd (Hilton
   *   Metal Forgings) — D, K, L, C, number of holes.
   * Source 2: Inflow UK "Flange Table - BS10" (D, C, K, holes, bolt).
   * Both agree except where flagged. A third source (Complete Stainless)
   * disagrees on some bolt counts — see `unverified`.
   * Bolt size is the bolt that suits the hole: 9/16" hole -> 1/2" bolt,
   * 11/16" -> 5/8", 7/8" -> 3/4", 1" -> 7/8", 1 1/8" -> 1",
   * 1 1/4" -> 1 1/8", 1 3/8" -> 1 1/4".
   * t1 = thickness of a STEEL plate (slip-on) flange. Cast iron BS 10
   * flanges are thicker — use thickness as a weak clue only.
   * pipeOD = column A (steel pipe OD, inches).
   * ------------------------------------------------------------------ */
  {
    id: 'BS10_D', family: 'BS 10', rating: 'Table D', material: 'Steel / cast iron (pre-metric UK)', unit: 'in',
    aliases: ['BS10 Table D', 'BS 10 D'],
    columns: ['nps', 'dn', 'od', 'pcd', 'n', 'hole', 'bolt', 't1', 'pipeOD'],
    thicknessLabels: { t1: 'Steel plate flange' },
    rows: [
      // NPS       DN    D       K       n   L        bolt     C        A
      ['1/2',     15,  3.75,   2.625,   4, 0.5625, '1/2"',  0.1875,  0.84],
      ['3/4',     20,  4,      2.875,   4, 0.5625, '1/2"',  0.1875,  1.05],
      ['1',       25,  4.5,    3.25,    4, 0.5625, '1/2"',  0.1875,  1.32],
      ['1 1/4',   32,  4.75,   3.4375,  4, 0.5625, '1/2"',  0.25,    1.66],
      ['1 1/2',   40,  5.25,   3.875,   4, 0.5625, '1/2"',  0.25,    1.9],
      ['2',       50,  6,      4.5,     4, 0.6875, '5/8"',  0.3125,  2.38],
      ['2 1/2',   65,  6.5,    5,       4, 0.6875, '5/8"',  0.3125,  2.88],
      ['3',       80,  7.25,   5.75,    4, 0.6875, '5/8"',  0.375,   3.5],
      ['3 1/2',   90,  8,      6.5,     4, 0.6875, '5/8"',  0.375,   4.0],
      ['4',      100,  8.5,    7,       4, 0.6875, '5/8"',  0.375,   4.5],
      ['5',      125,  10,     8.25,    8, 0.6875, '5/8"',  0.5,     5.56],
      ['6',      150,  11,     9.25,    8, 0.6875, '5/8"',  0.5,     6.63],
      ['7',      175,  12,     10.25,   8, 0.6875, '5/8"',  0.5,     null],
      ['8',      200,  13.25,  11.5,    8, 0.6875, '5/8"',  0.5,     8.63],
      ['9',      225,  14.5,   12.75,   8, 0.6875, '5/8"',  0.625,   null],
      ['10',     250,  16,     14,      8, 0.875,  '3/4"',  0.625,  10.75],
      ['12',     300,  18,     16,     12, 0.875,  '3/4"',  0.75,   12.75],
      ['14',     350,  20.75,  18.5,   12, 1,      '7/8"',  0.875,  14],
      ['15',     375,  21.75,  19.5,   12, 1,      '7/8"',  0.875,  null],
      ['16',     400,  22.75,  20.5,   12, 1,      '7/8"',  0.875,  16],
      ['18',     450,  25.25,  23,     12, 1,      '7/8"',  1,      18],
      ['20',     500,  27.75,  25.25,  16, 1,      '7/8"',  1.125,  20],
      ['24',     600,  32.5,   29.75,  16, 1.125,  '1"',    1.25,   24],
    ],
    unverified: {
      175: '7" is only in the Inflow UK table (not in the Evenort BS 10 extract). Hole size assumed 11/16" from the M16 bolt listed.',
      225: '9" is only in the Inflow UK table. Hole size assumed 11/16" from the M16 bolt listed.',
      375: '15" is only in the Inflow UK table. Hole size assumed 1" from the M22 bolt listed.',
      90:  '3 1/2" is only in the Evenort BS 10 extract.',
      100: 'Two sources give 4 bolts at 4" (Evenort, Inflow UK); a third (Complete Stainless) says 8.',
      250: 'Two sources give 8 bolts at 10" (Evenort, Inflow UK); a third (Complete Stainless) says 12.',
      450: 'Two sources give 12 bolts at 18" (Evenort, Inflow UK); a third (Complete Stainless) says 16.',
    },
    notes: [
      'Table D was the most common low-pressure BS 10 drilling (roughly 7 bar water).',
      'Table D and Table E have the same outside diameter and PCD at every size — they differ only in thickness, and at some sizes in bolt count / bolt size.',
      'BS 10 flanges are often flat-faced; no raised face diameter is given.',
    ],
    sources: ['BS 10:1962 (Evenort Ltd reproduction)', 'inflowuk.co.uk Flange Table - BS10', 'completestainless.co.uk quick flange table (third check)'],
  },
  {
    id: 'BS10_E', family: 'BS 10', rating: 'Table E', material: 'Steel / cast iron (pre-metric UK)', unit: 'in',
    aliases: ['BS10 Table E', 'BS 10 E'],
    columns: ['nps', 'dn', 'od', 'pcd', 'n', 'hole', 'bolt', 't1', 'pipeOD'],
    thicknessLabels: { t1: 'Steel plate flange' },
    rows: [
      // NPS       DN    D       K       n   L        bolt     C         A
      ['1/2',     15,  3.75,   2.625,   4, 0.5625, '1/2"',  0.25,     0.84],
      ['3/4',     20,  4,      2.875,   4, 0.5625, '1/2"',  0.25,     1.05],
      ['1',       25,  4.5,    3.25,    4, 0.5625, '1/2"',  0.28125,  1.32],
      ['1 1/4',   32,  4.75,   3.4375,  4, 0.5625, '1/2"',  0.3125,   1.66],
      ['1 1/2',   40,  5.25,   3.875,   4, 0.5625, '1/2"',  0.34375,  1.9],
      ['2',       50,  6,      4.5,     4, 0.6875, '5/8"',  0.375,    2.38],
      ['2 1/2',   65,  6.5,    5,       4, 0.6875, '5/8"',  0.40625,  2.88],
      ['3',       80,  7.25,   5.75,    4, 0.6875, '5/8"',  0.4375,   3.5],
      ['3 1/2',   90,  8,      6.5,     8, 0.6875, '5/8"',  0.46875,  4.0],
      ['4',      100,  8.5,    7,       8, 0.6875, '5/8"',  0.5,      4.5],
      ['5',      125,  10,     8.25,    8, 0.6875, '5/8"',  0.5625,   5.56],
      ['6',      150,  11,     9.25,    8, 0.875,  '3/4"',  0.6875,   6.63],
      ['7',      175,  12,     10.25,   8, 0.875,  '3/4"',  0.75,     null],
      ['8',      200,  13.25,  11.5,    8, 0.875,  '3/4"',  0.75,     8.63],
      ['9',      225,  14.5,   12.75,  12, 0.875,  '3/4"',  0.8125,   null],
      ['10',     250,  16,     14,     12, 0.875,  '3/4"',  0.875,   10.75],
      ['12',     300,  18,     16,     12, 1,      '7/8"',  1,       12.75],
      ['14',     350,  20.75,  18.5,   12, 1,      '7/8"',  1.125,   14],
      ['15',     375,  21.75,  19.5,   12, 1,      '7/8"',  1.25,    null],
      ['16',     400,  22.75,  20.5,   12, 1,      '7/8"',  1.25,    16],
      ['18',     450,  25.25,  23,     16, 1,      '7/8"',  1.375,   18],
      ['20',     500,  27.75,  25.25,  16, 1,      '7/8"',  1.5,     20],
      ['24',     600,  32.5,   29.75,  16, 1.125,  '1"',    1.875,   24],
    ],
    unverified: {
      175: '7" is only in the Inflow UK table. Hole size assumed 7/8" from the M20 bolt listed.',
      225: '9" is only in the Inflow UK table. Hole size assumed 7/8" from the M20 bolt listed.',
      375: '15" is only in the Inflow UK table. Hole size assumed 1" from the M22 bolt listed.',
      90:  '3 1/2" is only in the Evenort BS 10 extract.',
      100: 'Two sources give 8 bolts at 4" (Evenort, Inflow UK); a third (Complete Stainless) says 4.',
      200: 'Evenort gives D = 13 1/4"; Inflow UK prints 13 3/4" (treated as a typo — D and E share OD everywhere else).',
      250: 'Two sources give 12 bolts at 10" (Evenort, Inflow UK); a third (Complete Stainless) says 8.',
    },
    notes: [
      'Table E is the next pressure step up from Table D (roughly 14 bar water).',
      'Same outside diameter and PCD as Table D — tell them apart by thickness and, at 3 1/2", 4", 9", 10" and 18", by bolt count.',
    ],
    sources: ['BS 10:1962 (Evenort Ltd reproduction)', 'inflowuk.co.uk Flange Table - BS10', 'completestainless.co.uk quick flange table (third check)'],
  },
  {
    id: 'BS10_F', family: 'BS 10', rating: 'Table F', material: 'Steel / cast iron (pre-metric UK)', unit: 'in',
    aliases: ['BS10 Table F', 'BS 10 F'],
    columns: ['nps', 'dn', 'od', 'pcd', 'n', 'hole', 'bolt', 't1', 'pipeOD'],
    thicknessLabels: { t1: 'Steel plate flange' },
    rows: [
      // NPS       DN    D       K       n   L        bolt      C       A
      ['1/2',     15,  3.75,   2.625,   4, 0.5625, '1/2"',   0.375,  0.84],
      ['3/4',     20,  4,      2.875,   4, 0.5625, '1/2"',   0.375,  1.05],
      ['1',       25,  4.75,   3.4375,  4, 0.6875, '5/8"',   0.375,  1.32],
      ['1 1/4',   32,  5.25,   3.875,   4, 0.6875, '5/8"',   0.5,    1.66],
      ['1 1/2',   40,  5.5,    4.125,   4, 0.6875, '5/8"',   0.5,    1.9],
      ['2',       50,  6.5,    5,       4, 0.6875, '5/8"',   0.625,  2.38],
      ['2 1/2',   65,  7.25,   5.75,    8, 0.6875, '5/8"',   0.625,  2.88],
      ['3',       80,  8,      6.5,     8, 0.6875, '5/8"',   0.625,  3.5],
      ['3 1/2',   90,  8.5,    7,       8, 0.6875, '5/8"',   0.75,   4.0],
      ['4',      100,  9,      7.5,     8, 0.6875, '5/8"',   0.75,   4.5],
      ['5',      125,  11,     9.25,    8, 0.875,  '3/4"',   0.875,  5.56],
      ['6',      150,  12,     10.25,  12, 0.875,  '3/4"',   0.875,  6.63],
      ['8',      200,  14.5,   12.75,  12, 0.875,  '3/4"',   1,      8.63],
      ['10',     250,  17,     15,     12, 1,      '7/8"',   1.125, 10.75],
      ['12',     300,  19.25,  17.25,  16, 1,      '7/8"',   1.25,  12.75],
      ['14',     350,  21.75,  19.5,   16, 1.125,  '1"',     1.375, 14],
      ['16',     400,  24,     21.75,  20, 1.125,  '1"',     1.625, 16],
      ['18',     450,  26.5,   24,     20, 1.25,   '1 1/8"', 1.75,  18],
      ['20',     500,  29,     26.5,   24, 1.25,   '1 1/8"', 2,     20],
      ['24',     600,  33.5,   30.75,  24, 1.375,  '1 1/4"', 2.25,  24],
    ],
    unverified: {
      90: '3 1/2" is only in the Evenort BS 10 extract.',
      500: 'Thickness: Evenort gives 2"; Inflow UK prints 1" (treated as a typo).',
    },
    notes: ['Table F is a higher pressure BS 10 table (roughly 21 bar water). Same OD/PCD as Table H at most sizes but thinner.'],
    sources: ['BS 10:1962 (Evenort Ltd reproduction)', 'inflowuk.co.uk Flange Table - BS10'],
  },

  /* ------------------------------------------------------------------
   * ASME B16.5  (also called ANSI B16.5)  —  Class 150 and Class 300
   * Numbers in INCHES. Source 1: pipedata.org weld neck tables (OD,
   * thickness, PCD, bolts, RF). Source 2: S.K. Fitting Valve ASME table
   * (OD, PCD, hole, n, bolt). Fluidcon catalogue used as a third check.
   * All agree. Thickness = minimum flange thickness, EXCLUDING the
   * 1/16" (1.6 mm) raised face (2003+ editions). Older catalogues
   * include the raised face, so a real flange can be ~1.6 mm thicker.
   * pipeOD = ASME B36.10M pipe OD.
   * ------------------------------------------------------------------ */
  {
    id: 'ASME_150', family: 'ASME B16.5', rating: 'Class 150', material: 'Steel (forged)', unit: 'in',
    aliases: ['ANSI 150', 'ANSI B16.5 150#', '150 lb'],
    columns: ['nps', 'dn', 'od', 'pcd', 'n', 'hole', 'bolt', 't1', 'rf', 'pipeOD'],
    thicknessLabels: { t1: 'Flange thickness (excl. 1.6 mm raised face)' },
    rows: [
      // NPS       DN    OD      PCD     n   hole    bolt       tf     RF      pipe OD
      ['1/2',     15,  3.5,    2.375,   4, 0.625, '1/2"',    0.38,  1.38,   0.840],
      ['3/4',     20,  3.875,  2.75,    4, 0.625, '1/2"',    0.44,  1.69,   1.050],
      ['1',       25,  4.25,   3.125,   4, 0.625, '1/2"',    0.50,  2.00,   1.315],
      ['1 1/4',   32,  4.625,  3.5,     4, 0.625, '1/2"',    0.56,  2.50,   1.660],
      ['1 1/2',   40,  5,      3.875,   4, 0.625, '1/2"',    0.62,  2.88,   1.900],
      ['2',       50,  6,      4.75,    4, 0.75,  '5/8"',    0.69,  3.62,   2.375],
      ['2 1/2',   65,  7,      5.5,     4, 0.75,  '5/8"',    0.81,  4.12,   2.875],
      ['3',       80,  7.5,    6,       4, 0.75,  '5/8"',    0.88,  5.00,   3.5],
      ['3 1/2',   90,  8.5,    7,       8, 0.75,  '5/8"',    0.88,  5.50,   4.0],
      ['4',      100,  9,      7.5,     8, 0.75,  '5/8"',    0.88,  6.19,   4.5],
      ['5',      125,  10,     8.5,     8, 0.875, '3/4"',    0.88,  7.31,   5.563],
      ['6',      150,  11,     9.5,     8, 0.875, '3/4"',    0.94,  8.50,   6.625],
      ['8',      200,  13.5,   11.75,   8, 0.875, '3/4"',    1.06, 10.62,   8.625],
      ['10',     250,  16,     14.25,  12, 1,     '7/8"',    1.12, 12.75,  10.75],
      ['12',     300,  19,     17,     12, 1,     '7/8"',    1.19, 15.00,  12.75],
      ['14',     350,  21,     18.75,  12, 1.125, '1"',      1.31, 16.25,  14],
      ['16',     400,  23.5,   21.25,  16, 1.125, '1"',      1.38, 18.50,  16],
      ['18',     450,  25,     22.75,  16, 1.25,  '1 1/8"',  1.50, 21.00,  18],
      ['20',     500,  27.5,   25,     20, 1.25,  '1 1/8"',  1.62, 23.00,  20],
      ['24',     600,  32,     29.5,   20, 1.375, '1 1/4"',  1.81, 27.25,  24],
    ],
    notes: ['Mostly found on imported pumps, valves and process kit. Class 150 is close to, but does NOT mate with, PN16 at most sizes.'],
    sources: ['pipedata.org ASME B16.5 Class 150 weld neck', 'skfitting.com ASME B16.5 table', 'Fluidcon Engineers flange catalogue'],
  },
  {
    id: 'ASME_300', family: 'ASME B16.5', rating: 'Class 300', material: 'Steel (forged)', unit: 'in',
    aliases: ['ANSI 300', 'ANSI B16.5 300#', '300 lb'],
    columns: ['nps', 'dn', 'od', 'pcd', 'n', 'hole', 'bolt', 't1', 'rf', 'pipeOD'],
    thicknessLabels: { t1: 'Flange thickness (excl. 1.6 mm raised face)' },
    rows: [
      // NPS       DN    OD      PCD     n   hole    bolt       tf     RF      pipe OD
      ['1/2',     15,  3.75,   2.625,   4, 0.625, '1/2"',    0.50,  1.38,   0.840],
      ['3/4',     20,  4.625,  3.25,    4, 0.75,  '5/8"',    0.56,  1.69,   1.050],
      ['1',       25,  4.875,  3.5,     4, 0.75,  '5/8"',    0.62,  2.00,   1.315],
      ['1 1/4',   32,  5.25,   3.875,   4, 0.75,  '5/8"',    0.69,  2.50,   1.660],
      ['1 1/2',   40,  6.125,  4.5,     4, 0.875, '3/4"',    0.75,  2.88,   1.900],
      ['2',       50,  6.5,    5,       8, 0.75,  '5/8"',    0.81,  3.62,   2.375],
      ['2 1/2',   65,  7.5,    5.875,   8, 0.875, '3/4"',    0.94,  4.12,   2.875],
      ['3',       80,  8.25,   6.625,   8, 0.875, '3/4"',    1.06,  5.00,   3.5],
      ['3 1/2',   90,  9,      7.25,    8, 0.875, '3/4"',    1.12,  5.50,   4.0],
      ['4',      100,  10,     7.875,   8, 0.875, '3/4"',    1.19,  6.19,   4.5],
      ['5',      125,  11,     9.25,    8, 0.875, '3/4"',    1.31,  7.31,   5.563],
      ['6',      150,  12.5,   10.625, 12, 0.875, '3/4"',    1.38,  8.50,   6.625],
      ['8',      200,  15,     13,     12, 1,     '7/8"',    1.56, 10.62,   8.625],
      ['10',     250,  17.5,   15.25,  16, 1.125, '1"',      1.81, 12.75,  10.75],
      ['12',     300,  20.5,   17.75,  16, 1.25,  '1 1/8"',  1.94, 15.00,  12.75],
      ['14',     350,  23,     20.25,  20, 1.25,  '1 1/8"',  2.06, 16.25,  14],
      ['16',     400,  25.5,   22.5,   20, 1.375, '1 1/4"',  2.19, 18.50,  16],
      ['18',     450,  28,     24.75,  24, 1.375, '1 1/4"',  2.31, 21.00,  18],
      ['20',     500,  30.5,   27,     24, 1.375, '1 1/4"',  2.44, 23.00,  20],
      ['24',     600,  36,     32,     24, 1.625, '1 1/2"',  2.69, 27.25,  24],
    ],
    notes: ['Higher pressure ASME class; uncommon in water distribution.'],
    sources: ['pipedata.org ASME B16.5 Class 300 weld neck', 'skfitting.com ASME B16.5 table', 'Fluidcon Engineers flange catalogue'],
  },
];

/* BS 4504 note: BS 4504 Part 1 (steel) and Part 2 (cast iron) were
 * replaced by BS EN 1092-1 and BS EN 1092-2. The mating dimensions
 * (D, K, n, bolt) are the same for the sizes in this app, so BS 4504
 * flanges are found through the EN 1092 tables (see `aliases`). */

// Make the data usable from Node.js (for the tests) as well as the browser.
if (typeof module !== 'undefined') module.exports = { FLANGE_TABLES };

var _a, _b, _c, _d, _e, _f;
import { r as reactExports, j as jsxRuntimeExports, c as cn, a as reactDomExports, I as Input, S as SelectMenu, b as createRoot } from "./select-menu-DPXFltX0.js";
function DialogContent({
  className,
  children,
  open,
  onOpenChange
}) {
  const [mounted, setMounted] = reactExports.useState(false);
  reactExports.useEffect(() => setMounted(true), []);
  reactExports.useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onOpenChange == null ? void 0 : onOpenChange(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onOpenChange]);
  if (!open || !mounted) return null;
  return reactDomExports.createPortal(
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 z-[100000]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "fixed inset-0 bg-black/40",
          onClick: () => onOpenChange == null ? void 0 : onOpenChange(false)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: cn(
            "fixed left-1/2 top-1/2 z-[100001] w-full max-w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white p-6 shadow-xl",
            className
          ),
          role: "dialog",
          "aria-modal": "true",
          onClick: (e) => e.stopPropagation(),
          children
        }
      )
    ] }),
    document.body
  );
}
const DialogHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("mb-2", className), ...props });
const DialogTitle = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    ref,
    className: cn("text-base font-semibold px-2", className),
    ...props
  }
));
DialogTitle.displayName = "DialogTitle";
const cmp = (a, b) => a > b ? 1 : a < b ? -1 : 0;
const inf = Infinity;
const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const EXACT_HERE = "eexxaacctt";
const PUNCT_RE = new RegExp("\\p{P}", "gu");
const LATIN_UPPER = "A-Z";
const LATIN_LOWER = "a-z";
const COLLATE_ARGS = ["en", { numeric: true, sensitivity: "base" }];
const swapAlpha = (str, upper, lower) => str.replace(LATIN_UPPER, upper).replace(LATIN_LOWER, lower);
const OPTS = {
  // whether regexps use a /u unicode flag
  unicode: false,
  alpha: null,
  // term segmentation & punct/whitespace merging
  interSplit: "[^A-Za-z\\d']+",
  intraSplit: "[a-z][A-Z]",
  // inter bounds that will be used to increase lft2/rgt2 info counters
  interBound: "[^A-Za-z\\d]",
  // intra bounds that will be used to increase lft1/rgt1 info counters
  intraBound: "[A-Za-z]\\d|\\d[A-Za-z]|[a-z][A-Z]",
  // inter-bounds mode
  // 2 = strict (will only match 'man' on whitepace and punct boundaries: Mega Man, Mega_Man, mega.man)
  // 1 = loose  (plus allowance for alpha-num and case-change boundaries: MegaMan, 0007man)
  // 0 = any    (will match 'man' as any substring: megamaniac)
  interLft: 0,
  interRgt: 0,
  // allowance between terms
  interChars: ".",
  interIns: inf,
  // allowance between chars in terms
  intraChars: "[a-z\\d']",
  // internally case-insensitive
  intraIns: null,
  intraContr: "'[a-z]{1,2}\\b",
  // multi-insert or single-error mode
  intraMode: 0,
  // single-error bounds for errors within terms, default requires exact first char
  intraSlice: [1, inf],
  // single-error tolerance toggles
  intraSub: null,
  intraTrn: null,
  intraDel: null,
  // can post-filter matches that are too far apart in distance or length
  // (since intraIns is between each char, it can accum to nonsense matches)
  intraFilt: (term, match, index) => true,
  // should this also accept WIP info?
  toUpper: (str) => str.toLocaleUpperCase(),
  toLower: (str) => str.toLocaleLowerCase(),
  compare: null,
  // final sorting fn
  sort: (info, haystack, needle, compare = cmp) => {
    let {
      idx,
      chars,
      terms,
      interLft2,
      interLft1,
      //	interRgt2,
      //	interRgt1,
      start,
      intraIns,
      interIns,
      cases
    } = info;
    return idx.map((v, i) => i).sort((ia, ib) => (
      // most contig chars matched
      chars[ib] - chars[ia] || // least char intra-fuzz (most contiguous)
      intraIns[ia] - intraIns[ib] || // most prefix bounds, boosted by full term matches
      terms[ib] + interLft2[ib] + 0.5 * interLft1[ib] - (terms[ia] + interLft2[ia] + 0.5 * interLft1[ia]) || // highest density of match (least span)
      //	span[ia] - span[ib] ||
      // highest density of match (least term inter-fuzz)
      interIns[ia] - interIns[ib] || // earliest start of match
      start[ia] - start[ib] || // case match
      cases[ib] - cases[ia] || // alphabetic
      compare(haystack[idx[ia]], haystack[idx[ib]])
    ));
  }
};
const lazyRepeat = (chars, limit) => limit == 0 ? "" : limit == 1 ? chars + "??" : limit == inf ? chars + "*?" : chars + `{0,${limit}}?`;
const mode2Tpl = "(?:\\b|_)";
function uFuzzy(opts) {
  opts = Object.assign({}, OPTS, opts);
  let {
    unicode,
    interLft,
    interRgt,
    intraMode,
    intraSlice,
    intraIns,
    intraSub,
    intraTrn,
    intraDel,
    intraContr,
    intraSplit: _intraSplit,
    interSplit: _interSplit,
    intraBound: _intraBound,
    interBound: _interBound,
    intraChars,
    toUpper,
    toLower,
    compare
  } = opts;
  intraIns ?? (intraIns = intraMode);
  intraSub ?? (intraSub = intraMode);
  intraTrn ?? (intraTrn = intraMode);
  intraDel ?? (intraDel = intraMode);
  compare ?? (compare = typeof Intl == "undefined" ? cmp : new Intl.Collator(...COLLATE_ARGS).compare);
  let alpha = opts.letters ?? opts.alpha;
  if (alpha != null) {
    let upper = toUpper(alpha);
    let lower = toLower(alpha);
    _interSplit = swapAlpha(_interSplit, upper, lower);
    _intraSplit = swapAlpha(_intraSplit, upper, lower);
    _interBound = swapAlpha(_interBound, upper, lower);
    _intraBound = swapAlpha(_intraBound, upper, lower);
    intraChars = swapAlpha(intraChars, upper, lower);
    intraContr = swapAlpha(intraContr, upper, lower);
  }
  let uFlag = unicode ? "u" : "";
  const quotedAny = '".+?"';
  const EXACTS_RE = new RegExp(quotedAny, "gi" + uFlag);
  const NEGS_RE = new RegExp(`(?:\\s+|^)-(?:${intraChars}+|${quotedAny})`, "gi" + uFlag);
  let { intraRules } = opts;
  if (intraRules == null) {
    intraRules = (p) => {
      let _intraSlice = OPTS.intraSlice, _intraIns = 0, _intraSub = 0, _intraTrn = 0, _intraDel = 0;
      if (/[^\d]/.test(p)) {
        let plen = p.length;
        if (plen <= 4) {
          if (plen >= 3) {
            _intraTrn = Math.min(intraTrn, 1);
            if (plen == 4)
              _intraIns = Math.min(intraIns, 1);
          }
        } else {
          _intraSlice = intraSlice;
          _intraIns = intraIns, _intraSub = intraSub, _intraTrn = intraTrn, _intraDel = intraDel;
        }
      }
      return {
        intraSlice: _intraSlice,
        intraIns: _intraIns,
        intraSub: _intraSub,
        intraTrn: _intraTrn,
        intraDel: _intraDel
      };
    };
  }
  let withIntraSplit = !!_intraSplit;
  let intraSplit = new RegExp(_intraSplit, "g" + uFlag);
  let interSplit = new RegExp(_interSplit, "g" + uFlag);
  let trimRe = new RegExp("^" + _interSplit + "|" + _interSplit + "$", "g" + uFlag);
  let contrsRe = new RegExp(intraContr, "gi" + uFlag);
  const split = (needle, keepCase = false) => {
    let exacts = [];
    needle = needle.replace(EXACTS_RE, (m) => {
      exacts.push(m);
      return EXACT_HERE;
    });
    needle = needle.replace(trimRe, "");
    if (!keepCase)
      needle = toLower(needle);
    if (withIntraSplit)
      needle = needle.replace(intraSplit, (m) => m[0] + " " + m[1]);
    let j = 0;
    return needle.split(interSplit).filter((t) => t != "").map((v) => v === EXACT_HERE ? exacts[j++] : v);
  };
  const NUM_OR_ALPHA_RE = /[^\d]+|\d+/g;
  const prepQuery = (needle, capt = 0, interOR = false) => {
    let parts = split(needle);
    if (parts.length == 0)
      return [];
    let contrs = Array(parts.length).fill("");
    parts = parts.map((p, pi) => p.replace(contrsRe, (m) => {
      contrs[pi] = m;
      return "";
    }));
    let reTpl;
    if (intraMode == 1) {
      reTpl = parts.map((p, pi) => {
        if (p[0] === '"')
          return escapeRegExp(p.slice(1, -1));
        let reTpl2 = "";
        for (let m of p.matchAll(NUM_OR_ALPHA_RE)) {
          let p2 = m[0];
          let {
            intraSlice: intraSlice2,
            intraIns: intraIns2,
            intraSub: intraSub2,
            intraTrn: intraTrn2,
            intraDel: intraDel2
          } = intraRules(p2);
          if (intraIns2 + intraSub2 + intraTrn2 + intraDel2 == 0)
            reTpl2 += p2 + contrs[pi];
          else {
            let [lftIdx, rgtIdx] = intraSlice2;
            let lftChar = p2.slice(0, lftIdx);
            let rgtChar = p2.slice(rgtIdx);
            let chars = p2.slice(lftIdx, rgtIdx);
            if (intraIns2 == 1 && lftChar.length == 1 && lftChar != chars[0])
              lftChar += "(?!" + lftChar + ")";
            let numChars = chars.length;
            let variants = [p2];
            if (intraSub2) {
              for (let i = 0; i < numChars; i++)
                variants.push(lftChar + chars.slice(0, i) + intraChars + chars.slice(i + 1) + rgtChar);
            }
            if (intraTrn2) {
              for (let i = 0; i < numChars - 1; i++) {
                if (chars[i] != chars[i + 1])
                  variants.push(lftChar + chars.slice(0, i) + chars[i + 1] + chars[i] + chars.slice(i + 2) + rgtChar);
              }
            }
            if (intraDel2) {
              for (let i = 0; i < numChars; i++)
                variants.push(lftChar + chars.slice(0, i + 1) + "?" + chars.slice(i + 1) + rgtChar);
            }
            if (intraIns2) {
              let intraInsTpl = lazyRepeat(intraChars, 1);
              for (let i = 0; i < numChars; i++)
                variants.push(lftChar + chars.slice(0, i) + intraInsTpl + chars.slice(i) + rgtChar);
            }
            reTpl2 += "(?:" + variants.join("|") + ")" + contrs[pi];
          }
        }
        return reTpl2;
      });
    } else {
      let intraInsTpl = lazyRepeat(intraChars, intraIns);
      if (capt == 2 && intraIns > 0) {
        intraInsTpl = ")(" + intraInsTpl + ")(";
      }
      reTpl = parts.map((p, pi) => p[0] === '"' ? escapeRegExp(p.slice(1, -1)) : p.split("").map((c, i, chars) => {
        if (intraIns == 1 && i == 0 && chars.length > 1 && c != chars[i + 1])
          c += "(?!" + c + ")";
        return c;
      }).join(intraInsTpl) + contrs[pi]);
    }
    let preTpl = interLft == 2 ? mode2Tpl : "";
    let sufTpl = interRgt == 2 ? mode2Tpl : "";
    let interCharsTpl = sufTpl + lazyRepeat(opts.interChars, opts.interIns) + preTpl;
    if (capt > 0) {
      if (interOR) {
        reTpl = preTpl + "(" + reTpl.join(")" + sufTpl + "|" + preTpl + "(") + ")" + sufTpl;
      } else {
        reTpl = "(" + reTpl.join(")(" + interCharsTpl + ")(") + ")";
        reTpl = "(.??" + preTpl + ")" + reTpl + "(" + sufTpl + ".*)";
      }
    } else {
      reTpl = reTpl.join(interCharsTpl);
      reTpl = preTpl + reTpl + sufTpl;
    }
    return [new RegExp(reTpl, "i" + uFlag), parts, contrs];
  };
  const filter = (haystack, needle, idxs) => {
    let [query] = prepQuery(needle);
    if (query == null)
      return null;
    let out = [];
    if (idxs != null) {
      for (let i = 0; i < idxs.length; i++) {
        let idx = idxs[i];
        query.test(haystack[idx]) && out.push(idx);
      }
    } else {
      for (let i = 0; i < haystack.length; i++)
        query.test(haystack[i]) && out.push(i);
    }
    return out;
  };
  let withIntraBound = !!_intraBound;
  let interBound = new RegExp(_interBound, uFlag);
  let intraBound = new RegExp(_intraBound, uFlag);
  const info = (idxs, haystack, needle) => {
    let [query, parts, contrs] = prepQuery(needle, 1);
    let partsCased = split(needle, true);
    let [queryR] = prepQuery(needle, 2);
    let partsLen = parts.length;
    let _terms = Array(partsLen);
    let _termsCased = Array(partsLen);
    for (let j = 0; j < partsLen; j++) {
      let part = parts[j];
      let partCased = partsCased[j];
      let term = part[0] == '"' ? part.slice(1, -1) : part + contrs[j];
      let termCased = partCased[0] == '"' ? partCased.slice(1, -1) : partCased + contrs[j];
      _terms[j] = term;
      _termsCased[j] = termCased;
    }
    let len = idxs.length;
    let field = Array(len).fill(0);
    let info2 = {
      // idx in haystack
      idx: Array(len),
      // start of match
      start: field.slice(),
      // length of match
      //	span: field.slice(),
      // contiguous chars matched
      chars: field.slice(),
      // case matched in term (via term.includes(match))
      cases: field.slice(),
      // contiguous (no fuzz) and bounded terms (intra=0, lft2/1, rgt2/1)
      // excludes terms that are contiguous but have < 2 bounds (substrings)
      terms: field.slice(),
      // cumulative length of unmatched chars (fuzz) within span
      interIns: field.slice(),
      // between terms
      intraIns: field.slice(),
      // within terms
      // interLft/interRgt counters
      interLft2: field.slice(),
      interRgt2: field.slice(),
      interLft1: field.slice(),
      interRgt1: field.slice(),
      ranges: Array(len)
    };
    let mayDiscard = interLft == 1 || interRgt == 1;
    let ii = 0;
    for (let i = 0; i < idxs.length; i++) {
      let mhstr = haystack[idxs[i]];
      let m = mhstr.match(query);
      let start = m.index + m[1].length;
      let idxAcc = start;
      let disc = false;
      let lft2 = 0;
      let lft1 = 0;
      let rgt2 = 0;
      let rgt1 = 0;
      let chars = 0;
      let terms = 0;
      let cases = 0;
      let inter = 0;
      let intra = 0;
      let refine = [];
      for (let j = 0, k = 2; j < partsLen; j++, k += 2) {
        let group = toLower(m[k]);
        let term = _terms[j];
        let termCased = _termsCased[j];
        let termLen = term.length;
        let groupLen = group.length;
        let fullMatch = group == term;
        if (m[k] == termCased)
          cases++;
        if (!fullMatch && m[k + 1].length >= termLen) {
          let idxOf = toLower(m[k + 1]).indexOf(term);
          if (idxOf > -1) {
            refine.push(idxAcc, groupLen, idxOf, termLen);
            idxAcc += refineMatch(m, k, idxOf, termLen);
            group = term;
            groupLen = termLen;
            fullMatch = true;
            if (j == 0)
              start = idxAcc;
          }
        }
        if (mayDiscard || fullMatch) {
          let lftCharIdx = idxAcc - 1;
          let rgtCharIdx = idxAcc + groupLen;
          let isPre = false;
          let isSuf = false;
          if (lftCharIdx == -1 || interBound.test(mhstr[lftCharIdx])) {
            fullMatch && lft2++;
            isPre = true;
          } else {
            if (interLft == 2) {
              disc = true;
              break;
            }
            if (withIntraBound && intraBound.test(mhstr[lftCharIdx] + mhstr[lftCharIdx + 1])) {
              fullMatch && lft1++;
              isPre = true;
            } else {
              if (interLft == 1) {
                let junk = m[k + 1];
                let junkIdx = idxAcc + groupLen;
                if (junk.length >= termLen) {
                  let idxOf = 0;
                  let found = false;
                  let re = new RegExp(term, "ig" + uFlag);
                  let m2;
                  while (m2 = re.exec(junk)) {
                    idxOf = m2.index;
                    let charIdx = junkIdx + idxOf;
                    let lftCharIdx2 = charIdx - 1;
                    if (lftCharIdx2 == -1 || interBound.test(mhstr[lftCharIdx2])) {
                      lft2++;
                      found = true;
                      break;
                    } else if (intraBound.test(mhstr[lftCharIdx2] + mhstr[charIdx])) {
                      lft1++;
                      found = true;
                      break;
                    }
                  }
                  if (found) {
                    isPre = true;
                    refine.push(idxAcc, groupLen, idxOf, termLen);
                    idxAcc += refineMatch(m, k, idxOf, termLen);
                    group = term;
                    groupLen = termLen;
                    fullMatch = true;
                    if (j == 0)
                      start = idxAcc;
                  }
                }
                if (!isPre) {
                  disc = true;
                  break;
                }
              }
            }
          }
          if (rgtCharIdx == mhstr.length || interBound.test(mhstr[rgtCharIdx])) {
            fullMatch && rgt2++;
            isSuf = true;
          } else {
            if (interRgt == 2) {
              disc = true;
              break;
            }
            if (withIntraBound && intraBound.test(mhstr[rgtCharIdx - 1] + mhstr[rgtCharIdx])) {
              fullMatch && rgt1++;
              isSuf = true;
            } else {
              if (interRgt == 1) {
                disc = true;
                break;
              }
            }
          }
          if (fullMatch) {
            chars += termLen;
            if (isPre && isSuf)
              terms++;
          }
        }
        if (groupLen > termLen)
          intra += groupLen - termLen;
        if (j > 0)
          inter += m[k - 1].length;
        if (!opts.intraFilt(term, group, idxAcc)) {
          disc = true;
          break;
        }
        if (j < partsLen - 1)
          idxAcc += groupLen + m[k + 1].length;
      }
      if (!disc) {
        info2.idx[ii] = idxs[i];
        info2.interLft2[ii] = lft2;
        info2.interLft1[ii] = lft1;
        info2.interRgt2[ii] = rgt2;
        info2.interRgt1[ii] = rgt1;
        info2.chars[ii] = chars;
        info2.terms[ii] = terms;
        info2.cases[ii] = cases;
        info2.interIns[ii] = inter;
        info2.intraIns[ii] = intra;
        info2.start[ii] = start;
        let m2 = mhstr.match(queryR);
        let idxAcc2 = m2.index + m2[1].length;
        let refLen = refine.length;
        let ri = refLen > 0 ? 0 : Infinity;
        let lastRi = refLen - 4;
        for (let i2 = 2; i2 < m2.length; ) {
          let len2 = m2[i2].length;
          if (ri <= lastRi && refine[ri] == idxAcc2) {
            let groupLen = refine[ri + 1];
            let idxOf = refine[ri + 2];
            let termLen = refine[ri + 3];
            let j = i2;
            let v = "";
            for (let _len = 0; _len < groupLen; j++) {
              v += m2[j];
              _len += m2[j].length;
            }
            m2.splice(i2, j - i2, v);
            idxAcc2 += refineMatch(m2, i2, idxOf, termLen);
            ri += 4;
          } else {
            idxAcc2 += len2;
            i2++;
          }
        }
        idxAcc2 = m2.index + m2[1].length;
        let ranges = info2.ranges[ii] = [];
        let from = idxAcc2;
        let to = idxAcc2;
        for (let i2 = 2; i2 < m2.length; i2++) {
          let len2 = m2[i2].length;
          idxAcc2 += len2;
          if (i2 % 2 == 0)
            to = idxAcc2;
          else if (len2 > 0) {
            ranges.push(from, to);
            from = to = idxAcc2;
          }
        }
        if (to > from)
          ranges.push(from, to);
        ii++;
      }
    }
    if (ii < idxs.length) {
      for (let k in info2)
        info2[k] = info2[k].slice(0, ii);
    }
    return info2;
  };
  const refineMatch = (m, k, idxInNext, termLen) => {
    let prepend = m[k] + m[k + 1].slice(0, idxInNext);
    m[k - 1] += prepend;
    m[k] = m[k + 1].slice(idxInNext, idxInNext + termLen);
    m[k + 1] = m[k + 1].slice(idxInNext + termLen);
    return prepend.length;
  };
  const OOO_TERMS_LIMIT = 5;
  const _search = (haystack, needle, outOfOrder, infoThresh = 1e3, preFiltered) => {
    outOfOrder = !outOfOrder ? 0 : outOfOrder === true ? OOO_TERMS_LIMIT : outOfOrder;
    let needles = null;
    let matches = null;
    let negs = [];
    needle = needle.replace(NEGS_RE, (m) => {
      let neg = m.trim().slice(1);
      neg = neg[0] === '"' ? escapeRegExp(neg.slice(1, -1)) : neg.replace(PUNCT_RE, "");
      if (neg != "")
        negs.push(neg);
      return "";
    });
    let terms = split(needle);
    let negsRe;
    if (negs.length > 0) {
      negsRe = new RegExp(negs.join("|"), "i" + uFlag);
      if (terms.length == 0) {
        let idxs = [];
        for (let i = 0; i < haystack.length; i++) {
          if (!negsRe.test(haystack[i]))
            idxs.push(i);
        }
        return [idxs, null, null];
      }
    } else {
      if (terms.length == 0)
        return [null, null, null];
    }
    if (outOfOrder > 0) {
      let terms2 = split(needle);
      if (terms2.length > 1) {
        let terms22 = terms2.slice().sort((a, b) => b.length - a.length);
        for (let ti = 0; ti < terms22.length; ti++) {
          if ((preFiltered == null ? void 0 : preFiltered.length) == 0)
            return [[], null, null];
          preFiltered = filter(haystack, terms22[ti], preFiltered);
        }
        if (terms2.length > outOfOrder)
          return [preFiltered, null, null];
        needles = permute(terms2).map((perm) => perm.join(" "));
        matches = [];
        let matchedIdxs = /* @__PURE__ */ new Set();
        for (let ni = 0; ni < needles.length; ni++) {
          if (matchedIdxs.size < preFiltered.length) {
            let preFiltered2 = preFiltered.filter((idx) => !matchedIdxs.has(idx));
            let matched = filter(haystack, needles[ni], preFiltered2);
            for (let j = 0; j < matched.length; j++)
              matchedIdxs.add(matched[j]);
            matches.push(matched);
          } else
            matches.push([]);
        }
      }
    }
    if (needles == null) {
      needles = [needle];
      matches = [(preFiltered == null ? void 0 : preFiltered.length) > 0 ? preFiltered : filter(haystack, needle)];
    }
    let retInfo = null;
    let retOrder = null;
    if (negs.length > 0)
      matches = matches.map((idxs) => idxs.filter((idx) => !negsRe.test(haystack[idx])));
    let matchCount = matches.reduce((acc, idxs) => acc + idxs.length, 0);
    if (matchCount <= infoThresh) {
      retInfo = {};
      retOrder = [];
      for (let ni = 0; ni < matches.length; ni++) {
        let idxs = matches[ni];
        if (idxs == null || idxs.length == 0)
          continue;
        let needle2 = needles[ni];
        let _info = info(idxs, haystack, needle2);
        let order = opts.sort(_info, haystack, needle2, compare);
        if (ni > 0) {
          for (let i = 0; i < order.length; i++)
            order[i] += retOrder.length;
        }
        for (let k in _info)
          retInfo[k] = (retInfo[k] ?? []).concat(_info[k]);
        retOrder = retOrder.concat(order);
      }
    }
    return [
      [].concat(...matches),
      retInfo,
      retOrder
    ];
  };
  return {
    search: (...args) => {
      let out = _search(...args);
      return out;
    },
    split,
    filter,
    info,
    sort: opts.sort
  };
}
const latinize = (() => {
  let accents = {
    A: "ÁÀÃÂÄĄĂÅ",
    a: "áàãâäąăå",
    E: "ÉÈÊËĖĚ",
    e: "éèêëęě",
    I: "ÍÌÎÏĮİ",
    i: "íìîïįı",
    O: "ÓÒÔÕÖ",
    o: "óòôõö",
    U: "ÚÙÛÜŪŲŮŰ",
    u: "úùûüūųůű",
    C: "ÇČĆ",
    c: "çčć",
    D: "Ď",
    d: "ď",
    G: "Ğ",
    g: "ğ",
    L: "Ł",
    l: "ł",
    N: "ÑŃŇ",
    n: "ñńň",
    S: "ŠŚȘŞ",
    s: "šśșş",
    T: "ŢȚŤ",
    t: "ţțť",
    Y: "Ý",
    y: "ý",
    Z: "ŻŹŽ",
    z: "żźž"
  };
  let accentsMap = {};
  let accentsTpl = "";
  for (let r in accents) {
    accents[r].split("").forEach((a) => {
      accentsTpl += a;
      accentsMap[a] = r;
    });
  }
  let accentsRe = new RegExp(`[${accentsTpl}]`, "g");
  let replacer = (m) => accentsMap[m];
  return (strings) => {
    if (typeof strings == "string")
      return strings.replace(accentsRe, replacer);
    let out = Array(strings.length);
    for (let i = 0; i < strings.length; i++)
      out[i] = strings[i].replace(accentsRe, replacer);
    return out;
  };
})();
function permute(arr) {
  arr = arr.slice();
  let length = arr.length, result = [arr.slice()], c = new Array(length).fill(0), i = 1, k, p;
  while (i < length) {
    if (c[i] < i) {
      k = i % 2 && c[i];
      p = arr[i];
      arr[i] = arr[k];
      arr[k] = p;
      ++c[i];
      i = 1;
      result.push(arr.slice());
    } else {
      c[i] = 0;
      ++i;
    }
  }
  return result;
}
const _mark = (part, matched) => matched ? `<mark>${part}</mark>` : part;
const _append = (acc, part) => acc + part;
function highlight(str, ranges, mark = _mark, accum = "", append = _append) {
  accum = append(accum, mark(str.substring(0, ranges[0]), false)) ?? accum;
  for (let i = 0; i < ranges.length; i += 2) {
    let fr = ranges[i];
    let to = ranges[i + 1];
    accum = append(accum, mark(str.substring(fr, to), true)) ?? accum;
    if (i < ranges.length - 3)
      accum = append(accum, mark(str.substring(ranges[i + 1], ranges[i + 2]), false)) ?? accum;
  }
  accum = append(accum, mark(str.substring(ranges[ranges.length - 1]), false)) ?? accum;
  return accum;
}
uFuzzy.latinize = latinize;
uFuzzy.permute = (arr) => {
  let idxs = permute([...Array(arr.length).keys()]).sort((a, b) => {
    for (let i = 0; i < a.length; i++) {
      if (a[i] != b[i])
        return a[i] - b[i];
    }
    return 0;
  });
  return idxs.map((pi) => pi.map((i) => arr[i]));
};
uFuzzy.highlight = highlight;
const uf = new uFuzzy({
  intraMode: 0,
  // MultiInsert mode - allows multiple insertions between chars
  intraIns: 3,
  // Max 3 inserted chars between term chars
  interIns: Infinity,
  // Allow any gap between search terms
  intraChars: "[a-z\\d-]"
  // Match alphanumeric + hyphens
});
function fuzzySearch(haystack, needle) {
  if (!(needle == null ? void 0 : needle.trim())) {
    return haystack;
  }
  const normalizedNeedle = needle.trim().toLowerCase();
  const [idxs, info, order] = uf.search(
    haystack,
    normalizedNeedle,
    1,
    1e3
  );
  if (!(idxs == null ? void 0 : idxs.length) || !(order == null ? void 0 : order.length)) {
    return [];
  }
  const results = order.map((i) => haystack[idxs[i]]);
  return results;
}
function useRestBase() {
  var _a2;
  const rest = ((_a2 = window.openicon_api) == null ? void 0 : _a2.root) || "/wp-json/";
  return rest.replace(/\/$/, "");
}
function useNonce() {
  var _a2;
  return ((_a2 = window.openicon_api) == null ? void 0 : _a2.nonce) || "";
}
function authFetch(url, nonce) {
  return fetch(url, {
    credentials: "include",
    headers: { "X-WP-Nonce": nonce }
  });
}
function useRecentIcons(provider, version, modalOpen) {
  const storageKey = `openicon_recent_${provider}@${version}`;
  const [recent, setRecent] = reactExports.useState([]);
  const loadRecent = reactExports.useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecent(parsed.slice(0, 8));
          return;
        }
      }
      setRecent([]);
    } catch {
      setRecent([]);
    }
  }, [storageKey]);
  reactExports.useEffect(() => {
    loadRecent();
  }, [loadRecent]);
  reactExports.useEffect(() => {
    if (modalOpen) {
      loadRecent();
    }
  }, [modalOpen, loadRecent]);
  const addRecent = reactExports.useCallback(
    (key) => {
      setRecent((prev) => {
        const next = [key, ...prev.filter((k) => k !== key)].slice(0, 8);
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
        }
        return next;
      });
    },
    [storageKey]
  );
  return { recent, addRecent };
}
function IconSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col aspect-square items-center justify-center gap-1 rounded-lg p-3 animate-pulse", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-6 h-6 bg-zinc-200 rounded" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-16 bg-zinc-200 rounded mt-1" })
  ] });
}
function getFieldContext(instanceId) {
  var _a2, _b2;
  const field = document.querySelector(
    `.openicon-field[data-openicon-instance-id="${instanceId}"]`
  );
  if (!field) {
    return {
      fieldGroupKey: "",
      flexibleLayout: null,
      flexibleLayoutInstanceIndex: null,
      flexibleContentFieldKey: null,
      repeaterKey: null,
      repeaterRowIndex: null
    };
  }
  let fieldGroupKey = field.dataset.openiconFieldGroupKey || "";
  const keyInput = field.querySelector("[data-openicon-key-out]");
  const inputName = (keyInput == null ? void 0 : keyInput.name) || "";
  if (!fieldGroupKey) {
    const form = field.closest("form");
    if (form) {
      const acfForm = form.querySelector("[data-key]");
      if (acfForm) {
        fieldGroupKey = acfForm.dataset.key || "";
      }
    }
    if (!fieldGroupKey && inputName) {
      const nameMatch = inputName.match(/acf\[([^\]]+)\]/);
      if (nameMatch && nameMatch[1]) {
        fieldGroupKey = nameMatch[1].split("][")[0] || "";
      }
    }
  }
  let flexibleLayout = null;
  let flexibleLayoutInstanceIndex = null;
  let flexibleContentFieldKey = null;
  const flexibleLayoutEl = field.closest("[data-layout]");
  if (flexibleLayoutEl) {
    flexibleLayout = flexibleLayoutEl.dataset.layout || null;
    if (flexibleLayoutEl && flexibleLayout) {
      const flexibleContentEl = flexibleLayoutEl.closest('[data-type="flexible_content"]');
      if (flexibleContentEl) {
        const allLayouts = flexibleContentEl.querySelectorAll(`[data-layout="${flexibleLayout}"]`);
        let instanceIndex = -1;
        for (let i = 0; i < allLayouts.length; i++) {
          if (allLayouts[i].contains(field) || allLayouts[i] === flexibleLayoutEl || flexibleLayoutEl.contains(allLayouts[i])) {
            instanceIndex = i;
            break;
          }
        }
        if (instanceIndex >= 0) {
          flexibleLayoutInstanceIndex = instanceIndex;
        }
      }
      if (flexibleLayoutInstanceIndex === null) {
        const layoutInstanceId = ((_a2 = flexibleLayoutEl == null ? void 0 : flexibleLayoutEl.dataset) == null ? void 0 : _a2.id) || (flexibleLayoutEl == null ? void 0 : flexibleLayoutEl.getAttribute("data-id")) || ((_b2 = flexibleLayoutEl == null ? void 0 : flexibleLayoutEl.closest("[data-id]")) == null ? void 0 : _b2.getAttribute("data-id"));
        if (layoutInstanceId) {
          const numericIndex = parseInt(layoutInstanceId, 10);
          flexibleLayoutInstanceIndex = !isNaN(numericIndex) && layoutInstanceId === numericIndex.toString() ? numericIndex : layoutInstanceId;
        }
      }
      if (flexibleLayoutInstanceIndex === null && inputName) {
        const escapedLayout = flexibleLayout.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const layoutMatch = inputName.match(new RegExp(`\\[([^\\]]+)\\]\\[${escapedLayout}\\]`));
        if (layoutMatch) {
          const instanceIdStr = layoutMatch[1];
          if (!instanceIdStr.startsWith("field_")) {
            const numericIndex = parseInt(instanceIdStr, 10);
            flexibleLayoutInstanceIndex = !isNaN(numericIndex) && instanceIdStr === numericIndex.toString() ? numericIndex : instanceIdStr;
          }
        }
      }
      if (typeof window !== "undefined" && window.__OPENICON_DEBUG__) {
        console.log("[OPENICON] Flexible extraction:", {
          inputName,
          flexibleLayout,
          flexibleLayoutInstanceIndex,
          flexibleContentFieldKey,
          allLayoutsCount: flexibleContentEl ? flexibleContentEl.querySelectorAll(`[data-layout="${flexibleLayout}"]`).length : 0
        });
      }
    }
    if (!flexibleContentFieldKey) {
      const flexibleContentEl = flexibleLayoutEl.closest('[data-type="flexible_content"]');
      if (flexibleContentEl) {
        flexibleContentFieldKey = flexibleContentEl.dataset.key || flexibleContentEl.dataset.name || null;
      }
    }
  }
  let repeaterKey = null;
  let repeaterRowIndex = null;
  const repeaterEl = field.closest('[data-type="repeater"]');
  if (repeaterEl) {
    repeaterKey = repeaterEl.dataset.key || repeaterEl.dataset.name || null;
    if (inputName) {
      if (flexibleLayout && flexibleLayoutInstanceIndex !== null) {
        const escapedLayout = flexibleLayout.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const layoutPattern = `\\]\\[${escapedLayout}\\]\\[([^\\]]+)\\]\\[([^\\]]+)\\]\\[([^\\]]+)\\]$`;
        const nestedRepeaterMatch = inputName.match(new RegExp(layoutPattern));
        if (nestedRepeaterMatch) {
          const potentialRepeaterKey = nestedRepeaterMatch[1];
          const rowIdStr = nestedRepeaterMatch[2];
          const numericRowIndex = parseInt(rowIdStr, 10);
          const potentialRowIndex = !isNaN(numericRowIndex) && rowIdStr === numericRowIndex.toString() ? numericRowIndex : rowIdStr;
          if (repeaterKey && potentialRepeaterKey === repeaterKey) {
            repeaterRowIndex = potentialRowIndex;
          } else if (!repeaterKey) {
            repeaterKey = potentialRepeaterKey;
            repeaterRowIndex = potentialRowIndex;
          }
        }
      } else {
        const repeaterMatch = inputName.match(/acf\[[^\]]+\]\[([^\]]+)\]\[([^\]]+)\]\[([^\]]+)\]/);
        if (repeaterMatch) {
          const extractedRepeaterKey = repeaterMatch[1];
          const rowIdStr = repeaterMatch[2];
          const numericRowIndex = parseInt(rowIdStr, 10);
          const extractedRowIndex = !isNaN(numericRowIndex) && rowIdStr === numericRowIndex.toString() ? numericRowIndex : rowIdStr;
          if (repeaterKey && extractedRepeaterKey === repeaterKey) {
            repeaterRowIndex = extractedRowIndex;
          } else if (!repeaterKey) {
            repeaterKey = extractedRepeaterKey;
            repeaterRowIndex = extractedRowIndex;
          }
        }
      }
    }
  }
  const context = {
    fieldGroupKey,
    flexibleLayout,
    flexibleLayoutInstanceIndex,
    flexibleContentFieldKey,
    repeaterKey,
    repeaterRowIndex
  };
  if (typeof window !== "undefined" && window.__OPENICON_DEBUG__) {
    console.log("[OPENICON] getFieldContext:", {
      instanceId,
      inputName,
      inputNameFull: inputName,
      // Show full name for debugging
      flexibleLayoutEl: flexibleLayoutEl ? {
        layout: flexibleLayoutEl.dataset.layout,
        html: flexibleLayoutEl.outerHTML.substring(0, 200)
      } : null,
      context
    });
  }
  return context;
}
function getLastColorStorageKey(fieldGroupKey, flexibleContentFieldKey, flexibleLayout, flexibleLayoutInstanceIndex, repeaterKey, repeaterRowIndex) {
  const parts = ["openicon_last_color", fieldGroupKey];
  if (flexibleContentFieldKey && flexibleLayout) {
    parts.push("flex", flexibleContentFieldKey, flexibleLayout);
    if (flexibleLayoutInstanceIndex !== null) {
      parts.push("i", String(flexibleLayoutInstanceIndex));
    }
  }
  if (repeaterKey) {
    parts.push("rep", repeaterKey);
    if (repeaterRowIndex !== null) {
      parts.push("r", String(repeaterRowIndex));
    }
  }
  const key = parts.join("_");
  if (typeof window !== "undefined" && window.__OPENICON_DEBUG__) {
    console.log("[OPENICON] getLastColorStorageKey:", {
      fieldGroupKey,
      flexibleContentFieldKey,
      flexibleLayout,
      flexibleLayoutInstanceIndex,
      repeaterKey,
      repeaterRowIndex,
      generatedKey: key
    });
  }
  return key;
}
function getLastColor(fieldGroupKey, flexibleContentFieldKey, flexibleLayout, flexibleLayoutInstanceIndex, repeaterKey, repeaterRowIndex) {
  var _a2;
  try {
    const key = getLastColorStorageKey(
      fieldGroupKey,
      flexibleContentFieldKey,
      flexibleLayout,
      flexibleLayoutInstanceIndex,
      repeaterKey,
      repeaterRowIndex
    );
    const stored = localStorage.getItem(key);
    if (typeof window !== "undefined" && window.__OPENICON_DEBUG__) {
      console.log("[OPENICON] getLastColor:", {
        lookupKey: key,
        found: !!stored,
        storedValue: stored ? JSON.parse(stored) : null
      });
    }
    if (stored) {
      const storedColor = JSON.parse(stored);
      const palette = ((_a2 = window.__OPENICON_PALETTE__) == null ? void 0 : _a2.items) || [];
      const currentPaletteItem = palette.find((p) => p.token === storedColor.token);
      if (currentPaletteItem) {
        return {
          token: storedColor.token,
          hex: currentPaletteItem.hex
          // Use current palette color, not stored hex
        };
      }
      return storedColor;
    }
  } catch (e) {
    if (typeof window !== "undefined" && window.__OPENICON_DEBUG__) {
      console.error("[OPENICON] getLastColor error:", e);
    }
  }
  return null;
}
function saveLastColor(fieldGroupKey, flexibleContentFieldKey, flexibleLayout, flexibleLayoutInstanceIndex, repeaterKey, repeaterRowIndex, color) {
  try {
    const key = getLastColorStorageKey(
      fieldGroupKey,
      flexibleContentFieldKey,
      flexibleLayout,
      flexibleLayoutInstanceIndex,
      repeaterKey,
      repeaterRowIndex
    );
    if (typeof window !== "undefined" && window.__OPENICON_DEBUG__) {
      console.log("[OPENICON] saveLastColor:", {
        storageKey: key,
        color
      });
    }
    localStorage.setItem(key, JSON.stringify(color));
  } catch (e) {
    if (typeof window !== "undefined" && window.__OPENICON_DEBUG__) {
      console.error("[OPENICON] saveLastColor error:", e);
    }
  }
}
function applyColorToSvg(svg, color) {
  if (!svg || !color) return svg;
  const hasStroke = /\bstroke(?!-)\s*=/i.test(svg);
  const hasFill = /\bfill(?!-)\s*=/i.test(svg) && !/fill\s*=\s*["']none["']/i.test(svg);
  let result = svg;
  if (hasStroke) {
    result = result.replace(/\bstroke(?!-)\s*=\s*["']?[^"'\s>]*["']?/gi, `stroke="${color}"`);
  }
  if (hasFill) {
    result = result.replace(/\bfill(?!-)\s*=\s*["']?[^"'\s>]*["']?/gi, `fill="${color}"`);
  }
  return result;
}
function normalizeSvgToBase(svg) {
  if (!svg) return svg;
  const hasStroke = /\bstroke(?!-)\s*=/i.test(svg);
  const hasFill = /\bfill(?!-)\s*=/i.test(svg) && !/fill\s*=\s*["']none["']/i.test(svg);
  let result = svg;
  if (hasStroke) {
    result = result.replace(/\bstroke(?!-)\s*=\s*["']?[^"'\s>]*["']?/gi, 'stroke="currentColor"');
  }
  if (hasFill) {
    result = result.replace(/\bfill(?!-)\s*=\s*["']?[^"'\s>]*["']?/gi, 'fill="currentColor"');
  }
  return result;
}
function IconPicker({
  provider,
  version,
  onSelect,
  instanceId,
  useLastColor = false,
  fieldKey = "",
  fieldGroupKey = "",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  disableColorPicker = false
}) {
  var _a2, _b2, _c2;
  const restBase = useRestBase();
  const nonce = useNonce();
  const [internalOpen, setInternalOpen] = reactExports.useState(false);
  const isControlled = controlledOpen !== void 0;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange || (() => {
  }) : setInternalOpen;
  const [query, setQuery] = reactExports.useState("");
  const [debouncedQuery, setDebouncedQuery] = reactExports.useState("");
  const palette = ((_a2 = window.__OPENICON_PALETTE__) == null ? void 0 : _a2.items) || [];
  const defaultToken = ((_b2 = window.__OPENICON_PALETTE__) == null ? void 0 : _b2.default) || "A";
  const defaultHex = ((_c2 = palette.find((i) => i.token === defaultToken)) == null ? void 0 : _c2.hex) || "#111111";
  const libraryInfo = window.__OPENICON_LIBRARY__ || { url: "https://heroicons.com", name: "Heroicons" };
  const getInitialColor = () => {
    if (!instanceId) {
      return { color: defaultHex, token: defaultToken };
    }
    const field = document.querySelector(
      `.openicon-field[data-openicon-instance-id="${instanceId}"]`
    );
    if (field) {
      const colorTokenInput = field.querySelector(
        "[data-openicon-color-token-out]"
      );
      if (colorTokenInput == null ? void 0 : colorTokenInput.value) {
        const token = colorTokenInput.value;
        const matchingPalette = palette.find((p) => p.token === token);
        if (matchingPalette) {
          return { color: matchingPalette.hex, token };
        }
      }
    }
    if (useLastColor) {
      const context = getFieldContext(instanceId);
      const lastColor = getLastColor(
        context.fieldGroupKey || fieldGroupKey,
        context.flexibleContentFieldKey,
        context.flexibleLayout,
        context.flexibleLayoutInstanceIndex,
        context.repeaterKey,
        context.repeaterRowIndex
      );
      if (lastColor) {
        return { color: lastColor.hex, token: lastColor.token };
      }
    }
    return { color: defaultHex, token: defaultToken };
  };
  const [currentColor, setCurrentColor] = reactExports.useState(() => getInitialColor().color);
  const [currentToken, setCurrentToken] = reactExports.useState(() => getInitialColor().token);
  const [all, setAll] = reactExports.useState([]);
  const [cache, setCache] = reactExports.useState({});
  const [activeIdx, setActiveIdx] = reactExports.useState(0);
  const [manifestLoading, setManifestLoading] = reactExports.useState(true);
  const inputRef = reactExports.useRef(null);
  const gridRef = reactExports.useRef(null);
  const [visibleRange, setVisibleRange] = reactExports.useState({ start: 0, end: 50 });
  const { recent, addRecent } = useRecentIcons(provider, version, open);
  const [currentIconKey, setCurrentIconKey] = reactExports.useState(null);
  const filterStartTimeRef = reactExports.useRef(null);
  const skeletonRemovalTimesRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const modalOpenTimeRef = reactExports.useRef(null);
  reactExports.useRef(/* @__PURE__ */ new Set());
  const activeIdxFromKeyboardRef = reactExports.useRef(false);
  reactExports.useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== debouncedQuery) {
        filterStartTimeRef.current = performance.now();
      }
      setDebouncedQuery(query);
      setActiveIdx(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, debouncedQuery]);
  const colorInitializedRef = reactExports.useRef(false);
  reactExports.useEffect(() => {
    var _a3;
    if (open && instanceId) {
      const field = document.querySelector(
        `.openicon-field[data-openicon-instance-id="${instanceId}"]`
      );
      if (field) {
        const keyInput = field.querySelector(
          "[data-openicon-key-out]"
        );
        const currentKey = ((_a3 = keyInput == null ? void 0 : keyInput.value) == null ? void 0 : _a3.trim()) || null;
        setCurrentIconKey(currentKey);
        if (currentKey && !cache[currentKey]) {
          const svgInput = field.querySelector(
            "[data-openicon-svg-out]"
          );
          if (svgInput == null ? void 0 : svgInput.value) {
            const baseSvg = normalizeSvgToBase(svgInput.value);
            setCache((prev) => ({ ...prev, [currentKey]: baseSvg }));
          }
        }
        const colorTokenInput = field.querySelector(
          "[data-openicon-color-token-out]"
        );
        if (colorTokenInput == null ? void 0 : colorTokenInput.value) {
          if (!colorInitializedRef.current) {
            const token = colorTokenInput.value;
            const matchingPalette = palette.find((p) => p.token === token);
            if (matchingPalette) {
              setCurrentToken(token);
              setCurrentColor(matchingPalette.hex);
              colorInitializedRef.current = true;
            }
          }
        } else if (useLastColor && !colorInitializedRef.current) {
          const context = getFieldContext(instanceId);
          const lastColor = getLastColor(
            context.fieldGroupKey || fieldGroupKey,
            context.flexibleContentFieldKey,
            context.flexibleLayout,
            context.flexibleLayoutInstanceIndex,
            context.repeaterKey,
            context.repeaterRowIndex
          );
          if (lastColor) {
            setCurrentToken(lastColor.token);
            setCurrentColor(lastColor.hex);
            colorInitializedRef.current = true;
          }
        }
      }
    } else {
      setCurrentIconKey(null);
      colorInitializedRef.current = false;
    }
  }, [open, instanceId, palette, useLastColor, fieldGroupKey, cache]);
  reactExports.useEffect(() => {
    if (open && currentIconKey && !cache[currentIconKey] && restBase) {
      const url = `${restBase}/openicon/v1/icon?provider=${encodeURIComponent(
        provider
      )}&version=${encodeURIComponent(version)}&key=${encodeURIComponent(currentIconKey)}`;
      authFetch(url, nonce).then((r) => {
        if (!r.ok) {
          return null;
        }
        return r.text();
      }).then((svg) => {
        if (!svg) {
          return;
        }
        const baseSvg = normalizeSvgToBase(svg);
        setCache((prev) => ({ ...prev, [currentIconKey]: baseSvg }));
      }).catch(() => {
      });
    }
  }, [open, currentIconKey, cache, provider, version, restBase]);
  reactExports.useEffect(() => {
    if (open) {
      modalOpenTimeRef.current = performance.now();
    } else {
      setQuery("");
      setDebouncedQuery("");
      setActiveIdx(0);
      if (modalOpenTimeRef.current) {
        modalOpenTimeRef.current = null;
      }
    }
  }, [open]);
  reactExports.useEffect(() => {
    try {
      const key = `openicon_cache_${provider}@${version}`;
      const raw = sessionStorage.getItem(key);
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj && typeof obj === "object") setCache(obj);
      }
    } catch {
    }
  }, [provider, version]);
  reactExports.useEffect(() => {
    const id = setTimeout(() => {
      try {
        const key = `openicon_cache_${provider}@${version}`;
        sessionStorage.setItem(key, JSON.stringify(cache));
      } catch {
      }
    }, 250);
    return () => clearTimeout(id);
  }, [cache, provider, version]);
  reactExports.useEffect(() => {
    let mounted = true;
    setManifestLoading(true);
    async function load() {
      const url = `${restBase}/openicon/v1/manifest?provider=${encodeURIComponent(
        provider
      )}&version=${encodeURIComponent(version)}`;
      const res = await authFetch(url, nonce);
      if (!res.ok) {
        if (mounted) setManifestLoading(false);
        return;
      }
      const data = await res.json();
      if (mounted) {
        const icons = data.icons || [];
        const uniqueIcons = Array.from(new Set(icons));
        setAll(uniqueIcons);
        setManifestLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [provider, version, restBase]);
  reactExports.useEffect(() => {
    if (!open || all.length === 0) return;
    const keysToEagerLoad = all.slice(0, 24).filter((k) => !cache[k]);
    if (keysToEagerLoad.length === 0) return;
    const url = `${restBase}/openicon/v1/bundle?provider=${encodeURIComponent(
      provider
    )}&version=${encodeURIComponent(version)}&keys=${keysToEagerLoad.join(",")}`;
    authFetch(url, nonce).then((r) => {
      if (!r.ok) {
        return { items: [] };
      }
      return r.json();
    }).then((data) => {
      const next = {};
      for (const it of data.items || []) next[it.key] = it.svg;
      setCache((prev) => ({ ...next, ...prev }));
    }).catch(() => {
    });
  }, [open, all, cache, provider, version, restBase]);
  reactExports.useEffect(() => {
    if (!open || recent.length === 0) return;
    const missing = recent.filter((k) => !cache[k]);
    if (missing.length === 0) return;
    const url = `${restBase}/openicon/v1/bundle?provider=${encodeURIComponent(
      provider
    )}&version=${encodeURIComponent(version)}&keys=${missing.join(",")}`;
    authFetch(url, nonce).then((r) => {
      if (!r.ok) {
        return { items: [] };
      }
      return r.json();
    }).then((data) => {
      const next = {};
      for (const it of data.items || []) {
        next[it.key] = it.svg;
      }
      setCache((prev) => ({ ...next, ...prev }));
    }).catch(() => {
    });
  }, [open, recent, cache, provider, version, restBase]);
  reactExports.useEffect(() => {
    function onPrewarm() {
      if (all.length === 0) return;
      const keys = all.slice(0, 24).filter((k) => !cache[k]);
      if (!keys.length) return;
      const url = `${restBase}/openicon/v1/bundle?provider=${encodeURIComponent(
        provider
      )}&version=${encodeURIComponent(version)}&keys=${keys.join(",")}`;
      authFetch(url, nonce).then((r) => {
        if (!r.ok) {
          return { items: [] };
        }
        return r.json();
      }).then((data) => {
        const next = {};
        for (const it of data.items || []) next[it.key] = it.svg;
        if (Object.keys(next).length)
          setCache((prev) => ({ ...next, ...prev }));
      }).catch(() => {
      });
    }
    window.addEventListener("openicon-prewarm", onPrewarm);
    return () => window.removeEventListener("openicon-prewarm", onPrewarm);
  }, [provider, version, restBase, all, cache]);
  const list = reactExports.useMemo(() => {
    const filtered = fuzzySearch(all || [], debouncedQuery);
    const uniqueFiltered = Array.from(new Set(filtered));
    if (filterStartTimeRef.current) {
      filterStartTimeRef.current = null;
    }
    return uniqueFiltered;
  }, [all, debouncedQuery]);
  const recentInList = reactExports.useMemo(() => {
    if (debouncedQuery) return [];
    const allSet = new Set(all);
    return recent.filter((key) => allSet.has(key));
  }, [recent, all, debouncedQuery]);
  const mainList = reactExports.useMemo(() => {
    if (debouncedQuery) return list;
    const recentSet = new Set(recent);
    const filtered = list.filter((key) => !recentSet.has(key));
    return filtered;
  }, [list, recent, debouncedQuery]);
  reactExports.useEffect(() => {
    if (!open || !gridRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = parseInt(
              entry.target.getAttribute("data-index") || "0"
            );
            setVisibleRange((prev) => ({
              start: Math.min(prev.start, idx),
              end: Math.max(prev.end, idx + 20)
              // Load 20 items ahead
            }));
          }
        });
      },
      {
        root: gridRef.current,
        rootMargin: "200px",
        // Start loading before item is visible
        threshold: 0
      }
    );
    const items = gridRef.current.querySelectorAll("[data-index]");
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [open, mainList, recentInList]);
  reactExports.useEffect(() => {
    if (!open || list.length === 0) return;
    const fetchStartTime = performance.now();
    const keysToFetch = debouncedQuery ? mainList.slice(0, 48).filter((k) => !cache[k]) : [
      ...recentInList.filter((k) => !cache[k]),
      ...mainList.slice(visibleRange.start, visibleRange.end).filter((k) => !cache[k])
    ];
    if (keysToFetch.length === 0) return;
    const visibleKeys = debouncedQuery ? mainList.slice(0, 48) : [
      ...recentInList.slice(0, 8),
      ...mainList.slice(
        visibleRange.start,
        Math.min(visibleRange.end, visibleRange.start + 40)
      )
    ];
    visibleKeys.forEach((key) => {
      if (!cache[key] && !skeletonRemovalTimesRef.current.has(key)) {
        skeletonRemovalTimesRef.current.set(key, fetchStartTime);
      }
    });
    const chunkSize = 200;
    const chunks = [];
    for (let i = 0; i < keysToFetch.length; i += chunkSize) {
      chunks.push(keysToFetch.slice(i, i + chunkSize));
    }
    const fetchPromises = chunks.map((chunk) => {
      const url = `${restBase}/openicon/v1/bundle?provider=${encodeURIComponent(
        provider
      )}&version=${encodeURIComponent(version)}&keys=${chunk.join(",")}`;
      return authFetch(url, nonce).then((r) => {
        if (!r.ok) {
          return { items: [] };
        }
        return r.json();
      }).then((data) => {
        const next = {};
        for (const it of data.items || []) {
          next[it.key] = it.svg;
        }
        return next;
      }).catch(() => {
        return {};
      });
    });
    Promise.all(fetchPromises).then((results) => {
      performance.now();
      const merged = {};
      for (const result of results) {
        Object.assign(merged, result);
      }
      if (Object.keys(merged).length > 0) {
        const visibleFetched = visibleKeys.filter((key) => merged[key]);
        if (visibleFetched.length > 0) {
          const removalTimes = [];
          visibleFetched.forEach((key) => {
            const startTime = skeletonRemovalTimesRef.current.get(key);
            if (startTime) {
              skeletonRemovalTimesRef.current.delete(key);
              removalTimes.push(performance.now() - startTime);
            }
          });
        }
        setCache((prev) => ({ ...prev, ...merged }));
        if (debouncedQuery && mainList.length > 48) {
          const remaining = mainList.slice(48).filter((k) => !cache[k] && !merged[k]).slice(0, 500);
          if (remaining.length > 0) {
            setTimeout(() => {
              performance.now();
              const bgChunks = [];
              for (let i = 0; i < remaining.length; i += 200) {
                bgChunks.push(remaining.slice(i, i + 200));
              }
              Promise.all(
                bgChunks.map((chunk) => {
                  const url = `${restBase}/openicon/v1/bundle?provider=${encodeURIComponent(
                    provider
                  )}&version=${encodeURIComponent(version)}&keys=${chunk.join(
                    ","
                  )}`;
                  return authFetch(url, nonce).then((r) => {
                    if (!r.ok) {
                      return { items: [] };
                    }
                    return r.json();
                  }).then((data) => {
                    const next = {};
                    for (const it of data.items || []) {
                      next[it.key] = it.svg;
                    }
                    return next;
                  }).catch(() => {
                    return {};
                  });
                })
              ).then((bgResults) => {
                const bgMerged = {};
                for (const result of bgResults) {
                  Object.assign(bgMerged, result);
                }
                if (Object.keys(bgMerged).length > 0) {
                  setCache((prev) => ({ ...prev, ...bgMerged }));
                }
              });
            }, 200);
          }
        }
      }
    });
  }, [
    open,
    list,
    cache,
    provider,
    version,
    restBase,
    visibleRange,
    recentInList,
    mainList,
    debouncedQuery
  ]);
  reactExports.useEffect(() => {
    if (!open) return;
    setActiveIdx(0);
    const onKey = (e) => {
      if (!open) return;
      const totalItems = recentInList.length + mainList.length;
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIdxFromKeyboardRef.current = true;
        setActiveIdx((i) => Math.min(i + 1, Math.max(0, totalItems - 1)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIdxFromKeyboardRef.current = true;
        setActiveIdx((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const flatList2 = [...recentInList, ...mainList];
        const key = flatList2[activeIdx];
        if (key) pick(key);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, mainList, recentInList, activeIdx]);
  reactExports.useEffect(() => {
    var _a3;
    if (!open || activeIdx < 0) return;
    if (!activeIdxFromKeyboardRef.current) {
      return;
    }
    activeIdxFromKeyboardRef.current = false;
    const flatList2 = [...recentInList, ...mainList];
    const total = flatList2.length;
    if (activeIdx >= total) return;
    const item = (_a3 = gridRef.current) == null ? void 0 : _a3.querySelector(
      `[data-index="${activeIdx}"]`
    );
    if (item) {
      item.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeIdx, open, mainList, recentInList]);
  reactExports.useEffect(() => {
    if (open) setTimeout(() => {
      var _a3;
      return (_a3 = inputRef.current) == null ? void 0 : _a3.focus();
    }, 0);
  }, [open]);
  async function ensureSvg(key) {
    if (cache[key]) return cache[key];
    const url = `${restBase}/openicon/v1/icon?provider=${encodeURIComponent(
      provider
    )}&version=${encodeURIComponent(version)}&key=${encodeURIComponent(key)}`;
    const res = await authFetch(url, nonce);
    let svg = await res.text();
    svg = applyColorToSvg(svg, currentColor);
    setCache((prev) => ({ ...prev, [key]: svg }));
    return svg;
  }
  async function pick(key) {
    const cachedSvg = cache[key];
    addRecent(key);
    const color = { token: currentToken, hex: currentColor };
    reactDomExports.flushSync(() => {
      setOpen(false);
    });
    onSelect({ key, svg: cachedSvg, color });
    if (!cachedSvg) {
      ensureSvg(key).then((svg) => {
        onSelect({ key, svg, color });
      }).catch(() => {
      });
    }
    if (useLastColor && instanceId) {
      const context = getFieldContext(instanceId);
      saveLastColor(
        context.fieldGroupKey || fieldGroupKey,
        context.flexibleContentFieldKey,
        context.flexibleLayout,
        context.flexibleLayoutInstanceIndex,
        context.repeaterKey,
        context.repeaterRowIndex,
        color
      );
    }
  }
  async function applyColorToCurrentIcon() {
    if (!currentIconKey) return;
    const svg = await ensureSvg(currentIconKey);
    const color = { token: currentToken, hex: currentColor };
    onSelect({ key: currentIconKey, svg, color });
    if (useLastColor && instanceId) {
      const context = getFieldContext(instanceId);
      saveLastColor(
        context.fieldGroupKey || fieldGroupKey,
        context.flexibleContentFieldKey,
        context.flexibleLayout,
        context.flexibleLayoutInstanceIndex,
        context.repeaterKey,
        context.repeaterRowIndex,
        color
      );
    }
    setOpen(false);
  }
  reactExports.useEffect(() => {
    if (isControlled) return;
    const handler = (e) => {
      var _a3;
      const customEvent = e;
      const eventInstanceId = (_a3 = customEvent.detail) == null ? void 0 : _a3.instanceId;
      const shouldOpen = !instanceId || eventInstanceId === instanceId;
      if (shouldOpen) {
        if (instanceId) {
          const field = document.querySelector(
            `.openicon-field[data-openicon-instance-id="${instanceId}"]`
          );
          if (field) {
            const colorTokenInput = field.querySelector(
              "[data-openicon-color-token-out]"
            );
            if (colorTokenInput == null ? void 0 : colorTokenInput.value) {
              const token = colorTokenInput.value;
              const matchingPalette = palette.find((p) => p.token === token);
              if (matchingPalette) {
                setCurrentToken(token);
                setCurrentColor(matchingPalette.hex);
              }
            } else if (useLastColor) {
              const context = getFieldContext(instanceId);
              const lastColor = getLastColor(
                context.fieldGroupKey || fieldGroupKey,
                context.flexibleContentFieldKey,
                context.flexibleLayout,
                context.flexibleLayoutInstanceIndex,
                context.repeaterKey,
                context.repeaterRowIndex
              );
              if (lastColor) {
                setCurrentToken(lastColor.token);
                setCurrentColor(lastColor.hex);
              }
            }
          }
        }
        setOpen(true);
      }
    };
    window.addEventListener("openicon-open-modal", handler);
    return () => window.removeEventListener("openicon-open-modal", handler);
  }, [instanceId, useLastColor, fieldGroupKey, palette, isControlled]);
  function isLight(hex) {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16) / 255;
    const g = parseInt(h.substring(2, 4), 16) / 255;
    const b = parseInt(h.substring(4, 6), 16) / 255;
    const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return lum > 0.92;
  }
  const flatList = [...recentInList, ...mainList];
  const totalCount = all.length;
  const showingCount = flatList.length;
  const hasMore = showingCount < totalCount;
  const renderIconButton = (key, idx, isRecent = false) => {
    const svgRaw = cache[key];
    const svgColored = svgRaw ? applyColorToSvg(svgRaw, currentColor) : "";
    const isActive = idx === activeIdx;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        "data-index": idx,
        "aria-label": `Select icon: ${key}`,
        type: "button",
        className: `group flex flex-col aspect-square items-center border rounded-lg p-3 transition-all duration-200 hover:bg-accent hover:border-primary/30 hover:scale-[1.02] hover:shadow-sm cursor-pointer ${isActive ? "ring-2 ring-primary ring-offset-1 bg-primary/5 border-primary/50 shadow-sm" : "border-zinc-200"} ${isLight(currentColor) ? "bg-zinc-600 text-white" : ""}`,
        onMouseEnter: () => setActiveIdx(idx),
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          pick(key);
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex items-center justify-center", children: svgColored ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "w-7 h-7 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full flex-shrink-0",
              dangerouslySetInnerHTML: { __html: svgColored }
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(IconSkeleton, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "text-xs text-center leading-tight px-1 truncate w-full",
              title: key,
              children: key
            }
          )
        ]
      },
      `${isRecent ? "recent-" : "main-"}${key}-${idx}`
    );
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DialogContent,
    {
      open,
      onOpenChange: setOpen,
      className: "max-w-[900px] lg:max-w-[1000px] xl:max-w-[1200px]",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Select Icon" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => setOpen(false),
              className: "rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer",
              "aria-label": "Close dialog",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "svg",
                {
                  width: "20",
                  height: "20",
                  viewBox: "0 0 20 20",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M15 5L5 15M5 5l10 10" })
                }
              )
            }
          )
        ] }) }),
        currentIconKey && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 px-2 py-3 bg-zinc-50 border border-zinc-200 rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0", children: cache[currentIconKey] ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "w-10 h-10 flex items-center justify-center border border-zinc-300 rounded bg-white [&>svg]:w-6 [&>svg]:h-6",
              dangerouslySetInnerHTML: {
                __html: cache[currentIconKey].replace(
                  /stroke="[^"]*"/g,
                  `stroke="${currentColor}"`
                )
              }
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 flex items-center justify-center border border-zinc-300 rounded bg-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-6 h-6 bg-zinc-200 rounded animate-pulse" }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-medium text-zinc-900 truncate", children: [
              "Current Icon: ",
              currentIconKey
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-zinc-500", children: cache[currentIconKey] ? "Preview with selected color" : "Loading icon..." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: applyColorToCurrentIcon,
              disabled: !cache[currentIconKey],
              className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600",
              children: "Apply & Close"
            }
          )
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mb-4 px-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  ref: inputRef,
                  placeholder: "Search icons…",
                  value: query,
                  onChange: (e) => setQuery(e.target.value),
                  className: "pr-10",
                  name: "icon-search"
                }
              ),
              query && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    var _a3;
                    setQuery("");
                    (_a3 = inputRef.current) == null ? void 0 : _a3.focus();
                  },
                  className: "absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors p-1",
                  "aria-label": "Clear search",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "svg",
                    {
                      width: "16",
                      height: "16",
                      viewBox: "0 0 16 16",
                      fill: "none",
                      stroke: "currentColor",
                      strokeWidth: "2",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 4l-8 8M4 4l8 8" })
                    }
                  )
                }
              )
            ] }),
            !disableColorPicker && /* @__PURE__ */ jsxRuntimeExports.jsx(
              SelectMenu,
              {
                className: "w-[180px] shrink-0",
                items: (palette.length ? palette : [{ token: "A", label: "Primary", hex: currentColor }]).map((p) => ({
                  value: p.token,
                  label: p.label || p.token,
                  hex: p.hex
                })),
                value: currentToken,
                onChange: (val) => {
                  var _a3;
                  setCurrentToken(val);
                  const hex = ((_a3 = palette.find((p) => p.token === val)) == null ? void 0 : _a3.hex) || currentColor;
                  setCurrentColor(hex);
                }
              }
            )
          ] }),
          (query || list.length > 0) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground px-1 mb-2", children: debouncedQuery ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            "Showing ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: showingCount }),
            hasMore && ` of ${totalCount}`,
            " icon",
            showingCount !== 1 ? "s" : "",
            hasMore && ` (showing first ${showingCount})`
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: totalCount }),
            " icon",
            totalCount !== 1 ? "s" : "",
            " ",
            "available",
            recentInList.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              " ",
              "• ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: recentInList.length }),
              " recent"
            ] })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              ref: gridRef,
              className: "max-h-[500px] overflow-auto min-h-[400px]",
              children: [
                !debouncedQuery && recentInList.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-zinc-700 mb-3 px-2", children: "Recently Used" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3 py-2 px-2", children: recentInList.map(
                    (key, idx) => renderIconButton(key, idx, true)
                  ) })
                ] }),
                mainList.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  !debouncedQuery && recentInList.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-zinc-700 mb-3 px-2", children: "All Icons" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3 py-2 px-2", children: mainList.map(
                    (key, idx) => renderIconButton(key, recentInList.length + idx, false)
                  ) })
                ] }),
                manifestLoading && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-16 text-center", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "svg",
                    {
                      className: "w-16 h-16 mx-auto text-zinc-300 mb-4 animate-pulse",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "path",
                        {
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          strokeWidth: "1.5",
                          d: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        }
                      )
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-zinc-700 mb-1", children: "Loading icons..." }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Please wait while we fetch the icon library" })
                ] }),
                !manifestLoading && list.length === 0 && !debouncedQuery && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-16 text-center", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "svg",
                    {
                      className: "w-16 h-16 mx-auto text-zinc-300 mb-4",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "path",
                        {
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          strokeWidth: "1.5",
                          d: "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        }
                      )
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-zinc-700 mb-1", children: "No icons available" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Unable to load icons from the icon library" })
                ] }),
                debouncedQuery && list.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-16 text-center", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "svg",
                    {
                      className: "w-16 h-16 mx-auto text-zinc-300 mb-4",
                      fill: "none",
                      stroke: "currentColor",
                      viewBox: "0 0 24 24",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "path",
                        {
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          strokeWidth: "1.5",
                          d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        }
                      )
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-zinc-700 mb-1", children: "No icons found" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
                    "Try a different search term or",
                    " ",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setQuery(""),
                        className: "text-primary hover:underline",
                        children: "clear your search"
                      }
                    )
                  ] })
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t mt-4 pt-4 px-2 text-xs text-muted-foreground text-center space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              "You are using ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: libraryInfo.name }),
              ".",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "a",
                {
                  href: libraryInfo.url,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "text-blue-600 hover:underline",
                  children: "View full icon set"
                }
              ),
              "."
            ] }),
            window.__OPENICON_LITE__ && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-emerald-600", children: [
              "Want 6,000+ more icons?",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "a",
                {
                  href: "https://acfopenicons.com?utm_source=plugin&utm_medium=picker&utm_campaign=lite",
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "font-medium hover:underline",
                  children: "Upgrade to Premium →"
                }
              )
            ] })
          ] })
        ] })
      ]
    }
  );
}
function mountPickers() {
  const fields = document.querySelectorAll(
    ".openicon-field:not([data-openicon-mounted])"
  );
  const registry = window.__OPENICON_REGISTRY__ = window.__OPENICON_REGISTRY__ || {};
  fields.forEach((el) => {
    var _a2, _b2, _c2, _d2, _e2;
    const host = el;
    const keyOut = host.querySelector(
      "[data-openicon-key-out]"
    );
    const isClone = !!host.closest(".acf-clone");
    const isHiddenTpl = host.style.display === "none" && ((_a2 = host.closest("[data-type]")) == null ? void 0 : _a2.classList.contains("acf-field"));
    const hasCloneIndex = !!((_b2 = keyOut == null ? void 0 : keyOut.name) == null ? void 0 : _b2.includes("acfcloneindex"));
    if (isClone || isHiddenTpl) {
      return;
    }
    if (hasCloneIndex) {
      return;
    }
    let instanceId = host.dataset.openiconInstanceId || host.id || "";
    const keyOutForId = host.querySelector(
      "[data-openicon-key-out]"
    );
    const stillCloneIndex = !!((_c2 = keyOutForId == null ? void 0 : keyOutForId.name) == null ? void 0 : _c2.includes("acfcloneindex"));
    const idConflict = instanceId && document.querySelectorAll(
      `.openicon-field[data-openicon-instance-id="${instanceId}"]`
    ).length > 1;
    if (!instanceId || idConflict || stillCloneIndex) {
      const newId = `openicon_${Date.now().toString(16)}_${Math.random().toString(36).slice(2)}`;
      host.id = newId;
      host.dataset.openiconInstanceId = newId;
      instanceId = newId;
    }
    host.dataset.openiconMounted = "1";
    const existing = registry[instanceId];
    const existingMountId = `openicon-mount-${instanceId}`;
    if (existing) {
      try {
        (_e2 = (_d2 = existing.root).unmount) == null ? void 0 : _e2.call(_d2);
      } catch {
      }
      try {
        existing.mount.remove();
      } catch {
      }
      delete registry[instanceId];
    } else {
      const stray = document.getElementById(existingMountId);
      if (stray) {
        stray.remove();
      }
    }
    const provider = "heroicons";
    const version = host.dataset.openiconVersion || "latest";
    const useLastColor = host.dataset.openiconUseLastColor === "1";
    const fieldKey = host.dataset.openiconFieldKey || "";
    const fieldGroupKey = host.dataset.openiconFieldGroupKey || "";
    host.querySelector("[data-openicon-preview]");
    host.querySelector(
      "[data-openicon-key-out]"
    );
    host.querySelector(
      "[data-openicon-svg-out]"
    );
    const openBtn = host.querySelector(
      "[data-openicon-open]"
    );
    const mount = document.createElement("div");
    mount.id = existingMountId;
    document.body.appendChild(mount);
    const root = createRoot(mount);
    root.render(
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        IconPicker,
        {
          provider,
          version,
          instanceId,
          useLastColor,
          fieldKey,
          fieldGroupKey,
          onSelect: (item) => {
            var _a3, _b3, _c3;
            let liveHost = document.getElementById(host.id);
            if (!liveHost) {
              return;
            }
            const testInput = liveHost.querySelector(
              "[data-openicon-key-out]"
            );
            const isCloneState = (testInput == null ? void 0 : testInput.name.includes("acfcloneindex")) || false;
            const isCloneElement = !!liveHost.closest(".acf-clone");
            if (isCloneState || isCloneElement) {
              const instanceId2 = liveHost.dataset.openiconInstanceId;
              const allFields = document.querySelectorAll(".openicon-field");
              let actualField = null;
              for (const field of allFields) {
                const f = field;
                if (f.dataset.openiconInstanceId === instanceId2) {
                  const testInp = f.querySelector(
                    "[data-openicon-key-out]"
                  );
                  const notClone = !f.closest(".acf-clone");
                  const notCloneIndex = !(testInp == null ? void 0 : testInp.name.includes("acfcloneindex"));
                  if (notClone && notCloneIndex) {
                    actualField = f;
                    break;
                  }
                }
              }
              if (actualField) {
                liveHost = actualField;
              }
            }
            const currentInputKey = liveHost.querySelector(
              "[data-openicon-key-out]"
            );
            const currentInputSvg = liveHost.querySelector(
              "[data-openicon-svg-out]"
            );
            const currentPreview = liveHost.querySelector(
              "[data-openicon-preview]"
            );
            const currentOpenBtn = liveHost.querySelector(
              "[data-openicon-open]"
            );
            const currentClearBtn = liveHost.querySelector(
              "[data-openicon-clear]"
            );
            const colorTokenInput = liveHost.querySelector(
              "[data-openicon-color-token-out]"
            );
            if (currentInputKey) {
              currentInputKey.value = item.key;
              currentInputKey.dispatchEvent(
                new Event("input", { bubbles: true })
              );
              currentInputKey.dispatchEvent(
                new Event("change", { bubbles: true })
              );
            }
            if (colorTokenInput && ((_a3 = item.color) == null ? void 0 : _a3.token)) {
              colorTokenInput.value = item.color.token;
              colorTokenInput.dispatchEvent(
                new Event("input", { bubbles: true })
              );
            }
            if (currentPreview && !item.svg && item.key) {
              currentPreview.innerHTML = '<div style="width:16px;height:16px;border:2px solid #ddd;border-top-color:#333;border-radius:50%;animation:spin 1.2s linear infinite;"></div><style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
              const styleAttr = currentPreview.getAttribute("style") || "";
              const styleParts = styleAttr.split(";").filter((s) => {
                const trimmed = s.trim();
                return trimmed && !trimmed.toLowerCase().startsWith("display");
              });
              styleParts.push(
                "display:flex",
                "align-items:center",
                "justify-content:center"
              );
              const newStyle = styleParts.join(";") + ";";
              currentPreview.setAttribute("style", newStyle);
            }
            const applyColorToSvg2 = (svg, color) => {
              if (!svg || !color) return svg;
              const hasStroke = /\bstroke(?!-)\s*=/i.test(svg);
              const hasFill = /\bfill(?!-)\s*=/i.test(svg) && !/fill\s*=\s*["']none["']/i.test(svg);
              let result = svg;
              if (hasStroke) {
                result = result.replace(/\bstroke(?!-)\s*=\s*["']?[^"'\s>]*["']?/gi, `stroke="${color}"`);
              }
              if (hasFill) {
                result = result.replace(/\bfill(?!-)\s*=\s*["']?[^"'\s>]*["']?/gi, `fill="${color}"`);
              }
              return result;
            };
            if (currentInputSvg && item.svg) {
              const colored = ((_b3 = item.color) == null ? void 0 : _b3.hex) || "#111111";
              const svgWithColor = applyColorToSvg2(item.svg, colored);
              currentInputSvg.value = svgWithColor;
              currentInputSvg.dispatchEvent(
                new Event("input", { bubbles: true })
              );
              currentInputSvg.dispatchEvent(
                new Event("change", { bubbles: true })
              );
            }
            if (currentPreview && item.svg) {
              const colored = ((_c3 = item.color) == null ? void 0 : _c3.hex) || "#111111";
              const svgWithColor = applyColorToSvg2(item.svg, colored);
              currentPreview.innerHTML = svgWithColor;
              const styleAttr = currentPreview.getAttribute("style") || "";
              const styleParts = styleAttr.split(";").filter((s) => {
                const trimmed = s.trim();
                return trimmed && !trimmed.toLowerCase().startsWith("display");
              });
              styleParts.push(
                "display:flex",
                "align-items:center",
                "justify-content:center"
              );
              const newStyle = styleParts.join(";") + ";";
              currentPreview.setAttribute("style", newStyle);
              const svg = currentPreview.firstElementChild;
              if (svg) {
                svg.setAttribute("width", "24");
                svg.setAttribute("height", "24");
              }
              void currentPreview.offsetHeight;
            }
            if (currentOpenBtn) {
              currentOpenBtn.style.display = "";
              currentOpenBtn.textContent = "Change Icon";
            }
            if (currentClearBtn) {
              currentClearBtn.style.display = "";
            }
          }
        }
      )
    );
    registry[instanceId] = { root, mount };
    if (openBtn) {
      if (openBtn.__openiconBound__) ;
      else {
        openBtn.__openiconBound__ = true;
        const clickHandler = () => {
          window.dispatchEvent(
            new CustomEvent("openicon-open-modal", {
              detail: { instanceId }
            })
          );
        };
        openBtn.addEventListener("click", clickHandler);
        const prewarm = () => {
          window.dispatchEvent(new CustomEvent("openicon-prewarm"));
        };
        openBtn.addEventListener("mouseenter", prewarm, { passive: true });
        openBtn.addEventListener("focus", prewarm, { passive: true });
      }
    }
  });
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountPickers);
} else {
  mountPickers();
}
(_b = (_a = window.acf) == null ? void 0 : _a.addAction) == null ? void 0 : _b.call(_a, "append_field", ($field) => {
  setTimeout(() => mountPickers(), 50);
});
(_d = (_c = window.acf) == null ? void 0 : _c.addAction) == null ? void 0 : _d.call(_c, "ready_field", ($field) => {
  setTimeout(() => mountPickers(), 50);
});
(_f = (_e = window.acf) == null ? void 0 : _e.addAction) == null ? void 0 : _f.call(_e, "ready", () => {
  mountPickers();
});
document.addEventListener(
  "click",
  (ev) => {
    var _a2, _b2;
    const target = (_b2 = (_a2 = ev.target) == null ? void 0 : _a2.closest) == null ? void 0 : _b2.call(
      _a2,
      "[data-openicon-open]"
    );
    if (!target) return;
    const host = target.closest(".openicon-field");
    const instanceId = (host == null ? void 0 : host.dataset.openiconInstanceId) || (host == null ? void 0 : host.id) || "";
    window.dispatchEvent(
      new CustomEvent("openicon-open-modal", { detail: { instanceId } })
    );
    ev.preventDefault();
  },
  true
);
document.addEventListener(
  "click",
  (ev) => {
    var _a2, _b2;
    const target = (_b2 = (_a2 = ev.target) == null ? void 0 : _a2.closest) == null ? void 0 : _b2.call(
      _a2,
      "[data-openicon-clear]"
    );
    if (!target) return;
    const host = target.closest(".openicon-field");
    if (!host) return;
    const instanceId = host.dataset.openiconInstanceId || host.id || "";
    let liveHost = document.getElementById(host.id);
    if (!liveHost) {
      liveHost = document.querySelector(
        `.openicon-field[data-openicon-instance-id="${instanceId}"]`
      );
    }
    if (!liveHost) return;
    const testInput = liveHost.querySelector(
      "[data-openicon-key-out]"
    );
    const isCloneState = (testInput == null ? void 0 : testInput.name.includes("acfcloneindex")) || false;
    const isCloneElement = !!liveHost.closest(".acf-clone");
    if (isCloneState || isCloneElement) {
      const allFields = document.querySelectorAll(".openicon-field");
      let actualField = null;
      for (const field of allFields) {
        const f = field;
        if (f.dataset.openiconInstanceId === instanceId) {
          const testInp = f.querySelector(
            "[data-openicon-key-out]"
          );
          const notClone = !f.closest(".acf-clone");
          const notCloneIndex = !(testInp == null ? void 0 : testInp.name.includes("acfcloneindex"));
          if (notClone && notCloneIndex) {
            actualField = f;
            break;
          }
        }
      }
      if (actualField) {
        liveHost = actualField;
      }
    }
    const keyInput = liveHost.querySelector(
      "[data-openicon-key-out]"
    );
    const svgInput = liveHost.querySelector(
      "[data-openicon-svg-out]"
    );
    const tokenInput = liveHost.querySelector(
      "[data-openicon-color-token-out]"
    );
    const preview = liveHost.querySelector(
      "[data-openicon-preview]"
    );
    const openBtn = liveHost.querySelector(
      "[data-openicon-open]"
    );
    const clearBtn = liveHost.querySelector(
      "[data-openicon-clear]"
    );
    if (keyInput) {
      keyInput.value = "";
      keyInput.dispatchEvent(new Event("input", { bubbles: true }));
      keyInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (svgInput) {
      svgInput.value = "";
      svgInput.dispatchEvent(new Event("input", { bubbles: true }));
      svgInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (tokenInput) {
      tokenInput.value = "";
      tokenInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (preview) {
      preview.innerHTML = "";
      const styleAttr = preview.getAttribute("style") || "";
      const styleParts = styleAttr.split(";").filter((s) => {
        const trimmed = s.trim();
        return trimmed && !trimmed.toLowerCase().startsWith("display");
      });
      styleParts.push("display:none");
      const newStyle = styleParts.join(";") + ";";
      preview.setAttribute("style", newStyle);
    }
    if (openBtn) {
      openBtn.style.display = "";
      openBtn.textContent = "Select Icon";
    }
    if (clearBtn) {
      clearBtn.style.display = "none";
    }
    ev.preventDefault();
  },
  true
);

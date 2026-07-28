import {
  distributeEntitiesOverRuns,
  joinRuns
} from "./chunk-3WGABFPD.js";
import {
  strFromU8,
  strToU8,
  stripAppProps,
  stripCommentParts,
  stripCoreProps,
  unzipSync,
  zipSync
} from "./chunk-S5HPOW2S.js";
import "./chunk-TRTQSARU.js";

// src/files/docx-adapter.js
var W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
var PART_RE = /^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/;
function stripTrackedChanges(doc) {
  for (const del of Array.from(doc.getElementsByTagNameNS(W_NS, "del"))) {
    del.parentNode.removeChild(del);
  }
  for (const ins of Array.from(doc.getElementsByTagNameNS(W_NS, "ins"))) {
    const parent = ins.parentNode;
    while (ins.firstChild) parent.insertBefore(ins.firstChild, ins);
    parent.removeChild(ins);
  }
}
function removeCommentAnchors(doc) {
  for (const tag of ["commentRangeStart", "commentRangeEnd", "commentReference"]) {
    for (const el of Array.from(doc.getElementsByTagNameNS(W_NS, tag))) {
      el.parentNode.removeChild(el);
    }
  }
}
function collectRuns(paragraphEl) {
  const runs = [];
  let counter = 0;
  const walk = (node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType !== 1) continue;
      const local = child.localName;
      if (local === "r") {
        for (const grandchild of Array.from(child.childNodes)) {
          if (grandchild.nodeType !== 1) continue;
          const gname = grandchild.localName;
          if (gname === "t") {
            runs.push({ id: `r${counter++}`, node: grandchild, kind: "t", text: grandchild.textContent || "" });
          } else if (gname === "tab") {
            runs.push({ id: `r${counter++}`, node: grandchild, kind: "tab", text: "	" });
          } else if (gname === "br") {
            runs.push({ id: `r${counter++}`, node: grandchild, kind: "br", text: "\n" });
          }
        }
      } else if (local === "hyperlink") {
        walk(child);
      }
    }
  };
  walk(paragraphEl);
  return runs;
}
function withXmlProlog(serialized) {
  if (serialized.startsWith("<?xml")) return serialized;
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + serialized;
}
function processPart(xmlString, partName, DOMParser) {
  const doc = new DOMParser().parseFromString(xmlString, "text/xml");
  stripTrackedChanges(doc);
  const paragraphs = Array.from(doc.getElementsByTagNameNS(W_NS, "p"));
  const perParagraphRuns = paragraphs.map((p, i) => ({
    unitId: `${partName}#p${i}`,
    runs: collectRuns(p)
  }));
  return { doc, perParagraphRuns };
}
function partNamesOf(zipLikeKeys) {
  return zipLikeKeys.filter((p) => PART_RE.test(p));
}
function extractTextUnits(buffer, opts = {}) {
  const DP = opts.DOMParser || globalThis.DOMParser;
  const zip = unzipSync(new Uint8Array(buffer));
  const units = [];
  for (const partName of partNamesOf(Object.keys(zip))) {
    const { perParagraphRuns } = processPart(strFromU8(zip[partName]), partName, DP);
    for (const { unitId, runs } of perParagraphRuns) {
      const { text } = joinRuns(runs.map((r) => ({ id: r.id, text: r.text })));
      if (text.length > 0) units.push({ id: unitId, text });
    }
  }
  return { units };
}
function applyMask(buffer, resultsById, opts = {}) {
  const DP = opts.DOMParser || globalThis.DOMParser;
  const XS = opts.XMLSerializer || globalThis.XMLSerializer;
  const zip = unzipSync(new Uint8Array(buffer));
  const out = new Map(Object.entries(zip));
  for (const partName of partNamesOf([...out.keys()])) {
    const { doc, perParagraphRuns } = processPart(strFromU8(out.get(partName)), partName, DP);
    for (const { unitId, runs } of perParagraphRuns) {
      const result = resultsById.get(unitId);
      if (!result || runs.length === 0) continue;
      const newRuns = distributeEntitiesOverRuns(
        runs.map((r) => ({ id: r.id, text: r.text })),
        result.entities || []
      );
      runs.forEach((run, i) => {
        if (run.kind !== "t") return;
        const newText = newRuns[i].text;
        if (newText !== run.node.textContent) {
          run.node.textContent = newText;
          run.node.setAttribute("xml:space", "preserve");
        }
      });
    }
    out.set(partName, strToU8(withXmlProlog(new XS().serializeToString(doc))));
  }
  return zipSync(Object.fromEntries(out));
}
function stripMetadata(buffer, opts = {}) {
  const DP = opts.DOMParser || globalThis.DOMParser;
  const XS = opts.XMLSerializer || globalThis.XMLSerializer;
  const zip = unzipSync(new Uint8Array(buffer));
  let map = new Map(Object.entries(zip));
  for (const partName of partNamesOf([...map.keys()])) {
    const { doc } = processPart(strFromU8(map.get(partName)), partName, DP);
    removeCommentAnchors(doc);
    map.set(partName, strToU8(withXmlProlog(new XS().serializeToString(doc))));
  }
  if (map.has("docProps/core.xml")) {
    map.set("docProps/core.xml", strToU8(stripCoreProps(strFromU8(map.get("docProps/core.xml")))));
  }
  if (map.has("docProps/app.xml")) {
    map.set("docProps/app.xml", strToU8(stripAppProps(strFromU8(map.get("docProps/app.xml")))));
  }
  map = stripCommentParts(map);
  return zipSync(Object.fromEntries(map));
}
export {
  applyMask,
  extractTextUnits,
  stripMetadata
};

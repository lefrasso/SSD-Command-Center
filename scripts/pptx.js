const TEMPLATE_URL = 'assets/success-stories-template.pptx';
const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function inflate(data) {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readZip(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  let endOffset = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { endOffset = i; break; }
  }
  if (endOffset < 0) throw new Error('The PowerPoint template is not a valid ZIP package.');

  const entries = view.getUint16(endOffset + 10, true);
  let offset = view.getUint32(endOffset + 16, true);
  const files = new Map();
  for (let i = 0; i < entries; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) throw new Error('The PowerPoint template has an invalid directory.');
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(start, start + compressedSize);
    files.set(name, method === 0 ? compressed : await inflate(compressed));
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeZip(files) {
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;
  for (const [name, data] of files) {
    const nameBytes = encoder.encode(name);
    const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    localParts.push(local, data);

    const central = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint32(42, localOffset, true);
    central.set(nameBytes, 46);
    centralParts.push(central);
    localOffset += local.length + data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.size, true);
  endView.setUint16(10, files.size, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, localOffset, true);
  return new Blob([...localParts, ...centralParts, end], { type: PPTX_MIME });
}

function shapeById(slide, id) {
  return [...slide.getElementsByTagName('p:sp')].find((shape) => shape.getElementsByTagName('p:cNvPr')[0]?.getAttribute('id') === String(id));
}

function setShapeText(shape, value) {
  const nodes = [...shape.getElementsByTagName('a:t')];
  if (!nodes.length) return;
  nodes[0].textContent = value;
  nodes.slice(1).forEach((node) => { node.textContent = ''; });
}

function setLastParagraphValue(shape, paragraphIndex, value) {
  const paragraph = shape.getElementsByTagName('a:p')[paragraphIndex];
  const nodes = paragraph ? [...paragraph.getElementsByTagName('a:t')] : [];
  if (nodes.length) nodes[nodes.length - 1].textContent = value;
}

function setBulletParagraphs(shape, values) {
  const body = shape.getElementsByTagName('p:txBody')[0];
  const template = body?.getElementsByTagName('a:p')[0];
  if (!body || !template) return;
  [...body.getElementsByTagName('a:p')].forEach((paragraph) => paragraph.remove());
  values.filter(Boolean).slice(0, 4).forEach((value) => {
    const paragraph = template.cloneNode(true);
    const runs = [...paragraph.getElementsByTagName('a:r')];
    const text = runs[0]?.getElementsByTagName('a:t')[0];
    if (text) text.textContent = value;
    runs.slice(1).forEach((run) => run.remove());
    body.appendChild(paragraph);
  });
}

function parseLogo(dataUrl) {
  const match = /^data:(image\/(?:png|jpeg));base64,(.+)$/.exec(dataUrl || '');
  if (!match) return null;
  const binary = atob(match[2]);
  const data = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) data[i] = binary.charCodeAt(i);
  return { data, extension: match[1] === 'image/png' ? 'png' : 'jpg', contentType: match[1] };
}

function addCustomerLogo(files, slide, logo) {
  const placeholder = shapeById(slide, 10);
  if (!logo || !placeholder) return;
  const relationshipId = 'rIdCustomerLogo';
  const mediaPath = `ppt/media/customer-logo.${logo.extension}`;
  files.set(mediaPath, logo.data);

  const relationshipsPath = 'ppt/slides/_rels/slide8.xml.rels';
  const relationships = new DOMParser().parseFromString(decoder.decode(files.get(relationshipsPath)), 'application/xml');
  const relationship = relationships.createElementNS(REL_NS, 'Relationship');
  relationship.setAttribute('Id', relationshipId);
  relationship.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image');
  relationship.setAttribute('Target', `../media/customer-logo.${logo.extension}`);
  relationships.documentElement.appendChild(relationship);
  files.set(relationshipsPath, encoder.encode(new XMLSerializer().serializeToString(relationships)));

  const contentTypesPath = '[Content_Types].xml';
  const contentTypes = new DOMParser().parseFromString(decoder.decode(files.get(contentTypesPath)), 'application/xml');
  const hasType = [...contentTypes.getElementsByTagName('Default')].some((item) => item.getAttribute('Extension') === logo.extension);
  if (!hasType) {
    const item = contentTypes.createElementNS(contentTypes.documentElement.namespaceURI, 'Default');
    item.setAttribute('Extension', logo.extension);
    item.setAttribute('ContentType', logo.contentType);
    contentTypes.documentElement.appendChild(item);
    files.set(contentTypesPath, encoder.encode(new XMLSerializer().serializeToString(contentTypes)));
  }

  const pictureXml = `<p:pic xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:nvPicPr><p:cNvPr id="10" name="Customer Logo"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${relationshipId}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="787487" y="4988782"/><a:ext cx="1182128" cy="914399"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`;
  const picture = new DOMParser().parseFromString(pictureXml, 'application/xml').documentElement;
  placeholder.parentNode.replaceChild(slide.importNode(picture, true), placeholder);
}

function safeFilenamePart(value) {
  return String(value || '').replace(/[<>:"/\\|?*]+/g, '').replace(/\s+/g, '-').slice(0, 60);
}

export async function exportSuccessStoryPowerPoint(story, data) {
  const response = await fetch(TEMPLATE_URL);
  if (!response.ok) throw new Error(`Could not load the official PowerPoint template (${response.status}).`);
  const files = await readZip(await response.arrayBuffer());
  const slidePath = 'ppt/slides/slide8.xml';
  const slide = new DOMParser().parseFromString(decoder.decode(files.get(slidePath)), 'application/xml');
  const primaryEngagement = data.engagements.find((engagement) => engagement.id === story.engagementId);
  const customer = primaryEngagement?.customer || story.title;
  const year = primaryEngagement?.dueDate ? new Date(`${primaryEngagement.dueDate}T00:00:00Z`).getUTCFullYear() : new Date().getUTCFullYear();

  setShapeText(shapeById(slide, 5), story.headline);
  const titleNodes = [...shapeById(slide, 4).getElementsByTagName('a:t')];
  if (titleNodes.length) titleNodes[titleNodes.length - 1].textContent = story.family;
  setShapeText(shapeById(slide, 2), `“${story.customerQuote || story.csamQuote}”`);
  setShapeText(shapeById(slide, 3), `— ${story.customerQuoteAttribution || `${customer} stakeholder`}`);
  setShapeText(shapeById(slide, 7), `“${story.csamQuote || story.customerQuote}”`);
  setShapeText(shapeById(slide, 9), `— ${story.csamName}, CSAM`);

  const overview = shapeById(slide, 13);
  setLastParagraphValue(overview, 0, ` ${customer}`);
  setLastParagraphValue(overview, 1, ` ${story.timeZone} / ${story.country}`);
  setLastParagraphValue(overview, 2, ` ${story.industry}`);
  setLastParagraphValue(overview, 3, story.segment);
  setLastParagraphValue(overview, 4, ` ${story.eventNames.join(', ')}`);

  const team = shapeById(slide, 14);
  setShapeText(team.getElementsByTagName('a:p')[0], `CSAM: ${story.csamName}`);
  setLastParagraphValue(team, 1, ` ${story.podLeadName}`);
  setLastParagraphValue(team, 2, ` ${story.partnerCsaName} (${story.partnerName})`);
  setBulletParagraphs(shapeById(slide, 15), story.keyOutcomes.split(/\r?\n/));
  setBulletParagraphs(shapeById(slide, 16), story.insights.split(/\r?\n/));
  setBulletParagraphs(shapeById(slide, 17), story.impact.split(/\r?\n/));
  setShapeText(shapeById(slide, 11), `${story.month} ${year}`);
  addCustomerLogo(files, slide, parseLogo(story.customerLogoDataUrl));

  files.set(slidePath, encoder.encode(new XMLSerializer().serializeToString(slide)));
  const blob = writeZip(files);
  const filename = `${safeFilenamePart(story.fiscalYear)}-${safeFilenamePart(story.month)}-${safeFilenamePart(customer)}-${safeFilenamePart(story.timeZone)}.pptx`;
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
  return filename;
}

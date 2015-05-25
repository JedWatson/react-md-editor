const FORMATS = {
	h1: { type: 'block', token: 'header-1', before: '# ' },
	h2: { type: 'block', token: 'header-2', before: '## ' },
	h3: { type: 'block', token: 'header-3', before: '### ' },
	bold: { type: 'inline', token: 'strong', before: '**', after: '**' },
	italic: { type: 'inline', token: 'em', before: '_', after: '_' },
	quote: { type: 'block', token: 'quote', before: '> ' },
	oList: { type: 'block', before: '1. ' },
	uList: { type: 'block', before: '* ' }
};

const FORMAT_TOKENS = {};
Object.keys(FORMATS).forEach(key => {
	if (FORMATS[key].token) FORMAT_TOKENS[FORMATS[key].token] = key;
});

export function getCursorState(cm, pos) {
	pos = pos || cm.getCursor('start');
	var cs = {};
	var token = cs.token = cm.getTokenAt(pos);
	if (!token.type) return cs;
	var tokens = token.type.split(' ');
	tokens.forEach(t => {
		if (FORMAT_TOKENS[t]) {
			cs[FORMAT_TOKENS[t]] = true;
			return;
		}
		switch (t) {
			case 'link':
				cs.link = true;
				cs.link_label = true;
			break;
			case 'string':
				cs.link = true;
				cs.link_href = true;
			break;
			case 'variable-2':
				var text = cm.getLine(pos.line);
				if (/^\s*\d+\.\s/.test(text)) {
					cs.oList = true;
				} else {
					cs.uList = true;
				}
			break;
		}
	});
	return cs;
}

export function applyFormat(cm, key){
	var cs = getCursorState(cm);
	var format = FORMATS[key];

	var insertBefore = format.before;
	var insertAfter = format.after || '';

	var startPoint = cm.getCursor('start');
	var endPoint = cm.getCursor('end');

	if (cs[key]) {
		var line = cm.getLine(startPoint.line);
		var startPos = startPoint.ch;
		while (startPos) {
			if (line.substr(startPos, insertBefore.length) === insertBefore) {
				break;
			}
			startPos--;
		}
		var endPos = endPoint.ch;
		while (endPos <= line.length) {
			if (line.substr(endPos, insertAfter.length) === insertAfter) {
				break;
			}
			endPos++;
		}
		var start = line.slice(0, startPos);
		var mid = line.slice(startPos + insertBefore.length, endPos);
		var end = line.slice(endPos + insertAfter.length);
		cm.replaceRange(start + mid + end, { line: startPoint.line, ch: 0 }, { line: startPoint.line, ch: line.length + 1 });
		startPoint.ch -= insertBefore.length;
		endPoint.ch -= insertAfter.length;
	} else {
		cm.replaceSelection(insertBefore + cm.getSelection() + insertAfter);
		startPoint.ch += insertBefore.length;
		endPoint.ch += insertAfter.length;
	}
	cm.setSelection(startPoint, endPoint);
	cm.focus();
}

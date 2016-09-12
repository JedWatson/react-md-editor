const FORMATS = {
	h1: { type: 'block', token: 'header-1', before: '#', re: /^#\s+/, placeholder: 'Heading' },
	h2: { type: 'block', token: 'header-2', before: '##', re: /^##\s+/, placeholder: 'Heading' },
	h3: { type: 'block', token: 'header-3', before: '###', re: /^###\s+/, placeholder: 'Heading' },
	bold: { type: 'inline', token: 'strong', before: '**', after: '**', placeholder: 'bold text' },
	italic: { type: 'inline', token: 'em', before: '_', after: '_', placeholder: 'italic text' },
	quote: { type: 'block', token: 'quote', re: /^\>\s+/, before: '>', placeholder: 'quote' },
	oList: { type: 'block', before: '1. ', re: /^\d+\.\s+/, placeholder: 'List' },
	uList: { type: 'block', before: '* ', re: /^[\*\-]\s+/, placeholder: 'List' },
	link: { type: 'inline', token: 'link', before: '[link](', after: ')', re: /\[(?:[^\]]+)\]\(([^)]+)\)/, placeholder: 'Link' },
	image: { type: 'inline', token: 'image', before: '![Alt Text](', after: ')', re: /\!\[(?:[^\]]+)\]\(([^)]+)\)/, placeholder: 'Image' }
};

const FORMAT_TOKENS = {};
Object.keys(FORMATS).forEach(key => {
	if (FORMATS[key].token) FORMAT_TOKENS[FORMATS[key].token] = key;
});

export function getCursorState (cm) {
	var cursor = cm.getCursor();
	var lineTokens = cm.getLineTokens(cursor.line);
	var prevLineTokens = [];
	var curToken = null;
	var token = null;

	while (curToken = lineTokens.shift()) {
		if (cursor.ch >= curToken.start && cursor.ch <= curToken.end) {
			token = curToken;
			break;
		}
		prevLineTokens.push(curToken);
	}

	var tokenTypes = (token) ? getTokenTypes(token, prevLineTokens) : [];
	var cs = {token};
	tokenTypes.forEach(t => cs[t] = true);
	return cs;
}

var getTokenTypes = (token, previousTokens) => {
	var tokenTypes = [];

	if (!token.type) {
		return [];
	}

	token.type.split(' ').forEach(t => {
		switch (t) {
			case 'link':
				// if already identified as image, don't include link
				if (tokenTypes.indexOf('image') === -1) {
					tokenTypes.push('link');
				}
				break;
			case 'image':
				tokenTypes.push('image');
				break;
			case 'string':
				var prevToken = previousTokens.pop();
				var returnTokens = getTokenTypes(prevToken, previousTokens);
				tokenTypes.push(...returnTokens);
				break;
			case 'variable-2':
				var firstToken = (previousTokens.length > 0) ? previousTokens.shift() : token;
				if (/^\s*\d+\.\s/.test(firstToken.string)) {
					tokenTypes.push('oList');
				} else {
					tokenTypes.push('uList');
				}
				break;
			default:
				if (FORMAT_TOKENS[t]) {
					tokenTypes.push(FORMAT_TOKENS[t]);
				}
				break;
		}
	});

	return tokenTypes;
};

export function applyFormat (cm, key) {
	var cs = getCursorState(cm);
	var format = FORMATS[key];
	operations[format.type + (cs[key] ? 'Remove' : 'Apply')](cm, format);
}

var operations = {
	inlineApply (cm, format) {
		var startPoint = cm.getCursor('start');
		var endPoint = cm.getCursor('end');

		cm.replaceSelection(format.before + cm.getSelection() + format.after);

		startPoint.ch += format.before.length;
		endPoint.ch += format.after.length;
		cm.setSelection(startPoint, endPoint);
		cm.focus();
	},
	inlineRemove (cm, format) {
		var startPoint = cm.getCursor('start');
		var endPoint = cm.getCursor('end');
		var line = cm.getLine(startPoint.line);

		if (format.hasOwnProperty('re')) {
			var text = line.replace(format.re, '$1');
			cm.replaceRange(text, { line: startPoint.line, ch: 0 }, { line: startPoint.line, ch: line.length + 1 });
			cm.setSelection({ line: startPoint.line, ch: startPoint.ch }, { line: startPoint.line, ch: startPoint.ch });
			cm.focus();
			return;
		}

		var startPos = startPoint.ch;
		while (startPos) {
			if (line.substr(startPos, format.before.length) === format.before) {
				break;
			}
			startPos--;
		}

		var endPos = endPoint.ch;
		while (endPos <= line.length) {
			if (line.substr(endPos, format.after.length) === format.after) {
				break;
			}
			endPos++;
		}

		var start = line.slice(0, startPos);
		var mid = line.slice(startPos + format.before.length, endPos);
		var end = line.slice(endPos + format.after.length);
		cm.replaceRange(start + mid + end, { line: startPoint.line, ch: 0 }, { line: startPoint.line, ch: line.length + 1 });
		cm.setSelection({ line: startPoint.line, ch: start.length }, { line: startPoint.line, ch: (start + mid).length });
		cm.focus();
	},
	blockApply (cm, format) {
		var startPoint = cm.getCursor('start');
		var line = cm.getLine(startPoint.line);
		var text = format.before + ' ' + (line.length ? line : format.placeholder);
		cm.replaceRange(text, { line: startPoint.line, ch: 0 }, { line: startPoint.line, ch: line.length + 1 });
		cm.setSelection({ line: startPoint.line, ch: format.before.length + 1 }, { line: startPoint.line, ch: text.length });
		cm.focus();
	},
	blockRemove (cm, format) {
		var startPoint = cm.getCursor('start');
		var line = cm.getLine(startPoint.line);
		var text = line.replace(format.re, '');
		cm.replaceRange(text, { line: startPoint.line, ch: 0 }, { line: startPoint.line, ch: line.length + 1 });
		cm.setSelection({ line: startPoint.line, ch: 0 }, { line: startPoint.line, ch: text.length });
		cm.focus();
	},
};

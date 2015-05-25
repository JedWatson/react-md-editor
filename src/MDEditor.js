var classNames = require('classnames');
var CM = require('codemirror');
var React = require('react');
var Icons = require('./icons');

require('codemirror/mode/xml/xml');
require('codemirror/mode/markdown/markdown');
require('codemirror/addon/edit/continuelist');

var FORMATS = {
	h1: { type: 'block', token: 'header-1', before: '# ' },
	h2: { type: 'block', token: 'header-2', before: '## ' },
	h3: { type: 'block', token: 'header-3', before: '### ' },
	bold: { type: 'inline', token: 'strong', before: '**', after: '**' },
	italic: { type: 'inline', token: 'em', before: '_', after: '_' },
	quote: { type: 'block', token: 'quote', before: '> ' },
	oList: { type: 'block', before: '1. ' },
	uList: { type: 'block', before: '* ' }
};

var FORMAT_TOKENS = {};
Object.keys(FORMATS).forEach((key) => {
	if (FORMATS[key].token) FORMAT_TOKENS[FORMATS[key].token] = key;
});

function getCursorState(cm, pos) {
	pos = pos || cm.getCursor('start');
	var cs = {};
	var token = cs.token = cm.getTokenAt(pos);
	if (!token.type) return cs;
	var tokens = token.type.split(' ');
	tokens.forEach((t) => {
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

function applyFormat(cm, key){
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

var MarkdownEditor = React.createClass({
	
	getInitialState: function() {
		return {
			isFocused: false,
			cs: {}
		};
	},
	
	componentDidMount: function() {
		this.codeMirror = CM.fromTextArea(this.refs.codemirror.getDOMNode(), this.getOptions());
		this.codeMirror.on('change', this.codemirrorValueChanged);
		this.codeMirror.on('focus', this.focusChanged.bind(this, true));
		this.codeMirror.on('blur', this.focusChanged.bind(this, false));
		this.codeMirror.on('cursorActivity', this.updateCursorState);
		this._currentCodemirrorValue = this.props.value;
	},

	getOptions: function() {
		return Object.assign({
			mode: 'markdown',
			lineNumbers: false,
			indentWithTabs: true,
			tabSize: '2'
		}, this.props.options);
	},
	
	componentWillUnmount: function() {
		// todo: is there a lighter-weight way to remove the cm instance?
		if (this.codeMirror) {
			this.codeMirror.toTextArea();
		}
	},
	
	componentWillReceiveProps: function(nextProps) {
		if (this.codeMirror && this._currentCodemirrorValue !== nextProps.value) {
			this.codeMirror.setValue(nextProps.value);
		}
	},

	getCodeMirror: function() {
		return this.codeMirror;
	},
	
	focus: function() {
		if (this.codeMirror) {
			this.codeMirror.focus();
		}
	},
	
	focusChanged: function(focused) {
		this.setState({
			isFocused: focused
		});
	},

	updateCursorState: function() {
		this.setState({ cs: getCursorState(this.codeMirror) });
	},
	
	codemirrorValueChanged: function(doc, change) {
		var newValue = doc.getValue();
		this._currentCodemirrorValue = newValue;
		this.props.onChange && this.props.onChange(newValue);
	},

	fieldValueChanged: function(e) {
		// console.log("field changed");
	},

	toggle: function(csKey) {
		if (FORMATS[csKey]) {
			applyFormat(this.codeMirror, csKey);
		}
	},
	
	renderIcon: function(icon) {
		return <span dangerouslySetInnerHTML={{__html: icon}} className="MDEditor_toolbarButton_icon" />
	},

	renderButton: function(csKey, label, action) {
		if (!action) action = this.toggle.bind(this, csKey);

		var isTextIcon = (csKey == 'h1' || csKey == 'h2' || csKey == 'h3');
		var className = classNames('MDEditor_toolbarButton', {
			'MDEditor_toolbarButton--pressed': this.state.cs[csKey]
		}, ('MDEditor_toolbarButton--' + csKey) );

		var labelClass = isTextIcon ? 'MDEditor_toolbarButton_label-icon' : 'MDEditor_toolbarButton_label';

		return (
			<button className={className} onClick={action} title={csKey}>
				{isTextIcon ? null : this.renderIcon(Icons[csKey])}
				<span className={labelClass}>{label}</span>
			</button>
		);
	},

	renderToolbar: function() {
		return (
			<div className="MDEditor_toolbar">
				{this.renderButton('h1', 'h1')}
				{this.renderButton('h2', 'h2')}
				{this.renderButton('h3', 'h3')}
				{this.renderButton('bold', 'b')}
				{this.renderButton('italic', 'i')}
				{this.renderButton('oList', 'ol')}
				{this.renderButton('uList', 'ul')}
				{this.renderButton('quote', 'q')}
				{this.renderButton('link', 'a')}
			</div>
		);
	},
	
	render: function() {
		var editorClassName = 'MDEditor_editor';
		if (this.state.isFocused) {
			editorClassName += ' MDEditor_editor--focused';
		}
		return (
			<div className="MDEditor">
				{this.renderToolbar()}
				<div className={editorClassName}>
					<textarea ref="codemirror" name={this.props.path} value={this.props.value} onChange={this.fieldValueChanged} autoComplete="off" />
				</div>
			</div>
		);
	}
	
});

module.exports = MarkdownEditor;

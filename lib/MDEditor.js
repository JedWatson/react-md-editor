'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var classNames = require('classnames');
var CM = require('codemirror');
var React = require('react');
var Icons = require('./icons');

require('codemirror/mode/xml/xml');
require('codemirror/mode/markdown/markdown');
require('codemirror/addon/edit/continuelist');

var FORMATS = {
	h1: { before: '# ' },
	h2: { before: '## ' },
	h3: { before: '### ' },
	bold: { before: '**', after: '**' },
	italic: { before: '_', after: '_' },
	quote: { before: '> ' },
	oList: { before: '1. ' },
	uList: { before: '* ' }
};

function getCursorState(cm, pos) {
	pos = pos || cm.getCursor('start');
	var cs = {};
	var token = cs.token = cm.getTokenAt(pos);
	if (!token.type) return cs;
	var tokens = token.type.split(' ');
	tokens.forEach(function (t) {
		switch (t) {
			case 'header-1':
				cs.h1 = true;
				break;
			case 'header-2':
				cs.h2 = true;
				break;
			case 'header-3':
				cs.h3 = true;
				break;
			case 'strong':
				cs.bold = true;
				break;
			case 'quote':
				cs.quote = true;
				break;
			case 'em':
				cs.italic = true;
				break;
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

function toggleBlock(cm, key) {
	var cs = getCursorState(cm);

	var insertBefore = FORMATS[key].before;
	var insertAfter = FORMATS[key].after || '';

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
	displayName: 'MarkdownEditor',

	getInitialState: function getInitialState() {
		return {
			isFocused: false,
			cs: {}
		};
	},

	componentDidMount: function componentDidMount() {
		this.codeMirror = CM.fromTextArea(this.refs.codemirror.getDOMNode(), this.getOptions());
		this.codeMirror.on('change', this.codemirrorValueChanged);
		this.codeMirror.on('focus', this.focusChanged.bind(this, true));
		this.codeMirror.on('blur', this.focusChanged.bind(this, false));
		this.codeMirror.on('cursorActivity', this.updateCursorState);
		this._currentCodemirrorValue = this.props.value;
	},

	getOptions: function getOptions() {
		return _extends({
			mode: 'markdown',
			lineNumbers: false,
			indentWithTabs: true,
			tabSize: '2'
		}, this.props.options);
	},

	componentWillUnmount: function componentWillUnmount() {
		// todo: is there a lighter-weight way to remove the cm instance?
		if (this.codeMirror) {
			this.codeMirror.toTextArea();
		}
	},

	componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
		if (this.codeMirror && this._currentCodemirrorValue !== nextProps.value) {
			this.codeMirror.setValue(nextProps.value);
		}
	},

	getCodeMirror: function getCodeMirror() {
		return this.codeMirror;
	},

	focus: function focus() {
		if (this.codeMirror) {
			this.codeMirror.focus();
		}
	},

	focusChanged: function focusChanged(focused) {
		this.setState({
			isFocused: focused
		});
	},

	updateCursorState: function updateCursorState() {
		this.setState({ cs: getCursorState(this.codeMirror) });
	},

	codemirrorValueChanged: function codemirrorValueChanged(doc, change) {
		var newValue = doc.getValue();
		this._currentCodemirrorValue = newValue;
		this.props.onChange && this.props.onChange(newValue);
	},

	fieldValueChanged: function fieldValueChanged(e) {},

	toggle: function toggle(csKey) {
		if (FORMATS[csKey]) {
			toggleBlock(this.codeMirror, csKey);
		}
	},

	renderIcon: function renderIcon(icon) {
		return React.createElement('span', { dangerouslySetInnerHTML: { __html: icon }, className: 'MDEditor_toolbarButton_icon' });
	},

	renderButton: function renderButton(csKey, label, action) {
		if (!action) action = this.toggle.bind(this, csKey);

		var isTextIcon = csKey == 'h1' || csKey == 'h2' || csKey == 'h3';
		var className = classNames('MDEditor_toolbarButton', {
			'MDEditor_toolbarButton--pressed': this.state.cs[csKey]
		}, 'MDEditor_toolbarButton--' + csKey);

		var labelClass = isTextIcon ? 'MDEditor_toolbarButton_label-icon' : 'MDEditor_toolbarButton_label';

		return React.createElement(
			'button',
			{ className: className, onClick: action, title: csKey },
			isTextIcon ? null : this.renderIcon(Icons[csKey]),
			React.createElement(
				'span',
				{ className: labelClass },
				label
			)
		);
	},

	renderToolbar: function renderToolbar() {
		return React.createElement(
			'div',
			{ className: 'MDEditor_toolbar' },
			this.renderButton('h1', 'h1'),
			this.renderButton('h2', 'h2'),
			this.renderButton('h3', 'h3'),
			this.renderButton('bold', 'b'),
			this.renderButton('italic', 'i'),
			this.renderButton('oList', 'ol'),
			this.renderButton('uList', 'ul'),
			this.renderButton('quote', 'q'),
			this.renderButton('link', 'a')
		);
	},

	render: function render() {
		var editorClassName = 'MDEditor_editor';
		if (this.state.isFocused) {
			editorClassName += ' MDEditor_editor--focused';
		}
		return React.createElement(
			'div',
			{ className: 'MDEditor' },
			this.renderToolbar(),
			React.createElement(
				'div',
				{ className: editorClassName },
				React.createElement('textarea', { ref: 'codemirror', name: this.props.path, value: this.props.value, onChange: this.fieldValueChanged, autoComplete: 'off' })
			)
		);
	}

});

module.exports = MarkdownEditor;

// console.log("field changed");